(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const DEFAULT_NAV=[
    {icon:'🏠',label:'主頁',href:'index.html',visible:true},{icon:'🎮',label:'遊戲區',href:'game.html',visible:true},{icon:'✨',label:'附魔區',href:'enchant.html',visible:true},{icon:'🔍',label:'洗詞鑑定區',href:'identify.html',visible:true},{icon:'📚',label:'收藏區',href:'collection.html',visible:true},{icon:'💰',label:'裝備成本區',href:'equipment.html',visible:true},{icon:'💳',label:'現金區',href:'CASH.html',visible:true},{icon:'💎',label:'影子區',href:'shadow.html',visible:true}
  ];
  const ICONS=[['掉落','🎁'],['龍甲','🐉'],['善惡','⚔️'],['符文','🗿'],['華金','🔥'],['競標','🪡'],['時光','💎'],['收藏','📚'],['裝備','💰'],['現金','💳'],['遊戲','🎮'],['自訂流程','⚙️'],['影子','💎'],['測傷','🧪'],['百家樂','🎴'],['輪盤','🎡'],['21點','🃏'],['推筒子','🀙']];
  function cfgGet(p,fb){try{return window.StarroConfig?.get(p,fb)??fb}catch(e){return fb}}
  function navCfg(){const a=cfgGet('ui.navigation',null);return Array.isArray(a)&&a.length?a:DEFAULT_NAV}
  function normalizeNav(){const top=$('.topnav');if(top&&!top.classList.contains('starro-navigation'))top.classList.add('starro-navigation')}
  function applyNav(){const nav=$('.starro-navigation')||$('.topnav')||$('.page-links');if(!nav)return;let admin=$('a[href$="admin.html"]',nav)||$('a.game-page-link',nav);$$('a[href]',nav).forEach(a=>{const h=(a.getAttribute('href')||'').split('/').pop().toLowerCase();if(h!=='admin.html')a.remove()});for(const item of navCfg().filter(x=>x.visible!==false)){const a=document.createElement('a');a.href=item.href||'#';a.textContent=`${item.icon||'✦'} ${item.label||item.href}`;const h=(item.href||'').split('/').pop().toLowerCase();if(h===path)a.setAttribute('aria-current','page');if(admin)nav.insertBefore(a,admin);else nav.appendChild(a)}if(admin){admin.textContent='🔐 管理後台';nav.appendChild(admin)}}
  function decorate(){ $$('.card h2').forEach(h=>{if($('.ro-title-icon',h))return;let icon='✦',t=h.textContent;for(const [k,v] of ICONS)if(t.includes(k)){icon=v;break}const s=document.createElement('span');s.className='ro-title-icon';s.textContent=icon;h.prepend(s)}) }
  function apply(){normalizeNav();applyNav();decorate()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();document.addEventListener('starro-config-applied',()=>setTimeout(apply,0));
})();
