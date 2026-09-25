import { database } from '../db';
import type { Document } from 'mongodb';
import { slug } from './catalog';

export const visible = {status:{$nin:['hidden','deleted']}};
// Owner-approved server-only allowlist. Never accept roles or emails from a form.
export const moderator = (email?:string) => !!email && (process.env.MODERATOR_EMAILS??'princepatel1551756@gmail.com').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
export const publicProfile = (a:Document) => ({name:a.name,username:a.username||'',bio:a.bio||'',photo:a.photo||null,joined:a.created||null});
export async function publicPosts(posts:Document[],userId?:string){
 const db=await database();
 const users=await db.collection('accounts').find({id:{$in:[...new Set(posts.map(p=>p.user_id))]}},{projection:{id:1,name:1,username:1,photo:1}}).toArray();
 return posts.map(({_id,user_id,moderation,...p})=>{const a=users.find(u=>u.id===user_id);return {...p,author:a?.name||p.author,username:a?.username||null,avatar:a?.photo||null,own:user_id===userId};});
}
export async function catalogEntry(name:string,state:string,place?:string){
 const db=await database(),id=slug(state)+'/'+slug(name);
 await db.collection('destinations').updateOne({id},{$setOnInsert:{id,name,state,created:new Date().toISOString()}},{upsert:true});
 let placeId:string|null=null;
 if(place){placeId=id+'/'+slug(place);await db.collection('places').updateOne({id:placeId},{$setOnInsert:{id:placeId,destination_id:id,name:place,created:new Date().toISOString()}},{upsert:true});}
 return {destination_id:id,place_id:placeId};
}
export async function ensureTrip(userId:string,name:string){
 const db=await database(),key=name.toLocaleLowerCase('en-IN');
 await db.collection('trips').updateOne({user_id:userId,key},{$setOnInsert:{id:crypto.randomUUID(),user_id:userId,key,name,created:new Date().toISOString()}},{upsert:true});
 return (await db.collection('trips').findOne({user_id:userId,key}))!;
}
// Old bookmarks are moved on the owner's next visit; no public data or credentials change.
export async function migrateSaves(userId:string){
 const db=await database(),old=await db.collection('saves').find({user_id:userId}).toArray();
 for(const save of old){const trip=await ensureTrip(userId,save.collection||'My next trip');const key={trip_id:trip.id,kind:'experience',target_id:save.post_id};await db.collection('trip_items').updateOne(key,{$setOnInsert:{...key,user_id:userId,created:new Date().toISOString()}},{upsert:true});await db.collection('saves').deleteOne({_id:save._id});}
}
