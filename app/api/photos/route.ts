import { database } from '../../../db';
import { photoStore } from '../../storage';
import { getCurrentUser, sameOrigin } from '../../auth/session';
export async function POST(request:Request){
 try{
  if(!sameOrigin(request))return Response.json({error:'Invalid origin.'},{status:403});
  const user=await getCurrentUser();if(!user)return Response.json({error:'Sign in to upload photos.'},{status:401});
  if(Number(request.headers.get('content-length'))>3*1024*1024+64*1024)return Response.json({error:'Choose an image under 3 MB.'},{status:413});
  const form=await request.formData();const file=form.get('file');
  if(!(file instanceof File)||file.size>3*1024*1024||file.size===0)return Response.json({error:'Choose an image under 3 MB.'},{status:400});
  const bytes=new Uint8Array(await file.arrayBuffer());
  const mime=bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71?'image/png':String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'?'image/webp':null;
  if(!mime)return Response.json({error:'Use a JPG, PNG, or WebP image.'},{status:400});
  const store=photoStore(),d=await database(),id=crypto.randomUUID();
  await store.set(id,bytes.buffer,{metadata:{contentType:mime}});
  try{await d.collection('photos').insertOne({id,user_id:user.userId,mime});}catch(error){await store.delete(id);throw error;}
  return Response.json({id});
 }catch{return Response.json({error:'Photo upload failed. Your written experience has been kept.'},{status:503});}
}
