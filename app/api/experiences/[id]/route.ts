import { visible,publicPosts } from '../../../product-server';
import { database } from '../../../../db';
import { getCurrentUser } from '../../../auth/session';

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(!/^[a-f0-9-]{36}$/.test(id))return Response.json({error:'Experience not found.'},{status:404});
  try {
    const db=await database();
    const [post,user,comments]=await Promise.all([
      db.collection('posts').findOne({id,...visible},{projection:{_id:0}}),getCurrentUser(),
      db.collection('comments').find({post_id:id,...visible},{projection:{_id:0,id:1,post_id:1,author:1,body:1,created:1,parent_id:1,author_reply:1}}).sort({created:1}).limit(500).toArray(),
    ]);
    if(!post)return Response.json({error:'Experience not found.'},{status:404});
    const {user_id,...publicPost}=post;
    return Response.json({post:(await publicPosts([post],user?.userId))[0],comments},{headers:{'Cache-Control':'private, no-store'}});
  }catch{return Response.json({error:'This experience could not be loaded. Please try again.'},{status:503});}
}
