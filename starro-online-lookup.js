/* Shared online verification links for item details.
 * No user data is sent until a user clicks an external link.
 * The reference site's index is a metadata snapshot; Divine Pride is an external, region-specific DB.
 */
(function(root){
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
  const clean=value=>String(value??'').trim().slice(0,160);
  const isHttps=url=>typeof url==='string'&&/^https:\/\/[\w.-]+(?::\d+)?(?:[/?#]|$)/i.test(url);
  function search(name,id,refUrl){
    const term=clean(name),code=/^\d{3,9}$/.test(String(id??''))?String(id):'';
    // Search engine deep-links are formed from the user-requested query only.
    const query=encodeURIComponent([term,'仙境傳說 RO 道具 裝備 來源'].filter(Boolean).join(' '));
    const referenceSearch=encodeURIComponent('site:ro-collectitem-yuno.netlify.app '+term);
    return {
      search: 'https://www.google.com/search?q='+query,
      reference: 'https://www.google.com/search?q='+referenceSearch,
      divine: code?'https://www.divine-pride.net/database/item/'+code:'https://www.divine-pride.net/database/item',
      source: isHttps(refUrl)?refUrl:'https://ro-collectitem-yuno.netlify.app/'
    };
  }
  function render(name,id,refUrl){
    const links=search(name,id,refUrl),code=/^\d{3,9}$/.test(String(id??''))?String(id):'';
    return '<div class="starro-online-lookup" aria-label="網路道具查詢">'+
      '<h3>🔎 上網查詢這件道具</h3>'+
      '<p>外站資料可供比對圖片、裝備能力及取得來源；伺服器版本可能不同，未確認資料不會當作繁星服官方設定。</p>'+
      '<div class="starro-online-links">'+
      '<a target="_blank" rel="noopener noreferrer" href="'+esc(links.search)+'">🌐 搜尋裝備資料</a>'+
      '<a target="_blank" rel="noopener noreferrer" href="'+esc(links.reference)+'">🖼️ 搜尋參考圖鑑</a>'+
      '<a target="_blank" rel="noopener noreferrer" href="'+esc(links.divine)+'">'+(code?'📖 Divine Pride #'+esc(code):'📖 Divine Pride 道具庫')+'</a>'+
      (isHttps(refUrl)?'<a target="_blank" rel="noopener noreferrer" href="'+esc(links.source)+'">🔗 已登錄參考來源</a>':'')+
      '</div>'+
      '<small>※ Divine Pride 可切換 twRO／jRO 等伺服器。不同版本的物品編號或能力不一定相同；請以遊戲內為準。</small>'+
    '</div>';
  }
  root.StarroOnlineLookup=Object.freeze({render,search});
})(window);
