const test=require('node:test');const assert=require('node:assert/strict');const sim=require('../collection-simulation-core.js');
test('selected effects and duplicate slots follow simulator rules',()=>{
 const rows=[{group:'普通收藏',row:1,name:'A',slot:3,required:['A','B','C'],effect:'STR+2、ATK+5%'},{group:'普通收藏',row:2,name:'B',slot:2,required:['B','D'],effect:'STR+3，當基礎VIT達到100時ATK+10%'},{group:'特殊收藏',row:3,name:'C',slot:2,required:['A'],effect:'MATK+4'},{group:'特殊收藏',row:4,name:'D',slot:1,required:['E'],effect:'ATK+99'}];
 const result=sim.calculate(rows,new Set(['普通收藏|1|A','普通收藏|2|B','特殊收藏|3|C']));
 assert.equal(result.count,3);assert.equal(result.normal,4);assert.equal(result.special,2);assert.equal(result.saved,1);
 const map=new Map(result.entries);assert.equal(map.get('STR'),5);assert.equal(map.get('ATK%'),5);assert.equal(map.get('MATK'),4);assert.equal(map.get('ATK'),undefined);assert.equal(result.conditions.length,1);
});
