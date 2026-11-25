'use strict';
const { chromium, devices } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const screenshots=path.join(ROOT,'acceptance-artifacts');
fs.mkdirSync(screenshots,{recursive:true});
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(ROOT,'.'+pathname.replace(/\/$/,'/index.html'));
    if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'content-type':MIME[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
    fs.createReadStream(file).pipe(res);
  }catch(error){res.writeHead(500);res.end(String(error))}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true});
  const failures=[],details=[];
  const pages=['index.html','game.html','enchant.html','identify.html','collection.html','collection-advanced.html','equipment.html','CASH.html','shadow.html','catalog.html'];
  const expectedNav=[
    ['index.html','🏠 主頁'],['game.html','🎮 遊戲區'],
    ['enchant.html','✨ 附魔區'],['identify.html','🔍 洗詞鑑定區'],
    ['collection.html','📚 收藏圖鑑'],['collection-advanced.html','🧮 收藏模擬'],
    ['equipment.html','💰 裝備成本區'],['CASH.html','💳 現金區'],
    ['shadow.html','💎 影子區'],['admin.html','🔐 管理後台']
  ];
  async function verifyUnifiedNav(page,url){
    const canonical=url==='catalog.html'?'collection.html':url;
    const links=page.locator('.starro-global-nav a');
    await links.first().waitFor({timeout:10000});
    const actual=await links.evaluateAll(elements=>elements.map(link=>({
      href:link.getAttribute('href'),
      label:link.textContent.trim(),
      current:link.getAttribute('aria-current')
    })));
    assert.equal(actual.length,expectedNav.length,url+' unified navigation should contain ten entrances');
    assert.deepEqual(actual.map(link=>[link.href,link.label]),expectedNav,url+' navigation labels or order differ');
    assert.deepEqual(actual.filter(link=>link.current==='page').map(link=>link.href),[canonical],url+' current-page marker is wrong');
    const notVisible=await links.evaluateAll(elements=>elements.filter(link=>{
      const rect=link.getBoundingClientRect();
      const style=getComputedStyle(link);
      return !rect.width || !rect.height || style.display==='none'||style.visibility==='hidden';
    }).length);
    assert.equal(notVisible,0,url+' has hidden navigation entrances');
  }
  async function check(url,mode){
    const ctx=await browser.newContext(mode==='mobile'?{...devices['iPhone 13'],locale:'zh-TW'}:{viewport:{width:1440,height:900},deviceScaleFactor:1,locale:'zh-TW'});
    const p=await ctx.newPage();
    const errors=[];p.on('pageerror',e=>errors.push(e.message));
    try{
      const resp=await p.goto(base+'/'+url,{waitUntil:'domcontentloaded',timeout:35000});
      assert.equal(resp.status(),200);
      await p.waitForTimeout(350);
      await verifyUnifiedNav(p,url);
      assert.equal(await p.locator('link[href*="starro-polish.css"]').count(),1);
      const isCatalog=url==='collection.html'||url==='catalog.html';
      if(!isCatalog){
        assert.equal(await p.locator('link[href*="starro-gallery-unified.css"]').count(),1,'shared gallery palette not linked');
      }
      const scheme=await p.evaluate(()=>getComputedStyle(document.documentElement).colorScheme);
      assert.ok(scheme.includes('light'),'page did not adopt gallery light appearance');
      const theme=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--cat-gold').trim());
      assert.ok(/^#[0-9a-f]{6}$/i.test(theme),'catalog theme token missing');
      if(!['catalog.html','collection.html'].includes(url))assert.equal(await p.locator('script[src*="starro-polish.js"]').count(),1);
      assert.ok(await p.locator('h1').count()>=1,url+' is missing h1');
      const extent=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,window:innerWidth}));
      const nav=await p.locator('.ux-section-index').count();
      if(url==='index.html'){
        assert.ok(await p.locator('#biosTalismanSimulator').count());
        assert.ok(await p.locator('#talismanCostSimulator').count());
        assert.ok(await p.locator('#bioMaterialRows tr').count()>0);
      }
      if(url==='enchant.html'){
        await p.locator('#jroMvpRows tr').first().waitFor({timeout:10000});
        assert.ok(await p.locator('#jroMvpEnchant option').count()===9,'JRO enchant options missing');
        assert.ok(await p.locator('#jroMvpRows tr').count()>40,'JRO MVP rows missing');
        await p.locator('#jroMvpSearch').fill('英雄的凱歌');
        assert.ok((await p.locator('#jroMvpMeta').textContent()).includes('顯示 '),'JRO filtered count missing');
        await p.locator('#jroMvpClear').evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'}));
        await p.locator('#jroMvpClear').click();
        assert.ok(await p.locator('#jroMvpSearch').inputValue()==='','JRO clear failed');
      }
      if(url==='collection-advanced.html'){
        assert.equal(await p.locator('#jroMvpBox').count(),0,'JRO search should be moved out of collection');
        assert.ok((await p.locator('#groupFilter').textContent()).includes('特殊收藏'),'Special Collection terminology missing');
        assert.ok((await p.locator('#jroSlots').count())===1,'Special Collection capacity field missing');
        const special=await p.evaluate(()=>{const list=ITEMS.filter(x=>x.group==='特殊收藏');return {count:list.length,key:list.length?keyOf(list[0]):''}});
        assert.ok(special.count>=190,'special collection rename failed');
        assert.ok(special.key.startsWith('特殊收藏|'),'Special collection key has not been normalized');
        const original=await p.evaluate(()=>{
          const it=ITEMS.find(x=>x.group==='特殊收藏');
          localStorage.setItem('starro_collection_selected',JSON.stringify(['JRO收藏|'+it.row+'|'+it.name]));
          return it.name;
        });
        await p.reload({waitUntil:'domcontentloaded'});
        await p.locator('#search').fill(original);
        assert.ok(await p.locator('#list input[data-key]:checked').count()>=1,'Legacy JRO collection progress was not migrated');
        await p.locator('#search').fill(''); // Restore all subcategories before the multi-select test.
        assert.ok(await p.locator('#groupFilter option[value="特殊收藏"]').count(),'special group filter missing');
        assert.ok(await p.locator('script[src*="starro-online-lookup.js"]').count(),'advanced collection online lookup module missing');
        assert.equal(await p.locator('#subcatMenu:not([open])').count(),1,'subcategory menu should start collapsed');
        assert.equal(await p.locator('#specialMenu:not([open])').count(),1,'special category menu should start collapsed');
        await p.locator('#subcatMenu > summary').click();
        const subcatInputs=p.locator('#subcatChips input[type="checkbox"]');
        assert.ok(await subcatInputs.count()>=2,'subcategory checkbox choices missing');
        await subcatInputs.first().check();
        assert.ok((await p.locator('#subcatMeta').textContent()).includes('已選 1 種'));
        await p.locator('#subcatClear').click();
        assert.equal(await p.locator('#subcatChips input:checked').count(),0,'subcategory clear failed');
        await p.locator('#specialMenu > summary').click();
        const specialInputs=p.locator('#specialChips input[type="checkbox"]');
        assert.ok(await specialInputs.count()>=1,'special category checkbox choices missing');
        await specialInputs.first().check();
        assert.ok((await p.locator('#specialMeta').textContent()).includes('已選 1 類'));
        await p.locator('#specialClearChoices').click();
        assert.equal(await p.locator('#specialChips input:checked').count(),0,'special category clear failed');
      }
      if(url==='equipment.html'){
        assert.ok(await p.locator('#serviceMultiOptions').count());
        assert.ok(await p.locator('#serviceMaterialsText').count());
      }
      if(url==='collection-advanced.html'){
        await p.evaluate(()=>{
          const cfg=window.StarroConfig.all();
          cfg.features.catalog.items=[{group:'自訂收藏',row:982345,name:'驗收新增收藏',effect:'ATK+1',slot:1,required:['驗收裝備'],image:''}];
          cfg.features.catalog.images['驗收新增收藏']='https://example.com/test-icon.webp';
          cfg.features.catalog.equipmentDetails={驗收裝備:{type:'測試裝備',source:'驗收取得來源',description:'測試說明',stats:'ATK+1'}};
          window.StarroConfig.replace(cfg);
        });
        await p.locator('#search').fill('驗收新增收藏');
        await p.locator('#list .item').first().waitFor({timeout:10000});
        assert.ok((await p.locator('#list').textContent()).includes('驗收新增收藏'));
        assert.ok((await p.locator('#list .collection-thumb').count())>=1,'added collection image missing');
        await p.locator('#list input[data-key]').first().check();
        assert.ok((await p.locator('.item-sources').textContent()).includes('驗收取得來源'),'checked collection sources missing');
        await p.locator('.item-sources button[data-item-detail]').first().click();
        assert.ok(await p.locator('#itemDetailDialog').isVisible(),'required item dialog missing');
        assert.ok((await p.locator('#itemDetailContent').textContent()).includes('驗收取得來源'));
        await p.locator('.item-detail-close').click();
        await p.locator('#search').fill('');
        await p.locator('#search').fill('翡翠LT收藏組合');
        await p.locator('#list .item').first().waitFor({timeout:6000});
        const firstPick=p.locator('#list input[data-key]').first();
        if(!await firstPick.isChecked())await firstPick.check();
        const ltPanel=await p.locator('#list .item-sources').first().textContent();
        assert.ok(ltPanel.includes('翡翠戒指[1]')&&ltPanel.includes('改造升級'),
          'advanced collection LT source mapping/upgrade notice missing');
        await p.locator('#list .item-sources button[data-item-detail]').first().click();
        assert.ok((await p.locator('#itemDetailContent').textContent()).includes('資料來源'),
          'item details should cite equipment source at the end');
        await p.locator('.item-detail-close').click();
        await p.locator('#search').fill('');
      }
      if(url==='catalog.html'||url==='collection.html'){
        const ref=await p.evaluate(()=>{
          const lookup=window.StarroReferenceLookup;
          const info=lookup?.details('破壞斧[2]')||{};
          return {count:Object.keys(window.StarroReferenceIndex?.items||{}).length,
                  id:info.itemId,image:info.image,sources:info.sources||[]};
        });
        assert.ok(ref.count>=1400,'public reference encyclopedia not loaded');
        assert.equal(ref.id,'1341','item name to ID mapping failed');
        assert.ok(ref.image.endsWith('/item-icons/1341.png'),'public icon URL missing');
        assert.ok(ref.sources.some(s=>s.includes('狙擊轉蛋')),'named gacha source not loaded');
        await p.locator('.catalog-card').first().waitFor({timeout:10000});
        assert.ok((await p.locator('.catalog-card').count())>=20,'collection gallery cards missing');
        assert.ok(await p.locator('#catalogTabAll').isVisible(),'unified search mode missing');
        const reference=await p.evaluate(()=>window.StarroReferenceItems);
        assert.ok(reference&&Object.keys(reference).length>=700,'referenced item metadata not loaded');
        assert.ok(reference['翡翠戒指[1]']?.itemId==='28573','reference item id mismatch');
        assert.equal(await p.locator('#catalogSlots input[type="checkbox"]').count(),12,'compact categories missing');
        await p.locator('#catalogSlotMenu summary').click();
        await p.locator('#catalogSlots input[value="飾品"]').check();
        assert.ok((await p.locator('#catalogSlotLabel').textContent()).includes('飾品'),'checkbox selection not reflected');
        await p.locator('#catalogReset').click();
        assert.equal(await p.locator('#catalogSlots input:checked').count(),0,'reset filters failed');
        await p.locator('#catalogSearch').fill('網路測試裝備名稱');
        const onlineHref=await p.locator('#catalogOnlineSearch').getAttribute('href');
        assert.ok(onlineHref?.includes('google.com/search')&&onlineHref.includes(encodeURIComponent('網路測試裝備名稱')),'external fallback search did not encode item name');
        await p.locator('#catalogReset').click();
        assert.ok(await p.locator('#catalogGroups input[value="特殊收藏"]').count()===1,'Special Collection category missing');
        await p.locator('#catalogSearch').fill('翡翠LT收藏組合');
        assert.ok((await p.locator('.catalog-card').count())>=1,'catalog search did not return existing collection');
        await p.locator('.catalog-card input[data-pick-key]').first().check();
        assert.ok((await p.locator('.catalog-selected-sources').textContent()).includes('所需道具與已登錄來源'),'selected catalog item-source panel missing');
        const inheritedPanel=await p.locator('.catalog-selected-sources').first().textContent();
        assert.ok(inheritedPanel.includes('翡翠戒指[1]')&&inheritedPanel.includes('改造升級'),
          'LT item did not inherit verified original gacha source with conversion note');

        // Contrast regression: source summaries must be legible on light collection cards,
        // including iPhone-sized layouts. WCAG AA for small body text is >= 4.5:1.
        const sourceContrast=await p.locator('.catalog-selected-sources .catalog-source-line small').first().evaluate(el=>{
          const panel=el.closest('.catalog-selected-sources');
          const rgb=str=>(str.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
          const luminance=str=>{
            const [r,g,b]=rgb(str).map(c=>{const v=c/255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4});
            return 0.2126*r+0.7152*g+0.0722*b;
          };
          const fg=luminance(getComputedStyle(el).color);
          const bg=luminance(getComputedStyle(panel).backgroundColor);
          return (Math.max(fg,bg)+0.05)/(Math.min(fg,bg)+0.05);
        });
        assert.ok(sourceContrast>=4.5,'collection source summary too faint: '+sourceContrast.toFixed(2)+':1');
        const sourceItemColor=await p.locator('.catalog-selected-sources .catalog-source-line button > span').first().evaluate(el=>getComputedStyle(el).color);
        assert.ok(/^rgb\(3[0-9], 6[0-9], 8[0-9]\)$/.test(sourceItemColor)||sourceItemColor==='rgb(38, 63, 83)','source item name should be dark and readable');

        await p.locator('.catalog-source-line button').first().click();
        assert.ok(await p.locator('#catalogDialog').isVisible(),'source item detail dialog missing');
        assert.ok((await p.locator('#catalogDialogContent').textContent()).includes('已登錄取得來源'));
        assert.ok(await p.locator('#catalogDialogContent .starro-online-lookup').count()>=1,'online item research entry missing');
        assert.ok(await p.locator('#catalogDialogContent a[href*="divine-pride.net/database/item"]').count()>=1,'Divine Pride lookup missing');
        await p.locator('#catalogDialogClose').click();
        await p.locator('button[data-action="collection"]').first().click();
        assert.ok(await p.locator('#catalogDialog').isVisible(),'collection detail missing');
        assert.ok(await p.locator('.catalog-equipment-row').count()>=1,'required equipment links missing');
        await p.locator('.catalog-equipment-row').first().click();
        assert.ok((await p.locator('#catalogDialogContent').textContent()).includes('被哪些收藏需要'),'reverse collection links missing');
        await p.locator('#catalogDialogClose').click();
        await p.locator('#catalogTabEquipment').click();
        await p.locator('#catalogSearch').fill('翡翠戒指-LT[1]');
        assert.ok(await p.locator('.catalog-card').count()>=1,'equipment lookup missing');
        await p.locator('button[data-action="equipment"]').first().click();
        assert.ok(await p.locator('#catalogDialogContent').getByText('裝備詳細資料').count()>=1,'equipment details section missing');
        assert.ok(await p.locator('#catalogDialogContent a[href*="google.com/search"]').count()>=1,'online equipment name search missing');
        await p.locator('#catalogDialogClose').click();
        await p.locator('#catalogReset').click();
        await p.locator('#catalogTabAll').click();
        await p.locator('#catalogSearch').fill('翡翠戒指-LT[1]');
        assert.ok(await p.locator('#catalogResults button[data-action="equipment"]').count()>=1,'unified search did not include equipment');
        assert.ok(await p.locator('#catalogResults button[data-action="collection"]').count()>=1,'unified search did not include related collection');
        await p.locator('#catalogReset').click();
        await p.locator('#catalogTabGacha').click();
        assert.ok((await p.locator('#catalogGachaMenu').isVisible()),'gacha filter missing');
        await p.locator('#catalogGachaMenu summary').click();
        await p.locator('#catalogGachaTypes input[value="XR"]').check();
        await p.locator('#catalogGachaTypes input[value="紅利轉蛋"]').check();
        assert.ok((await p.locator('#catalogGachaLabel').textContent()).includes('XR'),'gacha multiselect missing');
        await p.locator('#catalogReset').click();
        assert.equal(await p.locator('#catalogGachaTypes input:checked').count(),0,'gacha filters not cleared');
        await p.evaluate(()=>{
          const cfg=window.StarroConfig.all();
          cfg.features.catalog.gachaPools=[{key:'test-pool',name:'XR測試轉蛋',type:'XR',id:'XR-TEST',items:[{name:'翡翠戒指-LT[1]',rate:'1%',image:''}]}];
          window.StarroConfig.replace(cfg);
        });
        await p.locator('.catalog-card').first().waitFor({timeout:10000});
        assert.ok((await p.locator('#catalogResults').textContent()).includes('翡翠戒指-LT[1]'));
        await p.locator('button[data-action="drop"]').first().click();
        assert.ok((await p.locator('#catalogDialog').isVisible()),'detail dialog did not open');
        await p.locator('#catalogDialogClose').click();
        await p.locator('#catalogViewSwitch [data-view="pools"]').click();
        assert.ok((await p.locator('#catalogResults').textContent()).includes('XR測試轉蛋'));
        await p.locator('button[data-action="pool"]').first().click();
        assert.ok(await p.locator('#catalogDialogContent button[data-equipment-name]').count()>=1,'Gacha prize buttons missing');
        await p.locator('#catalogDialogContent button[data-equipment-name]').first().click();
        assert.ok((await p.locator('#catalogDialogContent').textContent()).includes('裝備詳細資料'),'Gacha prize did not open equipment detail');
        await p.locator('#catalogDialogClose').click();
        const legacyName=await p.evaluate(()=>{
          const it=ITEMS.find(x=>x.group==='特殊收藏');
          localStorage.setItem('starro_collection_selected',JSON.stringify(['JRO收藏|'+it.row+'|'+it.name]));
          return it.name;
        });
        await p.reload({waitUntil:'domcontentloaded'});
        await p.locator('#catalogTabCollection').click();
        await p.locator('#catalogSearch').fill(legacyName);
        assert.equal(await p.locator('#catalogResults input[data-pick-key]:checked').count(),1,'Legacy Special collection progress missing in gallery');
        assert.ok((await p.locator('#catalogResults').textContent()).includes('特殊收藏'),'Special collection display name missing');
      }
      await p.screenshot({path:path.join(screenshots,url.replace('.html','')+'-'+mode+'.png'),fullPage:false});
      details.push({page:url,mode,nav,viewport:extent.window,pageWidth:extent.scroll,errors:errors.slice(0,8)});
      if(errors.length)failures.push(url+' '+mode+' JavaScript errors: '+errors.slice(0,3).join(' | '));
    }catch(e){failures.push(url+' '+mode+': '+e.stack)}
    await ctx.close();
  }
  for(const mode of ['desktop','mobile'])for(const page of pages)await check(page,mode);
  // Admin preview requires no credentials; must not perform a cloud save.
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const admin=await ctx.newPage();const adminErrors=[];
  admin.on('pageerror',e=>adminErrors.push(e.message));
  try{
    await admin.goto(base+'/admin.html',{waitUntil:'domcontentloaded'});
    await verifyUnifiedNav(admin,'admin.html');
    await admin.locator('#previewBtn').click();
    await admin.locator('#adminUxTools').waitFor();
    assert.ok(await admin.locator('#biosAdminPanel').count());
    assert.ok(await admin.locator('#serviceRulesAdminPanel').count());
    assert.ok(await admin.locator('#airPricesAdminPanel').count());
    assert.ok(await admin.locator('#catManage').count(), 'catalog admin missing');
    await admin.locator('[data-pane="equipment"]').click();
    await admin.locator('#catEquipName').fill('破壞斧[2]');
    await admin.locator('#catEquipImportRef').click();
    assert.equal(await admin.locator('#catEquipId').inputValue(),'1341','reference item ID not filled');
    assert.ok((await admin.locator('#catEquipImage').inputValue()).includes('/item-icons/1341.png'),'reference image not filled');
    assert.ok((await admin.locator('#catEquipSources').inputValue()).includes('狙擊轉蛋'),'reference gacha not filled');
    await admin.locator('#catEquipReset').click();
    await admin.locator('#catEquipName').fill('驗收測試戒指');
    await admin.locator('#catEquipId').fill('123456');
    await admin.locator('#catEquipSources').fill('測試副本獎勵');
    await admin.locator('#catEquipReference').fill('https://ro-collectitem-yuno.netlify.app/');
    await admin.locator('#catEquipSave').click();
    await admin.waitForFunction(()=>document.querySelector('#catEquipSaved')?.options.length>1);
    assert.ok((await admin.locator('#catEquipSaved option').count())>=2,'item metadata editor failed');
    assert.ok(await admin.locator('#catEquipmentAdmin').count(), 'equipment detail editor missing');
    await admin.locator('#eqAdminName').fill('翡翠戒指-LT[1]');
    await admin.locator('#eqAdminType').selectOption('飾品');
    await admin.locator('#eqAdminStats').fill('ATK+10');
    await admin.locator('#eqAdminSources').fill('驗收轉蛋獎勵');
    await admin.locator('#eqAdminSave').click();
    assert.ok((await admin.locator('#eqAdminStatus').textContent()).includes('已更新'),'equipment detail save failed');
    assert.ok((await admin.evaluate(()=>cfg.features.catalog.equipmentDetails['翡翠戒指-LT[1]']?.sources)||[]).includes('驗收轉蛋獎勵'),'source admin did not save source');
    await admin.locator('#catManage [data-pane="collections"]').click();
    await admin.locator('#catCollectionName').fill('驗收收藏');
    await admin.locator('#catCollectionEffect').fill('ATK+1');
    await admin.locator('#catCollectionSave').click();
    await admin.locator('#catManageStatus').getByText('已儲存收藏', {exact:false}).waitFor({timeout:10000}).catch(()=>{});
    assert.ok((await admin.locator('#catCollectionSelect option').count())>=2,'catalog item editor save failed');
    await admin.locator('[data-pane="gacha"]').first().click();
    await admin.locator('#catPoolName').fill('驗收轉蛋');
    await admin.locator('#catPoolDrops').fill('驗收獎品 | 0.1%');
    await admin.locator('#catPoolSave').click();
    assert.ok((await admin.locator('#catPoolSelect option').count())>=2,'gacha editor save failed');
    await admin.locator('#adminUxSearch').fill('收藏');
    assert.ok((await admin.locator('#featureTable .feature-row:visible').count())>=1);
    await admin.locator('#adminUxSearch').fill('');
    await admin.locator('#biosAdminPanel details').evaluate(x=>x.open=true);
    assert.equal(await admin.locator('#biosStageAdmin input[data-bios-rate]').count(),12);
    await admin.screenshot({path:path.join(screenshots,'admin-desktop.png'),fullPage:false});
    details.push({page:'admin.html',mode:'desktop',errors:adminErrors});
    if(adminErrors.length)failures.push('admin page errors: '+adminErrors.slice(0,3).join(' | '));
  }catch(e){failures.push('admin: '+e.stack)}
  await ctx.close();
  await browser.close();
  server.close();
  const report={checkedAt:new Date().toISOString(),pages:details,failures};
  fs.writeFileSync(path.join(screenshots,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
