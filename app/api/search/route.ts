import {monitored} from '../../monitoring/server';
import { visible,publicPosts } from '../../product-server';
import { database } from '../../../db';
import { getCurrentUser } from '../../auth/session';
import { searchTerms } from '../../experience-utils';
import { reviewCategories } from '../../data';

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
async function handleGET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get('q') || '').trim().slice(0, 160);
  const category = params.get('category') || 'All experiences';
  const terms = searchTerms(query);
  if (!terms.length && category === 'All experiences') return Response.json({posts:[],limit:60});
  if (category !== 'All experiences' && !reviewCategories.includes(category)) return Response.json({error:'Choose a valid experience category.'},{status:400});
  try {
    const db = await database();
    const clauses: Record<string, unknown>[] = terms.map(alternatives => ({
      $or: ['title','body','destination','state','category','place'].map(field => ({[field]: {$regex:alternatives.map(escape).join('|'),$options:'i'}})),
    }));
    clauses.push(visible);
    if (category === 'Prices & Costs') clauses.push({$or:[{price:{$type:'number'}},{category}]});
    else if (category !== 'All experiences') clauses.push({category});
    const [posts,user] = await Promise.all([
      db.collection('posts').find(clauses.length ? {$and:clauses} : {}, {projection:{_id:0}}).sort({created:-1}).limit(60).toArray(),
      getCurrentUser(),
    ]);
    return Response.json({posts:await publicPosts(posts,user?.userId),limit:60}, {headers:{'Cache-Control':'private, no-store'}});
  } catch {
    return Response.json({error:'Search is temporarily unavailable. Please try again.'},{status:503});
  }
}

export const GET=monitored('/api/search',handleGET);
