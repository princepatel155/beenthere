import {database} from '../../../db';
import {getCurrentUser,sameOrigin} from '../../auth/session';
import {isOwner} from '../../monitoring/privacy';
import {monitoringReport} from '../../monitoring/report';
import {runHealthChecks} from '../../monitoring/checks';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
export async function GET(request:Request){
 try{
  const user=await getCurrentUser();if(!user)return json({error:'Sign in to access monitoring.'},401);
  if(!isOwner(user.email))return json({error:'Owner access required.'},403);
  const requested=Number(new URL(request.url).searchParams.get('days')||7),days=[1,7,30].includes(requested)?requested:7;
  return json(await monitoringReport(days));
 }catch{return json({error:'Monitoring data is unavailable. Check Netlify function logs and Atlas availability.'},503);}
}
export async function POST(request:Request){
 if(!sameOrigin(request))return json({error:'Invalid origin'},403);
 try{
  const user=await getCurrentUser();if(!user)return json({error:'Sign in first.'},401);
  if(!isOwner(user.email))return json({error:'Owner access required.'},403);
  const text=await request.text();if(text.length>2000)return json({error:'Request too large'},413);
  const b=JSON.parse(text),db=await database(),now=new Date();
  if(!b||typeof b!=='object')return json({error:'Invalid action'},400);
  let description='';
  if(b.action==='check'){
   try{await db.collection('monitor_ack').updateOne({key:'health-lock'},{$setOnInsert:{key:'health-lock',at:new Date(0)}},{upsert:true});}catch(e:any){if(e.code!==11000)throw e;}
   const lock=await db.collection('monitor_ack').updateOne({key:'health-lock',at:{$lt:new Date(Date.now()-60000)}},{$set:{at:now}});
   if(!lock.modifiedCount)return json({error:'Wait a minute before running another health check.'},429);
   return json({checks:await runHealthChecks('manual')});
  }else if(b.action==='acknowledge'){
   if(typeof b.key!=='string'||!await db.collection('monitor_api').findOne({key:b.key,status:{$gte:400}}))return json({error:'Issue not found.'},404);
   await db.collection('monitor_ack').updateOne({key:b.key},{$set:{at:now}},{upsert:true});description='Acknowledged '+b.key;
  }else if(b.action==='task-create'){
   const title=typeof b.title==='string'?b.title.trim().slice(0,160):'';
   if(title.length<3)return json({error:'Add a descriptive task.'},400);
   if(await db.collection('monitor_tasks').countDocuments({})>=100)return json({error:'The action board is limited to 100 tasks.'},409);
   const key=title.toLowerCase();
   await db.collection('monitor_tasks').updateOne({key},{$setOnInsert:{id:crypto.randomUUID(),key,title,status:'open',created:now}},{upsert:true});description='Added task: '+title;
  }else if(b.action==='task-status'){
   if(!['open','done'].includes(b.status)||typeof b.id!=='string')return json({error:'Invalid task update.'},400);
   const result=await db.collection('monitor_tasks').updateOne({id:b.id},{$set:{status:b.status,updated:now}});
   if(!result.matchedCount)return json({error:'Task not found.'},404);description='Task marked '+b.status;
  }else return json({error:'Unknown action'},400);
  await db.collection('monitor_audit').insertOne({description,actor:user.userId,created:now,expires:new Date(now.getTime()+30*86400000)});
  return json({ok:true});
 }catch{return json({error:'Action could not be completed. Please retry.'},503);}
}
