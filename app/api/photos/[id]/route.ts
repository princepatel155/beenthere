import { visible,moderator } from '../../../product-server';
import { database } from '../../../../db';
import { photoStore } from '../../../storage';
import { getCurrentUser } from '../../../auth/session';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params;
  if(!/^[a-f0-9-]{36}$/.test(id))return new Response('Not found',{status:404});
  const d=await database(),user=await getCurrentUser();
  const metadata=await d.collection('photos').findOne({id});if(!metadata)return new Response('Not found',{status:404});
  const published=await d.collection('posts').findOne({photos:id,...visible},{projection:{_id:1}});
  const avatar=await d.collection('accounts').findOne({photo:id},{projection:{_id:1}});
  const reviewAccess=user&&moderator(user.email)&&await d.collection('posts').findOne({photos:id,status:'hidden'},{projection:{_id:1}});
  if(!published&&!avatar&&!reviewAccess&&metadata.user_id!==user?.userId)return new Response('Not found',{status:404});
  const object=await photoStore().get(id,{type:'arrayBuffer'});if(!object)return new Response('Not found',{status:404});
  return new Response(object,{headers:{'Content-Type':metadata.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Photo unavailable',{status:503});}
}
