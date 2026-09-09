(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const defs=window.STARRO_CMS_DEFS||{};
  function pageKey(){const f=(location.pathname.split('/').pop()||'index.html').toLowerCase();return Object.keys(defs).find(k=>defs[k].file.toLowerCase()===f)||null}
  function cfgGet(path,fb){try{return window.StarroConfig?.get(path,fb)??fb}catch(e){return fb}}
  function pageCfg(key){const d=defs[key];const c=cfgGet('ui.pages.'+key,{})||{};return {enabled:c.enabled!==false,title:c.title??d.title,subtitle:c.subtitle??d.subtitle,blocks:Array.isArray(c.blocks)?c.blocks:d.blocks.map(x=>({key:x.key,visible:true,title:x.label})),overrides:Array.isArray(c.overrides)?c.overrides:[]}}
  function getBlocks(def){
    if(def.blockMode==='selectors')return def.blocks.map(b=>{let sel=b.selector,idx=0;if(sel&&sel.includes('|')){const a=sel.split('|');sel=a[0];idx=Number(a[1])||0}const els=sel?document.querySelectorAll(sel):[];return {def:b,el:els[idx]||null}}).filter(x=>x.el);
    const els=$$('.card');return def.blocks.map((b,i)=>({def:b,el:els[i]||null})).filter(x=>x.el);
  }
  function applyBlocks(key,cfg){
    const def=defs[key], found=getBlocks(def), map=new Map(found.map(x=>[x.def.key,x]));
    found.forEach(x=>{x.el.dataset.cmsKey=x.def.key;x.el.classList.remove('cms-hidden')});
    const desired=[];
    for(const bc of cfg.blocks||[]){const hit=map.get(bc.key);if(!hit)continue;hit.el.classList.toggle('cms-hidden',bc.visible===false);const title=String(bc.title??'').trim();if(title){const h=hit.el.querySelector('h1,h2,h3,h4');if(h)h.textContent=title}desired.push(hit.el)}
    const groups=new Map();
    desired.forEach(el=>{const p=el.parentElement;if(!groups.has(p))groups.set(p,[]);groups.get(p).push(el)});
    groups.forEach((arr,parent)=>arr.forEach(el=>parent.appendChild(el)));
  }
  function applyOverrides(cfg){
    for(const o of cfg.overrides||[]){if(o?.enabled===false||!o?.selector)continue;let els=[];try{els=$$(o.selector)}catch(e){continue}for(const el of els){const v=String(o.value??'');switch(o.type){case'html':el.innerHTML=v;break;case'value':el.value=v;break;case'placeholder':el.setAttribute('placeholder',v);break;case'href':el.setAttribute('href',v);break;case'src':el.setAttribute('src',v);break;case'hidden':el.classList.toggle('cms-hidden',v==='1'||v==='true'||v==='yes');break;case'style':el.setAttribute('style',v);break;case'classAdd':v.split(/\s+/).filter(Boolean).forEach(c=>el.classList.add(c));break;default:el.textContent=v}}
  }
  }
  function apply(){
    const key=pageKey();if(!key)return;const def=defs[key],cfg=pageCfg(key);
    const h1=$('.wrap > h1')||$('h1');if(h1&&cfg.title)h1.textContent=cfg.title;
    const sub=$('.sub');if(sub){sub.textContent=cfg.subtitle||'';sub.classList.toggle('cms-hidden',!cfg.subtitle)}
    applyBlocks(key,cfg);applyOverrides(cfg);
    let notice=$('.cms-page-disabled');if(cfg.enabled===false){if(!notice){notice=document.createElement('div');notice.className='cms-page-disabled';notice.textContent='此頁目前已由管理後台暫停顯示。';const nav=$('.starro-navigation')||$('.topnav');(nav||h1)?.insertAdjacentElement('afterend',notice)}getBlocks(def).forEach(x=>x.el.classList.add('cms-hidden'))}else if(notice)notice.remove();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  document.addEventListener('starro-config-applied',()=>setTimeout(apply,0));
})();
