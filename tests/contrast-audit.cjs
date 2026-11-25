'use strict';
/* Automated site-wide color contrast audit. Runs desktop, mobile and expanded UI.
   WCAG AA 4.5:1 for normal text, 3:1 for large text (axe-core). */
const {chromium,devices}=require('playwright');
const axe=require('axe-core');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const ROOT=path.resolve(__dirname,'..');
const DIR=path.join(ROOT,'acceptance-artifacts');
fs.mkdirSync(DIR,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=http.createServer((req,res)=>{
 try{
  const filename=path.resolve(ROOT,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/\/$/,'/index.html'));
  if(!filename.startsWith(ROOT+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()){
   res.writeHead(404);res.end('Not found');return;
  }
  res.writeHead(200,{'content-type':mime[path.extname(filename)]||'application/octet-stream','cache-control':'no-store'});
  fs.createReadStream(filename).pipe(res);
 }catch(e){res.writeHead(500);res.end(String(e));}
});
const pages=['index.html','game.html','enchant.html','identify.html','collection.html',
 'catalog.html','collection-advanced.html','equipment.html','CASH.html','shadow.html','admin.html'];
function summarize(out,file,mode,state,axeResult){
 const problems=axeResult.violations.flatMap(v=>v.nodes.map(n=>({
  id:v.id,impact:v.impact,page:file,mode,state,
  target:(n.target||[]).join(' | '),
  html:(n.html||'').slice(0,250),summary:(n.failureSummary||'').slice(0,900)
 })));
 const incomplete=axeResult.incomplete.filter(v=>v.id==='color-contrast')
  .flatMap(v=>v.nodes.map(n=>({page:file,mode,state,target:(n.target||[]).join(' | '),html:(n.html||'').slice(0,160),reason:(n.failureSummary||'').slice(0,280)})));
 out.issues.push(...problems);out.incomplete.push(...incomplete);
 out.scans.push({file,mode,state,violations:problems.length,needsReview:incomplete.length,
  checked:(axeResult.passes.find(x=>x.id==='color-contrast')?.nodes.length||0)});
}
async function runAxe(p,report,file,mode,state){
 await p.evaluate(()=>document.fonts.ready);
 const results=await p.evaluate(async source=>{
  if(!window.axe){(0,eval)(source)}
  return await window.axe.run(document,{runOnly:{type:'rule',values:['color-contrast']},resultTypes:['violations','passes','incomplete']});
 },axe.source);
 summarize(report,file,mode,state,results);
}
async function clickIf(p,selector){
 const l=p.locator(selector);
 if(await l.count()){try{await l.first().click({timeout:2000})}catch(e){}}
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const report={generated:new Date().toISOString(),scans:[],issues:[],incomplete:[],errors:[]};
 for(const mode of ['desktop','mobile']){
  for(const file of pages){
   const ctx=await browser.newContext(mode==='mobile'
    ?{...devices['iPhone 13'],locale:'zh-TW'}
    :{viewport:{width:1440,height:900},locale:'zh-TW'});
   const p=await ctx.newPage();
   try{
    await p.goto(base+'/'+file,{waitUntil:'domcontentloaded',timeout:25000});
    await p.waitForTimeout(400);
    if(file==='admin.html')await clickIf(p,'#previewBtn');
    await runAxe(p,report,file,mode,'default');
    if(file==='collection.html'||file==='catalog.html'){
     await clickIf(p,'.catalog-filter-menu>summary');
     await runAxe(p,report,file,mode,'filters-open');
     await clickIf(p,'.catalog-filter-menu>summary');
     const pick=p.locator('.catalog-card input[data-pick-key]').first();
     try{await pick.check({timeout:3500});await runAxe(p,report,file,mode,'picked-source-list')}catch(e){report.errors.push(file+' '+mode+' pick: '+e.message)}
     await clickIf(p,'.catalog-source-line button');
     if(await p.locator('#catalogDialog[open]').count())await runAxe(p,report,file,mode,'detail-dialog');
    }else if(file==='collection-advanced.html'){
     await clickIf(p,'#subcatMenu>summary');await clickIf(p,'#specialMenu>summary');
     await runAxe(p,report,file,mode,'expanded-filter-choices');
    }else if(file==='enchant.html'){
     await runAxe(p,report,file,mode,'jro-mvp-table');
    }else if(file==='admin.html'){
     await clickIf(p,'[data-pane="catalog"]');
     await runAxe(p,report,file,mode,'admin-preview');
    }
   }catch(e){report.errors.push(file+' '+mode+': '+String(e.stack||e).slice(0,550))}
   await ctx.close();
  }
 }
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
 const totals={pages:pages.length,scans:report.scans.length,violations:report.issues.length,incomplete:report.incomplete.length,errors:report.errors.length};
 const bySection={};
 for(const issue of report.issues){
  const key=issue.page+' ['+issue.mode+'/'+issue.state+']';
  (bySection[key]||=([])).push(issue);
 }
 report.totals=totals;
 fs.writeFileSync(path.join(DIR,'contrast-report.json'),JSON.stringify(report,null,2));
 console.log('CONTRAST_AUDIT_SUMMARY '+JSON.stringify(totals));
 for(const [key,issues] of Object.entries(bySection)){
  console.log('CONTRAST_SECTION '+JSON.stringify({key,count:issues.length,examples:issues.slice(0,10)}));
 }
 for(const err of report.errors)console.log('CONTRAST_AUDIT_ERROR '+err);
 console.log('CONTRAST_REPORT_PATH acceptance-artifacts/contrast-report.json');
 if(process.env.CONTRAST_ENFORCE==='1'&&(totals.violations||totals.errors))process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
