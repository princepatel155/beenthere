import { database } from '../../../db';
import { sameOrigin,getCurrentUser } from '../../auth/session';
import { eventNames,isOwner,safePath,safeSearch,safeReferrer } from '../../monitoring/privacy';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 if(!sameOrigin(request))return json({error:'Invalid origin'},403);
 if(request.headers.get('dnt')==='1')return json({accepted:0});
 if(Number(request.headers.get('content-length'))>12000)return json({error:'Batch too large'},413);
 try{
  const text=await request.text();if(text.length>12000)return json({error:'Batch too large'},413);
  const body=JSON.parse(text);
  if(body?.consent!==true||!Array.isArray(body.events)||body.events.length>20||!/^[a-f0-9-]{36}$/.test(body.visitor||''))return json({error:'Invalid analytics batch'},400);
  const user=await getCurrentUser();if(isOwner(user?.email))return json({accepted:0,ownerExcluded:true});
  const now=new Date(),expires=new Date(now.getTime()+30*86400000);
  const events=body.events.filter((e:any)=>e&&eventNames.includes(e.name)&&/^[a-f0-9-]{36}$/.test(e.id||'')).map((e:any)=>({
   id:e.id,name:e.name,visitor:body.visitor,path:safePath(e.path),created:now,expires,
   device:['Mobile','Tablet','Desktop'].includes(e.device)?e.device:'Unknown',
   referrer:safeReferrer(e.referrer),
   ...(e.name==='search_destination'?{query:safeSearch(e.query),results:Number.isInteger(e.results)?Math.max(0,Math.min(60,e.results)):0}:{}),
  }));
  if(!events.length)return json({accepted:0});
  const db=await database(),minute=now.toISOString().slice(0,16),day=now.toISOString().slice(0,10);
  // Atomic shared budgets also bound bot/spoofed browser IDs and storage growth.
  for(const [key,limit] of [[minute+':'+body.visitor,60],[minute+':all',300],[day+':all',2000]] as const){
   try{await db.collection('monitor_budget').updateOne({key},{$setOnInsert:{key,count:0,expires}},{upsert:true});}catch(e:any){if(e.code!==11000)throw e;}
   const allowed=await db.collection('monitor_budget').updateOne({key,count:{$lte:limit-events.length}},{$inc:{count:events.length}});
   if(!allowed.modifiedCount)return json({error:'Analytics collection limit reached'},429);
  }
  await db.collection('monitor_events').bulkWrite(events.map((event:any)=>({updateOne:{filter:{id:event.id},update:{$setOnInsert:event},upsert:true}})),{ordered:false});
  return json({accepted:events.length});
 }catch{return json({error:'Analytics unavailable'},503);}
}
