/* Google sign-in and user-owned collection progress. */
(function(){
  'use strict';
  const cfg=window.STARRO_SUPABASE||{};
  const status=document.getElementById('collectionCloudStatus');
  const login=document.getElementById('collectionGoogleLogin');
  const logout=document.getElementById('collectionGoogleLogout');
  const saveButton=document.getElementById('collectionCloudSave');
  const loadButton=document.getElementById('collectionCloudLoad');
  const localKey='starro_collection_selected';
  let client=null,user=null,timer=null,loading=false,revision=0,savedRevision=0;
  const setStatus=text=>{if(status)status.textContent=text;};
  const redraw=()=>{
    updateSummary();renderSubcats();renderSpecials();renderList();
    renderTotals();renderRequiredPanels();
  };
  const validKeys=new Set(ITEMS.map(keyOf));
  const current=()=>[...selected].filter(k=>validKeys.has(k));
  const apply=keys=>{
    selected.clear();
    (Array.isArray(keys)?keys:[]).forEach(k=>{if(validKeys.has(k))selected.add(k);});
    try{localStorage.setItem(localKey,JSON.stringify(current()));}catch(e){}
    redraw();
  };
  const showUser=()=>{
    login.style.display=user?'none':'';
    logout.style.display=user?'':'none';
    saveButton.style.display=user?'':'none';
    loadButton.style.display=user?'':'none';
    if(!user)setStatus('未登入・勾選進度保存在本機');
  };
  async function cloudRow(){
    const {data,error}=await client.from('collection_progress')
      .select('selected,updated_at').eq('user_id',user.id).maybeSingle();
    if(error)throw error;
    return data;
  }
  async function cloudSave(){
    if(!user||loading)return;
    if(timer){clearTimeout(timer);timer=null;}
    const version=revision;
    const payload={user_id:user.id,selected:current(),updated_at:new Date().toISOString()};
    const {error}=await client.from('collection_progress').upsert(payload,{onConflict:'user_id'});
    if(error)throw error;
    savedRevision=version;
    setStatus('✅ 雲端已儲存 '+new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}));
    if(revision!==version)scheduleSave();
  }
  function scheduleSave(){
    revision++;
    try{localStorage.setItem(localKey,JSON.stringify(current()));}catch(e){}
    if(!user||loading)return;
    setStatus('變更已存本機，正在同步雲端…');
    if(timer)clearTimeout(timer);
    timer=setTimeout(()=>cloudSave().catch(e=>setStatus('⚠️ 雲端同步失敗：'+e.message+'；本機進度仍保留')),1200);
  }
  async function cloudLoad(ask){
    if(!user)return;
    if(timer){clearTimeout(timer);timer=null;}
    loading=true;
    try{
      const data=await cloudRow();
      if(!data){setStatus('雲端尚無進度；可按「儲存到雲端」上傳本機進度');return;}
      if(ask&&current().length&&!confirm('確定以雲端進度覆蓋此裝置的勾選？建議先匯出 Excel 備份。'))return;
      apply(data.selected);
      savedRevision=revision;
      setStatus('✅ 已載入雲端進度（'+current().length+' 項）');
    }finally{loading=false;}
  }
  async function signedIn(session){
    const next=session?.user||null;
    if(!next){user=null;showUser();return;}
    if(user?.id===next.id)return;
    user=next;showUser();
    loading=true;
    try{
      const data=await cloudRow();
      const local=current();
      if(!data){
        loading=false;
        setStatus('已登入 '+(user.email||'Google')+'，雲端尚無進度');
        if(local.length)await cloudSave();
      }else if(!local.length||JSON.stringify(local.slice().sort())===JSON.stringify((data.selected||[]).slice().sort())){
        apply(data.selected);setStatus('✅ 已同步 '+current().length+' 項收藏');
      }else{
        // Never silently discard existing progress on either side.
        const useCloud=confirm('Google 雲端已有收藏進度，本機也有不同勾選。\n按「確定」：使用雲端進度。\n按「取消」：保留本機進度，暫不覆蓋雲端；可以按「儲存到雲端」上傳。');
        if(useCloud){apply(data.selected);setStatus('✅ 已載入雲端進度');}
        else setStatus('已登入・目前保留本機進度，尚未覆蓋雲端');
      }
    }catch(e){setStatus('⚠️ 無法讀取雲端：'+e.message);}
    finally{loading=false;}
  }
  function ensureClient(){
    if(!window.supabase?.createClient||!cfg.url||!cfg.anonKey){
      setStatus('Google 雲端登入未啟用（Supabase SDK 或設定尚未就緒）');
      return false;
    }
    client=window.supabase.createClient(cfg.url,cfg.anonKey,{
      auth:{flowType:'pkce',autoRefreshToken:true,persistSession:true,detectSessionInUrl:true,
        storageKey:'starro-collection-google-auth'}
    });
    return true;
  }
  login.addEventListener('click',async()=>{
    if(!client)return setStatus('Google 登入服務尚未就緒');
    setStatus('正在前往 Google 登入…');
    const {error}=await client.auth.signInWithOAuth({
      provider:'google',
      options:{redirectTo:location.origin+location.pathname}
    });
    if(error)setStatus('Google 登入失敗：'+error.message);
  });
  logout.addEventListener('click',async()=>{
    if(!client)return;
    if(timer){clearTimeout(timer);timer=null;}
    const {error}=await client.auth.signOut();
    if(error){setStatus('登出失敗：'+error.message);return;}
    user=null;showUser();
  });
  saveButton.addEventListener('click',async()=>{
    if(!user)return;
    if(!confirm('確定將本機 '+current().length+' 項勾選儲存到雲端？這將覆蓋此 Google 帳號原有的雲端進度。'))return;
    try{loading=false;await cloudSave();}catch(e){setStatus('❌ 儲存失敗：'+e.message);}
  });
  loadButton.addEventListener('click',()=>cloudLoad(true).catch(e=>setStatus('❌ 載入失敗：'+e.message)));
  window.StarroCollectionCloud={scheduleSave};
  if(!ensureClient())return;
  client.auth.onAuthStateChange((_event,session)=>{
    // Supabase may invoke this for token refresh; avoid duplicate cloud reloads.
    setTimeout(()=>signedIn(session),0);
  });
  client.auth.getSession().then(({data,error})=>{
    if(error)setStatus('登入狀態讀取失敗：'+error.message);
    else signedIn(data.session);
  }).catch(e=>setStatus('登入狀態讀取失敗：'+e.message));
})();
