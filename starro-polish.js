(function(){
  'use strict';
  function boot(){
    if(document.querySelector('[data-ux-index]'))return;
    const root=document.querySelector('.wrap')||document.querySelector('main')||document.body;
    const sections=[...document.querySelectorAll('section[id], .card[id]')]
      .filter((el,i,a)=>a.indexOf(el)===i && el.querySelector('h2,h3') && !el.classList.contains('cms-hidden'));
    if(sections.length>=3){
      const top=sections[0];
      const nav=document.createElement('nav');
      nav.className='ux-section-index';nav.dataset.uxIndex='1';
      nav.setAttribute('aria-label','本頁功能快速導覽');
      const heading=document.createElement('p');heading.className='ux-section-index__title';heading.textContent='✦ 快速找到你要的模擬器';
      const links=document.createElement('div');links.className='ux-section-index__links';
      sections.slice(0,24).forEach(section=>{
        const heading=section.querySelector('h2,h3');if(!heading)return;
        const link=document.createElement('a');link.href='#'+encodeURIComponent(section.id);
        link.textContent=heading.textContent.trim().replace(/\s+/g,' ').slice(0,30);
        links.appendChild(link);
      });
      nav.append(heading);
      if(sections.length>=8){
        const filter=document.createElement('input');
        filter.type='search';filter.className='ux-section-index__search';
        filter.placeholder='搜尋模擬器名稱…';
        filter.setAttribute('aria-label','搜尋本頁模擬器');
        const count=document.createElement('span');
        count.className='ux-section-index__count';
        filter.addEventListener('input',()=>{
          const q=filter.value.trim().toLocaleLowerCase('zh-TW');
          let shown=0;
          [...links.children].forEach(link=>{const match=!q||link.textContent.toLocaleLowerCase('zh-TW').includes(q);link.hidden=!match;if(match)shown++});
          count.textContent=q?'找到 '+shown+' 項':'';
        });
        nav.append(filter,count);
      }
      nav.append(links);
      top.parentNode.insertBefore(nav,top);
    }
    const toTop=document.createElement('button');toTop.type='button';toTop.className='ux-page-top';toTop.textContent='↑ 回到頁首';toTop.setAttribute('aria-label','回到頁首');
    toTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'}));
    document.body.appendChild(toTop);
    const update=()=>toTop.classList.toggle('visible',window.scrollY>650);
    window.addEventListener('scroll',update,{passive:true});update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();