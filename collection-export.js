/* Minimal standards-compliant XLSX export; no network dependency or executable formulas. */
(function(root){
'use strict';
const enc=new TextEncoder();
const xml=s=>String(s??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const header='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main', rel='http://schemas.openxmlformats.org/officeDocument/2006/relationships',pkg='http://schemas.openxmlformats.org/package/2006/relationships';
function col(n){let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
function sheet(rows){
 return header+'<worksheet xmlns="'+ns+'"><sheetData>'+rows.map((r,i)=>'<row r="'+(i+1)+'">'+r.map((v,j)=>{
  const ref=col(j)+(i+1),style=i===0?' s="1"':'';
  return typeof v==='number'&&Number.isFinite(v)?'<c r="'+ref+'"'+style+'><v>'+v+'</v></c>':'<c r="'+ref+'" t="inlineStr"'+style+'><is><t xml:space="preserve">'+xml(v)+'</t></is></c>';
 }).join('')+'</row>').join('')+'</sheetData></worksheet>';
}
const crcTable=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let b=0;b<8;b++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc(data){let c=0xffffffff;for(const v of data)c=crcTable[(c^v)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function bytes(size,fields){const a=new Uint8Array(size),d=new DataView(a.buffer);for(const [pos,width,val] of fields)d[width===2?'setUint16':'setUint32'](pos,val,true);return a;}
function zip(entries){
 let offset=0,centralSize=0;const parts=[],directory=[];
 for(const [name,body] of entries){
  const n=enc.encode(name),data=enc.encode(body),sum=crc(data),size=data.length;
  const local=bytes(30,[[0,4,0x04034b50],[4,2,20],[14,4,sum],[18,4,size],[22,4,size],[26,2,n.length]]);
  const central=bytes(46,[[0,4,0x02014b50],[4,2,20],[6,2,20],[16,4,sum],[20,4,size],[24,4,size],[28,2,n.length],[42,4,offset]]);
  parts.push(local,n,data);directory.push(central,n);offset+=local.length+n.length+size;centralSize+=central.length+n.length;
 }
 const end=bytes(22,[[0,4,0x06054b50],[8,2,entries.length],[10,2,entries.length],[12,4,centralSize],[16,4,offset]]);
 const all=[...parts,...directory,end],out=new Uint8Array(all.reduce((n,p)=>n+p.length,0));let i=0;for(const p of all){out.set(p,i);i+=p.length;}return out;
}
function workbook(sheets){
 const types='http://schemas.openxmlformats.org/package/2006/content-types';
 const entries=[
 ['[Content_Types].xml',header+'<Types xmlns="'+types+'"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>'],
 ['_rels/.rels',header+'<Relationships xmlns="'+pkg+'"><Relationship Id="rId1" Type="'+rel+'/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
 ['xl/workbook.xml',header+'<workbook xmlns="'+ns+'" xmlns:r="'+rel+'"><sheets>'+sheets.map((s,i)=>'<sheet name="'+xml(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>'],
 ['xl/_rels/workbook.xml.rels',header+'<Relationships xmlns="'+pkg+'">'+sheets.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="'+rel+'/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'<Relationship Id="rId'+(sheets.length+1)+'" Type="'+rel+'/styles" Target="styles.xml"/></Relationships>'],
 ['xl/styles.xml',header+'<styleSheet xmlns="'+ns+'"><fonts count="2"><font><sz val="11"/><name val="Microsoft JhengHei"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Microsoft JhengHei"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF173149"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']
 ];
 sheets.forEach((s,i)=>entries.push(['xl/worksheets/sheet'+(i+1)+'.xml',sheet(s.rows)]));
 return zip(entries);
}
root.StarroCollectionExport=Object.freeze({workbook});
if(typeof module!=='undefined'&&module.exports)module.exports=root.StarroCollectionExport;
})(typeof window==='undefined'?globalThis:window);
