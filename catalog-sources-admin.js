(()=>{
'use strict';
const $=id=>document.getElementById(id);
function model(){
 cfg.features.catalog=cfg.features.catalog||{enabled:true,items:[],gachaPools:[],images:{}};
 const c=cfg.features.catalog;
 if(!c.equipmentDetails||typeof c.equipmentDetails!=='object')c.equipmentDetails={};
 return c.equipmentDetails;
}
const fields=['catSourceType','catSourceId','catSourceDescription','catSourceStats','catSourceOrigin','catSourceImage'];
function clear(){
 $('catSourceName').value='';fields.forEach(id=>$(id).value='');
 $('catSourceStatus').textContent='可輸入既有收藏需求道具的名稱，建立詳細資料。';
}
function fill(){
 const d=model()[$('catSourceName').value.trim()]||{};
 $('catSourceType').value=d.type||'';
 $('catSourceId').value=d.itemId||'';
 $('catSourceDescription').value=d.description||'';
 $('catSourceStats').value=d.stats||'';
 $('catSourceOrigin').value=[d.source,...(Array.isArray(d.sources)?d.sources:[])].filter(Boolean).join('\n');
 $('catSourceImage').value=d.image||'';
}
function refresh(){
 const data=model(),suggestions=$('catSourceNames');
 suggestions.replaceChildren();
 const names=new Set([...Object.keys(data),...((typeof ITEMS!=='undefined'?ITEMS:[]).flatMap(x=>x.required||[]).map(x=>x.replace(/\s*[×x*]\s*\d+(?:\.\d+)?$/i,'').trim()))]);
 for(const n of [...names].filter(Boolean).sort((a,b)=>a.localeCompare(b,'zh-Hant')).slice(0,5000)){
  const option=document.createElement('option');option.value=n;suggestions.appendChild(option);
 }
 $('catSourceTotal').textContent='已建檔 '+Object.keys(data).length+' 種道具';
}
function save(){
 const name=$('catSourceName').value.trim();
 if(!name){$('catSourceStatus').textContent='請先填寫道具名稱';return}
 const url=$('catSourceImage').value.trim();
 if(url&&!/^https:\/\//i.test(url)){$('catSourceStatus').textContent='圖片請使用 HTTPS 網址';return}
 const existing=model()[name]||{};
 const sources=$('catSourceOrigin').value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,100);
 model()[name]={...existing,type:$('catSourceType').value.trim(),itemId:$('catSourceId').value.trim(),
  description:$('catSourceDescription').value.trim(),stats:$('catSourceStats').value.trim(),
  sources,source:'',image:url||existing.image||''};
 setDirty(true);refresh();
 $('catSourceStatus').textContent='已將「'+name+'」的道具資料及 '+sources.length+' 筆來源加入編輯器；請再按「儲存全部」發布。';
}
function remove(){
 const name=$('catSourceName').value.trim();
 if(!name||!model()[name])return;
 if(!confirm('刪除「'+name+'」的道具詳細資料及手動來源？'))return;
 delete model()[name];setDirty(true);clear();refresh();
 $('catSourceStatus').textContent='已從編輯器刪除，請按「儲存全部」發布。';
}
function init(){
 const panel=$('catManage');
 if(!panel||$('catSourcePanel'))return;
 const tab=document.createElement('button');tab.type='button';tab.dataset.pane='sources';tab.textContent='📍 道具來源';
 panel.querySelector('.cat-manage-tabs').append(tab);
 const body=document.createElement('div');body.className='cat-manage-pane';body.dataset.paneContent='sources';body.id='catSourcePanel';body.hidden=true;
 body.innerHTML='<p>為道具補充經核對的取得方式、詳細描述、效果與圖片。沒有來源時不會猜測掉落地點。</p>'+
 '<label>道具名稱<input id="catSourceName" list="catSourceNames" placeholder="例如：翡翠戒指-LT[1]"><datalist id="catSourceNames"></datalist></label>'+
 '<div class="cat-manage-grid"><label>道具類型<input id="catSourceType" placeholder="例如：飾品、卡片"></label>'+
 '<label>道具編號<input id="catSourceId" placeholder="未登錄可留空"></label></div>'+
 '<label>道具說明<textarea id="catSourceDescription" rows="3"></textarea></label>'+
 '<label>能力／效果<textarea id="catSourceStats" rows="3"></textarea></label>'+
 '<label>已確認的取得來源（每行一種）<textarea id="catSourceOrigin" rows="5" placeholder="活動兌換&#10;副本獎勵"></textarea></label>'+
 '<label>道具圖片 URL（HTTPS）<input id="catSourceImage" type="url" placeholder="https://example.com/item.webp"></label>'+
 '<div class="cat-manage-buttons"><button type="button" class="primary" id="catSourceSave">儲存道具資料至編輯器</button>'+
 '<button type="button" id="catSourceClear">清空表單</button><button type="button" class="danger" id="catSourceDelete">刪除此筆道具資料</button></div>'+
 '<p id="catSourceTotal"></p><p id="catSourceStatus" role="status"></p>';
 const target=panel.querySelector('#catManageStatus');
 target.parentNode.insertBefore(body,target);
 tab.addEventListener('click',()=>{
  panel.querySelectorAll('[data-pane]').forEach(x=>x.classList.toggle('active',x===tab));
  panel.querySelectorAll('[data-pane-content]').forEach(x=>x.hidden=x!==body);
 });
 $('catSourceName').addEventListener('change',fill);
 $('catSourceSave').addEventListener('click',save);
 $('catSourceClear').addEventListener('click',clear);
 $('catSourceDelete').addEventListener('click',remove);
 document.addEventListener('starro-config-applied',refresh);
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();