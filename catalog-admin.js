(()=>{
'use strict';
const $=id=>document.getElementById(id);
const e=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const html=[
'<section class="cat-manage" id="catManage">',
'<header><h2>📚 收藏／轉蛋資料與圖片管理</h2><a href="catalog.html" target="_blank" rel="noopener">開啟圖鑑 ↗</a></header>',
'<p>可新增收藏及轉蛋，設定圖片 URL 或上傳小圖。編輯完成後，請按右上角「儲存全部」才會發布到網站。</p>',
'<nav class="cat-manage-tabs"><button type="button" data-pane="collections" class="active">📚 收藏</button><button type="button" data-pane="gacha">🎁 轉蛋池</button><button type="button" data-pane="pictures">🖼️ 圖片</button><button type="button" data-pane="equipment">🛡️ 道具詳情／來源</button></nav>',
'<div class="cat-manage-pane" data-pane-content="collections">',
'<label>選擇自訂收藏<select id="catCollectionSelect"><option value="">＋ 新增一筆收藏</option></select></label>',
'<div class="cat-manage-grid"><label>收藏名稱<input id="catCollectionName" maxlength="120"></label><label>分類<select id="catCollectionGroup"><option>普通收藏</option><option>特殊收藏</option><option>自訂收藏</option></select></label>',
'<label>遊戲分類／編號<input id="catCollectionGame" placeholder="[A]裝備-999"></label><label>佔用格數<input id="catCollectionSlot" type="number" min="0" max="100" value="1"></label></div>',
'<label>效果<textarea id="catCollectionEffect" rows="2"></textarea></label>',
'<label>需求裝備／卡片（每行一種）<textarea id="catCollectionRequired" rows="4"></textarea></label>',
'<label>圖片網址（HTTPS）<input id="catCollectionImage" type="url" placeholder="https://example.com/icon.webp"></label>',
'<label>或上傳圖片（自動縮小為 128px）<input id="catCollectionFile" type="file" accept="image/png,image/jpeg,image/webp"></label>',
'<div class="cat-manage-buttons"><button id="catCollectionSave" class="primary" type="button">新增／更新收藏</button><button id="catCollectionNew" type="button">清空表單</button><button id="catCollectionDelete" type="button" class="danger">刪除收藏</button></div></div>',
'<div class="cat-manage-pane" data-pane-content="gacha" hidden>',
'<label>選擇已建立轉蛋池<select id="catPoolSelect"><option value="">＋ 新增轉蛋池</option></select></label>',
'<div class="cat-manage-grid"><label>轉蛋名稱<input id="catPoolName" placeholder="XR轉蛋（01）"></label><label>轉蛋類型<select id="catPoolType"><option>XR</option><option>紅利轉蛋</option><option>商城轉蛋</option><option>其他</option></select></label>',
'<label>轉蛋編號<input id="catPoolNumber" placeholder="XR-001"></label><label>轉蛋圖片網址（HTTPS）<input id="catPoolImage" type="url"></label></div>',
'<label>說明<textarea id="catPoolDescription" rows="2"></textarea></label>',
'<label>獎品清單（每行：道具名稱 | 機率或備註 | 圖片網址）<textarea id="catPoolDrops" rows="10" placeholder="星辰戒指[1] | 0.5% | https://example.com/ring.webp"></textarea></label>',
'<label>或上傳轉蛋圖片（自動縮小為 128px）<input id="catPoolFile" type="file" accept="image/png,image/jpeg,image/webp"></label>',
'<div class="cat-manage-buttons"><button id="catPoolSave" type="button" class="primary">新增／更新轉蛋池</button><button type="button" id="catPoolNew">清空表單</button><button id="catPoolDelete" type="button" class="danger">刪除轉蛋池</button></div></div>',
'<div class="cat-manage-pane" data-pane-content="pictures" hidden>',
'<p>適合為現有收藏、需求裝備、轉蛋獎品設定圖片。名稱需與圖鑑中的道具名稱一致。</p>',
'<label>收藏或道具名稱<input id="catPictureName" placeholder="翡翠戒指-LT[1]"></label>',
'<label>圖片網址（HTTPS）<input id="catPictureUrl" type="url"></label>',
'<label>或上傳圖片<input id="catPictureFile" type="file" accept="image/png,image/jpeg,image/webp"></label>',
'<div class="cat-manage-buttons"><button type="button" id="catPictureSave" class="primary">儲存圖片</button><button type="button" id="catPictureDelete">刪除圖片</button></div>',
'<div id="catPicturePreview"></div><div id="catPictureList"></div></div>',
'<div class="cat-manage-pane" data-pane-content="equipment" hidden>',
'<p>針對圖鑑與進階收藏中的需求道具，可補充道具編號、說明、效果、來源、圖片及參考網址。資料會在兩個頁面的道具詳細視窗顯示。請只填寫已核實的來源。</p>',
'<label>道具名稱（須與收藏需求名稱一致）<input id="catEquipName" maxlength="200" placeholder="例如：翡翠戒指-LT[1]"></label>',
'<div class="cat-manage-grid"><label>道具 ID<input id="catEquipId" maxlength="80"></label><label>裝備分類<input id="catEquipType" maxlength="120" placeholder="飾品／卡片／材料"></label></div>',
'<label>道具說明<textarea id="catEquipDesc" rows="3"></textarea></label>',
'<label>能力／效果<textarea id="catEquipStats" rows="3"></textarea></label>',
'<label>已確認取得來源（每行一個；例如：XX副本獎勵、XX轉蛋）<textarea id="catEquipSources" rows="4"></textarea></label>',
'<label>資料參考網址（HTTPS；可貼該道具的實際資料頁）<input id="catEquipReference" type="url" placeholder="https://ro-collectitem-yuno.netlify.app/"></label>',
'<label>道具圖片 URL（HTTPS）<input id="catEquipImage" type="url" placeholder="https://example.com/item.webp"></label>',
'<label>或上傳圖片<input id="catEquipFile" type="file" accept="image/png,image/jpeg,image/webp"></label>',
'<div class="cat-manage-buttons"><button type="button" id="catEquipImportRef">從參考網站帶入已核對資料</button><button type="button" class="primary" id="catEquipSave">儲存道具詳情</button><button type="button" id="catEquipReset">新增／清空</button><button type="button" id="catEquipDelete" class="danger">刪除此道具資料</button></div>',
'<label>選擇已建立的道具資料<select id="catEquipSaved"><option value="">＋ 新增資料</option></select></label>',
'<p>參考資料：<a href="https://ro-collectitem-yuno.netlify.app/" target="_blank" rel="noopener noreferrer">RO 收藏／轉蛋查詢網站</a>。參考網址僅為查核入口，不會自動推定掉落率或來源。</p>',
'</div>',
'<p id="catManageStatus" role="status">尚未修改。</p>',
'</section>'
].join('');
function model(){
 const c=cfg.features.catalog||(cfg.features.catalog={enabled:true,items:[],gachaPools:[],images:{}});
 if(!Array.isArray(c.items))c.items=[];
 if(!Array.isArray(c.gachaPools))c.gachaPools=[];
 if(!c.images||typeof c.images!=='object')c.images={};
 if(!c.equipmentDetails||typeof c.equipmentDetails!=='object')c.equipmentDetails={};
 return c;
}
function status(s,error=false){$('catManageStatus').textContent=s;$('catManageStatus').style.color=error?'#ffb6b0':'#a6efc3'}
function changed(message){setDirty(true);status(message+'。請再按「儲存全部」發布。');refresh()}
function validImage(s){return !s||/^https:\/\//i.test(s)||/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(s)&&s.length<90000}
async function pickImage(url,file){
 const f=$(file).files[0];
 if(f){
   if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>3*1024*1024)throw Error('圖片只限 PNG／JPG／WebP，原始檔不可超過 3MB');
   const bitmap=await createImageBitmap(f),scale=Math.min(1,128/Math.max(bitmap.width,bitmap.height));
   const cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(bitmap.width*scale));cv.height=Math.max(1,Math.round(bitmap.height*scale));
   cv.getContext('2d').drawImage(bitmap,0,0,cv.width,cv.height);bitmap.close?.();
   const data=cv.toDataURL('image/webp',.68);
   if(data.length>40000)throw Error('圖片壓縮後過大，請改用圖片網址');
   return data;
 }
 const v=$(url).value.trim();if(!validImage(v))throw Error('圖片網址只能使用 HTTPS');
 return v;
}
function refresh(){
 const c=model();
 const selectedCol=$('catCollectionSelect').value,selectedPool=$('catPoolSelect').value,selectedEquip=$('catEquipSaved').value;
 $('catCollectionSelect').innerHTML='<option value="">＋ 新增一筆收藏</option>'+c.items.map(x=>'<option value="'+e(x.id)+'">'+e(x.name)+'</option>').join('');
 $('catPoolSelect').innerHTML='<option value="">＋ 新增轉蛋池</option>'+c.gachaPools.map(x=>'<option value="'+e(x.key)+'">'+e(x.name)+'</option>').join('');
 $('catCollectionSelect').value=selectedCol;$('catPoolSelect').value=selectedPool;
 $('catEquipSaved').innerHTML='<option value="">＋ 新增資料</option>'+Object.keys(c.equipmentDetails).sort((a,b)=>a.localeCompare(b,'zh-Hant')).map(n=>'<option value="'+e(n)+'">'+e(n)+'</option>').join('');
 $('catEquipSaved').value=selectedEquip;
 $('catPictureList').innerHTML='<p>已設定 '+Object.keys(c.images).length+' 筆圖片</p>'+Object.keys(c.images).slice(-30).reverse().map(n=>'<button type="button" data-image-name="'+e(n)+'">'+e(n)+'</button>').join('');
}
function resetCollection(){
 $('catCollectionSelect').value='';
 ['catCollectionName','catCollectionGame','catCollectionEffect','catCollectionRequired','catCollectionImage','catCollectionFile'].forEach(id=>$(id).value='');
 $('catCollectionGroup').value='普通收藏';$('catCollectionSlot').value=1;
}
function resetPool(){
 $('catPoolSelect').value='';
 ['catPoolName','catPoolNumber','catPoolImage','catPoolDescription','catPoolDrops','catPoolFile'].forEach(id=>$(id).value='');
 $('catPoolType').value='XR';
}
function fillCollection(){
 const x=model().items.find(x=>x.id===$('catCollectionSelect').value);if(!x){resetCollection();return}
 $('catCollectionName').value=x.name;$('catCollectionGroup').value=x.group==='JRO收藏'?'特殊收藏':(x.group||'普通收藏');
 $('catCollectionGame').value=x.game||'';$('catCollectionSlot').value=x.slot||0;
 $('catCollectionEffect').value=x.effect||'';$('catCollectionRequired').value=(x.required||[]).join('\n');
 $('catCollectionImage').value=x.image?.startsWith('data:')?'':x.image||'';$('catCollectionFile').value='';
}
function fillPool(){
 const x=model().gachaPools.find(x=>x.key===$('catPoolSelect').value);if(!x){resetPool();return}
 $('catPoolName').value=x.name;$('catPoolType').value=x.type||'其他';
 $('catPoolNumber').value=x.id||'';$('catPoolImage').value=x.image?.startsWith('data:')?'':x.image||'';
 $('catPoolDescription').value=x.description||'';
 $('catPoolDrops').value=(x.items||[]).map(v=>[v.name,v.rate||'',v.image||''].join(' | ')).join('\n');
 $('catPoolFile').value='';
}
async function saveCollection(){
 const c=model(),old=c.items.find(x=>x.id===$('catCollectionSelect').value),name=$('catCollectionName').value.trim();
 if(!name)throw Error('收藏名稱不可為空');
 if(c.items.some(x=>x.name===name&&x!==old))throw Error('已有同名收藏');
 const slot=Number($('catCollectionSlot').value);
 if(!Number.isInteger(slot)||slot<0||slot>100)throw Error('佔格數必須在 0～100');
 const image=await pickImage('catCollectionImage','catCollectionFile');
 const row={id:old?.id||'item-'+Date.now().toString(36),group:$('catCollectionGroup').value,row:old?.row||900000+Math.floor(Math.random()*100000),
  name,game:$('catCollectionGame').value.trim(),effect:$('catCollectionEffect').value.trim(),slot,
  required:$('catCollectionRequired').value.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,120),image:image||old?.image||''};
 if(old)c.items.splice(c.items.indexOf(old),1,row);else c.items.push(row);
 changed('已儲存收藏「'+name+'」');$('catCollectionSelect').value=row.id;
}
function drops(){
 const lines=$('catPoolDrops').value.split('\n').map(s=>s.trim()).filter(Boolean);
 if(!lines.length||lines.length>300)throw Error('每個轉蛋池請填 1～300 種獎品');
 return lines.map((s,i)=>{
  const parts=s.split('|').map(x=>x.trim());if(!parts[0])throw Error('第 '+(i+1)+' 行沒有獎品名稱');
  if(!validImage(parts[2]||''))throw Error('第 '+(i+1)+' 行圖片網址格式錯誤');
  return {name:parts[0],rate:parts[1]||'',image:parts[2]||''};
 });
}
async function savePool(){
 const c=model(),old=c.gachaPools.find(x=>x.key===$('catPoolSelect').value),name=$('catPoolName').value.trim();
 if(!name)throw Error('請輸入轉蛋名稱');
 const image=await pickImage('catPoolImage','catPoolFile');
 const v={key:old?.key||'pool-'+Date.now().toString(36),name,type:$('catPoolType').value,
  id:$('catPoolNumber').value.trim(),description:$('catPoolDescription').value.trim(),
  items:drops(),image:image||old?.image||''};
 if(old)c.gachaPools.splice(c.gachaPools.indexOf(old),1,v);else c.gachaPools.push(v);
 changed('已儲存轉蛋「'+name+'」共 '+v.items.length+' 種獎品');$('catPoolSelect').value=v.key;
}
function preview(){
 const url=model().images[$('catPictureName').value.trim()],box=$('catPicturePreview');box.replaceChildren();
 if(!url||!validImage(url))return;
 const img=document.createElement('img');img.src=url;img.alt='預覽';img.style.cssText='width:96px;height:96px;object-fit:contain;border:1px solid #6585a5;border-radius:12px';
 box.appendChild(img);
}
function resetEquip(){
  $('catEquipSaved').value='';
  for(const id of ['catEquipName','catEquipId','catEquipType','catEquipDesc','catEquipStats','catEquipSources','catEquipReference','catEquipImage','catEquipFile'])$(id).value='';
}
function fillEquip(){
  const name=$('catEquipSaved').value;
  const data=model().equipmentDetails[name];
  if(!data){resetEquip();return}
  $('catEquipName').value=name;
  $('catEquipId').value=data.itemId||'';
  $('catEquipType').value=data.type||'';
  $('catEquipDesc').value=data.description||'';
  $('catEquipStats').value=data.stats||'';
  $('catEquipSources').value=(Array.isArray(data.sources)?data.sources:[data.source||'']).filter(Boolean).join('\n');
  $('catEquipReference').value=data.referenceUrl||'';
  $('catEquipImage').value=(data.image||'').startsWith('data:')?'':(data.image||'');
  $('catEquipFile').value='';
}
async function saveEquip(){
  const name=$('catEquipName').value.trim();
  if(!name)throw Error('請輸入要對應的道具名稱');
  const oldName=$('catEquipSaved').value;
  const c=model();
  if(oldName&&oldName!==name&&c.equipmentDetails[name])throw Error('已有相同名稱的道具資料');
  const referenceUrl=$('catEquipReference').value.trim();
  if(referenceUrl&&!/^https:\/\//i.test(referenceUrl))throw Error('參考網址須使用 HTTPS');
  const image=await pickImage('catEquipImage','catEquipFile');
  const old=c.equipmentDetails[oldName]||{};
  c.equipmentDetails[name]={
    itemId:$('catEquipId').value.trim(),type:$('catEquipType').value.trim(),
    description:$('catEquipDesc').value.trim(),stats:$('catEquipStats').value.trim(),
    sources:$('catEquipSources').value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,100),
    referenceUrl,image:image||old.image||''
  };
  if(oldName&&oldName!==name)delete c.equipmentDetails[oldName];
  changed('已更新道具「'+name+'」的詳細資料及來源');
  $('catEquipSaved').value=name;
}
function init(){
 const app=$('adminApp');if(!app||$('catManage'))return;
 const host=app.querySelector('.content'),wrap=document.createElement('div');wrap.innerHTML=html;
 host.insertBefore(wrap.firstElementChild,$('featureTable'));
 const section=$('catManage');
 section.querySelectorAll('[data-pane]').forEach(b=>b.onclick=()=>{
  section.querySelectorAll('[data-pane]').forEach(x=>x.classList.toggle('active',x===b));
  section.querySelectorAll('[data-pane-content]').forEach(x=>x.hidden=x.dataset.paneContent!==b.dataset.pane);
 });
 $('catCollectionSelect').onchange=fillCollection;$('catPoolSelect').onchange=fillPool;
 $('catEquipSaved').onchange=fillEquip;
 $('catEquipImportRef').onclick=()=>{
   const name=$('catEquipName').value.trim();
   if(!name){status('請先輸入道具名稱',true);return;}
   const ref=window.StarroReferenceLookup?.details(name)||{};
   if(!ref.itemId){status('參考資料沒有唯一符合「'+name+'」的道具，請核對名稱或改用手動編輯',true);return;}
   if(!$('catEquipId').value)$('catEquipId').value=ref.itemId;
   if(!$('catEquipType').value)$('catEquipType').value=ref.type||'';
   if(!$('catEquipSources').value)$('catEquipSources').value=(ref.sources||[]).join('\n');
   if(!$('catEquipImage').value&&ref.image)$('catEquipImage').value=ref.image;
   if(!$('catEquipReference').value&&ref.sourceUrl)$('catEquipReference').value=ref.sourceUrl;
   status('已從參考網站核對道具 ID、分類、圖片及轉蛋名稱；請再確認並按「儲存道具詳情」');
 };
 $('catEquipReset').onclick=resetEquip;
 $('catEquipSave').onclick=()=>saveEquip().catch(err=>status(err.message,true));
 $('catEquipDelete').onclick=()=>{
   const name=$('catEquipSaved').value,c=model();
   if(name&&c.equipmentDetails[name]&&confirm('確定刪除「'+name+'」的道具詳細資料？')){
     delete c.equipmentDetails[name];resetEquip();changed('已刪除道具資料');
   }
 };
 $('catCollectionNew').onclick=resetCollection;$('catPoolNew').onclick=resetPool;
 $('catCollectionSave').onclick=()=>saveCollection().catch(err=>status(err.message,true));
 $('catPoolSave').onclick=()=>savePool().catch(err=>status(err.message,true));
 $('catCollectionDelete').onclick=()=>{
  const c=model(),x=c.items.find(x=>x.id===$('catCollectionSelect').value);
  if(x&&confirm('確定刪除收藏「'+x.name+'」？')){c.items.splice(c.items.indexOf(x),1);resetCollection();changed('已刪除收藏');}
 };
 $('catPoolDelete').onclick=()=>{
  const c=model(),x=c.gachaPools.find(x=>x.key===$('catPoolSelect').value);
  if(x&&confirm('確定刪除轉蛋「'+x.name+'」與獎品？')){c.gachaPools.splice(c.gachaPools.indexOf(x),1);resetPool();changed('已刪除轉蛋池');}
 };
 $('catPictureSave').onclick=async()=>{
  try{const n=$('catPictureName').value.trim();if(!n)throw Error('請填道具或收藏名稱');
   const uri=await pickImage('catPictureUrl','catPictureFile');if(!uri)throw Error('請提供圖片');
   model().images[n]=uri;changed('已儲存「'+n+'」圖片');preview();
  }catch(err){status(err.message,true)}
 };
 $('catPictureDelete').onclick=()=>{
  const n=$('catPictureName').value.trim();
  if(model().images[n]&&confirm('刪除「'+n+'」的圖片？')){delete model().images[n];changed('已刪除圖片');preview();}
 };
 $('catPictureName').oninput=preview;
 $('catPictureList').onclick=evt=>{
  const b=evt.target.closest('[data-image-name]');if(!b)return;
  $('catPictureName').value=b.dataset.imageName;
  const url=model().images[b.dataset.imageName]||'';
  $('catPictureUrl').value=url.startsWith('data:')?'':url;
  preview();
 };
 document.addEventListener('starro-config-applied',refresh);
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();