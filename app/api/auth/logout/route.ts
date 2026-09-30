import { database,hashToken,requestCookie,sameOrigin,cookieValue,SESSION_COOKIE,NONCE_COOKIE } from '../../../auth/session';
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Invalid origin'},{status:403});
 const secure=new URL(request.url).protocol==='https:';
 const headers=new Headers({'Cache-Control':'private, no-store'});
 headers.append('Set-Cookie',cookieValue(SESSION_COOKIE,'',0,secure));
 headers.append('Set-Cookie',cookieValue(NONCE_COOKIE,'',0,secure));
 try{
  const session=requestCookie(request,SESSION_COOKIE);
  if(/^[a-f0-9]{64}$/.test(session))await (await database()).collection('sessions').deleteOne({token_hash:await hashToken(session)});
  return Response.json({ok:true,signedOut:true},{headers});
 }catch{
  // Always end this browser's session even if the session store is unavailable.
  // Report incomplete server revocation rather than claiming it succeeded.
  return Response.json({signedOut:true,error:'Signed out on this browser. Server session revocation could not be completed.'},{status:503,headers});
 }
}
