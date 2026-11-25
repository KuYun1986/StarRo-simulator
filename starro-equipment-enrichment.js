/* Shared LT base-item matching and VERIFIED official ability extracts.
 * Exact item family only: no unrelated fuzzy naming or LT/base effect copying.
 * StarRO may customize effects; official TWRO text is a reference, not server proof.
 */
(function(root){
'use strict';
const stripQuantity=s=>String(s||'').trim().replace(/\s*[×x*]\s*\d+(?:\.\d+)?\s*$/i,'');
const key=s=>stripQuantity(s).normalize('NFKC').toLocaleLowerCase('zh-TW')
  .replace(/[\s\u200b\u200c\ufeff]/g,'').replace(/[－–—﹣]/g,'-');
const isLT=s=>/-\s*LT(?=\s*(?:\[\d+\])?\s*$)/i.test(stripQuantity(s).normalize('NFKC'));
const withoutLT=s=>stripQuantity(s).normalize('NFKC').replace(/-\s*LT(?=\s*(?:\[\d+\])?\s*$)/i,'').trim();
const trimRefine=s=>s.replace(/^\s*\+\d+\s*/,'');
const trimRank=s=>s.replace(/^\s*(?:(?:[A-DＳS])\s*階\s*|\([A-D]\s*級\)\s*)/i,'');
function baseCandidates(s){
  if(!isLT(s))return [];
  const plain=withoutLT(s);
  const variants=[plain,trimRefine(plain),trimRank(plain),trimRank(trimRefine(plain)),trimRefine(trimRank(plain))];
  const seen=new Set();
  return variants.filter(n=>n&&!seen.has(key(n))&&seen.add(key(n)));
}
function findBase(target,knownNames){
  if(!isLT(target))return null;
  const byKey=new Map();
  for(const raw of knownNames||[]){
    const name=stripQuantity(raw);
    if(!name||isLT(name))continue;
    const k=key(name);
    if(!byKey.has(k))byKey.set(k,name);
  }
  for(const candidate of baseCandidates(target)){
    const match=byKey.get(key(candidate));
    if(match)return match;
  }
  return null;
}
function matchesBase(target,base){
  if(!isLT(target)||isLT(base))return false;
  return baseCandidates(target).some(candidate=>key(candidate)===key(base));
}
const U='https://ro.gnjoy.com.tw/notice/guide_view.aspx?id=205519';
const V='https://ro.gnjoy.com.tw/notice/notice_view.aspx?id=216859';
// Short verified excerpts. These are NOT exhaustive in-game tooltips.
// Every text below was cross-checked against TWRO's official equipment notes.
const VERIFIED={
  '阿斯特莉亞斗篷-LT[1]':{
    text:'All State+2、MaxHP/SP+10%；精煉每+2增加ATK/MATK+10、每+3無屬性抗性+3%；+9對全體型物理及魔法傷害+10%、+11近遠距物理與全屬性魔法傷害+10%、+13技能後延遲-10%。搭配阿斯特莉亞戰靴-LT另有抗性及HP/SP效果。',
    url:U
  },
  '阿斯特莉亞戰盔-LT[1]':{
    text:'MaxHP+5%；搭配闇●超魔導師卡片提升念屬性魔法傷害，精煉每+2增加念屬性魔法傷害、+12對全體型魔法傷害+15%；D至A階級另依階級增加MATK、屬性及種族魔法傷害。',
    url:U
  },
  '魔鬼惡火斗篷-LT[1]':{
    text:'MDEF+10；可依各50%機率發動強酸火煙瓶投擲、爆炸孢子、手推車加農砲Lv1（需備妥施法材料及砲彈）；使用手推車龍捲風Lv10時，另有70%機率發動爆炸炸藥Lv1，已習得較高等級時依公告採用較高等級。',
    url:U
  },

  '阿斯特莉亞指環-LT[1]':{
    text:'MDEF+10；六種特性素質各+1；可使用聖典Lv5；全階級物理與魔法傷害+8%；無視種族物理與魔法防禦10%。另有戰靴、戰盔及卡片套裝效果。',
    url:U
  },
  '阿斯特莉亞戰靴-LT[1]':{
    text:'All State+3、MDEF+10。精煉+10時依六大基本素質100點啟動HP/SP、詠唱、抗性、攻速、延遲或CRI增益；+13時還有特性素質門檻加成。',
    url:U
  },
  '阿斯特莉亞鎧甲-LT[1]':{
    text:'MDEF+10、MaxHP+20%、體型物理減傷5%。精煉每+2增加VIT與ATK/MATK；+7降低技能後延遲、+9增加屬性對象傷害、+13增加體型對象傷害，另有階級及卡片套裝能力。',
    url:U
  },
  '時光超越者之靴-LT[1]':{
    text:'MDEF+15、All State+2、MaxHP+15%、MaxSP+5%。精煉+10依基本素質108點分別提升ATK、MATK、攻速、HP、固定詠唱或爆擊傷害；+13追加特性素質效果。',
    url:U
  },
  '時光超越者斗篷-LT[1]':{
    text:'MDEF+10。隨精煉階段提升ATK、MATK、CRI、近遠距物理及屬性魔法傷害；+9增加體型傷害、+12增加屬性傷害。搭配時光超越者之靴-LT另有套裝效果。',
    url:U
  },
  '粗暴者龍影鎧甲-LT[1]':{
    text:'MDEF+10、All State+12、MaxHP/SP+15%。每10級BaseLv提升MATK；精煉+9屬性魔法傷害+25%、+11中大型魔傷+30%、+13技能延遲-15%，搭配指定卡片或披肩另有能力。',
    url:U
  },
  '深紅魔術之靴-LT[1]':{
    text:'MDEF+15、ATK/MATK+5%，並提升遠距離及無屬性攻擊抗性。精煉每+2增加ATK/MATK百分比；+11追加多屬性抗性、+13減少固定詠唱與技能後延遲，另有三件套裝及階級效果。',
    url:U
  },
  '機械鋁合金改造靴-LT[1]':{
    text:'MDEF+10。精煉每+2 POW+2、每+3 MaxHP+4%及技能延遲-2%；+7 ATK+7%、+9近遠距傷害+15%、+11屬性物理傷害+10%、+13加農砲與戰斧颶風能力強化，另有卡片與階級效果。',
    url:U
  },
  '魔力星陣-LT':{
    text:'固定詠唱時間減少0.2秒、ASPD+1。搭配魔力之星-LT，六項基本素質依達成門檻提供MATK、延遲及不同對象魔法傷害加成。',
    url:U
  },
  '深紅寶石結晶之墜-LT[1]':{
    text:'MDEF+15、技能後延遲-5%、ATK/MATK+12%，以及屬性與遠距離抗性+5%；可使用魔法醒悟Lv1，部分職業有額外限制。',
    url:U
  },
  '守護精靈祈禱之鞋-LT[1]':{
    text:'MDEF+10；SPL與WIS總和達150時S.MATK+15。精煉階段增加MATK、HP/SP、延遲、屬性魔傷；+13施法攻擊可觸發特性素質與MATK效果，另有指定卡片套裝。',
    url:U
  },
  '瘋狂兔寶寶[1]':{
    text:'對各種族物理傷害及MATK各增加5%；近距離物理傷害反射10%，受到魔法攻擊時有機率短暫反射魔法。精煉+7/+9加ATK與MATK；+12提升CRI並防詠唱中斷。',
    url:V
  }
};
const verified=new Map(Object.entries(VERIFIED).map(([name,data])=>[key(name),{...data,matchedName:name}]));
function officialEffect(name){
  // More verified TWRO notices supplement the original curated excerpts.
  const published=root.StarroOfficialEquipment?.lookup(name);
  if(published)return {text:published.effect,url:published.source,
    matchedName:published.name,partial:true,publisher:published.publisher};
  const n=stripQuantity(name);
  let found=verified.get(key(n));
  if(found)return {...found,partial:true};
  // Refinement/grade is a prefix to the SAME piece of equipment, not a
  // reason to copy unrelated base-item effects.
  const noRank=trimRank(trimRefine(n));
  found=verified.get(key(noRank));
  return found?{...found,partial:true,prefixAdjusted:true}:null;
}
function sourceFooter(record,reference,itemName){
  const url=record?.url||U;
  const extra=typeof reference==='string'&&/^https:\/\//i.test(reference)
    ?'；<a href="'+reference.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'" target="_blank" rel="noopener noreferrer">既有道具參考連結</a>':'';
  return '<div class="starro-data-source-note"><b>資料來源：</b>'+
   (record?.url?'<a href="'+url+'" target="_blank" rel="noopener noreferrer">外部裝備能力參考（非繁星核定）</a>；':'優先採用繁星資料；')+
   '<a href="https://event.gnjoy.com.tw/Ro/RoItemSearch'+(itemName?'?UrlQuery='+encodeURIComponent(itemName):'')+'" target="_blank" rel="noopener noreferrer">官方裝備道具查詢平台</a>；'+
   '<a href="https://ro-collectitem-yuno.netlify.app/" target="_blank" rel="noopener noreferrer">繁星專屬收藏圖鑑（主要資料來源）</a>'+extra+'。'+
   '外部效果僅供參考；繁星實際能力與取得來源以伺服器設定為準。</div>';
}
function isGachaSource(source){
  return /轉蛋|扭蛋/.test(String(source||''));
}
const conversionNote='轉蛋取得的是非 LT 原版裝備，需再改造升級成 LT。';
const api={key,isLT,withoutLT,baseCandidates,findBase,matchesBase,officialEffect,sourceFooter,isGachaSource,conversionNote};
root.StarroEquipmentEnrichment=Object.freeze(api);
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
