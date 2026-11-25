(()=>{
'use strict';
const root=document.getElementById('jroMvpBox');
if(!root||typeof JRO_MVP_ENCHANTS==='undefined'||typeof JRO_MVP_ROWS==='undefined')return;
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const icons=Object.fromEntries(JRO_MVP_ENCHANTS.map(x=>[x.id,x.icon||'']));
const byId=Object.fromEntries(JRO_MVP_ENCHANTS.map(x=>[x.id,x]));
const rows=document.getElementById('jroMvpRows');
const search=document.getElementById('jroMvpSearch');
const select=document.getElementById('jroMvpEnchant');
const meta=document.getElementById('jroMvpMeta');
const choices=document.getElementById('jroMvpChoices');
const icon=(id,size='')=>icons[id]?'<img class="jro-inline-icon '+size+'" src="'+icons[id]+'" alt="" loading="lazy">':'🧿';
select.innerHTML='<option value="all">全部 8 種附魔</option>'+JRO_MVP_ENCHANTS.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('');
choices.innerHTML=JRO_MVP_ENCHANTS.map(x=>'<button type="button" data-enchant="'+esc(x.id)+'">'+icon(x.id,'lg')+esc(x.name)+'</button>').join('');
function render(){
 const q=search.value.trim().toLocaleLowerCase('zh-TW'),type=select.value;
 const list=JRO_MVP_ROWS.filter(r=>{
  const enchant=byId[r[0]];
  return enchant&&(type==='all'||type===r[0])&&(!q||[enchant.name,enchant.jp,r[1],r[2]].join(' ').toLocaleLowerCase('zh-TW').includes(q));
 });
 meta.textContent='顯示 '+list.length+' / '+JRO_MVP_ROWS.length+' 筆卡片套裝效果';
 rows.innerHTML=list.length?list.map(r=>{
  const e=byId[r[0]],name=r[1].startsWith('(JRO)')?r[1]:'(JRO)'+r[1];
  return '<tr><td>'+icon(e.id)+' '+esc(e.name)+'<div class="jro-meta">'+esc(e.jp)+'<div>本體：'+esc(e.base)+'</div></div></td><td class="jro-card '+(/封印/.test(name)?'jro-sealed':'')+'">'+esc(name)+'</td><td>'+esc(r[2])+'</td></tr>';
 }).join(''):'<tr><td colspan="3">沒有符合的附魔／卡片</td></tr>';
 choices.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.enchant===type));
}
search.addEventListener('input',render);select.addEventListener('change',render);
document.getElementById('jroMvpClear').addEventListener('click',()=>{search.value='';select.value='all';render()});
choices.addEventListener('click',e=>{const b=e.target.closest('[data-enchant]');if(!b)return;select.value=select.value===b.dataset.enchant?'all':b.dataset.enchant;render()});
render();
})();