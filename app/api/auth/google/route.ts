import {monitored} from '../../../monitoring/server';
import { googleClientId,database,randomToken,hashToken,cookieValue,sameOrigin,requestCookie,SESSION_COOKIE,NONCE_COOKIE,SESSION_SECONDS } from '../../../auth/session';
import { verifyGoogleCredential } from '../../../auth/verify-google';
const fail=(error:string,status:number)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
async function handleGET(request:Request){
 const clientId=googleClientId();if(!clientId)return Response.json({configured:false},{headers:{'Cache-Control':'no-store'}});
 const nonce=randomToken();
 try{
  const d=await database();
  await d.collection('login_nonces').insertOne({token_hash:await hashToken(nonce),expires:new Date(Date.now()+600000)});
  return Response.json({configured:true,clientId,nonce},{headers:{'Cache-Control':'no-store','Set-Cookie':cookieValue(NONCE_COOKIE,nonce,600,new URL(request.url).protocol==='https:')}});
 }catch{ return fail('Sign-in is temporarily unavailable. Please try again.',503); }
}
async function handlePOST(request:Request){
 if(!sameOrigin(request))return fail('Please start sign-in from this website.',403);
 if(!googleClientId())return fail('Google sign-in has not been configured yet.',503);
 let body:any;try{body=await request.json();}catch{return fail('Invalid sign-in request.',400);}
 const nonce=requestCookie(request,NONCE_COOKIE);
 if(!/^[a-f0-9]{64}$/.test(nonce)||!body||typeof body.credential!=='string'||body.credential.length>12000)return fail('Your sign-in request expired. Reload this page and try again.',400);
 let identity;try{identity=await verifyGoogleCredential(body.credential,googleClientId(),nonce);}catch{return fail('Google sign-in could not be verified. Reload this page and try again.',401);}
 try{
  const d=await database();
  // Atomic removal prevents two requests from redeeming the same Google token.
  const consumed=await d.collection('login_nonces').findOneAndDelete({token_hash:await hashToken(nonce),expires:{$gt:new Date()}});
  if(!consumed)return fail('This sign-in request has expired or was already used. Please reload.',401);
  const id='google:'+identity.subject;
  const account=await d.collection('accounts').updateOne({id},{
   $set:{google_sub:identity.subject,email:identity.email},
   $setOnInsert:{name:identity.name,created:new Date().toISOString()}
  },{upsert:true});
  const session=randomToken(),oldSession=requestCookie(request,SESSION_COOKIE);
  if(oldSession)await d.collection('sessions').deleteOne({token_hash:await hashToken(oldSession)});
  await d.collection('sessions').insertOne({token_hash:await hashToken(session),user_id:id,expires:new Date(Date.now()+SESSION_SECONDS*1000)});
  const secure=new URL(request.url).protocol==='https:',headers=new Headers({'Cache-Control':'no-store'});
  headers.append('Set-Cookie',cookieValue(SESSION_COOKIE,session,SESSION_SECONDS,secure));headers.append('Set-Cookie',cookieValue(NONCE_COOKIE,'',0,secure));
  return Response.json({ok:true,isNewUser:account.upsertedCount===1},{headers});
 }catch{return fail('Your account could not be saved. Reload the page and try again.',503);}
}

export const GET=monitored('/api/auth/google',handleGET);
export const POST=monitored('/api/auth/google',handlePOST);
