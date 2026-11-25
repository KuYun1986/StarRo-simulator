/* Single source of truth for StarRo's nine cross-section entrances. */
(function(){
  'use strict';
  const links=[["index.html","🏠 主頁"],["game.html","🎮 遊戲區"],["enchant.html","✨ 附魔區"],["identify.html","🔍 洗詞鑑定區"],["collection.html","📚 收藏專區"],["equipment.html","💰 裝備成本區"],["CASH.html","💳 現金區"],["shadow.html","💎 影子區"],["admin.html","🔐 管理後台"]];
  function init(){
    const page=decodeURIComponent(location.pathname.split('/').pop()||'index.html');
    const active=page==='catalog.html'?'collection.html':page;
    for(const nav of document.querySelectorAll('[data-starro-unified-nav]')){
      const frag=document.createDocumentFragment();
      for(const item of links){
        const link=document.createElement('a');
        link.href=item[0];link.textContent=item[1];
        if(item[0]===active)link.setAttribute('aria-current','page');
        frag.appendChild(link);
      }
      nav.replaceChildren(frag);
      const admin=nav.querySelector('a[href="admin.html"]');
      let actions=nav.parentElement.querySelector(':scope > .starro-account-actions');
      if(!actions){actions=document.createElement('div');actions.className='starro-account-actions';nav.before(actions);}
      if(admin)actions.appendChild(admin);
      if(!actions.querySelector('#collectionGoogleLogin')&&!actions.querySelector('#collectionGoogleLogout')){
        const google=document.createElement('a');google.className='starro-google-entry';google.href='collection.html?login=1';google.textContent='G  Google 登入';actions.prepend(google);
      }
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();