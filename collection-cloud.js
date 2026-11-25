/* StarRo: Google OAuth and per-user cloud collection progress (RLS-protected). */
(function(){
'use strict';
const cfg=window.STARRO_SUPABASE||{},el=id=>document.getElementById(id);
const login=el('collectionGoogleLogin'),logout=el('collectionGoogleLogout');
const saveBtn=el('collectionCloudSave'),loadBtn=el('collectionCloudLoad'),status=el('collectionCloudStatus');
if(!login||!logout||!saveBtn||!loadBtn||!status)return;
const KEY='starro_collection_selected';
let db=null,user=null,epoch=0,busy=false,writing=false,autosave=false,timer=null,revision=0,pending=false;
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
function keys(){return new Set(ITEMS.map(keyOf));}
function normalize(v){return typeof v==='string'?v.replace(/^JRO收藏\|/,'特殊收藏|'):'';}
function snapshot(){
 const valid=keys();return [...selected].map(normalize).filter(k=>valid.has(k)).sort();
}
function equal(a,b){const valid=keys();return JSON.stringify(a)===JSON.stringify(
 (Array.isArray(b)?b:[]).map(normalize).filter(k=>valid.has(k)).sort());}
function storeLocal(){try{localStorage.setItem(KEY,JSON.stringify(snapshot()));}catch(e){say('本機儲存失敗：'+errMessage(e),'error');}}
function show(){
 const logged=!!user;
 login.style.display=logged?'none':'';
 logout.style.display=logged?'':'none';
 saveBtn.style.display=logged?'':'none';
 loadBtn.style.display=logged?'':'none';
 saveBtn.disabled=busy||writing;loadBtn.disabled=busy||writing;
}
function applyCloud(progress){
 const valid=keys();selected.clear();
 for(const value of Array.isArray(progress)?progress:[]){const k=normalize(value);if(valid.has(k))selected.add(k);}
 storeLocal();
 updateSummary();renderSubcats();renderSpecials();renderList();renderTotals();renderRequiredPanels();
}
function clearDelay(){if(timer!==null){clearTimeout(timer);timer=null;}}
async function getRemote(){
 const {data,error}=await db.from('collection_progress').select('selected,updated_at')
 .eq('user_id',user.id).maybeSingle();
 if(error)throw error;return data;
}
async function persist(){
 if(!db||!user||busy){pending=true;return;}
 if(writing){pending=true;return;}
 clearDelay();writing=true;show();
 const account=user.id,version=epoch;
 try{
  let captured;
  do{
   pending=false;captured=revision;
   const copy=snapshot();
   const {error}=await db.from('collection_progress').upsert({
    user_id:account,selected:copy,updated_at:new Date().toISOString()
   },{onConflict:'user_id'});
   if(error)throw error;
   if(epoch!==version||!user||user.id!==account)return;
   if(!pending&&revision===captured){
    autosave=true;
    say('✅ Google 雲端已儲存 '+copy.length+' 項（'+
      new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false})+'）','success');
   }
  }while((pending||revision!==captured)&&version===epoch);
 }catch(e){
  if(epoch===version){autosave=false;say('❌ 雲端儲存失敗：'+errMessage(e)+' 本機進度仍保留','error');}
 }finally{writing=false;show();}
}
function scheduleSave(){
 revision++;storeLocal();
 if(!user){say('✅ 本機已儲存；登入 Google 後可同步');return;}
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
 user=next;autosave=false;
 const version=++epoch;busy=true;clearDelay();show();
 say('Google 已登入：'+(next.email||'使用者')+'，正在核對收藏進度…');
 try{
  const remote=await getRemote();
  if(epoch!==version)return;
  const local=snapshot();
  if(!remote){
   if(local.length)say('Google 已登入，雲端目前無資料。本機有 '+local.length+' 項，按「儲存到雲端」建立備份。');
   else{autosave=true;say('✅ Google 已登入；首次勾選將自動儲存。','success');}
  }else if(!local.length){
   applyCloud(remote.selected);autosave=true;
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
 clearDelay();busy=true;show();const version=epoch;
 try{
  const remote=await getRemote();
  if(epoch!==version)return;
  if(!remote){say('雲端尚未建立進度，請先按「儲存到雲端」。');return;}
  const local=snapshot();
  if(local.length&&!equal(local,remote.selected)&&
     !confirm('雲端與本機勾選不同。確定用雲端進度取代本機勾選嗎？')){
    say('已取消載入，保留本機進度');return;
  }
  revision++;applyCloud(remote.selected);autosave=true;
  say('✅ 成功還原 Google 雲端 '+snapshot().length+' 項收藏','success');
 }catch(e){
  if(epoch===version)say('❌ 雲端載入失敗：'+errMessage(e)+' 本機進度仍保留','error');
 }finally{busy=false;show();}
}
login.addEventListener('click',async()=>{
 if(!db){say('Google 登入服務尚未就緒，請檢查連線設定','error');return;}
 login.disabled=true;say('正在前往 Google 授權畫面…');
 try{
  const {error}=await db.auth.signInWithOAuth({
   provider:'google',options:{redirectTo:location.origin+location.pathname}
  });
  if(error)throw error;
 }catch(e){say('❌ Google 登入失敗：'+errMessage(e),'error');}
 finally{login.disabled=false;}
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
 if(!confirm('將本機 '+snapshot().length+' 項收藏儲存到 Google 雲端？如原本有雲端資料將被覆蓋。'))return;
 autosave=true;void persist();
});
loadBtn.addEventListener('click',()=>{void loadCloud();});
window.StarroCollectionCloud={scheduleSave,save:persist,load:loadCloud};
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
}).catch(e=>say('❌ Google 登入狀態檢查失敗：'+errMessage(e),'error'));
})();