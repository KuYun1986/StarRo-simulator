'use strict';
/* Probe ONLY public Supabase endpoints. Never logs API keys or user data. */
const fs=require('node:fs'),path=require('node:path');
const text=fs.readFileSync(path.join(__dirname,'..','supabase-config.js'),'utf8');
const matchUrl=text.match(/url:\s*['"]([^'"]+)['"]/);
const matchKey=text.match(/anonKey:\s*['"]([^'"]+)['"]/);
if(!matchUrl||!matchKey)throw new Error('Missing public Supabase configuration');
const root=matchUrl[1].replace(/\/$/,''),key=matchKey[1];
async function probe(uri,options={}){
 try{
  const res=await fetch(uri,{...options,signal:AbortSignal.timeout(12000),redirect:'manual'});
  const raw=await res.text();
  let json={};
  try{json=JSON.parse(raw)}catch{}
  return {status:res.status,location:res.headers.get('location'),json};
 }catch(e){return{status:'network-failed',error:String(e.message||e)}}
}
(async()=>{
 const auth=await probe(root+'/auth/v1/settings',{headers:{apikey:key}});
 const google=auth.json?.external?.google===true;
 const rest=await probe(root+'/rest/v1/collection_progress?select=user_id&limit=0',{headers:{apikey:key,Accept:'application/json'}});
 const missing=rest.json?.code==='PGRST205'||/Could not find the table .*collection_progress|relation .*collection_progress.* does not exist/i.test(rest.json?.message||'');
 const tableKnown=missing?'missing':rest.status===200?'accessible-with-anon':
    (rest.status===401||rest.status===403)?'restricted-or-permission-denied':'undetermined';
 const report={authHttp:auth.status,googleProviderEnabled:google,googleProviderReported:typeof auth.json?.external?.google==='boolean',progressTableHttp:rest.status,progressTableStatus:tableKnown,progressTableCode:rest.json?.code||null};
 console.log('SUPABASE_PUBLIC_READINESS '+JSON.stringify(report));
 if(auth.status!==200||!google)console.log('ACTION: Enable Google Auth provider in Supabase and configure Google Cloud OAuth client and redirect URI.');
 if(missing)console.log('ACTION: Run collection_progress_setup.sql in the Supabase SQL editor.');
 else if(tableKnown==='restricted-or-permission-denied')console.log('INFO: Anonymous users may be correctly blocked. Signed-in row read/write requires an authenticated test.');
})().catch(e=>{console.log('SUPABASE_PUBLIC_READINESS_FAILED '+e.message);});
