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
 // Normalize the same egg across the server index, legacy import and CMS.
 function dedupeSources(values){
   const groups=new Map(),other=new Set();
   for(const raw of values||[]){
     if(typeof raw!=='string'||!raw.trim())continue;
     const text=raw.trim().normalize('NFKC');
     const prefix=text.match(/^非LT原版「([^」]+)」\s*\|\s*/i);
     const body=text.replace(/^非LT原版「[^」]+」\s*\|\s*/i,'').replace(/\s*\(取得後需改造升級為 LT\)$/i,'').replace(/^(?:轉蛋|扭蛋)\s*:\s*/,'');
     const egg=body.match(/^((?:紅利轉蛋\s*[-–—]?\s*XR|XR轉蛋\s*[-–—]?|紅利轉蛋|[^|()]*?(?:轉蛋|扭蛋)))\s*(?:\(\s*(\d+)\s*\))?/i);
     if(!egg){other.add(raw.trim());continue;}
     let name=egg[1].replace(/\s+/g,'').replace(/[–—]/g,'-');
     if(/^(?:紅利轉蛋-?XR|XR轉蛋-?)$/i.test(name))name='紅利轉蛋-XR';
     if(egg[2])name+='（'+Number(egg[2])+'）';
     const tail=body.slice(egg[0].length);
     const rank=tail.match(/(?:^|[\s(|])\s*(XR|UR|SSS|SSR|SS|SR|S|R|N)\s*(?:獎|賞)?(?=$|[\s)|])/i)?.[1]?.toUpperCase()||'';
     const id=tail.match(/編號\s*:?\s*(\d+)/)?.[1]||'';
     const rate=tail.match(/(\d+(?:\.\d+)?)\s*%/)?.[0]||'';
     const key=(prefix?.[1]||'')+'|'+name;
     if(!groups.has(key))groups.set(key,{name,prefix:prefix?.[1]||'',records:[]});
     groups.get(key).records.push({rank,id,rate});
   }
   const result=[];
   for(const g of groups.values()){
     const ranked=g.records.filter(x=>x.rank);
     const ranks=[...new Set(ranked.map(x=>x.rank))];
     const use=ranks.length?ranks:[''];
     for(const rank of use){
       const exact=g.records.filter(x=>x.rank===rank);
       const unknown=use.length===1?g.records.filter(x=>!x.rank):[];
       const records=[...exact,...unknown];
       const ids=[...new Set(records.map(x=>x.id).filter(Boolean))];
       for(const id of ids.length?ids:['']){
         const rate=records.find(x=>(!x.id||x.id===id)&&x.rate)?.rate||'';
         result.push((g.prefix?'非LT原版「'+g.prefix+'」｜':'')+g.name+(rank?'｜'+rank+'獎':'')+(id?'｜編號 '+id:'')+(rate?'｜'+rate:''));
       }
     }
   }
   return [...result,...other];
 }
 function details(name){
   const data=find(name);
   if(!data)return {};
   const gacha=Array.isArray(data.gacha)?data.gacha:[];
   const sources=dedupeSources(gacha.filter(x=>x&&x.name).map(x=>x.name+(x.tier?'｜'+x.tier+'獎':'')+(x.boxId?'｜編號 '+x.boxId:'')));
   return {itemId:data.itemId||'',type:data.type||'',alias:data.alias||'',image:data.image||'',stats:data.stats||'',description:data.description||'',effect:data.effect||'',
     sourceLabel:data.sourceLabel||'',sourceUrl:data.sourceUrl||'',referenceSite:global.StarroReferenceIndex.site||site,sources,gacha};
 }
 const nonempty=v=>v!=null&&(typeof v!=='string'||v.trim()!=='');
 function merge(name,imported={},manual={}){
   const primary=details(name),id=primary.itemId||manual.itemId||imported.itemId||'',ext=fallback[id];
   const out={};
   for(const row of [imported,primary,manual])for(const [k,v] of Object.entries(row))if(nonempty(v))out[k]=v;
   out.sources=dedupeSources([...(primary.sources||[]),...(imported.sources||[]),...(manual.sources||[]),manual.source]);
   const abilityPattern=/(?:ATK|MATK|MHP|MSP|MaxHP|MaxSP|MDEF|STR|DEX|技能傷害|物理傷害|魔法傷害|技能後延遲|固定詠唱)\s*[+＋-－]|(?:傷害|抗性|暴擊|詠唱|延遲).*(?:[+＋-－]|增加|減少)/i;
   const existing=out.effect||(abilityPattern.test(out.stats||'')?out.stats:'');
   if(existing){out.effect=existing;if(existing===out.stats)out.stats='';out.effectRecord=null;}
   else if(ext){out.effect=ext.effect;out.effectRecord={url:ext.url,publisher:'RagnaPlace 台灣版道具資料',partial:true};}
   else {const record=global.StarroEquipmentEnrichment?.officialEffect(name);out.effect=record?.text||'';out.effectRecord=record||null;}
   if(ext){if(!out.stats)out.stats=ext.stats;if(!out.description)out.description=ext.description;if(!out.type)out.type=ext.type;out.externalReference=ext.url;}
   return out;
 }
 function ability(info){return info.effect?(info.effect+(info.effectRecord?'（外部版本參考，繁星尚未核對）':'')):'尚無可核對的裝備能力資料';}
 // Ordinary special collections use the first UR/XR; ascended collections use the second UR (sixth requirement).
 const isAscended=item=>/^昇華(?:●|[\s・．.]|$)/.test(String(item?.name||''));
 function representative(item){
   const req=Array.isArray(item?.required)?item.required:[];
   return isAscended(item)?(req[5]||''):(req[0]||item?.name||'');
 }
 // Use only that actual item (never guess another image by similar name).
 function collectionCover(item,resolve,original=''){
   if(!item||!['特殊收藏','JRO收藏'].includes(item.group))return original;
   const name=representative(item);
   if(!name)return original;
   return (typeof resolve==='function'?resolve(name):details(name).image)||original;
 }
 // Stable, global matching: filters, pages and collection selection never change assignments.
 const collectionKey=item=>[item.group==='JRO收藏'?'特殊收藏':item.group,item.row,item.name].join('|');
 const isSpecial=item=>['特殊收藏','JRO收藏'].includes(item.group);
 function buildCollectionCovers(items,config={}){
   const normalized=rows=>new Map(Object.entries(rows||{}).map(([n,v])=>[canonical(n),v]));
   const imported=normalized(global.StarroReferenceItems),manual=normalized(config.equipmentDetails),images=normalized(config.images);
   const safe=url=>typeof url==='string'&&(/^https:\/\//i.test(url)||/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(url))?url:'';
   const identity=url=>{
     if(url.startsWith('data:'))return url;
     try{const u=new URL(url);return u.origin+u.pathname;}catch(e){return url;}
   };
   const resolved=new Map();
   function resolve(name){
     const key=canonical(name);
     if(resolved.has(key))return resolved.get(key);
     const ref=details(name),old=imported.get(key)||{},custom=manual.get(key)||{};
     const url=safe(images.get(key))||safe(custom.image)||safe(ref.image)||safe(old.image);
     const type=custom.type||ref.type||old.type||'';
     const data={url,type,rarity:(ref.gacha||[]).some(x=>/^(UR|XR)$/i.test(x.tier||''))};
     resolved.set(key,data);return data;
   }
   const rows=[...new Map((items||[]).filter(Boolean).map(it=>[collectionKey(it),it])).values()]
     .sort((a,b)=>(Number(a.row)||0)-(Number(b.row)||0)||collectionKey(a).localeCompare(collectionKey(b),'zh-TW'));
   const assigned=new Map(),used=new Set();
   const uniqueOptions=names=>{
     const out=[],seen=new Set();
     for(const name of names){const x=resolve(name);if(!x.url)continue;const id=identity(x.url);if(seen.has(id))continue;seen.add(id);out.push({...x,id});}
     return out;
   };
   // Reserve each special collection's designated UR/XR representative (sixth requirement for ascended).
   // A duplicate may use another explicitly UR/XR requirement; never use an unrelated icon.
   const waiting=[];
   for(const it of rows.filter(isSpecial)){
     const primary=resolve(representative(it)),k=collectionKey(it);
     const id=primary.url&&identity(primary.url);
     if(id&&!used.has(id)){used.add(id);assigned.set(k,primary.url);}
     else if(!isAscended(it))waiting.push(it);
   }
   for(const it of waiting){
     const options=uniqueOptions((it.required||[]).slice(1)).filter(x=>x.rarity&&!used.has(x.id));
     if(options.length){used.add(options[0].id);assigned.set(collectionKey(it),options[0].url);}
   }
   // Maximum bipartite matching for ordinary collections. Reassign a flexible earlier
   // collection when that allows a constrained collection to have its own image.
   const ordinary=rows.filter(it=>!isSpecial(it)).map(it=>({
     key:collectionKey(it),options:uniqueOptions(it.required||[])
      .filter(x=>!used.has(x.id)&&!/^(?:消耗品|材料|雜物|其他|道具|料理|貨幣|任務道具)$/i.test(x.type))
   })).sort((a,b)=>a.options.length-b.options.length);
   const owners=new Map(),byKey=new Map(ordinary.map(x=>[x.key,x]));
   function place(row,visited){
     for(const x of row.options){
       if(visited.has(x.id))continue;visited.add(x.id);
       const previous=owners.get(x.id);
       if(!previous||place(byKey.get(previous),visited)){
         owners.set(x.id,row.key);assigned.set(row.key,x.url);return true;
       }
     }
     return false;
   }
   for(const row of ordinary)place(row,new Set());
   return assigned;
 }
 global.StarroReferenceLookup=Object.freeze({canonical,find,details,merge,ability,collectionCover,collectionKey,buildCollectionCovers,dedupeSources});
 if(typeof module!=='undefined'&&module.exports)module.exports=global.StarroReferenceLookup;
})(typeof window==='undefined'?globalThis:window);
