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
const eqName=s=>window.StarroReferenceLookup.itemKey(s);
const autoRefByName=(()=>{
  const entries=Object.entries(window.StarroReferenceItems||{});
  const normalized=new Map();
  for(const [name,info] of entries)if(!normalized.has(eqName(name)))normalized.set(eqName(name),info);
  return normalized;
})();
const equipDetail=name=>{
  const supplemental=window.StarroReferenceLookup?.details(name)||{};
  const auto=window.StarroReferenceItems||{};
  const imported=auto[name]||autoRefByName.get(eqName(name))||{};
  const allManual=catalog().equipmentDetails||{};
  const manual=allManual[name]||Object.entries(allManual).find(([n])=>eqName(n)===eqName(name))?.[1]||{};
  const info=window.StarroReferenceLookup.merge(name,imported,manual);
  return {...info,officialEffect:info.effectRecord||null};
};
const imageHtml=(src,icon='🎁')=>{
  const url=safeImage(src);
  return '<div class="catalog-cover">'+(url?'<img loading="lazy" decoding="async" referrerpolicy="no-referrer" data-fallback-icon="'+esc(icon)+'" src="'+esc(url)+'" alt="">':icon)+'</div>';
};
const state={tab:'all',view:'items',page:1,pageSize:36,slots:[],query:'',groups:[],progress:'all',gachaTypes:[]};
const slots=['全部','頭上','頭中','頭下','鎧甲','武器','盾牌','披肩','鞋子','飾品','影子裝備','卡片','其他'];
const normalizeSavedKey=k=>typeof k==='string'?k.replace(/^JRO收藏\|/,'特殊收藏|'):'';
const keyOf=it=>(it.group==='JRO收藏'?'特殊收藏':it.group)+'|'+it.row+'|'+it.name;
const progressKey='starro_collection_selected';
function loadSaved(){try{const v=JSON.parse(localStorage.getItem(progressKey)||'[]');return new Set(Array.isArray(v)?v.map(normalizeSavedKey).filter(Boolean):[])}catch(e){return new Set()}}
let selected=loadSaved();
function catalog(){return window.StarroConfig?.get('features.catalog',{})||{}}
function allCollections(){
  const custom=Array.isArray(catalog().items)?catalog().items:[];
  const base=typeof ITEMS!=='undefined'?ITEMS:[];
  const existing=new Set(base.map(keyOf));
  return base.concat(custom.filter(x=>x&&typeof x.name==='string'&&!existing.has(keyOf(x))).map((x,i)=>({
    ...x,group:x.group==='JRO收藏'?'特殊收藏':(x.group||'自訂收藏'),row:x.row||900000+i,slot:Number(x.slot)||0,required:Array.isArray(x.required)?x.required:[]
  })));
}
function pools(){
  return (Array.isArray(catalog().gachaPools)?catalog().gachaPools:[]).filter(p=>p&&p.name&&Array.isArray(p.items));
}
function imageFor(name,explicit=''){
  const images=catalog().images||{};
  const known=typeof JRO_MVP_ENCHANTS!=='undefined'
    ? JRO_MVP_ENCHANTS.find(x=>x.name===name)?.icon||'' : '';
  const url=images[name]||explicit||known;
  return safeImage(url);
}
let collectionCovers=new Map();
function collectionImage(item){
  return collectionCovers.get(window.StarroReferenceLookup.collectionKey(item))||'';
}
let cachedEquipmentEntries=null;
function equipmentEntries(){
  if(cachedEquipmentEntries)return cachedEquipmentEntries;
  const m=new Map();
  const all=allCollections();
  for(const col of all)for(const requirement of (col.required||[])){
    const name=clean(requirement).replace(/\s*[×x*]\s*\d+(?:\.\d+)?$/i,'');
    if(!name)continue;
    const key=eqName(name);
    if(!m.has(key))m.set(key,{name,collections:[],sources:[]});
    const entry=m.get(key);
    if(!entry.collections.some(x=>keyOf(x)===keyOf(col)))entry.collections.push(col);
  }
  // Reference encyclopedia items remain searchable even when no collection uses them.
  const refItems=window.StarroReferenceIndex?.items||{};
  for(const item of Object.values(refItems)){
    if(!item||!item.name)continue;
    const key=eqName(item.name);
    if(!m.has(key))m.set(key,{name:item.name,collections:[],sources:[]});
  }
  for(const pool of pools())for(const item of pool.items||[]){
    const key=eqName(item.name);
    if(!m.has(key))m.set(key,{name:item.name,collections:[],sources:[]});
    m.get(key).sources.push({pool:pool.name,type:pool.type||'其他',rate:item.rate||'',image:item.image||''});
  }
  return cachedEquipmentEntries=[...m.values()].sort((a,b)=>b.collections.length-a.collections.length||a.name.localeCompare(b.name,'zh-Hant'));
}
function equipmentFilters(item){
  if(!inSlot(item.name+' '+(equipDetail(item.name).type||'')))return false;
  const q=normalize(state.query);
  const meta=equipDetail(item.name);
  return !q||normalize([item.name,meta.type,meta.itemId,meta.description,meta.stats,meta.alias,...(meta.sources||[]),...item.collections.map(c=>c.name),...item.sources.map(s=>s.pool)].join(' ')).includes(q);
}
function relatedCollectionHtml(items){
  return items.length?'<div class="catalog-related">'+items.slice(0,80).map(x=>
    '<button type="button" class="catalog-related__item" data-collection-key="'+esc(keyOf(x))+'"><span class="catalog-related__mark">📚</span><span><b>'+esc(x.name)+'</b><small>'+esc(x.effect||'')+'</small></span></button>').join('')+'</div>':
    '<p class="catalog-notpicked">目前沒有找到使用此裝備的收藏</p>';
}
function equipmentDetailHtml(item){
  const info=equipDetail(item.name),src=imageFor(item.name,info.image||item.sources[0]?.image);
  const rows=[['裝備分類',info.type||'未登錄'],['裝備編號',info.itemId||'尚未提供'],['裝備描述',info.description||'尚未登錄裝備描述'],
    ['能力／效果',window.StarroReferenceLookup.ability(info)],['基本資料',info.stats||'尚未提供']];
  if(info.socketNote)rows.push(['打洞說明',info.socketNote]);
  const ref=typeof info.referenceUrl==='string'&&/^https:\/\//i.test(info.referenceUrl)?info.referenceUrl:'';
  const sourceSite=typeof info.referenceSite==='string'&&/^https:\/\//i.test(info.referenceSite)?info.referenceSite:'';
  const online=window.StarroOnlineLookup?.render(item.name,info.itemId,ref||sourceSite)||'';
  return detailHeader(item.name,src,'equipment')+

    '<div class="catalog-detail-section"><h3>裝備詳細資料</h3><dl class="catalog-equipment-meta">'+
    rows.map(([a,b])=>'<div><dt>'+esc(a)+'</dt><dd>'+esc(b)+'</dd></div>').join('')+'</dl></div>'+online+
    '<div class="catalog-detail-section"><h3>被哪些收藏需要？（'+item.collections.length+'）</h3>'+relatedCollectionHtml(item.collections)+'</div>'+
    detailSection('已登錄取得來源',registeredSources(item.name).length?registeredSources(item.name):['尚未登錄取得方式或轉蛋來源，不代表沒有其他取得途徑'])+
    '';
}
function collectionEquipmentHtml(items){
  return items.length?'<div class="catalog-equipment-list">'+items.map(name=>{
    const match=equipmentEntries().find(x=>eqName(x.name)===eqName(name));
    const related=match?.collections.length||0;
    return '<button type="button" class="catalog-equipment-row" data-equipment-name="'+esc(name)+'">'+
      imageHtml(imageFor(name,equipDetail(name).image),'🛡️')+
      '<span><b>'+esc(name)+'</b><small>其他相關收藏 '+Math.max(0,related-1)+' 項'+(match?.sources.length?' · 轉蛋來源 '+match.sources.length+' 筆':'')+'</small></span><span aria-hidden="true">›</span></button>'
  }).join('')+'</div>':'<p class="catalog-notpicked">沒有需求裝備資料</p>';
}
function inSlot(text){
  if(!state.slots.length)return true;
  const s=clean(text);
  return state.slots.some(slot=>slot==='其他'
    ? !slots.slice(1,-1).some(x=>s.includes(x))
    : s.includes(slot));
}
function collectionSource(item){
  const req=(item.required||[]).map(eqName);
  const requirements=item.required||[];
  const enrich=window.StarroEquipmentEnrichment;
  const out=[];
  for(const pool of pools()){
    for(const drop of pool.items){
      if(req.includes(eqName(drop.name))){
        out.push({pool:pool.name,type:pool.type||'其他',drop,ltDerived:false});
      }else if(enrich&&requirements.some(raw=>enrich.matchesBase(raw,drop.name))){
        out.push({pool:pool.name,type:pool.type||'其他',drop,ltDerived:true});
      }
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
  if(state.tab==='special' ? !['特殊收藏','JRO收藏'].includes(item.group) : state.groups.length&&!state.groups.includes(item.group))return false;
  const chosen=selected.has(keyOf(item));
  if(state.progress==='saved'&&!chosen)return false;
  if(state.progress==='unsaved'&&chosen)return false;
  if(!inSlot((item.required||[]).join(' ')+' '+item.game+' '+item.name))return false;
  const q=normalize(state.query);
  return !q||normalize([item.name,item.effect,item.game,item.dc,...(item.required||[]),typeof JRO_NAME_PREFIX!=='undefined'?(JRO_NAME_PREFIX[keyOf(item)]||''):''].join(' ')).includes(q);
}
function gachaFilters(p){
  if(state.gachaTypes.length&&!state.gachaTypes.includes(p.type||'其他'))return false;
  if(!inSlot([p.name,...(p.items||[]).map(x=>x.name)].join(' ')))return false;
  const q=normalize(state.query);
  return !q||normalize([p.name,p.id||'',p.type,...(p.items||[]).map(x=>x.name)].join(' ')).includes(q);
}
function itemFilters(it){
  const matchingSources=it.sources.filter(x=>!state.gachaTypes.length||state.gachaTypes.includes(x.type));
  if(!matchingSources.length)return false;
  if(!inSlot(it.name))return false;
  const q=normalize(state.query);
  return !q||normalize([it.name,...matchingSources.map(x=>x.pool)].join(' ')).includes(q);
}
function button(label,action,datum){
  return '<button type="button" data-action="'+esc(action)+'" data-id="'+esc(datum)+'">'+esc(label)+'</button>';
}
// LT conversion only inherits actual GACHA entries of the exact same original
// item; the original's equipment EFFECTS are never copied onto the LT item.
function ltInheritedGacha(name){
 const enrich=window.StarroEquipmentEnrichment;
 if(!enrich?.isLT(name))return null;
 const refs=window.StarroReferenceItems||{};
 const manuals=catalog().equipmentDetails||{};
 const poolNames=pools().flatMap(p=>(p.items||[]).map(x=>x.name));
 const indexNames=Object.values(window.StarroReferenceIndex?.items||{}).map(item=>item.name).filter(Boolean);
 const base=enrich.findBase(name,[...Object.keys(refs),...Object.keys(manuals),...indexNames,...poolNames]);
 if(!base)return null;
 const baseDetail=equipDetail(base);
 const direct=baseDetail.sources.filter(enrich.isGachaSource);
 const related=equipmentEntries().find(x=>eqName(x.name)===eqName(base));
 const gacha=(related?.sources||[]).map(x=>x.pool+(x.rate?'（'+x.rate+'）':''));
 const sources=window.StarroReferenceLookup.dedupeSources([...direct,...gacha].filter(enrich.isGachaSource));
 return sources.length?{base,sources}:null;
}
function registeredSources(name){
 const detail=equipDetail(name);
 const explicit=[detail.source,detail.sources,detail.obtain,detail.obtainFrom].flat().filter(x=>typeof x==='string'&&x.trim());
 const related=equipmentEntries().find(x=>eqName(x.name)===eqName(name));
 const gacha=related?.sources.map(x=>x.pool+(x.rate?'（'+x.rate+'）':''))||[];
 const inherited=ltInheritedGacha(name);
 const linked=inherited?.sources.map(source=>'非LT原版「'+inherited.base+'」｜'+source+'（取得後需改造升級為 LT）')||[];
 return window.StarroReferenceLookup.dedupeSources([...explicit,...gacha,...linked]);
}
function selectedRequiredPanel(item){
 const required=item.required||[];
 return '<div class="catalog-selected-sources"><b>📍 所需道具與已登錄來源</b>'+
 (required.length?required.map(raw=>{
   const name=clean(raw).replace(/\s*[×x*]\s*\d+(?:\.\d+)?$/i,'');
   const sources=registeredSources(name),derived=ltInheritedGacha(name);
   return '<div class="catalog-source-line"><button type="button" data-equipment-name="'+esc(name)+'">'+imageHtml(imageFor(name,equipDetail(name).image),'🛡️')+'<span>'+esc(raw)+'</span> <span aria-hidden="true">›</span></button>'+
   '<small>'+esc(sources.length?sources.slice(0,3).join('、'):'尚未登錄取得來源')+'</small>'+
   (derived?'<small class="starro-lt-note">⚒ '+esc(window.StarroEquipmentEnrichment.conversionNote)+'</small>':'')+'</div>';
 }).join(''):'<p>此收藏尚無需求道具資料</p>')+'</div>';
}

function renderCollectionCard(item,i){
  const k=keyOf(item),has=selected.has(k),sourceCount=collectionSource(item).length;
  return '<article class="catalog-card"><div class="catalog-card__top">'+imageHtml(collectionImage(item),'')+
    '<div class="catalog-card__name">'+esc(item.name)+'</div></div><div class="catalog-card__body">'+
    '<div class="catalog-card__effect">'+esc(item.effect||'尚無效果說明')+'</div><div class="catalog-card__meta">'+
    '<span class="catalog-chip">'+esc(item.group||'自訂收藏')+'</span><span class="catalog-chip">佔格 '+esc(item.slot||0)+'</span>'+
    (sourceCount?'<span class="catalog-chip">'+sourceCount+' 筆轉蛋關聯</span>':'')+
    '</div>'+(has?selectedRequiredPanel(item):'')+'</div><div class="catalog-card__bottom">'+
    '<label class="catalog-pick"><input type="checkbox" data-pick-key="'+esc(k)+'" '+(has?'checked':'')+'><span>'+(has?'已收藏':'勾選收藏')+'</span></label>'+
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
function renderEquipmentCard(item,i){
  const info=equipDetail(item.name);
  return '<article class="catalog-card catalog-card--equipment"><div class="catalog-card__top">'+
    imageHtml(imageFor(item.name,info.image||item.sources[0]?.image),'🛡️')+
    '<div class="catalog-card__name">'+esc(item.name)+'</div></div>'+
    '<div class="catalog-card__body"><div class="catalog-card__effect">'+
    esc(info.description||info.stats||'查看裝備詳細資料及收藏來源')+'</div><div class="catalog-card__meta">'+
    '<span class="catalog-chip">'+item.collections.length+' 項收藏需求</span>'+
    (item.sources.length?'<span class="catalog-chip">'+item.sources.length+' 筆轉蛋來源</span>':'')+'</div></div>'+
    '<div class="catalog-card__bottom"><span class="catalog-notpicked">'+esc(info.type||'裝備／卡片')+'</span>'+
    button('裝備詳情','equipment',String(i))+'</div></article>';
}
let rendered=[];
function unifiedResults(collections,allPools){
  const collectionsFound=collections.filter(collectionFilters);
  const equipmentFound=equipmentEntries().filter(equipmentFilters);
  const poolsFound=allPools.filter(gachaFilters);
  const dropsFound=allItems().filter(itemFilters);
  // With no search term, the collection list is the primary browsing view.
  // When searching, merge all matching categories without forcing a tab switch.
  const q=normalize(state.query);
  const entries=q
    ? [
        ...collectionsFound.map(entry=>({kind:'collection',entry})),
        ...equipmentFound.map(entry=>({kind:'equipment',entry})),
        ...dropsFound.map(entry=>({kind:'drop',entry})),
        ...poolsFound.map(entry=>({kind:'pool',entry}))
      ]
    : collectionsFound.map(entry=>({kind:'collection',entry}));
  return {entries,counts:{collection:collectionsFound.length,equipment:equipmentFound.length,
    gacha:dropsFound.length+poolsFound.length},pools:poolsFound,drops:dropsFound};
}
const fmt=v=>Number.isInteger(v)?String(v):String(Math.round(v*10000)/10000);
const CHAR_CALC_KEY="starro_collection_charcalc_v158";
const CHAR_BASIC=["STR","AGI","VIT","INT","DEX","LUK"];
const CHAR_TRAIT=["POW","STA","WIS","SPL","CON","CRT"];
const CHAR_COMBAT=["ATK","MATK","P.ATK","S.MATK","CRI","C.RATE","HIT","FLEE","DEF","MDEF","MHP","MSP","ASPD"];
const CHAR_PCT=[
  ["ATK%","ATK %"],["MATK%","MATK %"],["MHP%","MHP %"],["MSP%","MSP %"],
  ["爆擊傷害%","爆擊傷害 %"],["遠距離傷害%","遠距離傷害 %"],
  ["近距離傷害%","近距離傷害 %"],["技能終傷%","技能終傷 %"],["技能後延遲%","技能後延遲 %"]
];
let charCalcInput={level:275};
try{
  const x=JSON.parse(localStorage.getItem(CHAR_CALC_KEY)||"{}");
  if(x&&typeof x==="object") charCalcInput=x;
}catch(e){}
if(!Number.isFinite(Number(charCalcInput.level))) charCalcInput.level=275;


function normalStatAvailable(level){
  level=Math.max(1,Math.min(275,Math.floor(Number(level)||275)));
  // 轉生角色 Lv1 起始 100 點；200 後一般素質點不再增加。
  let pts=100;
  const cap=Math.min(level,200);
  for(let x=1;x<cap;x++){
    if(x<100) pts+=Math.floor(x/5)+3;
    else if(x<=150) pts+=Math.floor(x/10)+13;
    else pts+=Math.floor((x-150)/7)+28;
  }
  return pts;
}

function normalStatCostTo(target){
  let v=Math.max(1,Math.min(130,Math.floor(Number(target)||1)));
  let cost=0;
  for(let low=1;low<v;low++){
    if(low<100) cost+=2+Math.floor((low-1)/10);
    else cost+=16+4*Math.floor((low-100)/5);
  }
  return cost;
}

function traitAvailable(level){
  level=Math.max(1,Math.min(275,Math.floor(Number(level)||275)));
  if(level<200) return 0;
  const gainedLevels=level-200;
  return 7 + gainedLevels*3 + Math.floor(gainedLevels/5)*4;
}

function basicStatInputValue(key){
  const raw=charCalcInput[key];
  if(raw===undefined || raw===null || raw==="") return 1;
  return Math.max(1,Math.min(130,Math.floor(Number(raw)||1)));
}

function traitStatInputValue(key){
  const raw=charCalcInput[key];
  if(raw===undefined || raw===null || raw==="") return 0;
  return Math.max(0,Math.min(110,Math.floor(Number(raw)||0)));
}

function renderStatPointSummary(){
  const level=Math.max(1,Math.min(275,Math.floor(Number(charCalcInput.level)||275)));
  const basicAvail=normalStatAvailable(level);
  const basicUsed=CHAR_BASIC.reduce((s,k)=>s+normalStatCostTo(basicStatInputValue(k)),0);
  const basicRemain=basicAvail-basicUsed;

  const traitAvail=traitAvailable(level);
  const traitUsed=CHAR_TRAIT.reduce((s,k)=>s+traitStatInputValue(k),0);
  const traitRemain=traitAvail-traitUsed;

  const set=(id,val,bad=false)=>{
    const el=document.getElementById(id);
    if(!el)return;
    el.textContent=Number(val).toLocaleString();
    el.classList.toggle("badv",bad);
    el.classList.toggle("okv",!bad && id.includes("Remain"));
  };
  set("charBasicAvailable",basicAvail);
  set("charBasicUsed",basicUsed);
  set("charBasicRemain",basicRemain,basicRemain<0);
  set("charTraitAvailable",traitAvail);
  set("charTraitUsed",traitUsed);
  set("charTraitRemain",traitRemain,traitRemain<0);

  const lv=document.getElementById("charCalcLevel");
  if(lv && String(lv.value)!==String(level)) lv.value=level;
}

function saveCharCalc(){
  try{localStorage.setItem(CHAR_CALC_KEY,JSON.stringify(charCalcInput));}catch(e){}
}

function getSelectedCollectionStatMap(){return new Map(window.StarroCollectionSimulation.calculate(allCollections(),selected).entries);}

function collectionStatBonus(key,map){
  let v=Number(map.get(key)||0);

  // All / AllState 套用至六大基本素質
  if(CHAR_BASIC.includes(key)){
    v+=Number(map.get("ALL")||0);
    v+=Number(map.get("All")||0);
    v+=Number(map.get("全能力")||0);
  }

  // 全特殊屬性、四轉特殊屬性套用至 POW~CRT
  if(CHAR_TRAIT.includes(key)){
    v+=Number(map.get("全特殊屬性")||0);
    v+=Number(map.get("四轉特殊屬性")||0);
  }
  return v;
}

function charNumber(key){
  const n=Number(charCalcInput[key]);
  return Number.isFinite(n)?n:0;
}

function charRow(key,label,map,isPct=false){
  const add=collectionStatBonus(key,map);
  let base=charNumber(key);
  let inputValue=charCalcInput[key];

  if(CHAR_BASIC.includes(key)){
    base=basicStatInputValue(key);
    if(inputValue===undefined || inputValue===null || inputValue==="") inputValue=1;
  }else if(CHAR_TRAIT.includes(key)){
    base=traitStatInputValue(key);
    if(inputValue===undefined || inputValue===null || inputValue==="") inputValue=0;
  }else{
    if(inputValue===undefined || inputValue===null || inputValue==="") inputValue=0;
  }

  const total=base+add;
  const addTxt=(add>0?"+":"")+fmt(add)+(isPct?"%":"");
  const totalTxt=fmt(total)+(isPct?"%":"");
  return `<div class="charcalc-row">
    <span class="cc-label">${esc(label)}</span>
    <input class="charcalc-input" data-char-key="${esc(key)}" type="number" step="${CHAR_BASIC.includes(key)||CHAR_TRAIT.includes(key)?1:0.1}" value="${esc(inputValue)}">
    <span class="cc-add">${addTxt}</span>
    <span class="cc-total">${totalTxt}</span>
  </div>`;
}

function renderCharacterCalculator(){
  const map=getSelectedCollectionStatMap();
  const basic=$("charCalcBasic"),trait=$("charCalcTrait"),combat=$("charCalcCombat"),pct=$("charCalcPct");
  if(!basic||!trait||!combat||!pct) return;

  basic.innerHTML=CHAR_BASIC.map(k=>charRow(k,k,map,false)).join("");
  trait.innerHTML=CHAR_TRAIT.map(k=>charRow(k,k,map,false)).join("");
  combat.innerHTML=CHAR_COMBAT.map(k=>charRow(k,k,map,false)).join("");
  pct.innerHTML=CHAR_PCT.map(([k,label])=>charRow(k,label,map,true)).join("");

  document.querySelectorAll(".charcalc-input").forEach(inp=>{
    inp.addEventListener("input",()=>{
      const key=inp.dataset.charKey;
      charCalcInput[key]=inp.value;
      saveCharCalc();
      renderCharacterCalculator();
    });
  });

  renderStatPointSummary();
}


const missingKey='starro_collection_missing_required_v147';
function missingSet(){try{return new Set(JSON.parse(localStorage.getItem(missingKey)||'[]'))}catch(e){return new Set()}}
function renderRequiredSummary(collections){
  const counts=new Map(),missing=missingSet();
  for(const it of collections)if(selected.has(keyOf(it)))for(const raw of it.required||[]){
    const s=String(raw||'').trim();if(!s)continue;
    const m=s.match(/^(.*?)(?:\s*(?:×|x|X|\*)\s*(\d+(?:\.\d+)?))$/);
    const name=(m?m[1]:s).trim(),qty=m?Number(m[2])||1:1;
    counts.set(name,(counts.get(name)||0)+qty);
  }
  const rows=[...counts].sort((a,b)=>a[0].localeCompare(b[0],'zh-Hant')),lack=rows.filter(([n])=>missing.has(n));
  $('simRequiredCount').textContent='（'+rows.length+' 種）';$('simMissingCount').textContent='（'+lack.length+' 種）';
  $('simRequiredList').innerHTML=rows.length?rows.map(([n,q])=>'<label><input type="checkbox" data-missing-name="'+esc(n)+'" '+(!missing.has(n)?'checked':'')+'><span>'+esc(n)+'</span><b>× '+esc(q)+'</b></label>').join(''):'<p>尚未勾選收藏</p>';
  $('simMissingList').innerHTML=lack.length?lack.map(([n,q])=>'<div><span>'+esc(n)+'</span><b>× '+esc(q)+'</b></div>').join(''):'<p>目前沒有標記缺少的道具</p>';
}
window.StarroCollectionProgressAdapter={keys:()=>new Set(allCollections().map(keyOf)),snapshot:()=>[...selected],apply:values=>{selected=new Set(values);render();}};
const SIM_CAP_KEY='starro_collection_gallery_caps';
function renderSimulation(collections){
  const sim=window.StarroCollectionSimulation.calculate(collections,selected);
  const fmt=n=>Number(n).toLocaleString('zh-TW',{maximumFractionDigits:4});
  const cap=id=>Math.max(0,Math.floor(Number($(id).value)||0));
  const n=cap('simNormalCap'),s=cap('simSpecialCap');
  for(const [id,value] of Object.entries({simTotal:fmt(sim.total),simSelected:fmt(sim.count),simNormal:fmt(sim.normal)+' / '+fmt(n),simSpecial:fmt(sim.special)+' / '+fmt(s),simSaved:fmt(sim.saved)}))$(id).textContent=value;
  $('simNormal').classList.toggle('over-cap',sim.normal>n);$('simSpecial').classList.toggle('over-cap',sim.special>s);
  $('simEffectCount').textContent='（'+sim.entries.length+' 項）';$('simConditionCount').textContent='（'+sim.conditions.length+' 組）';
  $('simStats').innerHTML=sim.entries.length?sim.entries.map(([k,v])=>'<div class="catalog-sim-stat"><span>'+esc(k.replace(/%$/,''))+'</span><b>'+(v>0?'+':'')+esc(fmt(v))+(k.endsWith('%')?'%':'')+'</b></div>').join(''):'<div class="catalog-sim-empty">勾選收藏後會顯示總能力</div>';
  $('simConditions').innerHTML=sim.conditions.length?sim.conditions.map(x=>'<div class="catalog-sim-condition"><b>'+esc(x.name)+'</b>'+esc(x.effects)+'</div>').join(''):'<div class="catalog-sim-empty">目前沒有條件式效果</div>';
}
function render(){
  cachedEquipmentEntries=null;
  const collections=allCollections(),allPools=pools();
  renderSimulation(collections);
  renderRequiredSummary(collections);
  renderCharacterCalculator();
  collectionCovers=window.StarroReferenceLookup.buildCollectionCovers(collections,catalog());
  $('catalogTotal').textContent=collections.length.toLocaleString('zh-TW');
  $('catalogPoolTotal').textContent=allPools.length.toLocaleString('zh-TW');
  const unified=state.tab==='all',gacha=state.tab==='gacha',equipment=state.tab==='equipment';
  const tabs={all:'catalogTabAll',collection:'catalogTabCollection',special:'catalogTabSpecial',equipment:'catalogTabEquipment',gacha:'catalogTabGacha'};
  for(const [key,id] of Object.entries(tabs)){
    $(id).classList.toggle('active',state.tab===key);
    $(id).setAttribute('aria-selected',String(state.tab===key));
  }
  $('catalogGachaMenu').hidden=!gacha;
  $('catalogGroupMenu').hidden=gacha||equipment||state.tab==='special';
  $('catalogProgress').hidden=gacha||equipment;
  $('catalogViewSwitch').hidden=!gacha;
  $('catalogViewSwitch').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
  const mixed=unifiedResults(collections,allPools);
  // In the unified view, the collection filters apply to collection matches only.
  // Equipment and gacha entries continue matching the same search term.
  $('catalogSearchSummary').innerHTML=unified
    ? '<span>一站搜尋：</span><b>收藏 '+mixed.counts.collection+'</b><b>裝備／卡片 '+mixed.counts.equipment+'</b><b>轉蛋來源／獎品 '+mixed.counts.gacha+'</b>'
    : '';
  let results;
  if(unified)results=mixed.entries;
  else if(equipment)results=equipmentEntries().filter(equipmentFilters);
  else if(!gacha)results=collections.filter(collectionFilters);
  else if(state.view==='pools')results=allPools.filter(gachaFilters);
  else results=allItems().filter(itemFilters);
  const totalPages=Math.max(1,Math.ceil(results.length/state.pageSize));
  state.page=Math.min(state.page,totalPages);
  const start=(state.page-1)*state.pageSize;
  rendered=results.slice(start,start+state.pageSize);
  const query=state.query.trim();
  const webSearch=$('catalogOnlineSearch');
  if(webSearch){
    webSearch.href=query?(window.StarroOnlineLookup?.search(query)?.search||'https://www.divine-pride.net/database/item'):'https://www.divine-pride.net/database/item';
    webSearch.textContent=query?'🌐 全網查詢「'+query.slice(0,26)+'」':'🌐 前往 RO 道具資料庫';
  }
  $('catalogStatus').textContent=(unified?'全部類型｜':'')+'符合條件 '+results.length.toLocaleString('zh-TW')+' 筆｜每頁 '+state.pageSize+' 筆';
  $('catalogPage').textContent='第 '+state.page+' / '+totalPages+' 頁';
  $('catalogPrev').disabled=state.page<=1;$('catalogNext').disabled=state.page>=totalPages;
  const card=(x,i)=>{
    const kind=unified?x.kind:(equipment?'equipment':gacha?(state.view==='pools'?'pool':'drop'):'collection');
    const entry=unified?x.entry:x;
    if(kind==='equipment')return renderEquipmentCard(entry,i);
    if(kind==='pool')return renderPoolCard(entry,i);
    if(kind==='drop')return renderItemCard(entry,i);
    return renderCollectionCard(entry,i);
  };
  $('catalogResults').innerHTML=rendered.length?rendered.map(card).join(''):
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
function groupedRequiredSources(req){
  const names=[...new Set(req.map(raw=>clean(raw).replace(/\s*[×x*]\s*\d+(?:\.\d+)?$/i,'')))];
  return '<div class="catalog-detail-section"><h3>需求道具的已知取得來源</h3>'+names.map(name=>{
    const derived=ltInheritedGacha(name);
    const rows=window.StarroReferenceLookup.dedupeSources(registeredSources(name));
    const socketNote=window.StarroReferenceLookup.socketNote(name);
    return '<section style="margin:14px 0;padding:14px;border:1px solid #b8c8d8;border-radius:10px;background:#f4f7fb;color:#24384c;overflow-wrap:anywhere"><h4 style="margin:0 0 8px;font-size:1.08rem;color:#173653">'+esc(name)+'</h4>'+
      (derived?'<p style="margin:0 0 8px;color:#42566b">原始道具：'+esc(derived.base)+'</p>':'')+
      (rows.length?'<ul style="margin:0;padding-left:1.3em;line-height:1.65">'+rows.map(s=>'<li style="margin:4px 0;color:#24384c">'+esc(s)+'</li>').join('')+'</ul>':'<p>尚未登錄取得來源</p>')+
      (socketNote?'<p style="margin:10px 0 0;color:#42566b">※ '+esc(socketNote)+'</p>':'')+
      (derived?'<p style="margin:10px 0 0;color:#42566b">※ 取得原始道具後，需改造升級為 LT。</p>':'')+'</section>';
  }).join('')+'</div>';
}
function openDetail(kind,i){
  const row=rendered[i];if(!row)return;
  const entry=state.tab==='all'?row.entry:row;
  if(state.tab==='all')kind=row.kind;
  let html='';
  if(kind==='collection'){
    const req=entry.required||[],sources=collectionSource(entry);
    const has=selected.has(keyOf(entry));
    html=detailHeader(entry.name,collectionImage(entry),'collection')+
      detailSection('收藏效果',[entry.effect||'尚無效果說明'])+
      '<div class="catalog-detail-section"><h3>所需裝備／卡片（點選可查詳細資料與其他收藏）</h3>'+collectionEquipmentHtml(req)+'</div>'+
      groupedRequiredSources(req)+

      '<div class="catalog-detail-section"><button class="catalog-detail-btn" type="button" id="catalogToggleSelected" data-key="'+esc(keyOf(entry))+'">'+(has?'取消勾選':'✓ 標記已收藏')+'</button></div>';
  }else if(kind==='equipment'){
    html=equipmentDetailHtml(entry);
  }else if(kind==='pool'){
    html=detailHeader(entry.name,imageFor(entry.name,entry.image),'gacha')+
      detailSection('轉蛋類型／編號',[entry.type||'其他',entry.id||'未提供編號'])+
      '<div class="catalog-detail-section"><h3>轉蛋獎品（點選可看圖片、來源與詳細內容）</h3><div class="catalog-equipment-list">'+
      entry.items.map(x=>'<button type="button" class="catalog-equipment-row" data-equipment-name="'+esc(x.name)+'">'+
        imageHtml(imageFor(x.name,equipDetail(x.name).image||x.image),'🛡️')+
        '<span><b>'+esc(x.name)+'</b><small>'+esc(x.rate||'尚無已確認機率')+'</small></span><span aria-hidden="true">›</span></button>').join('')+'</div></div>';
  }else{
    html=detailHeader(entry.name,imageFor(entry.name,entry.images[0]),'gacha')+
      detailSection('出現轉蛋及已登錄來源',registeredSources(entry.name));
    const detail=equipDetail(entry.name);
    if(detail&&Object.keys(detail).length){
      html+=detailSection('道具詳細資料',[detail.type&&'分類：'+detail.type,detail.itemId&&'編號：'+detail.itemId,detail.description,window.StarroReferenceLookup.ability(detail),detail.stats,detail.socketNote].filter(Boolean));
      const reference=typeof detail.referenceUrl==='string'&&/^https:\/\//i.test(detail.referenceUrl)?detail.referenceUrl:'';
      // Detail source links are consolidated into the final source footer.

      html+=window.StarroOnlineLookup?.render(entry.name,detail.itemId,detail.referenceUrl||detail.referenceSite)||'';
    }
    const related=allCollections().filter(x=>(x.required||[]).some(r=>eqName(r)===eqName(entry.name)));
    html+=detailSection('相關收藏',related.slice(0,30).map(x=>x.name));
    if(!html.includes('starro-online-lookup'))html+=window.StarroOnlineLookup?.render(entry.name,detail?.itemId,detail?.referenceUrl||detail?.referenceSite)||'';
  }
  const detailInfo=kind==='equipment'?equipDetail(entry.name):kind==='drop'?equipDetail(entry.name):null;
  html+=window.StarroEquipmentEnrichment?.sourceFooter(
    detailInfo?.officialEffect,
    detailInfo?.referenceUrl||detailInfo?.referenceSite||'',
    entry.name
  )||'';
  $('catalogDialogContent').innerHTML=html;
  const dialog=$('catalogDialog');
  if(!dialog.open)dialog.showModal();
}
function init(){
  $('simRequiredList').addEventListener('change',e=>{const t=e.target.closest('[data-missing-name]');if(!t)return;const m=missingSet();if(t.checked)m.delete(t.dataset.missingName);else m.add(t.dataset.missingName);try{localStorage.setItem(missingKey,JSON.stringify([...m]));}catch(e){}renderRequiredSummary(allCollections());});
  $('charCalcLevel').addEventListener('input',e=>{charCalcInput.level=e.target.value;saveCharCalc();renderCharacterCalculator();});
  $('charCalcReset').addEventListener('click',()=>{charCalcInput={level:275};saveCharCalc();renderCharacterCalculator();});
  try{const caps=JSON.parse(localStorage.getItem(SIM_CAP_KEY)||'{}');for(const id of ['simNormalCap','simSpecialCap'])if(Number.isFinite(caps[id]))$(id).value=id==='simSpecialCap'&&caps[id]===600?800:caps[id];}catch(e){}
  for(const id of ['simNormalCap','simSpecialCap'])$(id).addEventListener('input',()=>{
    try{localStorage.setItem(SIM_CAP_KEY,JSON.stringify({simNormalCap:Number($('simNormalCap').value),simSpecialCap:Number($('simSpecialCap').value)}));}catch(e){}
    renderSimulation(allCollections());
  });
  const slotChoices=slots.slice(1);
  $('catalogSlots').innerHTML=slotChoices.map(x=>'<label><input type="checkbox" value="'+esc(x)+'"> '+esc(x)+'</label>').join('');
  const syncLabels=()=>{
    $('catalogSlotLabel').textContent=state.slots.length
      ? '裝備分類：'+(state.slots.length<=2?state.slots.join('、'):'已選 '+state.slots.length+' 種')
      : '裝備分類：全部';
    $('catalogGachaLabel').textContent=state.gachaTypes.length
      ? '轉蛋分類：'+(state.gachaTypes.length<=2?state.gachaTypes.join('、'):'已選 '+state.gachaTypes.length+' 種')
      : '轉蛋分類：全部';
    $('catalogGroupLabel').textContent=state.groups.length
      ? '收藏分類：'+(state.groups.length<=2?state.groups.join('、'):'已選 '+state.groups.length+' 種')
      : '收藏分類：全部';
  };
  $('catalogSlots').addEventListener('change',()=>{
    state.slots=[...$('catalogSlots').querySelectorAll('input:checked')].map(x=>x.value);
    state.page=1;syncLabels();render();
  });
  $('catalogGroups').addEventListener('change',()=>{
    state.groups=[...$('catalogGroups').querySelectorAll('input:checked')].map(x=>x.value);
    state.page=1;syncLabels();render();
  });
  $('catalogGachaTypes').addEventListener('change',()=>{
    state.gachaTypes=[...$('catalogGachaTypes').querySelectorAll('input:checked')].map(x=>x.value);
    state.page=1;syncLabels();render();
  });
  document.addEventListener('click',event=>{
    for(const id of ['catalogGroupMenu','catalogSlotMenu','catalogGachaMenu']){
      const menu=$(id);
      if(menu.open&&!menu.contains(event.target))menu.open=false;
    }
  });
  syncLabels();
  $('catalogTabAll').onclick=()=>{state.tab='all';state.page=1;render()};
  $('catalogTabCollection').onclick=()=>{state.tab='collection';state.page=1;render()};
  $('catalogTabSpecial').onclick=()=>{state.tab='special';state.page=1;render()};
  $('catalogTabGacha').onclick=()=>{state.tab='gacha';state.page=1;render()};
  $('catalogTabEquipment').onclick=()=>{state.tab='equipment';state.page=1;render()};
  $('catalogViewSwitch').addEventListener('click',e=>{const b=e.target.closest('button[data-view]');if(b){state.view=b.dataset.view;state.page=1;render()}});
  $('catalogSearch').addEventListener('input',e=>{state.query=e.target.value;state.page=1;render()});
  for(const [id,key] of [['catalogProgress','progress']]){
    $(id).onchange=e=>{state[key]=e.target.value;state.page=1;render()};
  }
  $('catalogPrev').onclick=()=>{state.page--;render();window.scrollTo({top:250,behavior:'smooth'})};
  $('catalogNext').onclick=()=>{state.page++;render();window.scrollTo({top:250,behavior:'smooth'})};
  $('catalogReset').onclick=()=>{
    Object.assign(state,{query:'',groups:[],progress:'all',gachaTypes:[],slots:[],page:1});
    ['catalogSearch'].forEach(id=>$(id).value='');
    ['catalogProgress'].forEach(id=>$(id).value='all');
    document.querySelectorAll('#catalogSlots input,#catalogGroups input,#catalogGachaTypes input').forEach(x=>x.checked=false);
    syncLabels();
    render();
  };
  $('catalogResults').addEventListener('change',e=>{
    const pick=e.target.closest('input[data-pick-key]');if(!pick)return;
    if(pick.checked)selected.add(pick.dataset.pickKey);else selected.delete(pick.dataset.pickKey);
    localStorage.setItem(progressKey,JSON.stringify([...selected]));
    window.StarroCollectionCloud?.scheduleSave();
    render();
  });
  $('catalogResults').addEventListener('click',e=>{
    const itemButton=e.target.closest('button[data-equipment-name]');
    if(itemButton){
      const item=equipmentEntries().find(x=>eqName(x.name)===eqName(itemButton.dataset.equipmentName));
      const fallback=item||{name:itemButton.dataset.equipmentName,collections:[],sources:[]};
      $('catalogDialogContent').innerHTML=equipmentDetailHtml({...fallback,name:itemButton.dataset.equipmentName});
      $('catalogDialog').showModal();
      return;
    }
    const b=e.target.closest('button[data-action]');if(b)openDetail(b.dataset.action,Number(b.dataset.id));
  });
  $('catalogDialogClose').onclick=()=>$('catalogDialog').close();
  $('catalogDialog').onclick=e=>{if(e.target===$('catalogDialog'))$('catalogDialog').close()};
  document.addEventListener('error',e=>{
    const img=e.target;
    if(!(img instanceof HTMLImageElement)||!img.matches('.catalog-cover img'))return;
    const cover=img.parentElement;if(!cover)return;
    cover.textContent=img.dataset.fallbackIcon||'🛡️';
    cover.setAttribute('aria-label','暫無可用圖片');
  },true);
  $('catalogDialogContent').addEventListener('click',e=>{
    const itemBtn=e.target.closest('[data-equipment-name]');
    if(itemBtn){
      const item=equipmentEntries().find(x=>eqName(x.name)===eqName(itemBtn.dataset.equipmentName));
      if(item)$('catalogDialogContent').innerHTML=equipmentDetailHtml(item);
      return;
    }
    const relatedBtn=e.target.closest('[data-collection-key]');
    if(relatedBtn){
      const item=allCollections().find(x=>keyOf(x)===relatedBtn.dataset.collectionKey);
      if(item)$('catalogDialogContent').innerHTML=detailHeader(item.name,collectionImage(item),'collection')+
        detailSection('收藏效果',[item.effect||''])+
        '<div class="catalog-detail-section"><h3>需求裝備</h3>'+collectionEquipmentHtml(item.required||[])+'</div>';
      return;
    }
    const b=e.target.closest('#catalogToggleSelected');if(!b)return;
    if(selected.has(b.dataset.key))selected.delete(b.dataset.key);else selected.add(b.dataset.key);
    localStorage.setItem(progressKey,JSON.stringify([...selected]));
    window.StarroCollectionCloud?.scheduleSave();
    b.textContent=selected.has(b.dataset.key)?'取消勾選':'✓ 標記已收藏';
    render();
  });
  document.addEventListener('starro-config-applied',render);
  window.addEventListener('storage',e=>{if(e.key===progressKey){selected=loadSaved();render()}});
  const params=new URLSearchParams(location.search);
  if(params.get('tab')==='collection')state.tab='collection';
  if(params.get('tab')==='special')state.tab='special';
  if(params.get('tab')==='gacha')state.tab='gacha';
  if(params.get('tab')==='equipment')state.tab='equipment';
  if(params.get('q')){state.query=params.get('q');$('catalogSearch').value=state.query}
  render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();