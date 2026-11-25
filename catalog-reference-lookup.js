/* Lookup for public reference identifiers, icon URLs and named gacha sources.
   Reference item descriptions are not reproduced. Management settings take precedence. */
(function(global){
 'use strict';
 function canonical(name){
   return String(name||'').replace(/\s*[×x*]\s*\d+(?:\.\d+)?$/i,'')
     .toLocaleLowerCase('zh-TW').replace(/\s+/g,'')
     .replace(/（/g,'(').replace(/）/g,')');
 }
 function find(name){
   const index=global.StarroReferenceIndex;
   if(!index||!index.byName||!index.items)return null;
   const id=index.byName[canonical(name)];
   const data=id?index.items[id]:null;
   return data&&typeof data==='object'?data:null;
 }
 function details(name){
   const data=find(name);
   if(!data)return {};
   const gacha=Array.isArray(data.gacha)?data.gacha:[];
   const sources=[...new Set(gacha.filter(x=>x&&x.name)
     .map(x=>x.name+(x.tier?'（'+x.tier+'獎）':'')))];
   return {
     itemId:data.itemId||'',type:data.type||'',alias:data.alias||'',image:data.image||'',
     sourceLabel:data.sourceLabel||'',
     sourceUrl:data.sourceUrl||'',referenceSite:global.StarroReferenceIndex.site||'',
     sources,gacha
   };
 }
 global.StarroReferenceLookup=Object.freeze({canonical,find,details});
})(window);
