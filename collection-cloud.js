/* StarRo: Google OAuth and per-user cloud collection progress (RLS-protected). */
(function(){
'use strict';
const cfg=window.STARRO_SUPABASE||{},el=id=>document.getElementById(id);
const login=el('collectionGoogleLogin'),logout=el('collectionGoogleLogout');
const saveBtn=el('collectionCloudSave'),loadBtn=el('collectionCloudLoad'),status=el('collectionCloudStatus');
if(!login||!logout||!saveBtn||!loadBtn||!status)return;
const KEY='starro_collection_selected';
let db=null,user=null,epoch=0,busy=false,writing=false,autosave=false,timer=null,revision=0,pending=false,providerDisabled=false,dirty=false,verified=null;
function say(message,level='info'){status.textContent=message;status.dataset.state=level;}
function errMessage(e){
 const s=String(e?.message||e||'未知錯誤'),code=String(e?.code||'');
 if(/PGRST205|42P01|collection_progress.*(not found|does not exist)|schema cache.*collection_progress/i.test(code+' '+s))
   return '缺少 collection_progress 資料表；請在 Supabase SQL Editor 執行 collection_progress_setup.sql。';
 if(/42501|permission denied|row.level.security/i.test(code+' '+s))
   return 'collection_progress 權限不足，請檢查 RLS 與 authenticated 授權。';
 if(/unsupported provider|provider.*disabled|provider is not enabled/i.test(s))
   return 'Supabase 尚未啟用 Google 登入。';
 if(/redirect_uri_mismatch|redirect.*not.*allowed/i.test(s))
   return 'Google OAuth 回跳網址不符，請檢查 Supabase 與 Google Cloud 的 Redirect URLs。';
 if(/failed to fetch|networkerror|network request failed/i.test(s))
   return '無法連線至 Supabase，請檢查網路；本機收藏仍保留。';
 return s;
}
const adapter=window.StarroCollectionProgressAdapter;
function keys(){return adapter?adapter.keys():new Set(ITEMS.map(keyOf));}
function normalize(v){return typeof v==='string'?v.replace(/^JRO收藏\|/,'特殊收藏|'):'';}
function normalizeList(values){
 if(!Array.isArray(values)||values.some(v=>typeof v!=='string'||!v.trim()))throw Error('收藏存檔格式不正確，已停止同步以保護資料');
 return [...new Set(values.map(normalize))].sort();
}
function snapshot(){return normalizeList(adapter?adapter.snapshot():[...selected]);}
function checkedList(values){
 const next=normalizeList(values),valid=keys(),unknown=next.filter(k=>!valid.has(k));
 if(unknown.length)throw Error('有 '+unknown.length+' 項收藏尚未對應目前圖鑑；已停止同步，保留原本資料。請重新整理後再試');
 return next;
}
function equal(a,b){return JSON.stringify(normalizeList(a))===JSON.stringify(normalizeList(b));}
function storeLocal(){try{localStorage.setItem(KEY,JSON.stringify(snapshot()));}catch(e){say('本機儲存失敗：'+errMessage(e),'error');}}
function show(){
 const logged=!!user;
 login.style.display=logged?'none':'';
 logout.style.display=logged?'':'none';
 saveBtn.style.display=logged?'':'none';
 loadBtn.style.display=logged?'':'none';
 saveBtn.disabled=busy||writing;loadBtn.disabled=busy||writing;
 login.disabled=providerDisabled||busy;
}
function applyCloud(progress){
 const next=checkedList(progress);
 const previous=snapshot();
 if(!equal(previous,next))localStorage.setItem('starro_collection_previous_selection',JSON.stringify(previous));
 if(adapter){adapter.apply(next);storeLocal();return;}
 selected.clear();for(const k of next)selected.add(k);
 storeLocal();
 updateSummary();renderSubcats();renderSpecials();renderList();renderTotals();renderRequiredPanels();
}
function clearDelay(){if(timer!==null){clearTimeout(timer);timer=null;}}
async function getRemote(){
 const {data,error}=await db.from('collection_progress').select('selected,updated_at')
 .eq('user_id',user.id).maybeSingle();
 if(error)throw error;return data;
}
function pauseAutosave(){dirty=true;autosave=false;pending=false;revision++;clearDelay();if(user)say('本機收藏已變更；雲端存檔保留，請手動儲存或載入。');}
async function persist(allowEmpty=false){
 if(!db||!user||busy){pending=true;return;}
 if(writing){pending=true;return;}
 clearDelay();writing=true;show();
 const account=user.id,version=epoch;
 try{
  let captured;
  do{
   pending=false;captured=revision;
   const copy=checkedList(snapshot());
   if(!copy.length&&!allowEmpty){pauseAutosave();say('本機收藏為 0 項，已暫停自動同步，避免覆蓋雲端存檔。');return;}
   const {error}=await db.from('collection_progress').upsert({
    user_id:account,selected:copy,updated_at:new Date().toISOString()
   },{onConflict:'user_id'});
   if(error)throw error;
   if(epoch!==version||!user||user.id!==account||!autosave)return;
   const saved=await getRemote();
   if(!saved||!equal(copy,saved.selected))throw Error('雲端寫入後核對不一致，請保留本機備份並重新儲存');
   if(epoch!==version||!user||user.id!==account||!autosave)return;
   if(!pending&&revision===captured){
    autosave=true;dirty=false;verified=copy;
    say('✅ Google 雲端已儲存 '+copy.length+' 項（'+
      new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false})+'）','success');
   }
  }while(autosave&&(pending||revision!==captured)&&version===epoch);
 }catch(e){
  if(epoch===version){autosave=false;say('❌ 雲端儲存失敗：'+errMessage(e)+' 本機進度仍保留','error');}
 }finally{writing=false;show();}
}
function scheduleSave(){
 revision++;dirty=true;storeLocal();
 if(!user){say('✅ 本機已儲存；登入 Google 後可同步');return;}
 if(!snapshot().length){pauseAutosave();say('本機收藏為 0 項，雲端原存檔保留；如需清空雲端請手動儲存。');return;}
 if(!autosave){say('本機已更新，與雲端尚未同步。請選擇「儲存到雲端」或「載入雲端進度」。');return;}
 say('本機已儲存，正在同步 Google 雲端…');
 clearDelay();timer=setTimeout(()=>{void persist();},1000);
}
async function activate(session){
 const next=session?.user||null;
 if(!next){
  if(user){epoch++;clearDelay();user=null;autosave=false;}
  show();return;
 }
 if(user?.id===next.id)return;
 user=next;autosave=false;dirty=false;verified=null;
 const version=++epoch;busy=true;clearDelay();show();
 say('Google 已登入：'+(next.email||'使用者')+'，正在核對收藏進度…');
 try{
  const remote=await getRemote();
  if(epoch!==version)return;
  const local=snapshot();
  if(remote)verified=checkedList(remote.selected);
  dirty=!equal(local,verified||[]);
  if(!remote){
   if(local.length)say('Google 已登入，雲端目前無資料。本機有 '+local.length+' 項，按「儲存到雲端」建立備份。');
   else{autosave=true;say('✅ Google 已登入；首次勾選將自動儲存。','success');}
  }else if(!local.length){
   applyCloud(remote.selected);autosave=true;dirty=false;
   say('✅ 已載入 Google 雲端 '+snapshot().length+' 項收藏','success');
  }else if(equal(local,remote.selected)){
   autosave=true;say('✅ 本機與 Google 雲端一致（'+local.length+' 項）','success');
  }else{
   say('⚠️ 本機 '+local.length+' 項與 Google 雲端進度不同。請選擇儲存或載入，不會自動覆蓋。');
  }
 }catch(e){
  if(epoch===version)say('❌ 雲端讀取失敗：'+errMessage(e)+' 本機收藏不受影響','error');
 }finally{if(epoch===version){busy=false;show();}}
}
async function loadCloud(){
 if(!user||busy||writing)return;
 if(timer!==null&&autosave&&dirty){clearDelay();await persist();if(dirty)return;}
 clearDelay();autosave=false;pending=false;busy=true;show();const version=epoch,startRevision=revision;
 try{
  const remote=await getRemote();
  if(epoch!==version)return;
  if(!remote){say('雲端尚未建立進度，請先按「儲存到雲端」。');return;}
  const next=checkedList(remote.selected),local=snapshot();
  if(revision!==startRevision){say('載入期間本機收藏有變更，已取消還原，請再試一次。');return;}
  if(!next.length&&local.length){say('雲端存檔目前為 0 項；已保留本機 '+local.length+' 項，避免空白存檔覆蓋。','error');return;}
  if(local.length&&!equal(local,next)&&
     !confirm('雲端有 '+next.length+' 項、本機有 '+local.length+' 項。確定用雲端進度取代本機勾選嗎？')){
    say('已取消載入，保留本機進度');return;
  }
  if(verified&&equal(local,verified)&&!equal(next,verified)){say('雲端存檔與本次已核對的保存結果不同，已保留本機進度；請重新儲存。','error');return;}
  revision++;applyCloud(next);autosave=true;dirty=false;verified=next;
  say('✅ 成功還原 Google 雲端 '+snapshot().length+' 項收藏','success');
 }catch(e){
  if(epoch===version)say('❌ 雲端載入失敗：'+errMessage(e)+' 本機進度仍保留','error');
 }finally{busy=false;show();}
}
// Read only public project capability metadata; never access private data or credentials.
async function checkPublicBackend(){
 if(typeof fetch!=='function'||!cfg.url||!cfg.anonKey)return;
 const base=cfg.url.replace(/\/$/,'');
 let googleDisabled=false,tableMissing=false;
 try{
  const response=await fetch(base+'/auth/v1/settings',{headers:{apikey:cfg.anonKey},cache:'no-store'});
  if(response.ok){
   const settings=await response.json();
   googleDisabled=settings?.external?.google===false;
  }
 }catch(e){/* Offline clients may still have a valid cached session. */}
 try{
  const response=await fetch(base+'/rest/v1/collection_progress?select=user_id&limit=0',{
   headers:{apikey:cfg.anonKey,Accept:'application/json'},cache:'no-store'
  });
  if(response.status===404){
   const result=await response.json().catch(()=>({}));
   tableMissing=result?.code==='PGRST205';
  }
 }catch(e){/* Authenticated operations report any real errors separately. */}
 providerDisabled=googleDisabled;
 show();
 if(!user&&(googleDisabled||tableMissing)){
  const reasons=[
   googleDisabled?'Google 登入尚未啟用（Supabase → Authentication → Providers → Google）':null,
   tableMissing?'收藏雲端資料表尚未建立（執行 collection_progress_setup.sql）':null
  ].filter(Boolean);
  say('❌ 雲端功能尚未完成設定：'+reasons.join('；')+'。目前收藏會保存在這台裝置。','error');
 }
}
login.addEventListener('click',async()=>{
 if(!db){say('Google 登入服務尚未就緒，請檢查連線設定','error');return;}
 if(providerDisabled){say('❌ 此 Supabase 專案尚未啟用 Google 登入。請管理員先在 Authentication → Providers → Google 啟用。','error');return;}
 login.disabled=true;say('正在前往 Google 授權畫面…');
 try{
  const {error}=await db.auth.signInWithOAuth({
   provider:'google',options:{redirectTo:location.origin+location.pathname}
  });
  if(error)throw error;
 }catch(e){say('❌ Google 登入失敗：'+errMessage(e),'error');}
 finally{show();}
});
logout.addEventListener('click',async()=>{
 if(!db)return;clearDelay();
 try{
  const {error}=await db.auth.signOut();if(error)throw error;
  epoch++;user=null;autosave=false;show();say('已登出 Google，本機勾選依然保留。');
 }catch(e){say('❌ 登出失敗：'+errMessage(e),'error');}
});
saveBtn.addEventListener('click',()=>{
 if(!user||busy||writing)return;
 let count;try{count=checkedList(snapshot()).length;}catch(e){say(errMessage(e),'error');return;}
 if(!confirm('將本機 '+count+' 項收藏儲存到 Google 雲端？如原本有雲端資料將被覆蓋。'))return;
 if(count===0&&!confirm('再次確認：這會清空雲端收藏存檔，確定繼續？'))return;
 autosave=true;dirty=true;say('正在儲存 '+count+' 項收藏，請等待雲端核對完成…');void persist(count===0);
});
loadBtn.addEventListener('click',()=>{void loadCloud();});
window.StarroCollectionCloud={scheduleSave,pauseAutosave,save:()=>persist(false),load:loadCloud};
const query=new URLSearchParams(location.search),oauthError=query.get('error_description')||query.get('error');
if(oauthError)say('❌ Google 授權失敗：'+errMessage(oauthError),'error');
if(!window.supabase?.createClient||!cfg.url||!cfg.anonKey){
 if(!oauthError)say('❌ Google 登入服務未初始化：請檢查 Supabase SDK 及公開連線設定。','error');
 login.disabled=true;return;
}
try{
 db=window.supabase.createClient(cfg.url,cfg.anonKey,{
  auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,
   detectSessionInUrl:true,storageKey:'starro-collection-google-auth'}
 });
}catch(e){say('❌ Google 登入初始化失敗：'+errMessage(e),'error');login.disabled=true;return;}
show();if(!oauthError)say('正在確認 Google 登入狀態…');
db.auth.onAuthStateChange((event,session)=>{
 if(event==='SIGNED_OUT'){
  setTimeout(()=>{void activate(null);say('已登出 Google，本機收藏仍保留。');},0);
 }else if(session?.user)setTimeout(()=>{void activate(session);},0);
});
db.auth.getSession().then(({data,error})=>{
 if(error)throw error;
 if(data?.session?.user)return activate(data.session);
 if(!oauthError&&!user)say('尚未登入 Google；目前收藏進度保存在本機。');
}).catch(e=>say('❌ Google 登入狀態檢查失敗：'+errMessage(e),'error'))
  .finally(()=>{void checkPublicBackend();});
})();