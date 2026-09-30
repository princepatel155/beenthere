import {database} from '../../db';
import {visible} from '../product-server';
import {istDayStart} from './privacy';

export async function monitoringReport(days:number){
 const db=await database(),now=new Date(),start=new Date(now.getTime()-days*86400000),today=istDayStart(now);
 const series=async(name:string,filter:Record<string,unknown>={})=>{
  const [row]=await db.collection(name).aggregate([{$match:filter},{$facet:{total:[{$count:'n'}],period:[{$match:{created:{$gte:start.toISOString()}}},{$count:'n'}],today:[{$match:{created:{$gte:today.toISOString()}}},{$count:'n'}]}}],{maxTimeMS:5000}).toArray();
  return {total:row?.total[0]?.n||0,period:row?.period[0]?.n||0,today:row?.today[0]?.n||0};
 };
 const eventMatch={created:{$gte:start},expires:{$gt:now}};
 const aggregate=async(pipeline:Record<string,unknown>[])=>db.collection('monitor_events').aggregate([{$match:eventMatch},...pipeline],{maxTimeMS:5000}).toArray();
 const group=(field:string,event='page_view')=>aggregate([{$match:{name:event}},{$group:{_id:'$'+field,count:{$sum:1}}},{$sort:{count:-1}},{$limit:10},{$project:{_id:0,label:'$_id',count:1}}]);
 const [users,reviews,stories,photos,trips,comments,helpful,openReports,hidden,topDestinations,events,daily,pages,referrers,devices,searches,zeroSearches,visitors,api,checks,tasks,acknowledged,audit,budget,oldPhotos]=await Promise.all([
  series('accounts'),series('posts',{...visible,kind:'review'}),series('posts',{...visible,kind:'story'}),series('photos'),series('trips'),series('comments',visible),
  db.collection('votes').countDocuments({kind:'helpful'}),db.collection('reports').countDocuments({status:'open'}),db.collection('posts').countDocuments({status:'hidden'}),
  db.collection('posts').aggregate([{$match:{...visible,created:{$gte:start.toISOString()}}},{$group:{_id:{destination:'$destination',state:'$state'},count:{$sum:1}}},{$sort:{count:-1}},{$limit:10},{$project:{_id:0,destination:'$_id.destination',state:'$_id.state',count:1}}],{maxTimeMS:5000}).toArray(),
  aggregate([{$group:{_id:{name:'$name',visitor:'$visitor'},count:{$sum:1}}},{$group:{_id:'$_id.name',count:{$sum:'$count'},visitors:{$sum:1}}},{$project:{_id:0,name:'$_id',count:1,visitors:1}}]),
  aggregate([{$match:{name:'page_view'}},{$group:{_id:{$dateToString:{date:'$created',format:'%Y-%m-%d',timezone:'Asia/Kolkata'}},count:{$sum:1}}},{$sort:{_id:1}},{$project:{_id:0,date:'$_id',count:1}}]),
  group('path'),group('referrer'),group('device'),group('query','search_destination'),
  aggregate([{$match:{name:'search_destination',results:0,query:{$nin:['','[redacted]']}}},{$group:{_id:'$query',count:{$sum:1}}},{$sort:{count:-1}},{$limit:10},{$project:{_id:0,label:'$_id',count:1}}]),
  aggregate([{$match:{name:'page_view'}},{$group:{_id:'$visitor',days:{$addToSet:{$dateToString:{date:'$created',format:'%Y-%m-%d',timezone:'Asia/Kolkata'}}}}},{$group:{_id:null,count:{$sum:1},returning:{$sum:{$cond:[{$gt:[{$size:'$days'},1]},1,0]}}}}]),
  db.collection('monitor_api').aggregate([{$match:{created:{$gte:start}}},{$group:{_id:'$key',route:{$first:'$route'},method:{$first:'$method'},status:{$first:'$status'},count:{$sum:'$count'},totalMs:{$sum:'$totalMs'},maxMs:{$max:'$maxMs'},last:{$max:'$last'}}},{$sort:{status:-1,count:-1}},{$project:{_id:0,key:'$_id',route:1,method:1,status:1,count:1,totalMs:1,maxMs:1,last:1}}],{maxTimeMS:5000}).toArray(),
  db.collection('monitor_checks').find({created:{$gte:start}},{projection:{_id:0,source:1,checks:1,created:1}}).sort({created:-1}).limit(1500).toArray(),
  db.collection('monitor_tasks').find({},{projection:{_id:0,actor:0}}).sort({created:-1}).limit(100).toArray(),
  db.collection('monitor_ack').find({},{projection:{_id:0,key:1,at:1}}).toArray(),
  db.collection('monitor_audit').find({},{projection:{_id:0,actor:0}}).sort({created:-1}).limit(15).toArray(),
  db.collection('monitor_budget').findOne({key:now.toISOString().slice(0,10)+':all'},{projection:{_id:0,count:1}}),
  db.collection('photos').countDocuments({created:{$exists:false}}),
 ]);
 const scheduled=checks.filter(c=>c.source==='scheduled'),success=scheduled.filter(c=>c.checks.every((x:{ok:boolean})=>x.ok)).length;
 return {generatedAt:now.toISOString(),start:start.toISOString(),days,todayStart:today.toISOString(),
  community:{users,reviews,stories,photos,trips,comments,helpful,openReports,hidden,oldPhotos},topDestinations,events,daily,pages,referrers,devices,searches,zeroSearches,
  audience:{visitors:visitors[0]?.count||0,returning:visitors[0]?.returning||0},api,checks:checks.slice(0,20),health:{scheduled:scheduled.length,success,lastScheduled:scheduled[0]?.created||null},tasks,acknowledged,audit,
  budget:{today:budget?.count||0,limit:2000},
 };
}
export type MonitoringReport=Awaited<ReturnType<typeof monitoringReport>>;
