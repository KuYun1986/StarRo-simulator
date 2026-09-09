
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
  const HEAD_ICON_MAP = [
    ['掉落','🎁'],['龍甲','🐉'],['善惡','⚔️'],['符文','🗿'],['華金','🔥'],['競標','🪡'],['時光','💎'],['收藏','📚'],['裝備','💰'],['現金','💳'],['遊戲','🎮'],['自訂流程','⚙️'],['影子','💎'],['測傷','🧪'],['百家樂','🎴'],['輪盤','🎡'],['21點','🃏'],['推筒子','🀙'],['儲值','💳'],['鑑定','🔍'],['價格','💰']
  ];
  const RARITY_PATTERNS = [
    {key:'sss', label:'SSS', className:'rarity-sss', tests:['SSS','評級SSS']},
    {key:'xr', label:'XR', className:'rarity-xr', tests:['XR']},
    {key:'ur', label:'UR', className:'rarity-ur', tests:['UR']},
    {key:'special', label:'SPECIAL', className:'rarity-special', tests:['特殊','頂級','傳說','神話']}
  ];

  function pageMeta(){ return PAGE_META[path] || {icon:'✦', title:document.title || '繁星仙境模擬器', desc:'RO 風格前台頁面。', badges:['🌟 StarRo'], side:'你可以透過上方導覽切換各區。', actions:[['🏠 回主頁','index.html']]}; }
  function currentPageName(){ return path === '' ? 'index.html' : path; }
  function markCurrentLinks(){
    const normalized = currentPageName();
    $$('a[href]').forEach(a=>{
      const href = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
      if(href && href === normalized){ a.setAttribute('aria-current','page'); a.classList.add('is-current'); }
    });
  }
  function normalizeCollectionNav(){
    const topnav = $('.topnav');
    if(topnav && !topnav.classList.contains('starro-navigation')) topnav.classList.add('starro-navigation');
  }
  function injectHero(){ /* intentionally disabled: keep front-end compact */ }
  function decorateHeadings(){
    $$('section.card h2, .card h2').forEach(h=>{
      if($('.ro-title-icon', h)) return;
      const text = h.textContent.trim();
      let icon = '✦';
      for(const [k,v] of HEAD_ICON_MAP){ if(text.includes(k)){ icon = v; break; } }
      const badge = document.createElement('span');
      badge.className = 'ro-title-icon';
      badge.textContent = icon;
      h.prepend(badge);
    });
  }
  function widenMainCards(){
    const wideKeywords = ['收藏','影子','裝備','符文','遊戲區','龍甲','善惡','累積儲值','倍率比較','現價'];
    $$('.card').forEach(card=>{
      const h = $('h2', card); if(!h) return;
      if(wideKeywords.some(k=>h.textContent.includes(k))) card.classList.add('ro-full');
    });
  }
  function buildSectionTabs(){
    const wrap = $('.wrap'); if(!wrap || $('.ro-tabs-shell')) return;
    const cards = $$('.wrap > .card, .wrap > section.card').filter(card=> $('h2',card) && card.id !== 'onlineBar');
    if(cards.length < 2) return;
    cards.forEach((card,idx)=>{
      if(!card.dataset.roTabId) card.dataset.roTabId = card.id || `ro-tab-${idx+1}`;
      const h = $('h2', card);
      card.dataset.roTabLabel = (h?.textContent || `區塊 ${idx+1}`).trim().replace(/\s+/g,' ');
    });
    const shell = document.createElement('section');
    shell.className = 'ro-tabs-shell';
    const btns = [`<button type="button" class="ro-tab-btn all active" data-ro-tab-target="all">全部顯示 <span class="ro-tab-indicator">${cards.length}</span></button>`]
      .concat(cards.map((card,idx)=>`<button type="button" class="ro-tab-btn" data-ro-tab-target="${card.dataset.roTabId}">${card.dataset.roTabLabel.length>15?card.dataset.roTabLabel.slice(0,15)+'…':card.dataset.roTabLabel}<span class="ro-tab-indicator">${idx+1}</span></button>`));
    shell.innerHTML = `<div class="ro-tabs-head"><h3>功能分頁</h3></div><div class="ro-tabs-grid">${btns.join('')}</div>`;
    const hero = $('.ro-page-hero') || $('.ro-lobby') || $('.starro-navigation') || $('.topnav');
    if(hero) hero.insertAdjacentElement('afterend', shell); else wrap.insertBefore(shell, wrap.children[1] || null);
    shell.querySelectorAll('.ro-tab-btn').forEach(btn=>btn.addEventListener('click',()=>activateSectionTab(btn.dataset.roTabTarget)));
  }
  function activateSectionTab(target){
    const cards = $$('.wrap > .card, .wrap > section.card').filter(card=> $('h2',card) && card.id !== 'onlineBar');
    const buttons = $$('.ro-tab-btn');
    buttons.forEach(btn=>btn.classList.toggle('active', btn.dataset.roTabTarget === target));
    cards.forEach(card=>{
      const show = target === 'all' || card.dataset.roTabId === target;
      card.classList.toggle('ro-tabbed-hidden', !show);
      card.classList.toggle('ro-tabbed-active', show && target !== 'all');
    });
    if(target !== 'all'){
      const hit = cards.find(c=>c.dataset.roTabId === target);
      hit?.scrollIntoView({behavior:'smooth', block:'start'});
    }
  }
  function getRarityRule(text){
    const t = String(text || '').toUpperCase();
    for(const rule of RARITY_PATTERNS){
      if(rule.tests.some(x => t.includes(String(x).toUpperCase()))) return rule;
    }
    return null;
  }
  function applyRarityGlow(){
    $$('.card').forEach(card=>{
      const text = card.textContent || '';
      const rule = getRarityRule(text);
      if(rule) card.classList.add(rule.className);
      const heading = $('h2', card);
      if(heading && rule && !$('.ro-rarity-tag', heading)){
        const tag = document.createElement('span');
        tag.className = `ro-rarity-tag ${rule.key}`;
        tag.textContent = rule.label;
        heading.appendChild(tag);
      }
    });
    $$('button, .badge, .chip, .subcat-chip, .special-chip, .page-link, .game-page-link').forEach(el=>{
      const rule = getRarityRule(el.textContent || '');
      if(rule) el.classList.add(rule.className);
    });
  }
  function boot(){
    normalizeCollectionNav();
    markCurrentLinks();
    injectHero();
    decorateHeadings();
    widenMainCards();
    buildSectionTabs();
    applyRarityGlow();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
