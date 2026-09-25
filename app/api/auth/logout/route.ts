import { database,hashToken,requestCookie,sameOrigin,cookieValue,SESSION_COOKIE } from '../../../auth/session';
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Invalid origin'},{status:403});
 try{
  const session=requestCookie(request,SESSION_COOKIE);
  if(session)await (await database()).collection('sessions').deleteOne({token_hash:await hashToken(session)});
  return Response.json({ok:true},{headers:{'Cache-Control':'no-store','Set-Cookie':cookieValue(SESSION_COOKIE,'',0,new URL(request.url).protocol==='https:')}});
 }catch{return Response.json({error:'Sign-out failed. Please try again.'},{status:503});}
}
