(()=>{
'use strict';
const $=id=>document.getElementById(id);
const clean=s=>String(s??'').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const safeImage=s=>{
  const url=clean(s);
  if(/^https:\/\//i.test(url))return url;
  if(/^data:image\/(?:png|jpeg|webp);base64,[\w+/=]+$/i.test(url)&&url.length<90000)return url;
  return '';
};
const normalize=s=>clean(s).toLocaleLowerCase('zh-TW').replace(/\s+/g,'');
const imageHtml=(src,icon='🎁')=>{
  const url=safeImage(src);
  return '<div class="catalog-cover">'+(url?'<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+esc(url)+'" alt="">':icon)+'</div>';
};
const state={tab:'collection',view:'items',page:1,pageSize:36,slot:'all',query:'',group:'all',progress:'all',gachaType:'all'};
const slots=['全部','頭上','頭中','頭下','鎧甲','武器','盾牌','披肩','鞋子','飾品','影子裝備','卡片','其他'];
const keyOf=it=>it.group+'|'+it.row+'|'+it.name;
const progressKey='starro_collection_selected';
function loadSaved(){try{const v=JSON.parse(localStorage.getItem(progressKey)||'[]');return new Set(Array.isArray(v)?v:[])}catch(e){return new Set()}}
let selected=loadSaved();
function catalog(){return window.StarroConfig?.get('features.catalog',{})||{}}
function allCollections(){
  const custom=Array.isArray(catalog().items)?catalog().items:[];
  const base=typeof ITEMS!=='undefined'?ITEMS:[];
  const existing=new Set(base.map(keyOf));
  return base.concat(custom.filter(x=>x&&typeof x.name==='string'&&!existing.has(keyOf(x))).map((x,i)=>({
    ...x,group:x.group||'自訂收藏',row:x.row||900000+i,slot:Number(x.slot)||0,required:Array.isArray(x.required)?x.required:[]
  })));
}
function pools(){
  return (Array.isArray(catalog().gachaPools)?catalog().gachaPools:[]).filter(p=>p&&p.name&&Array.isArray(p.items));
}
function imageFor(name,explicit=''){
  const images=catalog().images||{};
  const url=explicit||images[name]||'';
  return safeImage(url);
}
function inSlot(text){
  if(state.slot==='all')return true;
  const s=clean(text);
  if(state.slot==='其他')return !slots.slice(1,-1).some(x=>s.includes(x));
  return s.includes(state.slot);
}
function collectionSource(item){
  const req=(item.required||[]).map(x=>normalize(x.replace(/\s*(?:×|x)\s*\d+$/i,'')));
  const out=[];
  for(const pool of pools()){
    for(const drop of pool.items){
      if(req.includes(normalize(drop.name))){out.push({pool:pool.name,type:pool.type||'其他',drop});}
    }
  }
  return out;
}
function allItems(){
  const map=new Map();
  for(const pool of pools())for(const drop of pool.items){
    if(!drop||!clean(drop.name))continue;
    const key=normalize(drop.name);
    if(!map.has(key))map.set(key,{name:drop.name,images:[],sources:[]});
    const entry=map.get(key);
    entry.sources.push({pool:pool.name,type:pool.type||'其他',rate:drop.rate||'',image:drop.image||''});
    if(drop.image)entry.images.push(drop.image);
  }
  return [...map.values()];
}
function collectionFilters(item){
  if(state.group!=='all'&&state.group!==item.group)return false;
  const chosen=selected.has(keyOf(item));
  if(state.progress==='saved'&&!chosen)return false;
  if(state.progress==='unsaved'&&chosen)return false;
  if(state.slot!=='all'&&!inSlot((item.required||[]).join(' ')+' '+item.game+' '+item.name))return false;
  const q=normalize(state.query);
  return !q||normalize([item.name,item.effect,item.game,item.dc,...(item.required||[])].join(' ')).includes(q);
}
function gachaFilters(p){
  if(state.gachaType!=='all'&&state.gachaType!==(p.type||'其他'))return false;
  if(state.slot!=='all'&&!inSlot([p.name,...(p.items||[]).map(x=>x.name)].join(' ')))return false;
  const q=normalize(state.query);
  return !q||normalize([p.name,p.id||'',p.type,...(p.items||[]).map(x=>x.name)].join(' ')).includes(q);
}
function itemFilters(it){
  const matchingSources=it.sources.filter(x=>state.gachaType==='all'||x.type===state.gachaType);
  if(!matchingSources.length)return false;
  if(state.slot!=='all'&&!inSlot(it.name))return false;
  const q=normalize(state.query);
  return !q||normalize([it.name,...matchingSources.map(x=>x.pool)].join(' ')).includes(q);
}
function button(label,action,datum){
  return '<button type="button" data-action="'+esc(action)+'" data-id="'+esc(datum)+'">'+esc(label)+'</button>';
}
function renderCollectionCard(item,i){
  const k=keyOf(item),has=selected.has(k),sourceCount=collectionSource(item).length;
  return '<article class="catalog-card"><div class="catalog-card__top">'+imageHtml(imageFor(item.name,item.image),'📚')+
    '<div class="catalog-card__name">'+esc(item.name)+'</div></div><div class="catalog-card__body">'+
    '<div class="catalog-card__effect">'+esc(item.effect||'尚無效果說明')+'</div><div class="catalog-card__meta">'+
    '<span class="catalog-chip">'+esc(item.group||'自訂收藏')+'</span><span class="catalog-chip">佔格 '+esc(item.slot||0)+'</span>'+
    (sourceCount?'<span class="catalog-chip">'+sourceCount+' 筆轉蛋關聯</span>':'')+
    '</div></div><div class="catalog-card__bottom"><span class="'+(has?'catalog-picked':'catalog-notpicked')+'">'+(has?'✓ 已勾選':'○ 尚未勾選')+'</span>'+
    button('查看詳情','collection',String(i))+'</div></article>';
}
function renderPoolCard(p,i){
  return '<article class="catalog-card"><div class="catalog-card__top">'+imageHtml(imageFor(p.name,p.image),'🎁')+
  '<div class="catalog-card__name">'+esc(p.name)+'</div></div><div class="catalog-card__body"><div class="catalog-card__effect">'+esc(p.description||p.id||'轉蛋獎品清單')+'</div>'+
  '<div class="catalog-card__meta"><span class="catalog-chip">'+esc(p.type||'其他')+'</span><span class="catalog-chip">'+p.items.length+' 種獎品</span></div>'+
  '</div><div class="catalog-card__bottom"><span class="catalog-notpicked">轉蛋池</span>'+button('查看獎品','pool',String(i))+'</div></article>';
}
function renderItemCard(it,i){
  return '<article class="catalog-card"><div class="catalog-card__top">'+imageHtml(imageFor(it.name,it.images[0]),'💎')+
  '<div class="catalog-card__name">'+esc(it.name)+'</div></div><div class="catalog-card__body"><div class="catalog-card__effect">可由 '+it.sources.length+' 個轉蛋池取得</div>'+
  '<div class="catalog-card__meta">'+it.sources.slice(0,3).map(x=>'<span class="catalog-chip">'+esc(x.type)+'</span>').join('')+'</div></div>'+
  '<div class="catalog-card__bottom"><span class="catalog-notpicked">來源查詢</span>'+button('查看來源','drop',String(i))+'</div></article>';
}
let rendered=[];
function render(){
  const collections=allCollections(),allPools=pools();
  $('catalogTotal').textContent=collections.length.toLocaleString('zh-TW');
  $('catalogPoolTotal').textContent=allPools.length.toLocaleString('zh-TW');
  const gacha=state.tab==='gacha';
  $('catalogTabCollection').classList.toggle('active',!gacha);
  $('catalogTabGacha').classList.toggle('active',gacha);
  $('catalogTabCollection').setAttribute('aria-selected',String(!gacha));
  $('catalogTabGacha').setAttribute('aria-selected',String(gacha));
  $('catalogGachaType').hidden=!gacha;
  $('catalogGroup').hidden=gacha;$('catalogProgress').hidden=gacha;
  $('catalogViewSwitch').hidden=!gacha;
  $('catalogViewSwitch').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
  let results;
  if(!gacha){results=collections.filter(collectionFilters);}
  else if(state.view==='pools'){results=allPools.filter(gachaFilters);}
  else{results=allItems().filter(itemFilters);}
  const totalPages=Math.max(1,Math.ceil(results.length/state.pageSize));
  state.page=Math.min(state.page,totalPages);
  const start=(state.page-1)*state.pageSize;
  rendered=results.slice(start,start+state.pageSize);
  $('catalogStatus').textContent='符合條件 '+results.length.toLocaleString('zh-TW')+' 筆｜每頁 '+state.pageSize+' 筆';
  $('catalogPage').textContent='第 '+state.page+' / '+totalPages+' 頁';
  $('catalogPrev').disabled=state.page<=1;$('catalogNext').disabled=state.page>=totalPages;
  $('catalogResults').innerHTML=rendered.length?rendered.map((x,i)=>!gacha?renderCollectionCard(x,i):(state.view==='pools'?renderPoolCard(x,i):renderItemCard(x,i))).join(''):
    '<div class="catalog-empty">'+(gacha&&!allPools.length?'尚未建立轉蛋資料。可從 StarRo 管理後台新增轉蛋池、獎品與圖片。':'沒有符合條件的項目，請調整關鍵字或分類。')+'</div>';
}
function detailHeader(name,src,kind){
  return '<div class="catalog-detail-head">'+imageHtml(src,kind==='collection'?'📚':'🎁')+
    '<div><h2 id="catalogDialogTitle">'+esc(name)+'</h2><p>'+esc(kind==='collection'?'收藏效果、需求與轉蛋來源':'轉蛋獎品與來源')+'</p></div></div>';
}
function detailSection(title,items){
  return '<div class="catalog-detail-section"><h3>'+esc(title)+'</h3>'+(items.length?
  '<ul class="catalog-detail-list">'+items.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>':
  '<p class="catalog-notpicked">目前沒有已建立的資料</p>')+'</div>';
}
function openDetail(kind,i){
  const entry=rendered[i];if(!entry)return;
  let html='';
  if(kind==='collection'){
    const req=entry.required||[],sources=collectionSource(entry);
    const has=selected.has(keyOf(entry));
    html=detailHeader(entry.name,imageFor(entry.name,entry.image),'collection')+
      detailSection('收藏效果',[entry.effect||'尚無效果說明'])+
      detailSection('需求裝備／卡片',req)+
      detailSection('已建立的轉蛋來源',sources.map(x=>x.pool+'｜'+x.drop.name+(x.drop.rate?'｜'+x.drop.rate:'') ))+
      '<div class="catalog-detail-section"><button class="catalog-detail-btn" type="button" id="catalogToggleSelected" data-key="'+esc(keyOf(entry))+'">'+(has?'取消勾選':'✓ 標記已收藏')+'</button></div>';
  }else if(kind==='pool'){
    html=detailHeader(entry.name,imageFor(entry.name,entry.image),'gacha')+
      detailSection('轉蛋類型／編號',[entry.type||'其他',entry.id||'未提供編號'])+
      detailSection('轉蛋獎品',entry.items.map(x=>x.name+(x.rate?'｜'+x.rate:'') ));
  }else{
    html=detailHeader(entry.name,imageFor(entry.name,entry.images[0]),'gacha')+
      detailSection('出現轉蛋',entry.sources.map(x=>x.pool+'｜'+x.type+(x.rate?'｜'+x.rate:'') ));
    const related=allCollections().filter(x=>(x.required||[]).some(r=>normalize(r).includes(normalize(entry.name))));
    html+=detailSection('相關收藏',related.slice(0,30).map(x=>x.name));
  }
  $('catalogDialogContent').innerHTML=html;
  const dialog=$('catalogDialog');
  if(!dialog.open)dialog.showModal();
}
function init(){
  const slotButtons=['全部',...slots.slice(1)];
  $('catalogSlots').innerHTML=slotButtons.map(x=>'<button type="button" class="'+(x==='全部'?'active':'')+'" data-slot="'+esc(x==='全部'?'all':x)+'">'+esc(x)+'</button>').join('');
  $('catalogSlots').addEventListener('click',e=>{
    const b=e.target.closest('button[data-slot]');if(!b)return;state.slot=b.dataset.slot;state.page=1;
    $('catalogSlots').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));render();
  });
  $('catalogTabCollection').onclick=()=>{state.tab='collection';state.page=1;render()};
  $('catalogTabGacha').onclick=()=>{state.tab='gacha';state.page=1;render()};
  $('catalogViewSwitch').addEventListener('click',e=>{const b=e.target.closest('button[data-view]');if(b){state.view=b.dataset.view;state.page=1;render()}});
  $('catalogSearch').addEventListener('input',e=>{state.query=e.target.value;state.page=1;render()});
  for(const [id,key] of [['catalogGroup','group'],['catalogProgress','progress'],['catalogGachaType','gachaType']]){
    $(id).onchange=e=>{state[key]=e.target.value;state.page=1;render()};
  }
  $('catalogPrev').onclick=()=>{state.page--;render();window.scrollTo({top:250,behavior:'smooth'})};
  $('catalogNext').onclick=()=>{state.page++;render();window.scrollTo({top:250,behavior:'smooth'})};
  $('catalogReset').onclick=()=>{
    Object.assign(state,{query:'',group:'all',progress:'all',gachaType:'all',slot:'all',page:1});
    ['catalogSearch'].forEach(id=>$(id).value='');
    ['catalogGroup','catalogProgress','catalogGachaType'].forEach(id=>$(id).value='all');
    $('catalogSlots').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.slot==='all'));
    render();
  };
  $('catalogResults').addEventListener('click',e=>{
    const b=e.target.closest('button[data-action]');if(b)openDetail(b.dataset.action,Number(b.dataset.id));
  });
  $('catalogDialogClose').onclick=()=>$('catalogDialog').close();
  $('catalogDialog').onclick=e=>{if(e.target===$('catalogDialog'))$('catalogDialog').close()};
  $('catalogDialogContent').addEventListener('click',e=>{
    const b=e.target.closest('#catalogToggleSelected');if(!b)return;
    if(selected.has(b.dataset.key))selected.delete(b.dataset.key);else selected.add(b.dataset.key);
    localStorage.setItem(progressKey,JSON.stringify([...selected]));
    b.textContent=selected.has(b.dataset.key)?'取消勾選':'✓ 標記已收藏';
    render();
  });
  document.addEventListener('starro-config-applied',render);
  window.addEventListener('storage',e=>{if(e.key===progressKey){selected=loadSaved();render()}});
  const params=new URLSearchParams(location.search);
  if(params.get('tab')==='gacha')state.tab='gacha';
  if(params.get('q')){state.query=params.get('q');$('catalogSearch').value=state.query}
  render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();