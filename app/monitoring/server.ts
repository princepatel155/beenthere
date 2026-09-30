import { after } from 'next/server';
import { database } from '../../db';

// Only fixed route names, status codes and timings are stored. Never request bodies,
// cookies, credentials, IPs, exception messages, or query strings.
export function monitored<Args extends unknown[]>(route:string,handler:(request:Request,...args:Args)=>Promise<Response>){
 return async (request:Request,...args:Args)=>{
  const started=performance.now();let response:Response;
  try{response=await handler(request,...args);}catch{response=Response.json({error:'Temporarily unavailable. Please try again.'},{status:503,headers:{'Cache-Control':'no-store'}});}
  const duration=Math.round(performance.now()-started),status=response.status,method=request.method;
  after(async()=>{
   try{
    const db=await database(),now=new Date(),hour=now.toISOString().slice(0,13),key=route+':'+method+':'+status;
    await db.collection('monitor_api').updateOne({hour,key},{$inc:{count:1,totalMs:duration},$max:{maxMs:duration},$set:{last:now},$setOnInsert:{hour,key,route,method,status,created:now,expires:new Date(now.getTime()+30*86400000)}},{upsert:true});
   }catch{console.error('monitoring_write_unavailable');}
  });
  return response;
 };
}
