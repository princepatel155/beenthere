import { database } from '../../db';

// Fixed production targets prevent the health-check action becoming an SSRF proxy.
export async function runHealthChecks(source:'manual'|'scheduled'){
 const checks=await Promise.all(['https://kissesafarke.netlify.app/','https://kissesafarke.netlify.app/api/health'].map(async(url)=>{
  const start=performance.now();
  try{
   const response=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
   const body=await response.text();
   const valid=url.endsWith('/api/health')?JSON.parse(body).status==='ok':body.includes('Kisse Safar Ke');
   return {target:url.endsWith('/api/health')?'Database API':'Website',ok:response.ok&&valid,status:response.status,ms:Math.round(performance.now()-start)};
  }catch{return {target:url.endsWith('/api/health')?'Database API':'Website',ok:false,status:0,ms:Math.round(performance.now()-start)};}
 }));
 const now=new Date();
 await (await database()).collection('monitor_checks').insertOne({source,checks,created:now,expires:new Date(now.getTime()+30*86400000)});
 return checks;
}
