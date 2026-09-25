import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MongoClient } from 'mongodb';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { ensureIndexes } from '../db/indexes.ts';

// Tests use only a uniquely named disposable local database, never Atlas or .env credentials.
test('MongoDB-backed website: ownership, photos, votes, saves, sessions and login nonces', {timeout:180000}, async () => {
 const name='beenthere_test_'+randomUUID().replaceAll('-','');
 const client=new MongoClient('mongodb://127.0.0.1:27017',{serverSelectionTimeoutMS:5000});
 await client.connect();
 const db=client.db(name),photos=[];
 let child,output='';
 try{
  await ensureIndexes(db);
  const token=randomBytes(32).toString('hex'),other=randomBytes(32).toString('hex');
  const hash=v=>createHash('sha256').update(v).digest('hex');
  await db.collection('accounts').insertMany([{id:'google:test-one',google_sub:'test-one',name:'Test Traveler'},{id:'google:test-two',google_sub:'test-two',name:'Other Traveler'}]);
  await db.collection('sessions').insertMany([{token_hash:hash(token),user_id:'google:test-one',expires:new Date(Date.now()+600000)},{token_hash:hash(other),user_id:'google:test-two',expires:new Date(Date.now()+600000)}]);
  const origin='http://127.0.0.1:5183';
  child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','5183'],{env:{...process.env,NODE_ENV:'development',NETLIFY:'',LOCAL_INTEGRATION_TEST:'1',MONGODB_URI:'mongodb://127.0.0.1:27017',MONGODB_DB_NAME:name,GOOGLE_CLIENT_ID:'test.apps.googleusercontent.com',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe'],windowsHide:true});
  child.stdout.on('data',v=>output+=v);child.stderr.on('data',v=>output+=v);
  let ready=false;
  for(let i=0;i<90;i++){
   if(child.exitCode!==null)throw new Error('Test server exited: '+output.slice(-3000));
   try{const r=await fetch(origin+'/login');if(r.ok){ready=true;break;}}catch{}
   await new Promise(resolve=>setTimeout(resolve,500));
  }
  assert(ready,'Test server failed to start: '+output.slice(-3000));
  const call=(route,body,cookie=token)=>fetch(origin+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:'bt_session='+cookie}:{})},body:JSON.stringify(body)});
  const feed=async(cookie)=>{const r=await fetch(origin+'/api/community',{headers:cookie?{Cookie:'bt_session='+cookie}:{}});assert.equal(r.status,200);return r.json();};
  assert.equal((await call('/api/community',{action:'post'},null)).status,401);
  assert.equal((await fetch(origin+'/api/community',{method:'POST',headers:{Origin:'https://bad.test'}})).status,403);
  assert.equal((await call('/api/community',{action:'post'})).status,400);
  assert.equal((await call('/api/community',null)).status,400);
  const form=new FormData();
  form.set('file',new Blob([Uint8Array.from([137,80,78,71,13,10,26,10])],{type:'image/png'}),'test.png');
  const upload=await fetch(origin+'/api/photos',{method:'POST',headers:{Origin:origin,Cookie:'bt_session='+token},body:form});
  assert.equal(upload.status,200,await upload.clone().text());
  const photo=(await upload.json()).id;photos.push(photo);
  assert.equal((await fetch(origin+'/api/photos/'+photo)).status,404);
  assert.equal((await fetch(origin+'/api/photos/'+photo,{headers:{Cookie:'bt_session='+other}})).status,404);
  assert.equal((await fetch(origin+'/api/photos/'+photo,{headers:{Cookie:'bt_session='+token}})).status,200);
  const post={action:'post',title:'A test mountain trip',body:'A useful travel experience long enough to publish.',destination:'Manali',state:'Himachal Pradesh',category:'Hotels & Stays',author:'Test Traveler',visited:'2026-01-01',rating:4,price:123.5,tripType:'Friends',photos:[photo]};
  assert.equal((await call('/api/community',post,other)).status,400);
  assert.equal((await call('/api/community',{...post,photos:[{$ne:null}]})).status,400);
  assert.equal((await call('/api/community',{...post,costBasis:'made up'})).status,400);
  assert.equal((await call('/api/community',{...post,tripDays:-1})).status,400);
  const created=await call('/api/community',{...post,costBasis:'Per room / night',place:'Mountain View Hotel',photoDetails:[{id:photo,category:'Hotels',caption:'Our room'}],verification:{status:'verified'},tripDays:4});assert.equal(created.status,200);
  const postId=(await created.json()).id;
  const detailResponse=await fetch(origin+'/api/experiences/'+postId);assert.equal(detailResponse.status,200);
  const detail=(await detailResponse.json()).post;assert.equal(detail.id,postId);assert(!('user_id' in detail));
  assert.equal((await fetch(origin+'/api/experiences/'+randomUUID())).status,404);
  assert.equal((await (await fetch(origin+'/api/community?destination=Goa')).json()).posts.length,0);
  assert.equal((await (await fetch(origin+'/api/community?destination=manali')).json()).posts.length,1);
  assert.equal((await fetch(origin+'/api/photos/'+photo)).status,200);
  for(let i=0;i<2;i++)assert.equal((await call('/api/community',{action:'vote',postId,kind:'helpful',enabled:true})).status,200);
  assert.equal((await call('/api/community',{action:'save',postId,enabled:true,collection:'Private trip'})).status,200);
  const scopedSaved=await fetch(origin+'/api/community?scope=saved',{headers:{Cookie:'bt_session='+token}});
  assert.equal((await scopedSaved.json()).posts[0].id,postId);
  assert.equal((await (await fetch(origin+'/api/community?scope=saved')).json()).posts.length,0);
  assert.equal((await (await fetch(origin+'/api/community?scope=profile',{headers:{Cookie:'bt_session='+other}})).json()).posts.length,0);
  assert.equal((await call('/api/community',{action:'comment',postId,author:'Test Traveler',body:'Useful details'})).status,200);
  const mine=await feed(token),anon=await feed(),theirs=await feed(other);
  assert.equal(mine.posts[0].price,123.5);assert.equal(mine.posts[0].own,true);
  assert.equal(mine.posts[0].cost_basis,'Per room / night');
  assert.equal(mine.posts[0].place,'Mountain View Hotel');
  assert.equal(mine.posts[0].photo_details[0].caption,'Our room');
  assert.equal(mine.posts[0].verification.status,'unverified','Clients cannot grant verification badges');
  assert.equal(mine.votes[0].count,1);assert.equal(mine.saves[0].collection,'Private trip');
  assert.equal(anon.saves.length,0);assert.equal(theirs.saves.length,0);assert.equal(anon.ownVotes.length,0);
  assert(!('user_id' in anon.posts[0]));assert(!('_id' in anon.posts[0]));assert(!('user_id' in anon.comments[0]));
  const questionId=mine.comments[0].id;
  assert.equal((await call('/api/community',{action:'comment',postId,author:'Other Traveler',body:'Per person?',parentId:questionId,author_reply:true},other)).status,200);
  assert.equal((await call('/api/community',{action:'comment',postId,author:'Test Traveler',body:'That is for the whole room.',parentId:questionId})).status,200);
  assert.equal((await call('/api/community',{action:'comment',postId:'sample-goa-story',author:'Other Traveler',body:'Cross-post reply',parentId:questionId},other)).status,400);
  const thread=(await feed()).comments;
  assert.equal(thread.find(c=>c.body==='Per person?').author_reply,false);
  assert.equal(thread.find(c=>c.body==='That is for the whole room.').author_reply,true);
  const search=await fetch(origin+'/api/search?q=Manali%20hotel');assert.equal(search.status,200);
  const searchPosts=(await search.json()).posts;assert.equal(searchPosts.length,1);assert.equal(searchPosts[0].id,postId);assert(!('user_id' in searchPosts[0]));
  assert.equal((await (await fetch(origin+'/api/search?q=Goa%20scooter%20rental')).json()).posts.length,0);
  assert.equal((await fetch(origin+'/api/search?q=test&category=invalid')).status,400);
  assert.equal((await (await fetch(origin+'/api/search?q=Manali&category=Prices%20%26%20Costs')).json()).posts.length,1);
  const nonceResponse=await fetch(origin+'/api/auth/google');assert.equal(nonceResponse.status,200);
  const nonce=(await nonceResponse.json()).nonce;
  const attempts=await Promise.all([1,2].map(()=>db.collection('login_nonces').findOneAndDelete({token_hash:hash(nonce),expires:{$gt:new Date()}})));
  assert.equal(attempts.filter(Boolean).length,1,'nonce redemption must be atomic');
  await db.collection('sessions').updateOne({token_hash:hash(other)},{$set:{expires:new Date(0)}});
  assert.equal((await call('/api/community',{action:'save',postId,enabled:true},other)).status,401);
  assert.equal((await call('/api/auth/logout',{})).status,200);
  assert.equal((await call('/api/community',{action:'save',postId,enabled:true})).status,401);
  assert.equal(await db.collection('sessions').countDocuments({token_hash:hash(token)}),0);
 }finally{
  if(child?.pid){if(process.platform==='win32')spawnSync('taskkill',['/pid',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});else child.kill('SIGTERM');}
  for(const id of photos)if(/^[a-f0-9-]{36}$/.test(id))await unlink(path.join('.local','photos',id)).catch(()=>{});
  if(/^beenthere_test_[a-f0-9]{32}$/.test(name))await db.dropDatabase();
  await client.close();
 }
});
