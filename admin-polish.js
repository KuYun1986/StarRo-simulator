(function(){
  'use strict';
  function init(){
    const app=document.getElementById('adminApp'),overview=app?.querySelector('.overview');
    if(!app||!overview||document.getElementById('adminUxTools'))return;
    const tools=document.createElement('section');
    tools.className='ux-admin-tools';tools.id='adminUxTools';
    const title=document.createElement('div');title.className='ux-admin-tools__title';title.textContent='✦ 管理工作台';
    const desc=document.createElement('p');desc.className='tiny';desc.textContent='搜尋功能，或快速前往模擬器規則與備份管理。所有資料仍由原本的「儲存全部」發布。';
    const shortcuts=document.createElement('div');shortcuts.className='ux-section-index__links';
    const destinations=[['#biosAdminPanel','🧿 拜歐斯材料'],['#serviceRulesAdminPanel','🔨 代敲／代評'],['#airPricesAdminPanel','🧿 空中護身符'],['#featureTable','⚙️ 其他模擬器']];
    destinations.forEach(([href,label])=>{const a=document.createElement('a');a.href=href;a.textContent=label;shortcuts.appendChild(a)});
    const controls=document.createElement('div');controls.className='ux-admin-search';
    const label=document.createElement('label');label.htmlFor='adminUxSearch';label.textContent='搜尋管理功能';
    const search=document.createElement('input');search.id='adminUxSearch';search.type='search';search.placeholder='例如：收藏、裝備價格、遊戲、附魔';search.autocomplete='off';
    const count=document.createElement('span');count.id='adminUxCount';count.className='tiny';
    controls.append(label,search,count);tools.append(title,desc,shortcuts,controls);
    overview.insertAdjacentElement('afterend',tools);
    function filter(){
      const q=search.value.trim().toLocaleLowerCase('zh-TW');
      const rows=[...document.querySelectorAll('#featureTable .feature-row')];
      let visible=0;
      rows.forEach(row=>{const show=!q||row.textContent.toLocaleLowerCase('zh-TW').includes(q);row.hidden=!show;if(show)visible++});
      count.textContent=q?('找到 '+visible+' / '+rows.length+' 項功能'):(rows.length+' 項功能可管理');
    }
    search.addEventListener('input',filter);
    const target=document.getElementById('featureTable');
    if(target){const observer=new MutationObserver(filter);observer.observe(target,{childList:true});}
    filter();
    app.addEventListener('input',e=>{
      if(e.target.closest('#biosAdminPanel,#serviceRulesAdminPanel,#airPricesAdminPanel'))app.dataset.unsaved='true';
    });
    const save=document.getElementById('saveAllBtn');
    save?.addEventListener('click',()=>{
      // Actual save status is authoritative; button click alone must not clear a warning.
      setTimeout(()=>{if(document.getElementById('saveState')?.textContent==='已同步')app.dataset.unsaved='false'},450);
    });
    window.addEventListener('beforeunload',e=>{
      const pending=app.dataset.unsaved==='true'||document.getElementById('saveState')?.textContent==='有未儲存變更';
      if(!app.classList.contains('hidden')&&pending){e.preventDefault();e.returnValue='';}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();