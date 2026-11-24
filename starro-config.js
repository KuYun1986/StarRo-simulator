(function(){
  'use strict';
  const storageKey='starro-site-config-v3';
  const defaults={
    meta:{version:'admin-v3',updatedAt:null},
    features:{
      huajinArmor:{enabled:true,cost:49,stage1Rate:50,stage2Rate:10,ranges:[{min:1,max:5,weight:95},{min:6,max:10,weight:4.5},{min:11,max:14,weight:.45},{min:15,max:15,weight:.05}]},
      huajinAccessory:{enabled:true,cost:49,stage1Rate:50,stage2Rate:10,ranges:[{min:1,max:5,weight:95},{min:6,max:10,weight:4.5},{min:11,max:14,weight:.45},{min:15,max:15,weight:.05}]},
      auctionNeedle:{enabled:true,cost:19,secondRate:50,thirdRate:10,specialMagicRate:.1,specialBuffRate:.1,pool1:null,pool2:null,pool3:null},
      dragon:{enabled:true,fourth:{lv2to3:50,lv3toSpecial:25},third:{lv3to4:75,lv4to5:50,lv5toSpecial:25}},
      evilWeapon:{enabled:true,rates:{lv1to2:60,lv2to3:45,lv3to4:30,lv4to5:15}},
      timeBoot:{enabled:true,series:[{name:'希梅爾茲',weight:12},{name:'克羅內克',weight:12},{name:'海茵',weight:12},{name:'施密特',weight:12},{name:'保羅',weight:12},{name:'艾克拉珠',weight:12},{name:'其他',weight:28}],thirdPool:['鬥志','魔力','名弓','尖銳','幸運日','光速瞬移'],types:['力量','敏捷','體質','智力','靈巧','幸運']},
      simulators:{"bios":{"stages":[["4S 前置-1",1],["4S 前置-2",1],["4S 前置-3",1],["4S 強化-1",1],["4S 強化-2",0.9],["4S 強化-3",0.8],["4S 強化-4",0.7],["4S 強化-5",0.6],["3S 啟用",1],["3S 強化-1",1],["3S 強化-2",0.9],["3S 強化-3",0.8]],"materials":[["空中要塞鑰匙",{"0":250,"8":1000}],["無限挑戰日誌",{"0":50,"1":100,"2":150}],["空中要塞能源礦",{"0":150,"1":1500,"2":4500,"8":1500}],["空中要塞淬鍊石",{"0":50,"1":500,"2":1500,"8":500}],["暗夜吉芬衛冕硬幣",{"0":300}],["暗夜吉芬衛冕冠軍證明",{"1":200}],["晨曦之心",{"1":10,"2":20}],["乙太塔菲石",{"2":1000}],["凱薩祝福",{"8":1000}],["歐內斯特、斯特凡、傑克卡片",{"0":1,"1":1,"2":3,"8":1}],["史蒂芬傑克歐內斯特符文意識",{"8":5}],["裝備附魔券",{"0":10,"1":30,"2":50,"8":30}],["拜歐斯晝夜碎片",{"3":25,"4":55,"5":80,"6":110,"9":25,"10":55,"11":80}],["拜歐斯曙光碎片",{"4":20,"5":40,"6":60,"7":100,"10":20,"11":40}],["拜歐斯冥夜精華",{"5":15,"6":20,"7":30,"11":20}],["安庫的死神印記",{"6":35,"7":65,"11":40}],["死神安庫卡片",{"3":1,"9":1}],["死神安庫符文意識",{"3":1,"4":2,"5":3,"6":4,"7":5,"9":1,"10":2,"11":3}],["徽記",{"0":500,"1":1500,"2":2000,"3":250,"4":500,"5":750,"6":1000,"7":1500,"8":1500,"9":500,"10":1000,"11":1500}]]}},
      collection:{enabled:true,notice:'',items:null},
      equipment:{enabled:true,servicePrices:{bless:6,check:18,bigGold:950,smallGold:120,bigGray:148,smallGray:1,taffy:40,dust:1,red:220},priceOverrides:{},serviceRules:{"refine":{"LT20":{"red":10,"checks":10,"bless":0,"bigGold":5,"smallGold":0,"bigGray":15,"smallGray":15,"note":"上LT+20：10紅、支票10張、大小灰各15把＋大金5把。"},"A-D":{"red":10,"checks":10,"bless":0,"bigGold":0,"smallGold":0,"bigGray":15,"smallGray":15,"note":"A裝 +0~+20：大小灰各15把、支票10張、10紅。"},"S":{"red":20,"checks":20,"bless":200,"bigGold":15,"smallGold":15,"bigGray":0,"smallGray":0,"note":"2級防具／5級武器／S裝 +0~+14：鐵匠的祝福200個、支票20張、大小金各15把、20紅。"},"S-BOTH15":{"red":20,"checks":15,"bless":0,"bigGold":15,"smallGold":15,"bigGray":0,"smallGray":0,"note":"目前精煉 +14：20紅、支票15張、大小金各15把。"},"S-BOTH10":{"red":20,"checks":15,"bless":0,"bigGold":15,"smallGold":10,"bigGray":0,"smallGray":0,"note":"目前精煉 +15：20紅、支票15張、大金15／小金10把。"},"S-BOTH5":{"red":20,"checks":15,"bless":0,"bigGold":15,"smallGold":5,"bigGray":0,"smallGray":0,"note":"目前精煉 +16：20紅、支票15張、大金15／小金5把。"},"S-BIG15":{"red":20,"checks":15,"bless":0,"bigGold":15,"smallGold":0,"bigGray":0,"smallGray":0,"note":"目前精煉 +17：20紅、支票15張、大金15把。"},"S-BIG10":{"red":20,"checks":10,"bless":0,"bigGold":10,"smallGold":0,"bigGray":0,"smallGray":0,"note":"目前精煉 +18：20紅、支票10張、大金10把。"},"S-BIG5":{"red":20,"checks":5,"bless":0,"bigGold":5,"smallGold":0,"bigGray":0,"smallGray":0,"note":"目前精煉 +19：20紅、支票5張、大金5把。"},"S-ZERO":{"red":0,"checks":0,"bless":0,"bigGold":0,"smallGold":0,"bigGray":0,"smallGray":0,"note":"目前精煉 +20：不計算敲S費用。"},"SS":{"red":60,"checks":35,"bless":350,"bigGold":35,"smallGold":35,"bigGray":0,"smallGray":0,"note":"SS裝 +0~+20：鐵匠的祝福350個、支票35張、大小金各35把、60紅。"}},"grade":{"S":{"red":20,"taffy":30,"dust":270,"checks":9},"SS":{"red":40,"taffy":100,"dust":1000,"checks":25}}}},
      game:{enabled:true,wheel:{enabled:true,maxBet:5000,maxColors:4,betStep:100,options:[{name:'紅',p:6,pay:1},{name:'黃',p:3,pay:2},{name:'綠',p:2,pay:3},{name:'紫',p:1,pay:6},{name:'藍',p:1,pay:12},{name:'橘',p:1,pay:12}]},baccarat:{enabled:true,maxBet:30000,betStep:100,payouts:{player:1,banker:.95,tie:8,playerPair:11,bankerPair:11,big:.53,small:1.45,playerOdd:.95,playerEven:.88,bankerOdd:.92,bankerEven:.92}},blackjack:{enabled:true,bet:10000,startChips:500000,dealerStand:17,blackjackPayout:2},tongzi:{enabled:true,bet:100000,maxHands:10,dealerPairBonus:5}},
      cash:{enabled:true,redPerT:1,defaultAmount:1000,shopRatio:280,bonusRatio:1.6,tiers:[{min:100,max:999,rate:5,label:'100～999 元'},{min:1000,max:4999,rate:6,label:'1,000～4,999 元'},{min:5000,max:9999,rate:7,label:'5,000～9,999 元'},{min:10000,max:14999,rate:8,label:'10,000～14,999 元'},{min:15000,max:19999,rate:9,label:'15,000～19,999 元'},{min:20000,max:null,rate:10,label:'20,000 元以上'}],urBox2:[],cumulativeRewardTiers:null}
    },
    ui:{navigation:null,shadowPage:null,pages:{}}
  };
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function merge(a,b){
    if(Array.isArray(b))return clone(b);
    if(!b||typeof b!=='object')return b===undefined?clone(a):b;
    const out=(a&&typeof a==='object'&&!Array.isArray(a))?clone(a):{};
    for(const [k,v] of Object.entries(b)) out[k]=(v&&typeof v==='object'&&!Array.isArray(v))?merge(out[k],v):clone(v);
    return out;
  }
  function readLocal(){try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch(e){return {}}}
  let state=merge(defaults,readLocal());
  function get(path,fallback){let cur=state;for(const p of String(path||'').split('.')){if(!p)continue;if(cur==null||!(p in cur))return fallback;cur=cur[p]}return cur===undefined?fallback:cur}
  function all(){return clone(state)}
  function replace(obj){state=merge(defaults,obj||{});try{localStorage.setItem(storageKey,JSON.stringify(state))}catch(e){};document.dispatchEvent(new CustomEvent('starro-config-applied',{detail:all()}));return all()}
  async function loadCloud(){
    const s=window.STARRO_SUPABASE;if(!s?.url||!s?.anonKey)return all();
    try{
      const row=encodeURIComponent(s.configRow||'main');
      const r=await fetch(s.url.replace(/\/$/,'')+`/rest/v1/site_config?id=eq.${row}&select=config,updated_at`,{headers:{apikey:s.anonKey},cache:'no-store'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const d=await r.json();
      if(d[0]?.config){state=merge(defaults,d[0].config);if(d[0].updated_at)state.meta.updatedAt=d[0].updated_at;try{localStorage.setItem(storageKey,JSON.stringify(state))}catch(e){};document.dispatchEvent(new CustomEvent('starro-config-applied',{detail:all()}));}
    }catch(e){console.warn('[StarroConfig] cloud load failed:',e.message)}
    return all();
  }
  window.StarroConfig={defaults:clone(defaults),storageKey,get,all,replace,loadCloud,merge};
  queueMicrotask(loadCloud);
})();
