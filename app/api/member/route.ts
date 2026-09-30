import {isOwner} from '../../monitoring/privacy';
import {monitored} from '../../monitoring/server';
import { database } from '../../../db';
import { getCurrentUser,sameOrigin } from '../../auth/session';
import { publicProfile,publicPosts,visible,moderator,migrateSaves,ensureTrip,catalogEntry } from '../../product-server';
import { destinations,states } from '../../data';

const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
const clean=(v:unknown,n:number)=>typeof v==='string'?v.trim().slice(0,n):'';
const reasons=['Spam or advertising','Harassment or hate','False or misleading information','Private information','Inappropriate photo','Other'];
async function handleGET(request:Request){
 try{
  const db=await database(),user=await getCurrentUser(),params=new URL(request.url).searchParams;
  const username=params.get('username');
  if(username){
   const account=await db.collection('accounts').findOne({username:username.toLowerCase()});
   if(!account)return json({error:'Traveler not found.'},404);
   const posts=await db.collection('posts').find({user_id:account.id,...visible}).sort({created:-1}).limit(500).toArray();
   const helpful=await db.collection('votes').countDocuments({post_id:{$in:posts.map(p=>p.id)},kind:'helpful'});
   return json({profile:publicProfile(account),posts:await publicPosts(posts,user?.userId),helpful});
  }
  if(!user)return json({error:'Sign in to manage your profile and trips.'},401);
  const canModerate=moderator(user.email);
  if(params.get('view')==='reports'){
   if(!canModerate)return json({error:'Moderator access required.'},403);
   const reports=await db.collection('reports').find({},{projection:{_id:0,user_id:0}}).sort({status:1,created:1}).limit(100).toArray();
   const enriched=await Promise.all(reports.map(async r=>{const target=await db.collection(r.kind==='comment'?'comments':'posts').findOne({id:r.target_id},{projection:{_id:0,title:1,body:1,status:1,post_id:1,author:1,photos:1}});return {...r,target};}));
   return json({reports:enriched});
  }
  await migrateSaves(user.userId);
  const [account,trips,items]=await Promise.all([db.collection('accounts').findOne({id:user.userId}),db.collection('trips').find({user_id:user.userId},{projection:{_id:0,user_id:0,key:0}}).sort({created:-1}).toArray(),db.collection('trip_items').find({user_id:user.userId},{projection:{_id:0,user_id:0}}).toArray()]);
  return json({profile:publicProfile(account!),trips,items,canModerate,canMonitor:isOwner(user.email)});
 }catch{return json({error:'Unable to load your account. Please try again.'},503);}
}
async function handlePOST(request:Request){
 try{
  if(!sameOrigin(request))return json({error:'Invalid request origin.'},403);
  const user=await getCurrentUser();if(!user)return json({error:'Please sign in first.'},401);
  const parsed=await request.json().catch(()=>null);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return json({error:'Invalid request.'},400);
  const b=parsed as Record<string,unknown>;
  const db=await database();
  if(b.action==='profile'){
   const name=clean(b.name,60),username=clean(b.username,30).toLowerCase(),bio=clean(b.bio,300),photo=clean(b.photo,36)||null;
   if(name.length<2||!/^[a-z][a-z0-9_]{2,29}$/.test(username))return json({error:'Use a name and a username of 3–30 letters, numbers or underscores, starting with a letter.'},400);
   if(photo&&!await db.collection('photos').findOne({id:photo,user_id:user.userId}))return json({error:'Upload your own profile photo.'},400);
   await db.collection('accounts').updateOne({id:user.userId},{$set:{name,username,bio,photo}});
   return json({ok:true});
  }
  if(b.action==='trip-create'){
   const name=clean(b.name,80);if(!name)return json({error:'Give your trip a name.'},400);
   const trip=await ensureTrip(user.userId,name);return json({id:trip.id});
  }
  if(['trip-rename','trip-delete','trip-add','trip-remove'].includes(clean(b.action,30))){
   const tripId=clean(b.tripId,36),trip=await db.collection('trips').findOne({id:tripId,user_id:user.userId});
   if(!trip)return json({error:'Trip not found.'},404);
   if(b.action==='trip-rename'){
    const name=clean(b.name,80);if(!name)return json({error:'Give your trip a name.'},400);
    await db.collection('trips').updateOne({id:tripId,user_id:user.userId},{$set:{name,key:name.toLocaleLowerCase('en-IN')}});
   }else if(b.action==='trip-delete'){
    await db.collection('trip_items').deleteMany({trip_id:tripId,user_id:user.userId});await db.collection('trips').deleteOne({id:tripId,user_id:user.userId});
   }else{
    const kind=clean(b.kind,20),targetId=clean(b.targetId,400);
    if(!['experience','destination','place'].includes(kind))return json({error:'Choose a valid item.'},400);
    const filter={trip_id:tripId,user_id:user.userId,kind,target_id:targetId};
    if(b.action==='trip-remove')await db.collection('trip_items').deleteOne(filter);
    else{
     let target;
     if(kind==='experience')target=await db.collection('posts').findOne({id:targetId,...visible});
     else target=await db.collection(kind==='destination'?'destinations':'places').findOne({id:targetId});
     if(!target)return json({error:'This item could not be found.'},404);
     await db.collection('trip_items').updateOne(filter,{$setOnInsert:{...filter,label:target.name||target.title,created:new Date().toISOString()}},{upsert:true});
    }
   }
   return json({ok:true});
  }
  if(b.action==='destination-save'){
   const name=clean(b.destination,100),state=clean(b.state,80),tripName=clean(b.name,80);
   const known=destinations.some(d=>d.name===name&&d.state===state)||!!await db.collection('destinations').findOne({name,state});
   if(!known||!states.includes(state)||!tripName)return json({error:'Choose a destination and name your trip.'},400);
   const entry=await catalogEntry(name,state),trip=await ensureTrip(user.userId,tripName),filter={trip_id:trip.id,user_id:user.userId,kind:'destination',target_id:entry.destination_id};
   await db.collection('trip_items').updateOne(filter,{$setOnInsert:{...filter,label:name,created:new Date().toISOString()}},{upsert:true});return json({ok:true});
  }
  if(b.action==='report'){
   const kind=b.kind==='comment'?'comment':'experience',targetId=clean(b.targetId,100),reason=clean(b.reason,80),detail=clean(b.detail,1000);
   if(!reasons.includes(reason))return json({error:'Choose a report reason.'},400);
   const target=await db.collection(kind==='comment'?'comments':'posts').findOne({id:targetId,...visible});
   if(!target)return json({error:'Contribution not found.'},404);
   const filter={kind,target_id:targetId,user_id:user.userId};
   await db.collection('reports').updateOne(filter,{$set:{reason,detail,status:'open',created:new Date().toISOString()},$setOnInsert:{id:crypto.randomUUID()}},{upsert:true});
   return json({ok:true});
  }
  if(b.action==='moderate'){
   if(!moderator(user.email))return json({error:'Moderator access required.'},403);
   const id=clean(b.reportId,36),decision=clean(b.decision,20),note=clean(b.note,500);
   if(!['hide','dismiss','restore'].includes(decision)||note.length<3)return json({error:'Choose a decision and explain it for the audit log.'},400);
   const report=await db.collection('reports').findOne({id});if(!report)return json({error:'Report not found.'},404);
   const now=new Date().toISOString();
   await db.collection('moderation_actions').insertOne({id:crypto.randomUUID(),report_id:id,kind:report.kind,target_id:report.target_id,decision,note,moderator_id:user.userId,created:now});
   if(decision!=='dismiss')await db.collection(report.kind==='comment'?'comments':'posts').updateOne({id:report.target_id},{$set:{status:decision==='hide'?'hidden':'published'}});
   await db.collection('reports').updateMany({kind:report.kind,target_id:report.target_id,status:'open'},{$set:{status:'resolved',decision,resolved:now}});
   return json({ok:true});
  }
  return json({error:'Unknown action.'},400);
 }catch(error){if((error as {code?:number}).code===11000)return json({error:'That username or trip name is already in use. Choose another.'},409);return json({error:'Your changes could not be saved. Please try again.'},503);}
}

export const GET=monitored('/api/member',handleGET);
export const POST=monitored('/api/member',handlePOST);
