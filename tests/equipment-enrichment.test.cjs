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
