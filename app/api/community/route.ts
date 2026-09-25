import { database } from '../../../db';
import { getCurrentUser, sameOrigin } from '../../auth/session';
import { states, reviewCategories, samplePosts } from '../../data';
import { costBases, photoTopics } from '../../experience-utils';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
const clean=(v:unknown,max:number)=>typeof v==='string'?v.trim().slice(0,max):'';
export async function GET(request:Request){
 try {
  const user=await getCurrentUser(), d=await database();
  const destination=(new URL(request.url).searchParams.get('destination')||'').trim().slice(0,100);
  const escapedDestination=destination.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const scope=new URL(request.url).searchParams.get('scope');
  const savedIds=scope==='saved'&&user?await d.collection('saves').find({user_id:user.userId},{projection:{_id:0,post_id:1}}).toArray():[];
  const postFilter=destination?{destination:{$regex:'^'+escapedDestination+'$',$options:'i'}}:scope==='saved'?{id:{$in:savedIds.map(save=>save.post_id)}}:scope==='profile'?(user?{user_id:user.userId}:{id:{$in:[]}}):{};
  const [posts,votes,saves,comments,ownVotes]=await Promise.all([
   d.collection('posts').find(postFilter,{projection:{_id:0}}).sort({created:-1}).limit(500).toArray(),
   d.collection('votes').aggregate([{$group:{_id:{post_id:'$post_id',kind:'$kind'},count:{$sum:1}}},{$project:{_id:0,post_id:'$_id.post_id',kind:'$_id.kind',count:1}}]).toArray(),
   user?d.collection('saves').find({user_id:user.userId},{projection:{_id:0,post_id:1,collection:1}}).toArray():[],
   d.collection('comments').find({},{projection:{_id:0,id:1,post_id:1,author:1,body:1,created:1,parent_id:1,author_reply:1}}).sort({created:-1}).limit(1000).toArray(),
   user?d.collection('votes').find({user_id:user.userId},{projection:{_id:0,post_id:1,kind:1}}).toArray():[]
  ]);
  return json({posts:posts.map(p=>({...p,own:p.user_id===user?.userId,user_id:undefined})),votes,saves,comments,ownVotes});
 }catch{return json({error:'Community data is temporarily unavailable. Please try again.'},503);}
}
export async function POST(request:Request){
 try{
  if(!sameOrigin(request))return json({error:'Invalid request origin.'},403);
  const user=await getCurrentUser();if(!user)return json({error:'Sign in to contribute or save a trip.'},401);
  let b:any;try{b=await request.json();}catch{return json({error:'Invalid request.'},400);}
  if(!b||typeof b!=='object'||Array.isArray(b))return json({error:'Invalid request.'},400);
  const d=await database();
  if(b.action==='post'){
   const title=clean(b.title,120),body=clean(b.body,6000),destination=clean(b.destination,100),state=clean(b.state,80),category=clean(b.category,80),author=clean(b.author,60),visited=clean(b.visited,10),tripType=clean(b.tripType,30);
   if(title.length<5||body.length<20||!destination||!author||!states.includes(state)||!reviewCategories.includes(category)||!Number.isInteger(b.rating)||b.rating<1||b.rating>5||!/^\d{4}-\d{2}-\d{2}$/.test(visited)||Number.isNaN(Date.parse(visited))||visited>new Date().toISOString().slice(0,10))return json({error:'Add a title, experience (at least 20 characters), destination, state, visit date, and a rating.'},400);
   const price=b.price===''||b.price==null?null:Number(b.price);if(price!==null&&(!Number.isFinite(price)||price<0||price>100000000))return json({error:'Enter a valid amount paid.'},400);
   const costBasis=clean(b.costBasis,40);
   if(costBasis&&!costBases.includes(costBasis))return json({error:'Choose a valid cost basis.'},400);
   const tripDays=b.tripDays===''||b.tripDays==null?null:Number(b.tripDays);
   if(tripDays!==null&&(!Number.isInteger(tripDays)||tripDays<1||tripDays>365))return json({error:'Trip length must be between 1 and 365 days.'},400);
   const photos=Array.isArray(b.photos)?b.photos.slice(0,4):[];
   for(const id of photos){
    if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id)||!await d.collection('photos').findOne({id,user_id:user.userId}))return json({error:'A photo could not be verified. Upload it again.'},400);
   }
   const photoDetails=photos.map((photoId:string)=>{
    const detail=Array.isArray(b.photoDetails)?b.photoDetails.find((x:any)=>x?.id===photoId):null;
    return {id:photoId,category:photoTopics.includes(detail?.category)?detail.category:'Other',caption:clean(detail?.caption,160)};
   });
   const id=crypto.randomUUID();
   await d.collection('posts').insertOne({id,user_id:user.userId,author,kind:b.kind==='story'?'story':'review',destination,state,category,title,body,rating:b.rating,price,cost_basis:price!==null&&costBasis?costBasis:null,trip_days:tripDays,place:clean(b.place,120),visited,trip_type:tripType,photos,photo_details:photoDetails,verification:{status:'unverified',checks:[]},created:new Date().toISOString()});
   return json({id});
  }
  const postId=clean(b.postId,100);
  const actualPost=await d.collection('posts').findOne({id:postId});
  if(!samplePosts.some(p=>p.id===postId)&&!actualPost)return json({error:'This experience could not be found.'},404);
  if(b.action==='vote'&&['helpful','accurate','outdated'].includes(b.kind)){
   const filter={post_id:postId,user_id:user.userId,kind:b.kind};
   if(b.enabled)await d.collection('votes').updateOne(filter,{$setOnInsert:filter},{upsert:true});
   else await d.collection('votes').deleteOne(filter);
   return json({ok:true});
  }
  if(b.action==='save'){
   const filter={post_id:postId,user_id:user.userId};
   if(b.enabled)await d.collection('saves').updateOne(filter,{$set:{collection:clean(b.collection,80)||'My next trip'}},{upsert:true});
   else await d.collection('saves').deleteOne(filter);
   return json({ok:true});
  }
  if(b.action==='comment'){
   const body=clean(b.body,1500),author=clean(b.author,60);
   if(!body||!author)return json({error:'Add your name and a comment.'},400);
   const parentId=clean(b.parentId,100)||null;
   if(parentId){
    const parent=await d.collection('comments').findOne({id:parentId,post_id:postId});
    if(!parent||parent.parent_id)return json({error:'Reply to a question on this experience.'},400);
   }
   await d.collection('comments').insertOne({id:crypto.randomUUID(),post_id:postId,user_id:user.userId,author,body,parent_id:parentId,author_reply:actualPost?.user_id===user.userId,created:new Date().toISOString()});
   return json({ok:true});
  }
  return json({error:'Unknown action.'},400);
 }catch{return json({error:'Your changes could not be saved. Please try again.'},503);}
}
