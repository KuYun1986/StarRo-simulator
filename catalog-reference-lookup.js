/* StarRO encyclopedia is the primary source; external effects are reference only. */
(function(global){
 'use strict';
 const site='https://ro-collectitem-yuno.netlify.app/';
 const aliases={'機械鋁合金改造戰靴[1]':'470120'};
 const fallback={'470120':{type:'鞋子',stats:'防禦力：50；重量：150；裝備等級：100；防具等級：1；洞數：1；全職業',description:'機械鋁合金系列鞋子，具精煉加成及指定裝備、卡片套裝效果。',effect:'MDEF +10；每精煉 +2：STR +2；每 +3：MHP +2%；+7：ATK +7%；+9：固定詠唱 -0.5 秒；+11：全屬性對象物理傷害 +7%。\n加農改造器套裝：後延遲 -8%，兩種加農砲傷害 +20%，使用時有 3% 機率獲得 10 秒遠距物傷 +30%。\n艾昆妮華麗項鍊套裝：ATK +8%、後延遲 -8%；戰斧颶風或手推車龍捲風有 3% 機率觸發 10 秒近距物傷 +30%。\n廢鐵暖爐卡片套裝：ATK +50、中大型物傷減免 8%、鎧甲每 +3 近遠距物傷 +4%；商人系再加 ATK 80。\nRSX-0806 卡片套裝：ATK +100、中大型物傷減免 10%、鎧甲每 +2 近遠距物傷 +4%；商人系再加 ATK 120。',url:'https://ragnaplace.com/zh-t/ro/tw/item/470120/1'}};
 function canonical(name){
   return String(name||'').normalize('NFKC').replace(/\s*[×x*]\s*\d+(?:\.\d+)?$/i,'')
    .replace(/^\s*(?:(?:\+\d+|[A-DＳS]階|\([A-D]級\))\s*)+/i,'')
    .toLocaleLowerCase('zh-TW').replace(/[\s\u200b\ufeff]/g,'').replace(/[－–—]/g,'-');
 }
 function find(name){
   const index=global.StarroReferenceIndex;
   if(!index?.items||!index.byName)return null;
   const k=canonical(name);
   const id=index.byName[k]||aliases[k];
   return id?index.items[id]||null:null;
 }
 function details(name){
   const data=find(name);
   if(!data)return {};
   const gacha=Array.isArray(data.gacha)?data.gacha:[];
   const sources=[...new Set(gacha.filter(x=>x&&x.name).map(x=>x.name+(x.tier?'（'+x.tier+'獎）':'')))];
   return {itemId:data.itemId||'',type:data.type||'',alias:data.alias||'',image:data.image||'',stats:data.stats||'',description:data.description||'',effect:data.effect||'',
     sourceLabel:data.sourceLabel||'',sourceUrl:data.sourceUrl||'',referenceSite:global.StarroReferenceIndex.site||site,sources,gacha};
 }
 const nonempty=v=>v!=null&&(typeof v!=='string'||v.trim()!=='');
 function merge(name,imported={},manual={}){
   const primary=details(name),id=primary.itemId||manual.itemId||imported.itemId||'',ext=fallback[id];
   const out={};
   for(const row of [imported,primary,manual])for(const [k,v] of Object.entries(row))if(nonempty(v))out[k]=v;
   out.sources=[...new Set([...(primary.sources||[]),...(imported.sources||[]),...(manual.sources||[]),manual.source].filter(x=>typeof x==='string'&&x.trim()))];
   const abilityPattern=/(?:ATK|MATK|MHP|MSP|MaxHP|MaxSP|MDEF|STR|DEX|技能傷害|物理傷害|魔法傷害|技能後延遲|固定詠唱)\s*[+＋-－]|(?:傷害|抗性|暴擊|詠唱|延遲).*(?:[+＋-－]|增加|減少)/i;
   const existing=out.effect||(abilityPattern.test(out.stats||'')?out.stats:'');
   if(existing){out.effect=existing;if(existing===out.stats)out.stats='';out.effectRecord=null;}
   else if(ext){out.effect=ext.effect;out.effectRecord={url:ext.url,publisher:'RagnaPlace 台灣版道具資料',partial:true};}
   else {const record=global.StarroEquipmentEnrichment?.officialEffect(name);out.effect=record?.text||'';out.effectRecord=record||null;}
   if(ext){if(!out.stats)out.stats=ext.stats;if(!out.description)out.description=ext.description;if(!out.type)out.type=ext.type;out.externalReference=ext.url;}
   return out;
 }
 function ability(info){return info.effect?(info.effect+(info.effectRecord?'（外部版本參考，繁星尚未核對）':'')):'尚無可核對的裝備能力資料';}
 global.StarroReferenceLookup=Object.freeze({canonical,find,details,merge,ability});
 if(typeof module!=='undefined'&&module.exports)module.exports=global.StarroReferenceLookup;
})(typeof window==='undefined'?globalThis:window);
