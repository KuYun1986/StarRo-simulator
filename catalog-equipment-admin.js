(()=>{
'use strict';
const $=id=>document.getElementById(id);
function data(){
  cfg.features.catalog=cfg.features.catalog||{enabled:true,items:[],gachaPools:[],images:{}};
  if(!cfg.features.catalog.equipmentDetails)cfg.features.catalog.equipmentDetails={};
  return cfg.features.catalog.equipmentDetails;
}
function init(){
  if(!$('adminApp')||$('catEquipmentAdmin'))return;
  const div=document.createElement('div');
  div.innerHTML="<section class=\"cat-manage cat-equipment-admin\" id=\"catEquipmentAdmin\"><header><h2>🧰 裝備百科｜詳細資料管理</h2><a href=\"catalog.html?tab=equipment\" target=\"_blank\" rel=\"noopener\">開啟裝備百科 ↗</a></header><p>補上裝備編號、分類、能力效果、詳細描述與圖片。其他收藏需求由圖鑑自動反查。</p><div class=\"cat-manage-grid\"><label>裝備名稱<input id=\"eqAdminName\" list=\"eqAdminNames\" placeholder=\"例如：翡翠戒指-LT[1]\"><datalist id=\"eqAdminNames\"></datalist></label><label>裝備分類<select id=\"eqAdminType\"><option value=\"\">未分類</option><option>頭上</option><option>頭中</option><option>頭下</option><option>鎧甲</option><option>武器</option><option>盾牌</option><option>披肩</option><option>鞋子</option><option>飾品</option><option>影子裝備</option><option>卡片</option><option>其他</option></select></label><label>裝備編號<input id=\"eqAdminItemId\" placeholder=\"遊戲道具 ID\"></label><label>圖片網址（HTTPS）<input id=\"eqAdminImage\" type=\"url\"></label></div><label>裝備能力／詞條<textarea id=\"eqAdminStats\" rows=\"3\"></textarea></label><label>詳細描述／取得條件<textarea id=\"eqAdminDescription\" rows=\"3\"></textarea></label><label>已確認的道具來源（每行一種，轉蛋來源會自動加上）<textarea id=\"eqAdminSources\" rows=\"4\" placeholder=\"活動獎勵／活動名稱&#10;副本獎勵／副本名稱\"></textarea></label><div class=\"cat-manage-buttons\"><button class=\"primary\" id=\"eqAdminSave\" type=\"button\">儲存裝備資料</button><button id=\"eqAdminReset\" type=\"button\">清空</button><button class=\"danger\" id=\"eqAdminDelete\" type=\"button\">刪除詳細資料</button></div><p id=\"eqAdminStatus\" role=\"status\">修改後仍須按「儲存全部」發布。</p></section>";
  const pane=div.firstElementChild,near=$('catManage')||$('featureTable');
  near.insertAdjacentElement('afterend',pane);
  const status=s=>$('eqAdminStatus').textContent=s;
  function fill(name){
    const x=data()[name]||{};
    $('eqAdminName').value=name;$('eqAdminType').value=x.type||'';
    $('eqAdminItemId').value=x.itemId||'';$('eqAdminImage').value=x.image?.startsWith('data:')?'':x.image||'';
    $('eqAdminStats').value=x.stats||'';$('eqAdminDescription').value=x.description||'';
    $('eqAdminSources').value=[x.source,...(Array.isArray(x.sources)?x.sources:[])].filter(Boolean).join('\n');
  }
  function suggest(){
    const names=new Set(Object.keys(data()));
    if(typeof ITEMS!=='undefined')for(const x of ITEMS)for(const s of x.required||[]){
      const n=String(s).replace(/\\s*[×x*]\\s*\\d+(?:\\.\\d+)?$/i,'').trim();
      if(n)names.add(n);
    }
    const option=document.createDocumentFragment();
    for(const n of [...names].sort((a,b)=>a.localeCompare(b,'zh-Hant')).slice(0,12000)){
      const o=document.createElement('option');o.value=n;option.appendChild(o);
    }
    $('eqAdminNames').replaceChildren(option);
  }
  $('eqAdminName').addEventListener('change',()=>fill($('eqAdminName').value.trim()));
  $('eqAdminReset').onclick=()=>fill('');
  $('eqAdminSave').onclick=()=>{
    const name=$('eqAdminName').value.trim();
    if(!name){status('請填裝備名稱');return}
    const image=$('eqAdminImage').value.trim();
    if(image&&!/^https:\/\//i.test(image)){status('圖片只接受 HTTPS 網址');return}
    const previous=data()[name]||{};
    data()[name]={type:$('eqAdminType').value,itemId:$('eqAdminItemId').value.trim(),image:image||previous.image||'',
      stats:$('eqAdminStats').value.trim(),description:$('eqAdminDescription').value.trim(),
      sources:$('eqAdminSources').value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,100),source:''};
    setDirty(true);suggest();status('已更新「'+name+'」，請按「儲存全部」發布。');
  };
  $('eqAdminDelete').onclick=()=>{
    const name=$('eqAdminName').value.trim();
    if(!data()[name]||!confirm('確定刪除「'+name+'」的裝備詳細資料？'))return;
    delete data()[name];fill('');setDirty(true);suggest();status('已刪除資料，請儲存全部。');
  };
  document.addEventListener('starro-config-applied',suggest);
  suggest();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();