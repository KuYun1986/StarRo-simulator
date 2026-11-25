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
  async function check(url,mode){
    const ctx=await browser.newContext(mode==='mobile'?{...devices['iPhone 13'],locale:'zh-TW'}:{viewport:{width:1440,height:900},deviceScaleFactor:1,locale:'zh-TW'});
    const p=await ctx.newPage();
    const errors=[];p.on('pageerror',e=>errors.push(e.message));
    try{
      const resp=await p.goto(base+'/'+url,{waitUntil:'domcontentloaded',timeout:35000});
      assert.equal(resp.status(),200);
      await p.waitForTimeout(350);
      assert.equal(await p.locator('link[href*="starro-polish.css"]').count(),1);
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
        await p.locator('#jroMvpClear').click();
        assert.ok(await p.locator('#jroMvpSearch').inputValue()==='','JRO clear failed');
      }
      if(url==='collection-advanced.html'){
        assert.equal(await p.locator('#jroMvpBox').count(),0,'JRO search should be moved out of collection');
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
          window.StarroConfig.replace(cfg);
        });
        await p.locator('#search').fill('驗收新增收藏');
        await p.locator('#list .item').first().waitFor({timeout:10000});
        assert.ok((await p.locator('#list').textContent()).includes('驗收新增收藏'));
        assert.ok((await p.locator('#list .collection-thumb').count())>=1,'added collection image missing');
        await p.locator('#search').fill('');
      }
      if(url==='catalog.html'||url==='collection.html'){
        await p.locator('.catalog-card').first().waitFor({timeout:10000});
        assert.ok((await p.locator('.catalog-card').count())>=20,'collection gallery cards missing');
        assert.ok(await p.locator('#catalogTabAll').isVisible(),'unified search mode missing');
        assert.equal(await p.locator('#catalogSlots input[type="checkbox"]').count(),12,'compact categories missing');
        await p.locator('#catalogSlotMenu summary').click();
        await p.locator('#catalogSlots input[value="飾品"]').check();
        assert.ok((await p.locator('#catalogSlotLabel').textContent()).includes('飾品'),'checkbox selection not reflected');
        await p.locator('#catalogReset').click();
        assert.equal(await p.locator('#catalogSlots input:checked').count(),0,'reset filters failed');
        await p.locator('#catalogSearch').fill('翡翠LT收藏組合');
        assert.ok((await p.locator('.catalog-card').count())>=1,'catalog search did not return existing collection');
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
        await p.locator('#catalogDialogClose').click();
        await p.locator('#catalogReset').click();
        await p.locator('#catalogTabAll').click();
        await p.locator('#catalogSearch').fill('翡翠戒指-LT[1]');
        assert.ok(await p.locator('#catalogResults button[data-action="equipment"]').count()>=1,'unified search did not include equipment');
        assert.ok(await p.locator('#catalogResults button[data-action="collection"]').count()>=1,'unified search did not include related collection');
        await p.locator('#catalogReset').click();
        await p.locator('#catalogTabGacha').click();
        assert.ok((await p.locator('#catalogGachaType').isVisible()),'gacha filter missing');
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
    await admin.locator('#previewBtn').click();
    await admin.locator('#adminUxTools').waitFor();
    assert.ok(await admin.locator('#biosAdminPanel').count());
    assert.ok(await admin.locator('#serviceRulesAdminPanel').count());
    assert.ok(await admin.locator('#airPricesAdminPanel').count());
    assert.ok(await admin.locator('#catManage').count(), 'catalog admin missing');
    assert.ok(await admin.locator('#catEquipmentAdmin').count(), 'equipment detail editor missing');
    await admin.locator('#eqAdminName').fill('翡翠戒指-LT[1]');
    await admin.locator('#eqAdminType').selectOption('飾品');
    await admin.locator('#eqAdminStats').fill('ATK+10');
    await admin.locator('#eqAdminSave').click();
    assert.ok((await admin.locator('#eqAdminStatus').textContent()).includes('已更新'),'equipment detail save failed');
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
