/* Shared simulator calculation rules: preserve existing slot and effect semantics. */
(function(root){
'use strict';
const ALIAS={
 "Int":"INT","Str":"STR","Agi":"AGI","Vit":"VIT","Dex":"DEX","Luk":"LUK",
 "Cri":"CRI","C.Rate":"C.RATE","C.rate":"C.RATE","Pow":"POW","Spl":"SPL","Con":"CON","Crt":"CRT",
 "P.Atk":"P.ATK","P.atk":"P.ATK","PATK":"P.ATK","S.Matk":"S.MATK","S.matk":"S.MATK","SMATK":"S.MATK","/S.MATK":"S.MATK",
 "MaxHP":"MHP","MaxSP":"MSP","AllState":"ALL","暴擊傷害":"爆擊傷害","爆擊傷害":"爆擊傷害","全屬性魔法攻擊傷害":"全屬性魔法傷害","全屬性魔法傷害":"全屬性魔法傷害","遠距離物理攻擊力":"遠距離傷害","遠距離物理攻擊傷害":"遠距離傷害","遠距離物理傷害":"遠距離傷害","遠程物理傷害":"遠距離傷害","遠距離攻擊傷害":"遠距離傷害","遠距離物理攻擊":"遠距離傷害","近/遠距離物理攻擊傷害":"近/遠距離傷害","近/遠距離物理傷害":"近/遠距離傷害","遠/近距離物理攻擊傷害":"近/遠距離傷害","遠/近距離物理傷害":"近/遠距離傷害","近/遠距離傷害":"近/遠距離傷害","近/遠距離物理攻擊力":"近/遠距離傷害","近距離與遠距離物理攻擊力":"近/遠距離傷害","近距離與遠距離的物理傷害":"近/遠距離傷害",
 "全技能終傷":"技能終傷","所有技能終傷":"技能終傷"
};
const CONDITIONAL=["每","當","時","機率","精煉","Base","base","基礎","習得","裝備一件","達到","以上","以下","依照","根據"];
function normalizeLabel(label){
  label=label.trim().replace(/^[且並和及同時]+/,"").replace(/^(增加|提升|減少)/,"").trim();
  return ALIAS[label]||label;
}
function addStat(map,label,val,isPct){
  label=normalizeLabel(label);
  if(!label || label.length>55)return;
  // Known combined stats: one written bonus applies to both.
  const combo={
    "ATK/MATK":["ATK","MATK"],
    "P.ATK/S.MATK":["P.ATK","S.MATK"],
    "P.Atk/S.M.Atk":["P.ATK","S.MATK"],
    "RES/MRES":["RES","MRES"],
    "近/遠距離傷害":["近距離傷害","遠距離傷害"]
  };
  const labels=combo[label]||[label];
  for(const l0 of labels){
    const l=normalizeLabel(l0);
    const k=l+(isPct?"%":"");
    map.set(k,(map.get(k)||0)+val);
  }
}
function parseDirect(effect){
  const map=new Map(), conditions=[];
  const text=effect.replaceAll("＋","+").replaceAll("－","-").replaceAll("﹑","、");
  const clauses=text.split(/[，。；;]/).map(x=>x.trim()).filter(Boolean);
  for(const clause of clauses){
    if(CONDITIONAL.some(w=>clause.includes(w))){
      conditions.push(clause);
      continue;
    }
    // Split only where each fragment is often an independent stat.
    const parts=clause.split("、");
    let found=false;
    for(const part of parts){
      const rx=/(.{1,55}?)\s*([+-])\s*(\d+(?:\.\d+)?)\s*(%)?/g;
      let m;
      while((m=rx.exec(part))){
        let label=m[1].trim();
        // If previous value text leaked into label, take tail after punctuation.
        label=label.split(/[：:]/).pop().trim();
        const val=(m[2]==="-"?-1:1)*Number(m[3]);
        addStat(map,label,val,!!m[4]);
        found=true;
      }
    }
    if(!found) conditions.push(clause);
  }
  return {map,conditions};
}
function slotItemKey(name){
  return String(name||"")
    .normalize("NFKC")
    .replace(/\s+/g," ")
    .trim()
    .toLowerCase();
}
const keyOf=it=>(it.group==='JRO收藏'?'特殊收藏':it.group)+'|'+it.row+'|'+it.name;
function calculate(items,selected){
 const picked=(items||[]).filter(it=>selected.has(keyOf(it)));
 const totals=new Map(),conditions=[];
 const slots={normal:{items:new Set(),raw:0,hidden:0},special:{items:new Set(),raw:0,hidden:0}};
 for(const it of picked){
   const p=parseDirect(String(it.effect||''));
   for(const [k,v] of p.map)totals.set(k,(totals.get(k)||0)+v);
   if(p.conditions.length)conditions.push({name:it.name,effects:p.conditions.join('；')});
   const group=it.group==='普通收藏'?slots.normal:['特殊收藏','JRO收藏'].includes(it.group)?slots.special:null;
   if(!group)continue;
   const count=Math.max(0,Number(it.slot)||0),req=(it.required||[]).filter(x=>String(x||'').trim());
   group.raw+=count;
   for(const name of req)group.items.add(slotItemKey(name));
   group.hidden+=Math.max(0,count-req.length);
 }
 const normal=slots.normal.items.size+slots.normal.hidden,special=slots.special.items.size+slots.special.hidden;
 const saved=Math.max(0,slots.normal.raw+slots.special.raw-normal-special);
 const order=['STR','AGI','VIT','INT','DEX','LUK','ALL','POW','STA','WIS','SPL','CON','CRT','ATK','ATK%','MATK','MATK%','P.ATK','S.MATK','CRI','C.RATE','MHP','MHP%','MSP','MSP%','ASPD','ASPD%','HIT','FLEE','DEF','MDEF','爆擊傷害%','遠距離傷害%','近距離傷害%','技能終傷%','技能後延遲%'];
 const entries=[...totals.entries()].filter(([,v])=>Math.abs(v)>1e-9).sort((a,b)=>{
   const ai=order.indexOf(a[0]),bi=order.indexOf(b[0]);
   return ai>=0||bi>=0?(ai<0?999:ai)-(bi<0?999:bi):a[0].localeCompare(b[0],'zh-Hant');
 });
 return {count:picked.length,total:items.length,normal,special,saved,entries,conditions};
}
root.StarroCollectionSimulation=Object.freeze({calculate,parseDirect,slotItemKey});
if(typeof module!=='undefined'&&module.exports)module.exports=root.StarroCollectionSimulation;
})(typeof window==='undefined'?globalThis:window);
