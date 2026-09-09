
(function(){
  'use strict';
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const PAGE_META = {
    'index.html': {icon:'🏠', title:'繁星主城大廳', desc:'把常用模擬器集中成像 RO 主城控制台一樣的入口。你可以快速進入 GAME、CASH、附魔、洗詞鑑定、收藏、裝備成本與影子區。', badges:['☁️ 雲端同步','🎲 機率模擬','💹 物價更新'], side:'建議常用流程：\n1. 後台更新資料\n2. 儲存到雲端\n3. 匯出給 ChatGPT\n4. 前台重新整理套用', actions:[['🎮 遊戲區','game.html'],['🔐 管理後台','admin.html',true]]},
    'game.html': {icon:'🎮', title:'遊戲娛樂大廳', desc:'整合 21 點、推筒子、輪盤、百家樂等遊戲模擬，風格統一成 RO 控制台操作面板。', badges:['🎲 小遊戲模擬','📊 戰報與統計','🕹️ 快速試手氣'], side:'建議把常玩的模式固定放在上方，方便日後再擴充更多玩法。', actions:[['🏠 回主頁','index.html'],['💳 前往現金區','CASH.html']]},
    'cash.html': {icon:'💳', title:'CASH / 儲值中心', desc:'集中管理 CASH、儲值比值、紅利、級距與累積獎勵，畫面統一成商城風格控制台。', badges:['💰 儲值級距','🎁 累積獎勵','📈 商城比值'], side:'如果你調整級距與活動獎勵，記得同步到後台匯出 JSON，之後我就會使用最新版本。', actions:[['🔐 管理後台','admin.html',true],['🎮 前往遊戲區','game.html']]},
    'enchant.html': {icon:'✨', title:'附魔與精煉工坊', desc:'統一呈現龍甲、善惡、時光靴與各類附魔模擬，風格像遊戲內的強化工坊。', badges:['🐉 龍甲','⚔️ 善惡','💎 時光靴'], side:'這區內容偏多，已改成更一致的工坊風格；後續也可再加稀有度顏色與發光效果。', actions:[['🔍 前往洗詞鑑定區','identify.html'],['🏠 回主頁','index.html']]},
    'identify.html': {icon:'🔍', title:'洗詞鑑定中心', desc:'華金一條龍 2 種、競標針、鑑定棒整合在同一個 RO 風介面，不用再額外點內頁。', badges:['🔥 華金鎧甲 / 鞋','💎 華金耳環 / 飾品','🪡 競標針'], side:'這一區主打操作順手、資料集中。後續若要再增加新鑑定玩法，也能沿用同一套面板。', actions:[['✨ 前往附魔區','enchant.html'],['📚 前往收藏區','collection.html']]},
    'collection.html': {icon:'📚', title:'收藏圖鑑總覽', desc:'把收藏、搜尋、勾選、子分類與 Excel 匯入匯出整理成圖鑑式介面，看起來更像遊戲內收藏手冊。', badges:['📖 圖鑑風格','🔎 快速搜尋','📤 匯出 Excel'], side:'如果你要調整收藏資料，建議從後台同步中心匯出，再把新 JSON 丟給我，我就能沿用最新收藏設定。', actions:[['💰 前往裝備成本區','equipment.html'],['🏠 回主頁','index.html']]},
    'equipment.html': {icon:'💰', title:'裝備成本試算台', desc:'統一整理材料價格、代敲材料與裝備製作成本，頁面像遊戲內打造與估價工作台。', badges:['🧮 成本試算','📦 材料單價','💲 代敲價格'], side:'這區的價格最常更新，之後只要在後台更新並匯出 JSON，就能把最新物價同步給我。', actions:[['📚 前往收藏區','collection.html'],['💎 前往影子區','shadow.html']]},
    'shadow.html': {icon:'💎', title:'影子裝備實驗室', desc:'影子結晶、升級素質與測傷區統一成實驗室風格，像遊戲內專門研究傷害與結晶的介面。', badges:['💎 結晶計算','🧪 測傷區','📉 倍率比較'], side:'影子區適合後續再加更多圖表或職業預設模板，現在先把整體視覺統一成同一套 RO 風。', actions:[['💰 前往裝備成本區','equipment.html'],['🔐 管理後台','admin.html',true]]}
  };
  const DEFAULT_NAV = [
    {key:'index', icon:'🏠', label:'主頁', href:'index.html', visible:true},
    {key:'game', icon:'🎮', label:'遊戲區', href:'game.html', visible:true},
    {key:'enchant', icon:'✨', label:'附魔區', href:'enchant.html', visible:true},
    {key:'identify', icon:'🔍', label:'洗詞鑑定區', href:'identify.html', visible:true},
    {key:'collection', icon:'📚', label:'收藏區', href:'collection.html', visible:true},
    {key:'equipment', icon:'💰', label:'裝備成本區', href:'equipment.html', visible:true},
    {key:'cash', icon:'💳', label:'現金區', href:'CASH.html', visible:true},
    {key:'shadow', icon:'💎', label:'影子區', href:'shadow.html', visible:true}
  ];
  const HEAD_ICON_MAP = [['掉落','🎁'],['龍甲','🐉'],['善惡','⚔️'],['符文','🗿'],['華金','🔥'],['競標','🪡'],['時光','💎'],['收藏','📚'],['裝備','💰'],['現金','💳'],['遊戲','🎮'],['自訂流程','⚙️'],['影子','💎'],['測傷','🧪']];
  function cfgGet(path, fb){ try{return window.StarroConfig?window.StarroConfig.get(path, fb):fb}catch(e){return fb} }
  function pageMeta(){
    const base = {...(PAGE_META[path] || {icon:'✦', title:document.title || '繁星仙境模擬器', desc:'RO 風格前台頁面。', badges:['🌟 StarRo'], side:'你可以透過上方導覽切換各區。', actions:[['🏠 回主頁','index.html']]})};
    if(path === 'shadow.html'){
      const s = cfgGet('ui.shadowPage', null) || {};
      base.title = s.title || base.title;
      base.desc = s.desc || base.desc;
      base.side = s.side || base.side;
      if(s.action1Text && s.action1Href && s.action2Text && s.action2Href){
        base.actions = [[s.action1Text, s.action1Href],[s.action2Text, s.action2Href, s.action2Href==='admin.html']];
      }
    }
    return base;
  }
  function navConfig(){ const arr = cfgGet('ui.navigation', null); return Array.isArray(arr) && arr.length ? arr : DEFAULT_NAV; }
  function applyNavigationConfig(){
    const nav = $('.starro-navigation') || $('.topnav') || $('.page-links'); if(!nav) return;
    const adminLink = $('a[href$="admin.html"]', nav) || $('a.game-page-link', nav);
    const currentPage = path === '' ? 'index.html' : path;
    const linksMap = {};
    $$('a[href]', nav).forEach(a=>{ linksMap[(a.getAttribute('href')||'').split('/').pop().toLowerCase()] = a; });
    nav.querySelectorAll('a[href]').forEach(a=>{ const href=(a.getAttribute('href')||'').split('/').pop().toLowerCase(); if(href!=='admin.html') a.remove(); });
    const items = navConfig().filter(x=>x.visible!==false);
    items.forEach(item=>{
      const href = String(item.href || '').split('/').pop();
      const a = document.createElement('a');
      a.href = item.href || '#';
      a.textContent = `${item.icon || '✦'} ${item.label || href}`;
      if(href.toLowerCase() === currentPage) a.setAttribute('aria-current','page');
      if(adminLink) nav.insertBefore(a, adminLink); else nav.appendChild(a);
    });
    if(adminLink){ nav.appendChild(adminLink); if(!adminLink.textContent.includes('管理後台')) adminLink.textContent='🔐 管理後台'; }
  }
  function markCurrentLinks(){ const normalized = currentPageName(); $$('a[href]').forEach(a=>{ const href = (a.getAttribute('href') || '').split('/').pop().toLowerCase(); if(href && href === normalized){ a.setAttribute('aria-current','page'); a.classList.add('is-current'); } else if(a.getAttribute('aria-current')==='page' && href!==normalized) a.removeAttribute('aria-current'); }); }
  function currentPageName(){ return path === '' ? 'index.html' : path; }
  function injectHero(){ const wrap = $('.wrap'); if(!wrap || $('.ro-page-hero')) return; const nav = $('.starro-navigation') || $('.topnav') || $('.page-links'); const sub = $('.sub'); const meta = pageMeta(); const hero = document.createElement('section'); hero.className='ro-page-hero'; hero.innerHTML=`<div class="ro-page-hero-inner"><div><div class="ro-page-hero-title"><div class="ro-page-icon">${meta.icon}</div><div><h2>${meta.title}</h2></div></div><p>${meta.desc}</p><div class="ro-page-badges">${(meta.badges||[]).map(t=>`<span class="ro-page-badge">${t}</span>`).join('')}</div><div class="ro-page-actions">${(meta.actions||[]).map(([txt,href,primary])=>`<a class="${primary?'primary-link':''}" href="${href}">${txt}</a>`).join('')}</div></div><aside class="ro-page-side"><b>GM 提示</b><br>${String(meta.side||'').replace(/\n/g,'<br>')}</aside></div>`; if(nav) nav.insertAdjacentElement('afterend', hero); else wrap.insertBefore(hero, wrap.firstChild.nextSibling); }
  function decorateHeadings(){ $$('section.card h2, .card h2').forEach(h=>{ if($('.ro-title-icon', h)) return; const text=h.textContent.trim(); let icon='✦'; for(const [k,v] of HEAD_ICON_MAP){ if(text.includes(k)){ icon=v; break; } } const badge=document.createElement('span'); badge.className='ro-title-icon'; badge.textContent=icon; h.prepend(badge); }); }
  function widenMainCards(){ const wideKeywords=['收藏','影子','裝備','符文','遊戲區','龍甲','善惡']; $$('.card').forEach(card=>{ const h=$('h2', card); if(!h) return; if(wideKeywords.some(k=>h.textContent.includes(k))) card.classList.add('ro-full'); }); }
  function normalizeCollectionNav(){ const topnav = $('.topnav'); if(topnav && !topnav.classList.contains('starro-navigation')) topnav.classList.add('starro-navigation'); }
  function boot(){ normalizeCollectionNav(); applyNavigationConfig(); markCurrentLinks(); injectHero(); decorateHeadings(); widenMainCards(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
