(function(){
  "use strict";
  const STORAGE_KEY="starro_admin_config_v1";
  const RELOAD_KEY="starro_admin_remote_reload_hash";

  const DEFAULT_CONFIG={
    meta:{version:"admin-v1",updatedAt:null},
    features:{
      huajinArmor:{enabled:true,cost:49,stage1Rate:50,stage2Rate:10,ranges:[
        {min:1,max:5,weight:95},{min:6,max:10,weight:4.5},{min:11,max:14,weight:0.45},{min:15,max:15,weight:0.05}
      ]},
      huajinAccessory:{enabled:true,cost:49,stage1Rate:50,stage2Rate:10,ranges:[
        {min:1,max:5,weight:95},{min:6,max:10,weight:4.5},{min:11,max:19,weight:0.5},{min:20,max:20,weight:0.1}
      ]},
      auctionNeedle:{enabled:true,cost:19,secondRate:50,thirdRate:10,specialMagicRate:0.1,specialBuffRate:0.1,pool1:null,pool2:null,pool3:null},
      dragon:{enabled:true,fourth:{lv2to3:50,lv3toSpecial:25},third:{lv3to4:75,lv4to5:50,lv5toSpecial:25}},
      evilWeapon:{enabled:true,rates:{lv1to2:60,lv2to3:45,lv3to4:30,lv4to5:15}},
      timeBoot:{enabled:true,series:[{name:"墮落根莖",weight:70},{name:"闇答萊屍",weight:20},{name:"希梅爾茲",weight:10}],thirdPool:["變異餓熊威力","變異光速瞬移","變異無感肌肉","變異暴走魔法","變異犀利鷹眼","變異幸運之日"],types:["鬥志","魔力","尖銳","名弓"]},
      collection:{enabled:true,items:null,notice:""},
      equipment:{enabled:true,priceOverrides:{},servicePrices:{bless:6,check:18,bigGold:950,smallGold:120,bigGray:148,smallGray:1,taffy:40,dust:1,red:220}}
    }
  };

  function clone(x){return JSON.parse(JSON.stringify(x));}
  function merge(a,b){
    if(Array.isArray(b)) return clone(b);
    if(!b || typeof b!=="object") return b===undefined?clone(a):b;
    const o=(a&&typeof a==="object"&&!Array.isArray(a))?clone(a):{};
    Object.keys(b).forEach(k=>{o[k]=merge(o[k],b[k]);});
    return o;
  }
  function readCache(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");}catch(e){return null;}
  }
  let config=merge(DEFAULT_CONFIG,readCache()||{});
  function pathGet(path,fallback){
    let cur=config;
    for(const k of String(path||"").split(".").filter(Boolean)){
      if(cur==null || !(k in Object(cur))) return fallback;
      cur=cur[k];
    }
    return cur===undefined?fallback:cur;
  }
  function saveCache(next){
    config=merge(DEFAULT_CONFIG,next||{});
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(config));}catch(e){console.warn("STARRO config cache failed",e);}
  }
  function hash(obj){
    const s=JSON.stringify(obj); let h=2166136261;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return (h>>>0).toString(16);
  }
  function applyVisibility(){
    document.querySelectorAll('[data-starro-feature]').forEach(el=>{
      const key=el.getAttribute('data-starro-feature');
      const enabled=pathGet('features.'+key+'.enabled',true)!==false;
      el.style.display=enabled?'':'none';
    });
  }
  function applyInputDefaults(){
    const map={huajinCost:'features.huajinArmor.cost',accessoryCost:'features.huajinAccessory.cost'};
    Object.entries(map).forEach(([id,path])=>{const el=document.getElementById(id);if(el)el.value=pathGet(path,el.value);});
  }
  function applyAll(){applyVisibility();applyInputDefaults();document.dispatchEvent(new CustomEvent('starro-config-applied',{detail:config}));}

  window.StarroConfig={
    defaults:clone(DEFAULT_CONFIG),
    get:pathGet,
    all:()=>config,
    replace(next){saveCache(next);applyAll();return config;},
    patch(next){saveCache(merge(config,next||{}));applyAll();return config;},
    reset(){saveCache(DEFAULT_CONFIG);applyAll();return config;},
    storageKey:STORAGE_KEY
  };

  async function loadRemote(){
    const s=window.STARRO_SUPABASE||{};
    if(!s.url||!s.anonKey) return {mode:'local',ok:false,reason:'not-configured'};
    try{
      const row=encodeURIComponent(s.configRow||'main');
      const r=await fetch(s.url.replace(/\/$/,'')+`/rest/v1/site_config?id=eq.${row}&select=config,updated_at`,{
        headers:{apikey:s.anonKey,Authorization:'Bearer '+s.anonKey}
      });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const data=await r.json();
      if(!data[0]?.config) return {mode:'cloud',ok:true,empty:true};
      const remote=merge(DEFAULT_CONFIG,data[0].config);
      const before=hash(config),after=hash(remote);
      saveCache(remote);
      if(before!==after && !location.pathname.endsWith('/admin.html') && !location.pathname.endsWith('admin.html')){
        const last=sessionStorage.getItem(RELOAD_KEY);
        if(last!==after){sessionStorage.setItem(RELOAD_KEY,after);location.reload();return {mode:'cloud',ok:true,reloading:true};}
      }
      applyAll();
      document.dispatchEvent(new CustomEvent('starro-config-ready',{detail:{config,source:'cloud',updatedAt:data[0].updated_at}}));
      return {mode:'cloud',ok:true};
    }catch(err){
      console.warn('STARRO remote config load failed',err);
      document.dispatchEvent(new CustomEvent('starro-config-ready',{detail:{config,source:'cache',error:String(err)}}));
      return {mode:'cache',ok:false,error:String(err)};
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyAll,{once:true}); else applyAll();
  window.StarroConfig.ready=loadRemote();
})();
