'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const official=require('../starro-official-equipment.js');
const helper=require('../starro-equipment-enrichment.js');
test('LT suffix is removed only in the correct slot position, not loosely',()=>{
 assert.equal(helper.isLT('翡翠戒指-LT[1]'),true);
 assert.equal(helper.isLT('A階 阿斯特莉亞鎧甲-LT[1]'),true);
 assert.equal(helper.isLT('翡翠戒指[1]'),false);
 assert.equal(helper.isLT('超級LT武器[1]'),false);
 assert.equal(helper.withoutLT('翡翠戒指-LT[1]'),'翡翠戒指[1]');
});
test('original-equipment gacha family is matched exactly including slot',()=>{
 const names=['翡翠戒指 [1]','翡翠戒指 [0]','翡翠耳環 [1]','其他翡翠戒指[1]'];
 assert.equal(helper.findBase('翡翠戒指-LT[1]',names),'翡翠戒指 [1]');
 assert.equal(helper.matchesBase('翡翠戒指-LT[1]','翡翠戒指 [1]'),true);
 assert.equal(helper.matchesBase('翡翠戒指-LT[1]','翡翠戒指[0]'),false);
 assert.equal(helper.matchesBase('翡翠戒指-LT[1]','翡翠耳環[1]'),false);
 assert.equal(helper.findBase('不存在原版-LT[1]',names),null);
});
test('refinement and rank only strip on LT original candidate matching',()=>{
 const names=['阿斯特莉亞鎧甲[1]','阿斯特莉亞斗篷[1]'];
 assert.equal(helper.findBase('+15 A階 阿斯特莉亞鎧甲-LT[1]',names),'阿斯特莉亞鎧甲[1]');
 assert.equal(helper.findBase('A階 阿斯特莉亞鎧甲-LT[1]',names),'阿斯特莉亞鎧甲[1]');
 assert.equal(helper.findBase('(B級) 阿斯特莉亞鎧甲-LT[1]',names),'阿斯特莉亞鎧甲[1]');
 assert.equal(helper.matchesBase('阿斯特莉亞鎧甲-LT[1]','阿斯特莉亞斗篷[1]'),false);
});
test('never use original non-LT ability as LT effect',()=>{
 const emerald=helper.officialEffect('翡翠戒指-LT[1]');
 assert.ok(emerald?.text.includes('All State+5'));
 assert.ok(emerald.url.includes('ro.gnjoy.com.tw'));
 assert.ok(official.entries>=23);
 assert.equal(helper.officialEffect('翡翠戒指[1]'),null);
 const armorEffect=helper.officialEffect('A階 阿斯特莉亞鎧甲-LT[1]');
 assert.ok(armorEffect&&armorEffect.text.includes('MaxHP'));
 assert.equal(armorEffect.partial,true);
 assert.ok(armorEffect.url.startsWith('https://ro.gnjoy.com.tw/'));
});
test('extra official guide LT effects are available with citations',()=>{
 for(const name of ['阿斯特莉亞斗篷-LT[1]','阿斯特莉亞戰盔-LT[1]','魔鬼惡火斗篷-LT[1]']){
  const effect=helper.officialEffect(name);
  assert.ok(effect?.text?.length>40,name+' verified effect must be available');
  assert.equal(effect.url,'https://ro.gnjoy.com.tw/notice/guide_view.aspx?id=205519');
 }
});
test('only explicit gacha sources are inherited',()=>{
 assert.equal(helper.isGachaSource('轉蛋：魅力轉蛋（SSS）｜編號 62345'),true);
 assert.equal(helper.isGachaSource('野外魔物掉落'),false);
 assert.equal(helper.isGachaSource('商城直接販售'),false);
 assert.ok(helper.conversionNote.includes('改造升級成 LT'));
 assert.ok(helper.sourceFooter().includes('資料來源'));
 assert.ok(helper.sourceFooter(null,'','翡翠戒指-LT[1]').includes('UrlQuery='+encodeURIComponent('翡翠戒指-LT[1]')),'official source search should be item-specific');
});

test('official sourced effect excerpts include verified bonus and source URL',()=>{
 for(const name of ['翡翠戒指-LT[1]','翡翠耳環-LT[1]','翡翠玉結晶戰靴-LT[1]',
  '魔力之星-LT[1]','深紅寶石胸針-LT[1]','時光超越者之戒-LT[1]']){
  const entry=helper.officialEffect(name);
  assert.ok(entry?.text.length>45,name+' official extract missing');
  assert.ok(entry.url.startsWith('https://ro.gnjoy.com.tw/'),name+' official reference missing');
 }
 assert.equal(helper.officialEffect('不存在的 LT[1]'),null);
 assert.ok(helper.sourceFooter(helper.officialEffect('時光超越者之戒-LT[1]')).includes('216130'));
 assert.ok(helper.sourceFooter().includes('Ro/RoItemSearch'));
});

test('StarRO alias resolves exact item ID and never substitutes LT effects',()=>{
 const lookup=require('../catalog-reference-lookup.js');
 globalThis.StarroReferenceIndex={site:'https://ro-collectitem-yuno.netlify.app/',items:{'470120':{itemId:'470120',type:'鞋子',image:'https://ro-collectitem-yuno.netlify.app/item-icons/470120.png',gacha:[{name:'禁咒轉蛋',tier:'SSS'}]}},byName:{'機械鋁合金改造靴[1]':'470120'}};
 const row=lookup.merge('機械鋁合金改造戰靴[1]');
 assert.equal(row.itemId,'470120');
 assert.ok(row.effect.includes('MDEF +10'));
 assert.ok(lookup.ability(row).includes('繁星尚未核對'));
 assert.ok(row.sources[0].includes('禁咒轉蛋'));
 assert.equal(lookup.find('機械鋁合金改造戰靴-LT[1]'),null);
 globalThis.StarroReferenceIndex.items['470120'].effect='繁星專屬 ATK +999';
 const primary=lookup.merge('機械鋁合金改造戰靴[1]',{effect:'外部 ATK +1'});
 assert.equal(primary.effect,'繁星專屬 ATK +999');
 assert.equal(primary.effectRecord,null);
 delete globalThis.StarroReferenceIndex;
});

test('special collection uses its first UR/XR item image and preserves ordinary covers',()=>{
 const lookup=require('../catalog-reference-lookup.js');
 const item={group:'特殊收藏',name:'不滅的審判',required:['(JRO) 阿穆雷塔特 [1]','(JRO) 審判天秤 [1]']};
 const resolve=n=>n===item.required[0]?'https://ro-collectitem-yuno.netlify.app/item-icons/490290.png':'';
 assert.equal(lookup.collectionCover(item,resolve,'old'),'https://ro-collectitem-yuno.netlify.app/item-icons/490290.png');
 assert.equal(lookup.collectionCover({...item,group:'普通收藏'},resolve,'old'),'old');
 assert.equal(lookup.collectionCover(item,()=>'', 'old'),'old');
 assert.equal(lookup.collectionCover({group:'特殊收藏',name:'XR裝備',required:[]},n=>n==='XR裝備'?'xr.png':''),'xr.png');
});

test('collection covers are globally unique, special reserved, and maximize eligible ordinary assignments',()=>{
 const lookup=require('../catalog-reference-lookup.js');
 const rows=[
  {group:'特殊收藏',row:1,name:'不滅的審判',required:['阿穆']},
  {group:'特殊收藏',row:2,name:'昇華',required:['阿穆']},
  {group:'普通收藏',row:3,name:'彈性',required:['阿穆','甲','乙']},
  {group:'普通收藏',row:4,name:'限制',required:['甲']},
  {group:'普通收藏',row:5,name:'衝突',required:['阿穆']},
  {group:'普通收藏',row:6,name:'僅材料',required:['材料']}
 ];
 const config={images:{阿穆:'https://example.com/a.png',甲:'https://example.com/b.png',乙:'https://example.com/c.png',材料:'https://example.com/d.png'},equipmentDetails:{材料:{type:'材料'}}};
 const result=lookup.buildCollectionCovers(rows,config);
 const get=i=>result.get(lookup.collectionKey(rows[i]));
 assert.equal(get(0),'https://example.com/a.png');
 assert.equal(get(1),undefined);
 assert.equal(get(2),'https://example.com/c.png');
 assert.equal(get(3),'https://example.com/b.png');
 assert.equal(get(4),undefined);
 assert.equal(get(5),undefined);
 assert.equal(result.size,new Set(result.values()).size);
 assert.deepEqual([...lookup.buildCollectionCovers([...rows].reverse(),config)].sort(),[...result].sort());
});

test('昇華 uses the sixth requirement (second UR), not the original UR or second listed item',()=>{
 const lookup=require('../catalog-reference-lookup.js');
 const original={group:'特殊收藏',row:1,name:'奴隸的反撲',required:['奴隸的項圈','紅色貓耳魔女帽']};
 const ascended={group:'特殊收藏',row:2,name:'昇華●奴隸的反撲',required:['奴隸的項圈','紅色貓耳魔女帽','披肩','皇冠','手杖','(IRO) 流放忍者之眼 [1]']};
 const config={images:{'奴隸的項圈':'https://example.com/original.png','紅色貓耳魔女帽':'https://example.com/wrong.png','(IRO) 流放忍者之眼 [1]':'https://example.com/ascended.png'}};
 const result=lookup.buildCollectionCovers([original,ascended],config);
 assert.equal(result.get(lookup.collectionKey(original)),config.images['奴隸的項圈']);
 assert.equal(result.get(lookup.collectionKey(ascended)),config.images['(IRO) 流放忍者之眼 [1]']);
 assert.equal(lookup.collectionCover(ascended,n=>config.images[n]),config.images['(IRO) 流放忍者之眼 [1]']);
 delete config.images['(IRO) 流放忍者之眼 [1]'];
 assert.equal(lookup.buildCollectionCovers([original,ascended],config).get(lookup.collectionKey(ascended)),undefined);
});

test('deduplicate UR and other gacha tiers without merging different issues or IDs',()=>{
 const lookup=require('../catalog-reference-lookup.js');
 const rows=lookup.dedupeSources(['紅利轉蛋-XR（3）（UR獎）','轉蛋：紅利轉蛋-XR（03）（UR）｜編號 62179','XR轉蛋-（3）｜UR賞','紅利轉蛋-XR（3）','紅利轉蛋（10）（UR）｜編號 62123','禁咒轉蛋（SSS獎）','轉蛋：禁咒轉蛋（SSS）｜編號 61966','紅利轉蛋-XR（3）｜XR獎']);
 assert.equal(rows.length,4);
 assert.ok(rows.includes('紅利轉蛋-XR（3）｜UR獎｜編號 62179'));
 assert.ok(rows.includes('紅利轉蛋-XR（3）｜XR獎'));
 assert.ok(rows.includes('紅利轉蛋（10）｜UR獎｜編號 62123'));
 assert.ok(rows.includes('禁咒轉蛋｜SSS獎｜編號 61966'));
 assert.equal(lookup.dedupeSources(['紅利轉蛋（1）｜UR獎｜編號 1','紅利轉蛋（1）｜UR獎｜編號 2']).length,2);
});
