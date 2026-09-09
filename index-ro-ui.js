(function(){
  'use strict';
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const icons = [
    {key:'流程', icon:'⚙️'},
    {key:'掉落', icon:'🎁'},
    {key:'龍甲', icon:'🐉'},
    {key:'善惡', icon:'⚔️'},
    {key:'符文', icon:'🗿'},
    {key:'華金', icon:'🔥'},
    {key:'競標', icon:'🪡'},
    {key:'時光', icon:'💎'},
    {key:'收藏', icon:'📚'},
    {key:'裝備', icon:'💰'},
    {key:'現金', icon:'💳'},
    {key:'遊戲', icon:'🎮'}
  ];

  function decorateCards(){
    $$('.card').forEach((card,idx)=>{
      const h2 = $('h2', card);
      if(!h2 || $('.ro-emblem', h2)) return;
      const text = h2.textContent.trim();
      const found = icons.find(x=>text.includes(x.key));
      const emblem = document.createElement('span');
      emblem.className = 'ro-emblem';
      emblem.textContent = found ? found.icon : '✦';
      h2.prepend(emblem);
      if(idx < 2) card.classList.add('ro-card-highlight');
    });
  }

  function injectLobby(){
    const wrap = $('.wrap');
    const nav = $('.starro-navigation');
    const sub = $('.sub');
    if(!wrap || !nav || $('.ro-lobby')) return;
    const lobby = document.createElement('section');
    lobby.className = 'ro-lobby';
    lobby.innerHTML = `
      <div class="ro-lobby-head">
        <div class="ro-lobby-title">
          <h2>繁星主城大廳</h2>
          <p>把常用模擬器集中成像 RO 控制台一樣的入口。你可以直接進入 GAME、CASH、附魔、洗詞鑑定、收藏、裝備成本與影子區，也能從後台同步最新物價與機率設定。</p>
          <div class="ro-badges">
            <span class="ro-badge">☁️ 雲端同步</span>
            <span class="ro-badge">🎲 機率模擬</span>
            <span class="ro-badge">💹 物價更新</span>
            <span class="ro-badge">🧪 後台可匯出給 ChatGPT</span>
          </div>
        </div>
        <div class="ro-hero-side">
          <div class="tiny">當前網站風格已升級成較像遊戲介面的 <b>主城 HUD</b>。<br>建議常用流程：<br>1. 後台更新資料<br>2. 儲存到雲端<br>3. 匯出給 ChatGPT<br>4. 前台重新整理套用</div>
        </div>
      </div>
      <div class="ro-mini-grid">
        <div class="ro-mini"><span>主要入口</span><b>8 區</b></div>
        <div class="ro-mini"><span>後台狀態</span><b>Supabase</b></div>
        <div class="ro-mini"><span>同步用途</span><b>ChatGPT</b></div>
        <div class="ro-mini"><span>頁面模式</span><b>RO HUD</b></div>
      </div>
      <div class="ro-portal-grid">
        <a class="ro-portal" href="game.html"><strong>🎮 遊戲區</strong><span>輪盤／百家樂／21點／推筒子</span></a>
        <a class="ro-portal" href="CASH.html"><strong>💳 現金區</strong><span>儲值級距、商城比值、累積獎勵</span></a>
        <a class="ro-portal" href="enchant.html"><strong>✨ 附魔區</strong><span>龍甲、善惡、時光靴、各種附魔模擬</span></a>
        <a class="ro-portal" href="identify.html"><strong>🔍 洗詞鑑定區</strong><span>華金兩種、競標針、鑑定棒整合入口</span></a>
        <a class="ro-portal" href="collection.html"><strong>📚 收藏區</strong><span>收藏效果與需求快速查閱</span></a>
        <a class="ro-portal" href="equipment.html"><strong>💰 裝備成本區</strong><span>材料單價、服務價格與製作試算</span></a>
        <a class="ro-portal" href="shadow.html"><strong>💎 影子區</strong><span>影子裝備與結晶計算</span></a>
        <a class="ro-portal" href="admin.html"><strong>🔐 管理後台</strong><span>同步中心、版本歷史、雲端設定管理</span></a>
      </div>`;
    nav.insertAdjacentElement('afterend', lobby);

    const note = document.createElement('div');
    note.className = 'ro-gm-note';
    note.innerHTML = `<div class="icon">📢</div><div><b>GM 提示：</b> 如果你剛更新後台內容，前台重新整理就會依照最新雲端設定套用；若要同步給我，只要到後台的「資料同步 / 匯出中心」匯出 JSON 再丟到聊天視窗即可。</div>`;
    if(sub) sub.insertAdjacentElement('beforebegin', note);
  }

  function boot(){
    injectLobby();
    decorateCards();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
