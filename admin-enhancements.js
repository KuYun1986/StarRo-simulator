(function(){
  'use strict';
  const $$ = (sel, root=document) => root.querySelector(sel);
  const LOG_KEY = 'starro_admin_sync_logs_v1';
  const VERSION_KEY = 'starro_admin_version_history_v1';
  const FEATURE_KEYS = ['huajinArmor','huajinAccessory','auctionNeedle','dragon','evilWeapon','timeBoot','collection','equipment','game','cash'];

  function esc(s){return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function hasFn(name){return typeof window[name] === 'function';}
  function feature(key){return hasFn('getFeature') ? clone(window.getFeature(key)) : null;}
  function currentMode(){return ($$('#sourceMode')?.textContent || $$('#cloudStatus')?.textContent || '本機').trim();}
  function currentVersion(){return (window.StarroConfig && window.StarroConfig.all && window.StarroConfig.all().meta?.version) || 'admin-v1';}
  function currentUpdatedAt(){return $$('#updatedAt')?.textContent?.trim() || '—';}
  function toast(msg,bad){ if(hasFn('toast')) window.toast(msg,bad); }
  function readJsonLS(key,fallback){ try{ return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }catch(e){ return clone(fallback); } }
  function writeJsonLS(key,data){ localStorage.setItem(key, JSON.stringify(data)); }
  function readLogs(){ return readJsonLS(LOG_KEY, []); }
  function writeLog(action){ const logs = readLogs(); logs.unshift({time:new Date().toLocaleString('zh-TW'), action}); writeJsonLS(LOG_KEY, logs.slice(0,20)); }
  function readVersions(){ return readJsonLS(VERSION_KEY, []); }
  function saveVersions(list){ writeJsonLS(VERSION_KEY, list.slice(0,12)); }
  function downloadJson(filename,obj){ const blob = new Blob([JSON.stringify(obj,null,2)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),800); }

  function buildSyncPackage(){
    if(hasFn('captureAll')) window.captureAll();
    const pkg = { exportType:'starro-chatgpt-sync', site:'繁星仙境模擬器', generatedAt:new Date().toISOString(), meta:{version:currentVersion(), updatedAt:new Date().toISOString(), source:currentMode()}, features:{} };
    FEATURE_KEYS.forEach(k => pkg.features[k] = feature(k));
    return pkg;
  }

  function buildPublicSnapshot(){
    if(hasFn('captureAll')) window.captureAll();
    const f = Object.fromEntries(FEATURE_KEYS.map(k=>[k,feature(k)]));
    return {
      site:'繁星仙境模擬器',
      meta:{version:currentVersion(), updatedAt:new Date().toISOString(), source:currentMode()},
      prices:{servicePrices:f.equipment?.servicePrices || {}, priceOverrides:f.equipment?.priceOverrides || {}},
      cash:f.cash,
      game:f.game,
      auctionNeedle:{
        enabled:f.auctionNeedle?.enabled,
        cost:f.auctionNeedle?.cost,
        secondRate:f.auctionNeedle?.secondRate,
        thirdRate:f.auctionNeedle?.thirdRate,
        specialMagicRate:f.auctionNeedle?.specialMagicRate,
        specialBuffRate:f.auctionNeedle?.specialBuffRate
      },
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
      `物價覆寫：${priceCount} 筆`,
      `收藏：${collectionText}`,
      `CASH 級距：${(snap.cash?.tiers||[]).length} 個`,
      `GAME 子項：輪盤 / 百家樂 / 21點 / 推筒子`,
      '同步方式：把「starro-config-chatgpt.json」直接丟給 ChatGPT 即可接續修改。'
    ].join('\n');
  }

  async function copyText(text, okText){
    try{ await navigator.clipboard.writeText(text); toast(okText || '已複製'); return true; }
    catch(e){ toast('複製失敗：' + e.message, true); return false; }
  }

  function currentSnapshotConfig(){
    try{ return clone(window.StarroConfig?.all?.() || {}); }
    catch(e){ return buildSyncPackage(); }
  }

  function buildVersionEntry(action){
    const config = currentSnapshotConfig();
    const enabledCount = FEATURE_KEYS.filter(k => config.features?.[k]?.enabled !== false).length;
    return {
      id: 'v' + Date.now(),
      time: new Date().toLocaleString('zh-TW'),
      isoTime: new Date().toISOString(),
      version: config.meta?.version || currentVersion(),
      source: currentMode(),
      action,
      summary: `啟用 ${enabledCount}/10｜物價覆寫 ${Object.keys(config.features?.equipment?.priceOverrides || {}).length} 筆｜CASH ${(config.features?.cash?.tiers || []).length} 級距`,
      config
    };
  }

  function recordVersion(action){
    const versions = readVersions();
    const entry = buildVersionEntry(action);
    if(versions[0] && JSON.stringify(versions[0].config) === JSON.stringify(entry.config)){
      versions[0].time = entry.time;
      versions[0].isoTime = entry.isoTime;
      versions[0].action = action;
      versions[0].summary = entry.summary;
      versions[0].source = entry.source;
      versions[0].version = entry.version;
      saveVersions(versions);
      return versions[0];
    }
    versions.unshift(entry);
    saveVersions(versions);
    return entry;
  }

  function ensureHero(){
    const content = $$('.content');
    const overview = $$('.overview', content || document);
    if(!content || !overview || $$('.admin-hero', content)) return;
    const hero = document.createElement('section');
    hero.className = 'admin-hero';
    hero.innerHTML = `
      <div class="rune-title"><span class="orb"></span><h2>RO 遊戲介面風控制台</h2></div>
      <p>這裡是你的繁星管理總控台。你可以像遊戲 GM 一樣編輯洗詞、附魔、物價、CASH、GAME，並從 <b>資料同步 / 匯出中心</b> 一鍵匯出最新資料給 ChatGPT。</p>
      <div class="hero-badges">
        <span class="hero-badge">☁️ Supabase 雲端同步</span>
        <span class="hero-badge">🎮 GAME / CASH 後台</span>
        <span class="hero-badge">📤 匯出給 ChatGPT</span>
        <span class="hero-badge">📚 收藏與物價編輯</span>
      </div>
      <div class="hero-actions">
        <button class="btn blue" type="button" id="heroOpenSync">🔄 打開同步中心</button>
        <button class="btn ghost" type="button" id="heroOpenGame">🎮 前往遊戲區</button>
        <button class="btn ghost" type="button" id="heroOpenCash">💳 前往現金區</button>
      </div>`;
    overview.insertAdjacentElement('afterend', hero);
    $$('#heroOpenSync')?.addEventListener('click', ()=> hasFn('openPanel') && window.openPanel('syncCenter'));
    $$('#heroOpenGame')?.addEventListener('click', ()=> hasFn('openPanel') && window.openPanel('game'));
    $$('#heroOpenCash')?.addEventListener('click', ()=> hasFn('openPanel') && window.openPanel('cash'));
  }

  function versionRowsHtml(){
    const versions = readVersions();
    if(!versions.length) return '<div class="version-empty">尚未建立版本紀錄，先按一次「儲存全部」就會自動留下版本快照。</div>';
    return versions.map((v,i)=>`
      <div class="version-row" data-version-id="${esc(v.id)}">
        <div class="version-main">
          <div class="version-title">${i===0?'<span class="version-tag">最新</span>':''}<b>${esc(v.version || 'admin-v1')}</b>　<span>${esc(v.time)}</span></div>
          <div class="version-sub">${esc(v.action || '未命名動作')}｜${esc(v.source || '本機')}｜${esc(v.summary || '')}</div>
        </div>
        <div class="version-actions">
          <button class="btn ghost" type="button" data-version-preview="${esc(v.id)}">預覽</button>
          <button class="btn ghost" type="button" data-version-export="${esc(v.id)}">匯出</button>
          <button class="btn blue" type="button" data-version-restore="${esc(v.id)}">還原</button>
        </div>
      </div>`).join('');
  }

  function renderSyncCenter(){
    const panel = $$('[data-panel="syncCenter"]');
    if(!panel) return;
    const s = window.STARRO_SUPABASE || {};
    const snap = buildPublicSnapshot();
    const logs = readLogs();
    panel.innerHTML = `
      <div class="panel-head">
        <div>
          <h2>🔄 資料同步 / 匯出中心</h2>
          <div class="muted">集中查看同步狀態、匯出給 ChatGPT、重新整理同步資料，並保留最近同步紀錄。</div>
        </div>
        <div class="spacer"></div>
        <button class="btn blue" id="syncRefreshPanel">重新整理面板</button>
      </div>
      <div class="sync-grid">
        <div class="sync-card">
          <h3>同步資訊</h3>
          <div class="kv"><span>資料版本</span><b>${esc(snap.meta.version)}</b></div>
          <div class="kv"><span>目前來源</span><b>${esc(snap.meta.source)}</b></div>
          <div class="kv"><span>最後更新</span><b>${esc(currentUpdatedAt())}</b></div>
          <div class="kv"><span>Project URL</span><b>${esc(s.url || '未設定')}</b></div>
          <div class="kv"><span>Config Row</span><b>${esc(s.configRow || 'main')}</b></div>
          <div class="kv"><span>管理功能數</span><b>10 個功能 + 1 個同步中心</b></div>
          <div class="kv"><span>價格覆寫</span><b>${Object.keys(snap.prices.priceOverrides || {}).length} 筆</b></div>
          <div class="kv"><span>收藏狀態</span><b>${snap.collection.itemsCount != null ? snap.collection.itemsCount.toLocaleString() + ' 筆雲端收藏' : '使用網站內建收藏'}</b></div>
        </div>
        <div class="sync-card">
          <h3>快速操作</h3>
          <div class="sync-actions">
            <button class="btn primary" id="syncExportChatGPT">📤 匯出給 ChatGPT</button>
            <button class="btn ghost" id="syncExportFull">⬇️ 匯出完整設定</button>
            <button class="btn ghost" id="syncExportPublic">🧾 匯出公開快照</button>
            <button class="btn ghost" id="syncCopySummary">📋 複製同步摘要</button>
            <button class="btn ghost" id="syncCopyJson">📝 複製同步 JSON</button>
            <button class="btn danger" id="syncClearLogs">🗑 清空同步紀錄</button>
          </div>
          <div class="section" style="margin-top:12px">
            <h3>如何同步到 ChatGPT</h3>
            <div class="sync-note">1. 先按 <b>💾 儲存全部</b>。<br>2. 再按 <b>📤 匯出給 ChatGPT</b>。<br>3. 把下載好的 <b>starro-config-chatgpt.json</b> 直接丟到對話視窗，我就會用最新物價、GAME、CASH、附魔與收藏資料繼續幫你修改。</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="panel-head" style="border:0;padding-bottom:0;margin-bottom:10px">
          <div><h2 style="font-size:18px">🧪 同步資料預覽</h2><div class="muted">適合快速檢查目前匯出的資料內容。</div></div>
          <div class="spacer"></div>
          <button class="btn ghost" id="syncRefreshPreview">重新整理預覽</button>
        </div>
        <pre class="code" id="syncPreview">${esc(JSON.stringify(snap, null, 2))}</pre>
      </div>
      <div class="section">
        <div class="panel-head" style="border:0;padding-bottom:0;margin-bottom:10px">
          <div><h2 style="font-size:18px">🕒 更新紀錄 / 版本歷史</h2><div class="muted">每次按下「儲存全部」都會自動保留最近 12 份版本快照。</div></div>
          <div class="spacer"></div>
          <button class="btn ghost" id="syncVersionExportAll">匯出版本清單</button>
        </div>
        <div class="version-list" id="versionList">${versionRowsHtml()}</div>
      </div>
      <div class="section">
        <h3>🗒 最近同步紀錄</h3>
        <div class="sync-log" id="syncLog">${logs.length ? logs.map(x=>`<div><b>${esc(x.time)}</b>｜${esc(x.action)}</div>`).join('') : '<div>尚無紀錄</div>'}</div>
      </div>`;
  }

  async function restoreVersion(id){
    const versions = readVersions();
    const entry = versions.find(x=>x.id===id);
    if(!entry) return toast('找不到這份版本紀錄', true);
    if(!confirm(`確定要還原版本 ${entry.version}（${entry.time}）嗎？\n這會覆蓋目前後台設定。`)) return;
    try{
      window.StarroConfig?.replace?.(entry.config);
      if(hasFn('saveRemote') && currentMode().includes('雲端')){
        await window.saveRemote(entry.config);
      }
      writeLog(`還原版本 ${entry.version}`);
      toast('已還原版本，頁面將重新整理');
      setTimeout(()=>location.reload(), 800);
    }catch(e){
      toast('還原失敗：' + e.message, true);
    }
  }

  function bindSyncCenterEvents(){
    $$('#syncExportChatGPT')?.addEventListener('click', ()=>{ downloadJson('starro-config-chatgpt.json', buildSyncPackage()); writeLog('匯出給 ChatGPT'); renderSyncCenter(); bindSyncCenterEvents(); toast('已匯出 starro-config-chatgpt.json'); });
    $$('#syncExportFull')?.addEventListener('click', ()=>{ hasFn('exportConfig') ? window.exportConfig() : downloadJson('starro-config-backup.json', buildSyncPackage()); writeLog('匯出完整設定 JSON'); renderSyncCenter(); bindSyncCenterEvents(); });
    $$('#syncExportPublic')?.addEventListener('click', ()=>{ downloadJson('starro-public-snapshot.json', buildPublicSnapshot()); writeLog('匯出公開快照 JSON'); renderSyncCenter(); bindSyncCenterEvents(); toast('已匯出公開快照 JSON'); });
    $$('#syncCopySummary')?.addEventListener('click', async()=>{ if(await copyText(summaryText(),'同步摘要已複製')){ writeLog('複製同步摘要'); renderSyncCenter(); bindSyncCenterEvents(); } });
    $$('#syncCopyJson')?.addEventListener('click', async()=>{ if(await copyText(JSON.stringify(buildPublicSnapshot(),null,2),'同步 JSON 已複製')){ writeLog('複製同步 JSON'); renderSyncCenter(); bindSyncCenterEvents(); } });
    $$('#syncClearLogs')?.addEventListener('click', ()=>{ if(!confirm('確定清空最近同步紀錄？')) return; localStorage.removeItem(LOG_KEY); renderSyncCenter(); bindSyncCenterEvents(); toast('已清空同步紀錄'); });
    $$('#syncRefreshPanel')?.addEventListener('click', ()=>{ renderSyncCenter(); bindSyncCenterEvents(); toast('同步中心已更新'); });
    $$('#syncRefreshPreview')?.addEventListener('click', ()=>{ const pre = $$('#syncPreview'); if(pre) pre.textContent = JSON.stringify(buildPublicSnapshot(), null, 2); toast('預覽已更新'); });
    $$('#syncVersionExportAll')?.addEventListener('click', ()=>{ downloadJson('starro-version-history.json', readVersions()); writeLog('匯出版本歷史'); renderSyncCenter(); bindSyncCenterEvents(); toast('已匯出版本歷史'); });
    document.querySelectorAll('[data-version-preview]').forEach(btn=>btn.addEventListener('click', ()=>{ const entry = readVersions().find(x=>x.id===btn.dataset.versionPreview); if(!entry) return; const pre = $$('#syncPreview'); if(pre) pre.textContent = JSON.stringify(entry.config, null, 2); toast(`已預覽版本 ${entry.version}`); }));
    document.querySelectorAll('[data-version-export]').forEach(btn=>btn.addEventListener('click', ()=>{ const entry = readVersions().find(x=>x.id===btn.dataset.versionExport); if(!entry) return; downloadJson(`starro-${(entry.version||'version').replace(/[^\w.-]+/g,'_')}.json`, entry.config); writeLog(`匯出版本 ${entry.version}`); renderSyncCenter(); bindSyncCenterEvents(); }));
    document.querySelectorAll('[data-version-restore]').forEach(btn=>btn.addEventListener('click', ()=>restoreVersion(btn.dataset.versionRestore)));
  }

  function ensureSyncCenter(){
    const sideNav = $$('#sideNav');
    if(sideNav && !$$('[data-open="syncCenter"]', sideNav)){
      sideNav.insertAdjacentHTML('afterbegin', '<button data-open="syncCenter">🔄 資料同步 / 匯出中心</button>');
    }
    const table = $$('#featureTable');
    if(table && !$$('.feature-row-sync', table)){
      table.insertAdjacentHTML('afterbegin', `<div class="feature-row feature-row-sync"><div><div class="feature-title">🔄 資料同步 / 匯出中心</div><div class="feature-summary">匯出給 ChatGPT、匯出公開快照、複製同步摘要、查看版本歷史與最近同步紀錄</div></div><span class="pill">工具中心</span><button class="btn" data-open="syncCenter">編輯</button></div>`);
    }
    const panels = $$('#panels');
    if(panels && !$$('[data-panel="syncCenter"]', panels)){
      panels.insertAdjacentHTML('afterbegin', '<section class="panel" data-panel="syncCenter"></section>');
    }
    renderSyncCenter();
    if(hasFn('bindOpen')) window.bindOpen();
    bindSyncCenterEvents();
    const managed = $$('#managedCount');
    if(managed) managed.textContent = '11';
  }

  function patchCore(){
    if(hasFn('renderShell') && !window.__starro_sync_render_patched){
      const oldRender = window.renderShell;
      window.renderShell = function(){
        const result = oldRender.apply(this, arguments);
        ensureHero();
        ensureSyncCenter();
        return result;
      };
      window.__starro_sync_render_patched = true;
    }
    if(hasFn('updateMetrics') && !window.__starro_sync_metrics_patched){
      const oldMetrics = window.updateMetrics;
      window.updateMetrics = function(){
        const result = oldMetrics.apply(this, arguments);
        const managed = $$('#managedCount');
        if(managed) managed.textContent = '11';
        return result;
      };
      window.__starro_sync_metrics_patched = true;
    }
    if(hasFn('saveAll') && !window.__starro_sync_save_patched){
      const oldSave = window.saveAll;
      window.saveAll = async function(){
        const result = await oldSave.apply(this, arguments);
        writeLog(`儲存全部（${currentMode()}）`);
        recordVersion('儲存全部');
        return result;
      };
      window.__starro_sync_save_patched = true;
    }
    const exportBtn = $$('#exportBtn');
    if(exportBtn && !exportBtn.dataset.syncBound){
      exportBtn.dataset.syncBound = '1';
      exportBtn.addEventListener('click', ()=> writeLog('從側邊欄匯出完整設定 JSON'));
    }
    const importFile = $$('#importFile');
    if(importFile && !importFile.dataset.syncBound){
      importFile.dataset.syncBound = '1';
      importFile.addEventListener('change', ()=> setTimeout(()=>{ writeLog('匯入設定 JSON'); recordVersion('匯入設定 JSON'); }, 150));
    }
  }

  function boot(){
    patchCore();
    ensureHero();
    ensureSyncCenter();
    if(!readVersions().length && window.StarroConfig?.all){
      recordVersion('初始建立');
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
