'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'collection-cloud.js'),'utf8');
const A='普通收藏|1|甲',B='特殊收藏|2|乙';
function mock({local=[],remote=null,logged=true,error=null,backend=null}={}){
 const ids=['collectionGoogleLogin','collectionGoogleLogout','collectionCloudSave','collectionCloudLoad','collectionCloudStatus'];
 const els=Object.fromEntries(ids.map(id=>[id,{style:{},dataset:{},disabled:false,textContent:'',listeners:{},addEventListener(e,fn){this.listeners[e]=fn}}]));
 const selected=new Set(local),storage=new Map();let row=remote,writes=0;
 const user={id:'unit-test-account',email:'test@example.com'};
 const client={
  from(){return{
   select(){return{eq(){return{async maybeSingle(){return{data:row,error}}}}}},
   async upsert(data){writes++;if(!error)row={selected:data.selected};return{error}}
  }},
  auth:{
   onAuthStateChange(){},
   async getSession(){return{data:{session:logged?{user}:null},error:null}},
   async signInWithOAuth(){return{error:null}},
   async signOut(){return{error:null}}
  }
 };
 const context={
  window:{STARRO_SUPABASE:{url:'https://mock.supabase.co',anonKey:'test'},supabase:{createClient:()=>client}},
  document:{getElementById:id=>els[id]},
  location:{origin:'https://kuyun1986.github.io',pathname:'/StarRo-simulator/collection-advanced.html',search:''},
  localStorage:{setItem:(k,v)=>storage.set(k,v)},
  ITEMS:[{group:'普通收藏',row:1,name:'甲'},{group:'特殊收藏',row:2,name:'乙'}],
  keyOf:x=>x.group+'|'+x.row+'|'+x.name,selected,
  updateSummary(){},renderSubcats(){},renderSpecials(){},renderList(){},renderTotals(){},renderRequiredPanels(){},
  confirm:()=>true,
  setTimeout:fn=>{Promise.resolve().then(fn);return 1},clearTimeout(){},
  URLSearchParams,console
 };
 if(backend)context.fetch=async(url)=>{
   if(String(url).includes('/auth/v1/settings'))return{ok:true,json:async()=>({external:{google:backend.google}})};
   if(String(url).includes('/rest/v1/collection_progress'))return{
     status:backend.missing?404:401,json:async()=>({code:backend.missing?'PGRST205':'PGRST301'})
   };
   throw Error('Unexpected public diagnostics URL');
 };
 vm.runInNewContext(source,context,{filename:'collection-cloud.js'});
 return{els,selected,storage,context,remote:()=>row,writes:()=>writes,
  click:id=>els[id].listeners.click(),
  async settle(){for(let i=0;i<40;i++)await Promise.resolve()}};
}
test('existing checkmarks require opt-in before uploading to a new cloud account',async()=>{
 const h=mock({local:[A]});await h.settle();
 assert.equal(h.writes(),0);
 h.click('collectionCloudSave');await h.settle();
 assert.equal(h.writes(),1);assert.deepEqual([...h.remote().selected],[A]);
});
test('cloud progress restores automatically when local is empty',async()=>{
 const h=mock({remote:{selected:[B]}});await h.settle();
 assert.ok(h.selected.has(B));assert.equal(h.writes(),0);
 assert.deepEqual(JSON.parse(h.storage.get('starro_collection_selected')),[B]);
});
test('conflicting local and cloud data do not overwrite until user chooses',async()=>{
 const h=mock({local:[A],remote:{selected:[B]}});await h.settle();
 assert.equal(h.writes(),0);assert.ok(h.selected.has(A));
 h.click('collectionCloudLoad');await h.settle();
 assert.ok(h.selected.has(B));assert.ok(!h.selected.has(A));
});
test('missing table errors are visible and leave local progress alone',async()=>{
 const h=mock({local:[A],error:{code:'PGRST205',message:'Table not found'}});await h.settle();
 assert.match(h.els.collectionCloudStatus.textContent,/collection_progress_setup.sql/);
 assert.ok(h.selected.has(A));
});
test('logged-out edits remain on device',async()=>{
 const h=mock({logged:false});await h.settle();
 h.selected.add(A);h.context.window.StarroCollectionCloud.scheduleSave();await h.settle();
 assert.equal(h.writes(),0);
 assert.deepEqual(JSON.parse(h.storage.get('starro_collection_selected')),[A]);
});
test('eleven pages include the same ten valid section routes',()=>{
 const files=['index.html','game.html','enchant.html','identify.html','collection.html','catalog.html','collection-advanced.html','equipment.html','CASH.html','shadow.html','admin.html'];
 const routes=['index.html','game.html','enchant.html','identify.html','collection.html','collection-advanced.html','equipment.html','CASH.html','shadow.html','admin.html'];
 for(const name of files){
  const html=fs.readFileSync(path.join(root,name),'utf8');
  const nav=html.match(/<nav\b[^>]*data-starro-unified-nav[^>]*>[\s\S]*?<\/nav>/);
  assert.ok(nav,'navigation missing in '+name);
  assert.deepEqual([...nav[0].matchAll(/href="([^"]+)"/g)].map(x=>x[1]),routes,'routes differ in '+name);
 }
});

test('disabled Google provider and missing cloud table show specific problems while preserving local progress',async()=>{
 const h=mock({local:[A],logged:false,backend:{google:false,missing:true}});
 await h.settle();
 assert.equal(h.els.collectionGoogleLogin.disabled,true);
 assert.match(h.els.collectionCloudStatus.textContent,/Google 登入尚未啟用/);
 assert.match(h.els.collectionCloudStatus.textContent,/collection_progress_setup.sql/);
 assert.ok(h.selected.has(A));
 assert.equal(h.writes(),0);
});
