import { cookies } from 'next/headers';
import { database } from '../../db';
export { database } from '../../db';
export const SESSION_COOKIE='bt_session';
export const NONCE_COOKIE='bt_google_nonce';
export const SESSION_SECONDS=60*60*24*7;
export function googleClientId(){return process.env.GOOGLE_CLIENT_ID||'';}
export const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
export async function hashToken(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(b=>b.toString(16).padStart(2,'0')).join('');}
export function cookieValue(name:string,value:string,seconds:number,secure:boolean){return name+'='+value+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+seconds+(secure?'; Secure':'');}
export function sameOrigin(request:Request){
 const origin=request.headers.get('origin');if(!origin)return false;
 try{
  const source=new URL(origin),target=new URL(request.url);
  // Next.js may normalize request.url to localhost while retaining the actual Host.
  const host=request.headers.get('host')||target.host;
  return source.origin===origin&&source.host===host&&source.protocol===target.protocol;
 }catch{return false;}
}
export function requestCookie(request:Request,name:string){return request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1)||'';}
export async function getCurrentUser(){
 const token=(await cookies()).get(SESSION_COOKIE)?.value;
 if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
 const d=await database();
 const session=await d.collection('sessions').findOne({token_hash:await hashToken(token),expires:{$gt:new Date()}});
 if(!session)return null;
 const result=await d.collection<{id:string;name:string}>('accounts').findOne({id:session.user_id});
 return result?{userId:result.id,displayName:result.name,fullName:result.name}:null;
}
