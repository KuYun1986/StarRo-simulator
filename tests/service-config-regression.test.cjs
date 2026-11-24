// Run: node --test tests/service-config-regression.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
const context = {window:{},localStorage:{getItem:()=>null,setItem:()=>{}},document:{dispatchEvent:()=>{}},CustomEvent:class {constructor(name,options){this.type=name;this.detail=options.detail}},queueMicrotask:()=>{},console};
vm.runInNewContext(read('starro-config.js'),context,{filename:'starro-config.js'});
const cfg=context.window.StarroConfig.defaults;
const rules=cfg.features.equipment.serviceRules;
const bios=cfg.features.simulators.bios;
const sum=(keys,steps)=>Object.fromEntries(keys.map(k=>[k,steps.reduce((v,x)=>v+(x[k]||0),0)]));
const keys=['red','checks','bless','bigGold','smallGold','taffy','dust'];
test('Bios default 12 stages and 19 materials are valid',()=>{
  assert.equal(bios.stages.length,12);assert.equal(bios.materials.length,19);
  for(const [name,p] of bios.stages){assert.ok(name);assert.ok(p>0&&p<=1)}
  for(const [name,m] of bios.materials)for(const [idx,amount] of Object.entries(m)){assert.ok(+idx>=0&&+idx<12,name);assert.ok(amount>=0&&Number.isFinite(amount),name)}
});
test('High-level +16A -> +20S service totals',()=>{
  const got=sum(keys,[rules.refine['S-BOTH5'],rules.grade.S,rules.refine.S]);
  assert.deepEqual(got,{red:60,checks:44,bless:200,bigGold:30,smallGold:20,taffy:30,dust:270});
  const src=read('equipment.html');
  assert.ok(src.includes('pushS(a,"敲+20","firstS")'));
  assert.ok(src.includes('pushS(a,"敲 S","secondS")'));
});
test('A-grade full +20 -> S -> SS totals',()=>{
  const got=sum(keys,[rules.refine.S,rules.grade.S,rules.refine.S,rules.grade.SS,rules.refine.SS]);
  assert.deepEqual(got,{red:160,checks:109,bless:750,bigGold:65,smallGold:65,taffy:130,dust:1270});
});
