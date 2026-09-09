
(function(){
  'use strict';
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const LOG_KEY = 'starro_admin_sync_logs_v1';
  const VERSION_KEY = 'starro_admin_version_history_v1';
  const NAV_CFG_KEY = 'ui.navigation';
  const SHADOW_CFG_KEY = 'ui.shadowPage';
  const FEATURE_KEYS = ['huajinArmor','huajinAccessory','auctionNeedle','dragon','evilWeapon','timeBoot','collection','equipment','game','cash'];
  const DEFAULT_NAV_ITEMS = [
    {key:'index', icon:'🏠', label:'主頁', href:'index.html', visible:true, note:'網站首頁'},
    {key:'game', icon:'🎮', label:'遊戲區', href:'game.html', visible:true, note:'輪盤 / 百家樂 / 21點 / 推筒子'},
    {key:'enchant', icon:'✨', label:'附魔區', href:'enchant.html', visible:true, note:'龍甲 / 善惡 / 時光靴'},
    {key:'identify', icon:'🔍', label:'洗詞鑑定區', href:'identify.html', visible:true, note:'華金兩種 / 競標針'},
    {key:'collection', icon:'📚', label:'收藏區', href:'collection.html', visible:true, note:'收藏圖鑑'},
    {key:'equipment', icon:'💰', label:'裝備成本區', href:'equipment.html', visible:true, note:'材料價格 / 成本試算'},
    {key:'cash', icon:'💳', label:'現金區', href:'CASH.html', visible:true, note:'儲值級距 / 紅利'},
    {key:'shadow', icon:'💎', label:'影子區', href:'shadow.html', visible:true, note:'影子結晶 / 試算'}
  ];
  const DEFAULT_SHADOW = { enabled:true, title:'影子裝備實驗室', desc:'影子結晶、升級素質與測傷區統一成實驗室風格，像遊戲內專門研究傷害與結晶的介面。', side:'影子區適合後續再加更多圖表或職業預設模板，現在先把整體視覺統一成同一套 RO 風。', action1Text:'💰 前往裝備成本區', action1Href:'equipment.html', action2Text:'🔐 管理後台', action2Href:'admin.html' };

  function esc(s){return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function hasFn(name){return typeof window[name] === 'function';}
  function toast(msg,bad){ if(hasFn('toast')) window.toast(msg,bad); }
  function currentMode(){return ($('#sourceMode')?.textContent || $('#cloudStatus')?.textContent || '本機').trim();}
  function currentVersion(){return (window.StarroConfig && window.StarroConfig.all && window.StarroConfig.all().meta?.version) || 'admin-v1';}
  function currentUpdatedAt(){return $('#updatedAt')?.textContent?.trim() || '—';}
  function readJsonLS(key,fallback){ try{ return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }catch(e){ return clone(fallback); } }
  function writeJsonLS(key,data){ localStorage.setItem(key, JSON.stringify(data)); }
  function readLogs(){ return readJsonLS(LOG_KEY, []); }
  function writeLog(action){ const logs = readLogs(); logs.unshift({time:new Date().toLocaleString('zh-TW'), action}); writeJsonLS(LOG_KEY, logs.slice(0,20)); }
  function readVersions(){ return readJsonLS(VERSION_KEY, []); }
  function saveVersions(list){ writeJsonLS(VERSION_KEY, list.slice(0,12)); }
  function downloadJson(filename,obj){ const blob = new Blob([JSON.stringify(obj,null,2)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),800); }
  function feature(key){ try{return clone(window.getFeature(key));}catch(e){return null;} }
  function getByPath(obj,path,fb){ const parts=String(path||'').split('.'); let cur=obj; for(const p of parts){ if(!p) continue; if(cur==null || !(p in cur)) return fb; cur=cur[p]; } return cur==null?fb:cur; }
  function setByPath(obj,path,value){ const parts=String(path||'').split('.'); let cur=obj; parts.forEach((p,i)=>{ if(i===parts.length-1) cur[p]=value; else { if(!cur[p] || typeof cur[p] !== 'object') cur[p] = {}; cur = cur[p]; } }); return obj; }
  function getConfig(){ try{return clone(window.StarroConfig.all());}catch(e){return {meta:{},features:{},ui:{}};} }
  function setConfig(cfg){ window.StarroConfig?.replace?.(cfg); }
  function featureSummary(key){
    try{
      const c = feature(key);
      switch(key){
        case 'huajinArmor': return `每次 ${c.cost} 紅｜${c.stage1Rate}% → ${c.stage2Rate}%`;
        case 'huajinAccessory': return `每次 ${c.cost} 紅｜${c.stage1Rate}% → ${c.stage2Rate}%`;
        case 'auctionNeedle': return `每次 ${c.cost} 紅｜第2詞 ${c.secondRate}%｜第3詞 ${c.thirdRate}%`;
        case 'dragon': return `第四洞 ${c.fourth.lv2to3}% / ${c.fourth.lv3toSpecial}%｜第三洞 ${c.third.lv3to4}% / ${c.third.lv4to5}% / ${c.third.lv5toSpecial}%`;
        case 'evilWeapon': return `${c.rates.lv1to2}% → ${c.rates.lv2to3}% → ${c.rates.lv3to4}% → ${c.rates.lv4to5}%`;
        case 'timeBoot': return (c.series||[]).map(x=>`${x.name} ${x.weight}%`).join('｜');
        case 'collection': return Array.isArray(c.items) ? `${c.items.length.toLocaleString()} 筆雲端收藏資料` : '使用網站內建收藏資料';
        case 'equipment': return `${Object.keys(c.priceOverrides||{}).length} 筆雲端價格覆寫｜材料預設價可編輯`;
        case 'game': return `輪盤 ${c.wheel?.maxBet??5000}紅｜百家樂 ${c.baccarat?.maxBet??30000}紅｜21點 ${c.blackjack?.bet??10000}P｜推筒子 ${c.tongzi?.bet??100000}P`;
        case 'cash': return `${(c.tiers||[]).length} 個儲值級距｜商城比值 ${c.shopRatio??280}｜紅利比值 ${c.bonusRatio??1.6}`;
        default: return '—';
      }
    }catch(e){ return '資料摘要讀取中'; }
  }
  function featureEnabled(key){ try{return feature(key)?.enabled !== false;}catch(e){return true;} }
  function activeKey(){ return window.__starro_last_panel || $('.panel.active')?.dataset.panel || 'adminHome'; }

  function navItemsFromConfig(){
    const cfg = getConfig();
    const arr = getByPath(cfg, NAV_CFG_KEY, null);
    if(Array.isArray(arr) && arr.length) return arr.map((x,i)=>({ ...DEFAULT_NAV_ITEMS[i%DEFAULT_NAV_ITEMS.length], ...x, visible:x.visible!==false }));
    return clone(DEFAULT_NAV_ITEMS);
  }
  function shadowConfigFromConfig(){
    const cfg = getConfig();
    return { ...DEFAULT_SHADOW, ...(getByPath(cfg, SHADOW_CFG_KEY, {}) || {}) };
  }
  function captureHomeNavFromDom(){
    const rows = $$('.sort-row[data-nav-key]', $('#homeNavList') || document);
    if(!rows.length) return navItemsFromConfig();
    return rows.map((row,idx)=>({
      key: row.dataset.navKey || ('item'+idx),
      icon: $('.nav-icon',row)?.value?.trim() || row.dataset.defaultIcon || '✦',
      label: $('.nav-label',row)?.value?.trim() || row.dataset.defaultLabel || '未命名',
      href: $('.nav-href',row)?.value?.trim() || row.dataset.defaultHref || '#',
      visible: $('.nav-visible',row)?.checked !== false,
      note: row.dataset.note || ''
    }));
  }
  function captureShadowFromDom(){
    const panel = $('[data-panel="shadowHub"]');
    if(!panel) return shadowConfigFromConfig();
    return {
      enabled: $('#shadowEnabled', panel)?.checked !== false,
      title: $('#shadowTitle', panel)?.value?.trim() || DEFAULT_SHADOW.title,
      desc: $('#shadowDesc', panel)?.value?.trim() || DEFAULT_SHADOW.desc,
      side: $('#shadowSide', panel)?.value?.trim() || DEFAULT_SHADOW.side,
      action1Text: $('#shadowAction1Text', panel)?.value?.trim() || DEFAULT_SHADOW.action1Text,
      action1Href: $('#shadowAction1Href', panel)?.value?.trim() || DEFAULT_SHADOW.action1Href,
      action2Text: $('#shadowAction2Text', panel)?.value?.trim() || DEFAULT_SHADOW.action2Text,
      action2Href: $('#shadowAction2Href', panel)?.value?.trim() || DEFAULT_SHADOW.action2Href
    };
  }
  function captureCustomState(){ return { navigation: captureHomeNavFromDom(), shadow: captureShadowFromDom() }; }
  function applyCustomState(cfg, custom){
    setByPath(cfg, NAV_CFG_KEY, custom.navigation || navItemsFromConfig());
    setByPath(cfg, SHADOW_CFG_KEY, custom.shadow || shadowConfigFromConfig());
    return cfg;
  }
  async function persistCustomState(custom, reason='更新自訂設定', rerender=true){
    try{
      const cfg = applyCustomState(getConfig(), custom || captureCustomState());
      setConfig(cfg);
      if(hasFn('saveRemote') && currentMode().includes('雲端')) await window.saveRemote(cfg);
      writeLog(reason);
      if(rerender && hasFn('renderShell')) window.renderShell();
      return true;
    }catch(e){ toast('儲存自訂設定失敗：' + e.message, true); return false; }
  }

  function buildSyncPackage(){
    if(hasFn('captureAll')) window.captureAll();
    const cfg = applyCustomState(getConfig(), captureCustomState());
    const pkg = { exportType:'starro-chatgpt-sync', site:'繁星仙境模擬器', generatedAt:new Date().toISOString(), meta:{version:currentVersion(), updatedAt:new Date().toISOString(), source:currentMode()}, features:{}, ui:cfg.ui || {} };
    FEATURE_KEYS.forEach(k => pkg.features[k] = feature(k));
    return pkg;
  }
  function buildPublicSnapshot(){
    if(hasFn('captureAll')) window.captureAll();
    const f = Object.fromEntries(FEATURE_KEYS.map(k=>[k,feature(k)]));
    const custom = captureCustomState();
    return {
      site:'繁星仙境模擬器',
      meta:{version:currentVersion(), updatedAt:new Date().toISOString(), source:currentMode()},
      navigation: custom.navigation,
      shadowPage: custom.shadow,
      prices:{servicePrices:f.equipment?.servicePrices || {}, priceOverrides:f.equipment?.priceOverrides || {}},
      cash:f.cash,
      game:f.game,
      auctionNeedle:{ enabled:f.auctionNeedle?.enabled, cost:f.auctionNeedle?.cost, secondRate:f.auctionNeedle?.secondRate, thirdRate:f.auctionNeedle?.thirdRate, specialMagicRate:f.auctionNeedle?.specialMagicRate, specialBuffRate:f.auctionNeedle?.specialBuffRate },
      huajinArmor:f.huajinArmor,
      huajinAccessory:f.huajinAccessory,
      collection:{enabled:f.collection?.enabled, itemsCount:Array.isArray(f.collection?.items)?f.collection.items.length:null, notice:f.collection?.notice || ''}
    };
  }
  function summaryText(){
    const snap = buildPublicSnapshot();
    const priceCount = Object.keys(snap.prices.priceOverrides || {}).length;
    const collectionText = snap.collection.itemsCount != null ? `${snap.collection.itemsCount} 筆雲端收藏` : '使用網站內建收藏';
    return [
      '繁星仙境模擬器｜資料同步摘要',
      `版本：${snap.meta.version}`,
      `最後更新：${snap.meta.updatedAt}`,
      `來源：${snap.meta.source}`,
      `主頁導覽：${(snap.navigation||[]).filter(x=>x.visible!==false).map(x=>x.label).join(' / ')}`,
      `物價覆寫：${priceCount} 筆`,
      `收藏：${collectionText}`,
      `CASH 級距：${(snap.cash?.tiers||[]).length} 個`,
      `GAME 子項：輪盤 / 百家樂 / 21點 / 推筒子`,
      '同步方式：把「starro-config-chatgpt.json」直接丟給 ChatGPT 即可接續修改。'
    ].join('\n');
  }
  async function copyText(text, okText){ try{ await navigator.clipboard.writeText(text); toast(okText || '已複製'); return true; }catch(e){ toast('複製失敗：' + e.message, true); return false; } }
  function currentSnapshotConfig(){ try{ return clone(window.StarroConfig?.all?.() || {}); }catch(e){ return buildSyncPackage(); } }
  function buildVersionEntry(action){ const config = applyCustomState(currentSnapshotConfig(), captureCustomState()); const enabledCount = FEATURE_KEYS.filter(k => config.features?.[k]?.enabled !== false).length; return { id:'v'+Date.now(), time:new Date().toLocaleString('zh-TW'), isoTime:new Date().toISOString(), version:config.meta?.version || currentVersion(), source:currentMode(), action, summary:`啟用 ${enabledCount}/10｜物價覆寫 ${Object.keys(config.features?.equipment?.priceOverrides || {}).length} 筆｜CASH ${(config.features?.cash?.tiers || []).length} 級距`, config }; }
  function recordVersion(action){ const versions = readVersions(); const entry = buildVersionEntry(action); if(versions[0] && JSON.stringify(versions[0].config)===JSON.stringify(entry.config)){ Object.assign(versions[0], {time:entry.time, isoTime:entry.isoTime, action, summary:entry.summary, source:entry.source, version:entry.version}); saveVersions(versions); return versions[0]; } versions.unshift(entry); saveVersions(versions); return entry; }

  function ensurePanel(key, where='append'){ const panels = $('#panels'); if(!panels) return null; let panel = $(`[data-panel="${key}"]`, panels); if(!panel){ panel=document.createElement('section'); panel.className='panel'; panel.dataset.panel=key; if(where==='prepend' && panels.firstChild) panels.insertBefore(panel, panels.firstChild); else panels.appendChild(panel);} return panel; }

  function panelToolsHtml(key){ return `<div class="panel-toolbar"><button class="btn ghost" type="button" data-panel-expand="${key}">展開本區</button><button class="btn ghost" type="button" data-panel-collapse="${key}">收合本區</button></div>`; }

  function homeNavRowsHtml(items){
    return items.map((item,idx)=>`
      <div class="sort-row" data-nav-key="${esc(item.key)}" data-default-icon="${esc(item.icon)}" data-default-label="${esc(item.label)}" data-default-href="${esc(item.href)}" data-note="${esc(item.note||'')}">
        <div class="home-order-badge">${idx+1}</div>
        <div class="sort-row-main">
          <div class="sort-row-head"><span class="sort-row-title">${esc(item.label)}</span><small>${esc(item.note||'')}</small></div>
          <div class="inline-fields three">
            <label class="field"><span>圖示</span><input class="nav-icon" value="${esc(item.icon)}"></label>
            <label class="field"><span>名稱</span><input class="nav-label" value="${esc(item.label)}"></label>
            <label class="field"><span>連結</span><input class="nav-href" value="${esc(item.href)}"></label>
          </div>
        </div>
        <label class="switch-inline"><input class="nav-visible" type="checkbox" ${item.visible!==false?'checked':''}> 顯示</label>
        <div class="sort-row-actions"><button class="btn" type="button" data-nav-up>↑ 上移</button><button class="btn" type="button" data-nav-down>↓ 下移</button></div>
      </div>`).join('');
  }

  function renderAdminHome(){
    const panel = ensurePanel('adminHome','prepend'); if(!panel) return;
    panel.innerHTML = `
      <div class="panel-head"><div><h2>🏠 主頁總覽</h2><div class="muted">後台已依照主頁順序重新整理成一條主流程：主頁 → 遊戲區 → 附魔區 → 洗詞鑑定區 → 收藏區 → 裝備成本區 → 現金區 → 影子區，並額外加入同步中心與前台導覽設定。</div></div><div class="spacer"></div>${panelToolsHtml('adminHome')}</div>
      <div class="home-grid">
        <div class="home-card"><h3><span class="home-order-badge">1</span> 🧭 主頁導覽設定</h3><p>管理前台上方導覽列名稱、順序、顯示開關。儲存後前台重新整理就會套用。</p><div class="home-actions"><button class="btn primary" data-open="homeConfig">打開主頁導覽設定</button><a class="front-link" href="index.html" target="_blank">開啟前台主頁</a></div></div>
        <div class="home-card"><h3><span class="home-order-badge">2</span> 🎮 遊戲區</h3><p>${esc(featureSummary('game'))}</p><div class="home-actions"><button class="btn blue" data-open="game">打開遊戲區後台</button><a class="front-link" href="game.html" target="_blank">開啟前台頁面</a></div></div>
        <div class="home-card"><h3><span class="home-order-badge">3</span> ✨ 附魔區</h3><p>附魔區底下分成三個實際可編輯功能：龍甲、善惡武器、時光靴。</p><div class="home-sub-actions"><button class="btn" data-open="dragon">🐉 龍甲</button><button class="btn" data-open="evilWeapon">⚔️ 善惡</button><button class="btn" data-open="timeBoot">💎 時光靴</button></div><div class="front-links"><a class="front-link" href="enchant.html" target="_blank">開啟附魔區前台</a></div></div>
        <div class="home-card"><h3><span class="home-order-badge">4</span> 🔍 洗詞鑑定區</h3><p>洗詞鑑定區底下分成華金鎧甲/鞋、華金耳環/飾品、競標針三塊後台編輯。</p><div class="home-sub-actions"><button class="btn" data-open="huajinArmor">🔥 華金鎧甲/鞋</button><button class="btn" data-open="huajinAccessory">💎 華金耳環/飾品</button><button class="btn" data-open="auctionNeedle">🪡 競標針</button></div><div class="front-links"><a class="front-link" href="identify.html" target="_blank">開啟洗詞鑑定前台</a></div></div>
        <div class="home-card"><h3><span class="home-order-badge">5</span> 📚 收藏區</h3><p>${esc(featureSummary('collection'))}</p><div class="home-actions"><button class="btn blue" data-open="collection">打開收藏區後台</button><a class="front-link" href="collection.html" target="_blank">開啟前台頁面</a></div></div>
        <div class="home-card"><h3><span class="home-order-badge">6</span> 💰 裝備成本區</h3><p>${esc(featureSummary('equipment'))}</p><div class="home-actions"><button class="btn blue" data-open="equipment">打開裝備成本後台</button><a class="front-link" href="equipment.html" target="_blank">開啟前台頁面</a></div></div>
        <div class="home-card"><h3><span class="home-order-badge">7</span> 💳 現金區</h3><p>${esc(featureSummary('cash'))}</p><div class="home-actions"><button class="btn blue" data-open="cash">打開現金區後台</button><a class="front-link" href="CASH.html" target="_blank">開啟前台頁面</a></div></div>
        <div class="home-card"><h3><span class="home-order-badge">8</span> 💎 影子區</h3><p>現在影子區已經有自己的後台設定頁，可編輯前台標題、說明、GM 提示與快捷按鈕。</p><div class="home-actions"><button class="btn blue" data-open="shadowHub">打開影子區後台</button><a class="front-link" href="shadow.html" target="_blank">開啟前台頁面</a></div></div>
        <div class="home-card"><h3><span class="home-order-badge">9</span> 🔄 同步中心</h3><p>所有物價、機率與設定更新完成後，最後到這裡匯出 JSON，同步給 ChatGPT。</p><div class="home-actions"><button class="btn primary" data-open="syncCenter">打開同步中心</button><a class="front-link" href="admin.html" target="_blank">重新開啟後台</a></div></div>
      </div>
      <div class="system-note"><b>推薦流程：</b> 先更新各分頁資料 → 視需要調整主頁導覽 / 影子區顯示 → 按 <b>💾 儲存全部</b> → 到 <b>資料同步 / 匯出中心</b> 匯出 <b>starro-config-chatgpt.json</b>。</div>`;
  }

  function renderHomeConfig(){
    const items = navItemsFromConfig();
    const panel = ensurePanel('homeConfig'); if(!panel) return;
    panel.innerHTML = `
      <div class="panel-head"><div><h2>🧭 主頁導覽設定</h2><div class="muted">這裡可以直接管理前台上方 8 個主分頁的名稱、順序、連結與顯示開關。儲存後，前台所有分頁的導覽列都會跟著更新。</div></div><div class="spacer"></div>${panelToolsHtml('homeConfig')}</div>
      <div class="custom-editor-grid">
        <div class="section">
          <div class="panel-head slim"><div><h2 style="font-size:18px">主頁分頁順序 / 顯示</h2><div class="muted">按上下移可以改順序，也可以直接改標題。</div></div><div class="spacer"></div><div class="panel-toolbar"><button class="btn ghost" id="homeNavResetBtn" type="button">恢復預設</button><button class="btn primary" id="homeNavSaveBtn" type="button">儲存此區</button></div></div>
          <div class="sort-list" id="homeNavList">${homeNavRowsHtml(items)}</div>
          <div class="mini-help">提示：如果你把某個分頁取消顯示，它只是不在前台導覽列出現，該 HTML 檔案本身仍然存在。</div>
        </div>
        <div class="section preview-box"><h3>前台導覽預覽</h3><div class="preview-links" id="homeNavPreview"></div></div>
      </div>`;
  }

  function renderShadowHub(){
    const c = shadowConfigFromConfig();
    const panel = ensurePanel('shadowHub'); if(!panel) return;
    panel.innerHTML = `
      <div class="panel-head"><div><h2>💎 影子區後台</h2><div class="muted">這一版把影子區補成更完整的後台控制面板。可直接改影子區前台頁面的標題、說明、GM 提示與快捷按鈕文字。</div></div><div class="spacer"></div>${panelToolsHtml('shadowHub')}</div>
      <div class="custom-editor-grid">
        <div class="section">
          <div class="inline-fields">
            <label class="field"><span>頁面標題</span><input id="shadowTitle" value="${esc(c.title)}"></label>
            <label class="field"><span>啟用影子區導覽顯示</span><div class="switch-inline"><input id="shadowEnabled" type="checkbox" ${c.enabled!==false?'checked':''}> ${c.enabled!==false?'<span class="status-ok">顯示中</span>':'<span class="status-off">已隱藏</span>'}</div></label>
          </div>
          <label class="field"><span>頁面說明</span><textarea id="shadowDesc" rows="4">${esc(c.desc)}</textarea></label>
          <label class="field"><span>GM 提示</span><textarea id="shadowSide" rows="4">${esc(c.side)}</textarea></label>
          <div class="inline-fields">
            <label class="field"><span>快捷按鈕 1 文字</span><input id="shadowAction1Text" value="${esc(c.action1Text)}"></label>
            <label class="field"><span>快捷按鈕 1 連結</span><input id="shadowAction1Href" value="${esc(c.action1Href)}"></label>
            <label class="field"><span>快捷按鈕 2 文字</span><input id="shadowAction2Text" value="${esc(c.action2Text)}"></label>
            <label class="field"><span>快捷按鈕 2 連結</span><input id="shadowAction2Href" value="${esc(c.action2Href)}"></label>
          </div>
          <div class="home-actions" style="margin-top:12px"><button class="btn primary" type="button" id="shadowSaveBtn">儲存此區</button><a class="front-link" href="shadow.html" target="_blank">開啟影子區前台</a></div>
        </div>
        <div class="shadow-note"><b>目前已完成：</b><br>• 影子區已納入主頁順序邏輯<br>• 可從後台直接調整影子區頁面文案<br>• 會一併跟著資料同步中心匯出 JSON<br><br><b>下一步可再擴充：</b><br>• 影子裝備資料列表編輯<br>• 升級成功率設定<br>• 影子素質 / 成本欄位後台化</div>
      </div>`;
  }

  function renderSyncCenter(){
    const panel = ensurePanel('syncCenter'); if(!panel) return;
    const s = window.STARRO_SUPABASE || {};
    const snap = buildPublicSnapshot();
    const logs = readLogs();
    panel.innerHTML = `
      <div class="panel-head"><div><h2>🔄 資料同步 / 匯出中心</h2><div class="muted">集中查看同步狀態、匯出給 ChatGPT、重新整理同步資料，並保留最近同步紀錄。</div></div><div class="spacer"></div>${panelToolsHtml('syncCenter')}</div>
      <div class="sync-grid">
        <div class="sync-card"><h3>同步資訊</h3>
          <div class="kv"><span>資料版本</span><b>${esc(snap.meta.version)}</b></div>
          <div class="kv"><span>目前來源</span><b>${esc(snap.meta.source)}</b></div>
          <div class="kv"><span>最後更新</span><b>${esc(currentUpdatedAt())}</b></div>
          <div class="kv"><span>Project URL</span><b>${esc(s.url || '未設定')}</b></div>
          <div class="kv"><span>Config Row</span><b>${esc(s.configRow || 'main')}</b></div>
          <div class="kv"><span>主頁導覽顯示</span><b>${(snap.navigation||[]).filter(x=>x.visible!==false).map(x=>x.label).join(' / ')}</b></div>
          <div class="kv"><span>價格覆寫</span><b>${Object.keys(snap.prices.priceOverrides || {}).length} 筆</b></div>
          <div class="kv"><span>收藏狀態</span><b>${snap.collection.itemsCount != null ? snap.collection.itemsCount.toLocaleString() + ' 筆雲端收藏' : '使用網站內建收藏'}</b></div>
        </div>
        <div class="sync-card"><h3>快速操作</h3>
          <div class="sync-actions"><button class="btn primary" id="syncExportChatGPT">📤 匯出給 ChatGPT</button><button class="btn ghost" id="syncExportFull">⬇️ 匯出完整設定</button><button class="btn ghost" id="syncExportPublic">🧾 匯出公開快照</button><button class="btn ghost" id="syncCopySummary">📋 複製同步摘要</button><button class="btn ghost" id="syncCopyJson">📝 複製同步 JSON</button><button class="btn danger" id="syncClearLogs">🗑 清空同步紀錄</button></div>
          <div class="section" style="margin-top:12px"><h3>如何同步到 ChatGPT</h3><div class="sync-note">1. 先按 <b>💾 儲存全部</b>。<br>2. 再按 <b>📤 匯出給 ChatGPT</b>。<br>3. 把下載好的 <b>starro-config-chatgpt.json</b> 直接丟到對話視窗，我就會用最新物價、GAME、CASH、附魔、導覽設定與收藏資料繼續幫你修改。</div></div>
        </div>
      </div>
      <div class="section"><div class="panel-head slim"><div><h2 style="font-size:18px">🧪 同步資料預覽</h2><div class="muted">適合快速檢查目前匯出的資料內容。</div></div><div class="spacer"></div><button class="btn ghost" id="syncRefreshPreview">重新整理預覽</button></div><pre class="code" id="syncPreview">${esc(JSON.stringify(snap, null, 2))}</pre></div>
      <div class="section"><div class="panel-head slim"><div><h2 style="font-size:18px">🕒 更新紀錄 / 版本歷史</h2><div class="muted">每次按下「儲存全部」都會自動保留最近 12 份版本快照。</div></div><div class="spacer"></div><button class="btn ghost" id="syncVersionExportAll">匯出版本清單</button></div><div class="version-list" id="versionList">${versionRowsHtml()}</div></div>
      <div class="section"><h3>🗒 最近同步紀錄</h3><div class="sync-log" id="syncLog">${logs.length ? logs.map(x=>`<div><b>${esc(x.time)}</b>｜${esc(x.action)}</div>`).join('') : '<div>尚無紀錄</div>'}</div></div>`;
  }

  function versionRowsHtml(){ const versions = readVersions(); if(!versions.length) return '<div class="version-empty">尚未建立版本紀錄，先按一次「儲存全部」就會自動留下版本快照。</div>'; return versions.map((v,i)=>`<div class="version-row" data-version-id="${esc(v.id)}"><div class="version-main"><div class="version-title">${i===0?'<span class="version-tag">最新</span>':''}<b>${esc(v.version || 'admin-v1')}</b>　<span>${esc(v.time)}</span></div><div class="version-sub">${esc(v.action || '未命名動作')}｜${esc(v.source || '本機')}｜${esc(v.summary || '')}</div></div><div class="version-actions"><button class="btn ghost" type="button" data-version-preview="${esc(v.id)}">預覽</button><button class="btn ghost" type="button" data-version-export="${esc(v.id)}">匯出</button><button class="btn blue" type="button" data-version-restore="${esc(v.id)}">還原</button></div></div>`).join(''); }
  async function restoreVersion(id){ const versions = readVersions(); const entry = versions.find(x=>x.id===id); if(!entry) return toast('找不到這份版本紀錄', true); if(!confirm(`確定要還原版本 ${entry.version}（${entry.time}）嗎？\n這會覆蓋目前後台設定。`)) return; try{ window.StarroConfig?.replace?.(entry.config); if(hasFn('saveRemote') && currentMode().includes('雲端')) await window.saveRemote(entry.config); writeLog(`還原版本 ${entry.version}`); toast('已還原版本，頁面將重新整理'); setTimeout(()=>location.reload(), 800);}catch(e){toast('還原失敗：' + e.message, true);} }

  function bindCommonPanelButtons(root=document){
    $$('[data-panel-expand]', root).forEach(btn=>btn.onclick=()=>togglePanelDetails(btn.dataset.panelExpand, true));
    $$('[data-panel-collapse]', root).forEach(btn=>btn.onclick=()=>togglePanelDetails(btn.dataset.panelCollapse, false));
  }
  function togglePanelDetails(panelKey, open){ const panel = $(`[data-panel="${panelKey}"]`); if(!panel) return; $$('details.admin-details', panel).forEach(d=>d.open=!!open); }
  function bindGlobalExpandCollapse(){
    if($('.topbar-tools')) return;
    const topbar = $('.topbar'); if(!topbar) return;
    const tools = document.createElement('div');
    tools.className = 'topbar-tools';
    tools.innerHTML = '<button class="btn ghost" type="button" id="expandAllDetails">全部展開</button><button class="btn ghost" type="button" id="collapseAllDetails">全部收合</button>';
    const saveState = $('#saveState');
    if(saveState) saveState.insertAdjacentElement('afterend', tools); else topbar.appendChild(tools);
    $('#expandAllDetails')?.addEventListener('click', ()=>{ $$('details.admin-details').forEach(d=>d.open=true); toast('已展開所有詳細內容'); });
    $('#collapseAllDetails')?.addEventListener('click', ()=>{ $$('details.admin-details').forEach(d=>d.open=false); toast('已收合所有詳細內容'); });
  }

  function bindHomeConfigEvents(){
    const list = $('#homeNavList'); if(!list) return;
    const bindMove = ()=>{
      $$('[data-nav-up]', list).forEach(btn=>btn.onclick=()=>{ const row=btn.closest('.sort-row'); if(row && row.previousElementSibling){ row.parentNode.insertBefore(row, row.previousElementSibling); refreshHomeNavPreview(); } });
      $$('[data-nav-down]', list).forEach(btn=>btn.onclick=()=>{ const row=btn.closest('.sort-row'); if(row && row.nextElementSibling){ row.parentNode.insertBefore(row.nextElementSibling, row); refreshHomeNavPreview(); } });
      $$('.nav-icon,.nav-label,.nav-href,.nav-visible', list).forEach(el=>el.oninput=refreshHomeNavPreview);
      $$('.nav-visible', list).forEach(el=>el.onchange=refreshHomeNavPreview);
    };
    bindMove();
    $('#homeNavResetBtn')?.addEventListener('click', ()=>{ const current = activeKey(); const cfg = getConfig(); setByPath(cfg, NAV_CFG_KEY, clone(DEFAULT_NAV_ITEMS)); setConfig(cfg); if(hasFn('renderShell')) window.renderShell(); if(hasFn('openPanel')) window.openPanel(current || 'homeConfig'); toast('已恢復主頁導覽預設'); });
    $('#homeNavSaveBtn')?.addEventListener('click', async()=>{ const ok = await persistCustomState(captureCustomState(), '儲存主頁導覽設定'); if(ok){ toast('主頁導覽設定已儲存'); if(hasFn('openPanel')) window.openPanel('homeConfig'); } });
    refreshHomeNavPreview();
  }
  function refreshHomeNavPreview(){ const box = $('#homeNavPreview'); if(!box) return; const items = captureHomeNavFromDom().filter(x=>x.visible!==false); box.innerHTML = items.map(x=>`<span>${esc(x.icon)} ${esc(x.label)}</span>`).join('') || '<span>目前全部隱藏</span>'; }
  function bindShadowEvents(){ $('#shadowSaveBtn')?.addEventListener('click', async()=>{ const ok=await persistCustomState(captureCustomState(),'儲存影子區設定'); if(ok){ toast('影子區設定已儲存'); if(hasFn('openPanel')) window.openPanel('shadowHub'); } }); ['shadowEnabled','shadowTitle','shadowDesc','shadowSide','shadowAction1Text','shadowAction1Href','shadowAction2Text','shadowAction2Href'].forEach(id=>$('#'+id)?.addEventListener('input', ()=>{})); }

  function bindSyncCenterEvents(){
    $('#syncExportChatGPT')?.addEventListener('click', ()=>{ downloadJson('starro-config-chatgpt.json', buildSyncPackage()); writeLog('匯出給 ChatGPT'); renderSyncCenter(); bindSyncCenterEvents(); toast('已匯出 starro-config-chatgpt.json'); });
    $('#syncExportFull')?.addEventListener('click', ()=>{ downloadJson('starro-config-backup.json', applyCustomState(getConfig(), captureCustomState())); writeLog('匯出完整設定 JSON'); renderSyncCenter(); bindSyncCenterEvents(); toast('已匯出完整設定'); });
    $('#syncExportPublic')?.addEventListener('click', ()=>{ downloadJson('starro-public-snapshot.json', buildPublicSnapshot()); writeLog('匯出公開快照 JSON'); renderSyncCenter(); bindSyncCenterEvents(); toast('已匯出公開快照 JSON'); });
    $('#syncCopySummary')?.addEventListener('click', async()=>{ if(await copyText(summaryText(),'同步摘要已複製')){ writeLog('複製同步摘要'); renderSyncCenter(); bindSyncCenterEvents(); } });
    $('#syncCopyJson')?.addEventListener('click', async()=>{ if(await copyText(JSON.stringify(buildPublicSnapshot(),null,2),'同步 JSON 已複製')){ writeLog('複製同步 JSON'); renderSyncCenter(); bindSyncCenterEvents(); } });
    $('#syncClearLogs')?.addEventListener('click', ()=>{ if(!confirm('確定清空最近同步紀錄？')) return; localStorage.removeItem(LOG_KEY); renderSyncCenter(); bindSyncCenterEvents(); toast('已清空同步紀錄'); });
    $('#syncRefreshPreview')?.addEventListener('click', ()=>{ const pre = $('#syncPreview'); if(pre) pre.textContent = JSON.stringify(buildPublicSnapshot(), null, 2); toast('預覽已更新'); });
    $('#syncVersionExportAll')?.addEventListener('click', ()=>{ downloadJson('starro-version-history.json', readVersions()); writeLog('匯出版本歷史'); renderSyncCenter(); bindSyncCenterEvents(); toast('已匯出版本歷史'); });
    $$('[data-version-preview]').forEach(btn=>btn.addEventListener('click', ()=>{ const entry = readVersions().find(x=>x.id===btn.dataset.versionPreview); if(!entry) return; const pre = $('#syncPreview'); if(pre) pre.textContent = JSON.stringify(entry.config, null, 2); toast(`已預覽版本 ${entry.version}`); }));
    $$('[data-version-export]').forEach(btn=>btn.addEventListener('click', ()=>{ const entry = readVersions().find(x=>x.id===btn.dataset.versionExport); if(!entry) return; downloadJson(`starro-${(entry.version||'version').replace(/[^\w.-]+/g,'_')}.json`, entry.config); writeLog(`匯出版本 ${entry.version}`); renderSyncCenter(); bindSyncCenterEvents(); }));
    $$('[data-version-restore]').forEach(btn=>btn.addEventListener('click', ()=>restoreVersion(btn.dataset.versionRestore)));
  }

  const NAV_GROUPS = [
    {title:'主頁順序', items:[
      {key:'adminHome', icon:'🏠', name:'主頁總覽', kind:'custom', summary:'比照主頁順序整理所有後台入口與推薦操作流程。', pill:'總覽'},
      {key:'homeConfig', icon:'🧭', name:'主頁導覽設定', kind:'custom', summary:'直接改前台導覽列名稱、順序、顯示與連結。', pill:'前台控制'},
      {key:'game', icon:'🎮', name:'遊戲區', summary:()=>featureSummary('game'), pill:'前台頁面'},
      {key:'dragon', icon:'🐉', name:'附魔區｜龍甲', summary:()=>featureSummary('dragon'), pill:'附魔區'},
      {key:'evilWeapon', icon:'⚔️', name:'附魔區｜善惡武器', summary:()=>featureSummary('evilWeapon'), pill:'附魔區'},
      {key:'timeBoot', icon:'💎', name:'附魔區｜時光靴', summary:()=>featureSummary('timeBoot'), pill:'附魔區'},
      {key:'huajinArmor', icon:'🔥', name:'洗詞鑑定區｜華金鎧甲/鞋', summary:()=>featureSummary('huajinArmor'), pill:'洗詞鑑定'},
      {key:'huajinAccessory', icon:'💎', name:'洗詞鑑定區｜華金耳環/飾品', summary:()=>featureSummary('huajinAccessory'), pill:'洗詞鑑定'},
      {key:'auctionNeedle', icon:'🪡', name:'洗詞鑑定區｜競標針', summary:()=>featureSummary('auctionNeedle'), pill:'洗詞鑑定'},
      {key:'collection', icon:'📚', name:'收藏區', summary:()=>featureSummary('collection'), pill:'前台頁面'},
      {key:'equipment', icon:'💰', name:'裝備成本區', summary:()=>featureSummary('equipment'), pill:'前台頁面'},
      {key:'cash', icon:'💳', name:'現金區', summary:()=>featureSummary('cash'), pill:'前台頁面'},
      {key:'shadowHub', icon:'💎', name:'影子區', kind:'custom', summary:'可編輯影子區標題、說明、GM 提示與快捷按鈕。', pill:'前台控制'}
    ]},
    {title:'系統工具', items:[ {key:'syncCenter', icon:'🔄', name:'資料同步 / 匯出中心', kind:'custom', summary:'匯出給 ChatGPT、查看版本歷史、複製同步摘要。', pill:'工具中心'} ]}
  ];

  function renderOrderedSidebar(){ const sideNav = $('#sideNav'); if(!sideNav) return; const current = activeKey(); sideNav.innerHTML = NAV_GROUPS.map(group=>`<div class="nav-group"><div class="nav-group-title">${group.title}</div>${group.items.map(item=>`<button data-open="${item.key}" class="${current===item.key?'active':''}">${item.icon} ${item.name}</button>`).join('')}</div>`).join(''); }
  function groupedTableHtml(){ return NAV_GROUPS.map(group=>[`<div class="feature-group-label">${group.title}</div>`, ...group.items.map(item=>{ const custom=item.kind==='custom'; const enabled=custom ? true : featureEnabled(item.key); const summary=typeof item.summary==='function'?item.summary():item.summary; const pillClass=enabled?'pill':'pill off'; const pillText=custom?(item.pill||'工具'):(enabled?(item.pill||'啟用中'):'已停用'); return `<div class="feature-row"><div><div class="feature-title">${item.icon} ${item.name}</div><div class="feature-summary">${esc(summary)}</div></div><span class="${pillClass}">${esc(pillText)}</span><button class="btn" data-open="${item.key}">${custom?'查看':'編輯'}</button></div>`; })].join('')).join(''); }
  function renderOrderedFeatureTable(){ const table = $('#featureTable'); if(table) table.innerHTML = groupedTableHtml(); }

  function bindCoreExtras(){ bindGlobalExpandCollapse(); bindCommonPanelButtons(); bindHomeConfigEvents(); bindShadowEvents(); bindSyncCenterEvents(); }
  function enhanceLayout(){ renderAdminHome(); renderHomeConfig(); renderShadowHub(); renderSyncCenter(); renderOrderedSidebar(); renderOrderedFeatureTable(); if(hasFn('bindOpen')) window.bindOpen(); bindCoreExtras(); const current = activeKey(); if(hasFn('openPanel')) window.openPanel($(`[data-panel="${current}"]`) ? current : 'adminHome'); }

  function patchCore(){
    if(hasFn('openPanel') && !window.__starro_admin_open_patched){ const oldOpen=window.openPanel; window.openPanel=function(key){ window.__starro_last_panel=key; return oldOpen.apply(this, arguments); }; window.__starro_admin_open_patched=true; }
    if(hasFn('renderShell') && !window.__starro_admin_render_patched){ const oldRender=window.renderShell; window.renderShell=function(){ const previous=activeKey(); const result=oldRender.apply(this, arguments); window.__starro_last_panel=previous || window.__starro_last_panel || 'adminHome'; enhanceLayout(); return result; }; window.__starro_admin_render_patched=true; }
    if(hasFn('saveAll') && !window.__starro_admin_save_patched){ const oldSave=window.saveAll; window.saveAll=async function(){ const custom = captureCustomState(); const result = await oldSave.apply(this, arguments); const cfg = applyCustomState(getConfig(), custom); setConfig(cfg); if(hasFn('saveRemote') && currentMode().includes('雲端')) await window.saveRemote(cfg); writeLog(`儲存全部（${currentMode()}）`); recordVersion('儲存全部'); if(hasFn('renderShell')) window.renderShell(); return result; }; window.__starro_admin_save_patched=true; }
    const exportBtn = $('#exportBtn'); if(exportBtn && !exportBtn.dataset.syncBound){ exportBtn.dataset.syncBound='1'; exportBtn.onclick=()=>{ const cfg = applyCustomState(getConfig(), captureCustomState()); downloadJson('starro-config-backup.json', cfg); writeLog('從側邊欄匯出完整設定 JSON'); toast('已匯出完整設定'); }; }
    const importFile = $('#importFile'); if(importFile && !importFile.dataset.syncBound){ importFile.dataset.syncBound='1'; importFile.addEventListener('change', ()=> setTimeout(()=>{ writeLog('匯入設定 JSON'); recordVersion('匯入設定 JSON'); }, 150)); }
  }

  function boot(){ patchCore(); if(!readVersions().length && window.StarroConfig?.all) recordVersion('初始建立'); if($('#adminApp') && !$('#adminApp').classList.contains('hidden')) enhanceLayout(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
