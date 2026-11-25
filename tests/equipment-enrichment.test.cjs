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
