const test=require('node:test');const assert=require('node:assert/strict');const {workbook}=require('../collection-export.js');
test('XLSX contains a valid ZIP package with all sheets, escaped text and no formulas',()=>{
 const bytes=Buffer.from(workbook([{name:'收藏總覽',rows:[['名稱','數量'],['=1+1 & <測試>',5]]},{name:'總能力',rows:[['ATK',2]]}]));
 assert.equal(bytes.readUInt32LE(0),0x04034b50);assert.equal(bytes.readUInt32LE(bytes.length-22),0x06054b50);
 const files=new Map();let p=0;
 while(bytes.readUInt32LE(p)===0x04034b50){const size=bytes.readUInt32LE(p+18),n=bytes.readUInt16LE(p+26),x=bytes.readUInt16LE(p+28),start=p+30+n+x;files.set(bytes.subarray(p+30,p+30+n).toString(),bytes.subarray(start,start+size).toString());p=start+size;}
 assert.ok(files.has('[Content_Types].xml'));assert.ok(files.has('xl/worksheets/sheet2.xml'));
 const xml=files.get('xl/worksheets/sheet1.xml');assert.match(xml,/=1\+1 &amp; &lt;測試&gt;/);assert.match(xml,/<v>5<\/v>/);assert.doesNotMatch(xml,/<f>/);
});