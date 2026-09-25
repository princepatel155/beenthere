import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
const googleKeys=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
export async function verifyGoogleCredential(token:string,clientId:string,nonce:string,keys:JWTVerifyGetKey=googleKeys){
 if(!clientId||!nonce||token.length>12000)throw new Error('Invalid sign-in request');
 const {payload}=await jwtVerify(token,keys,{issuer:['https://accounts.google.com','accounts.google.com'],audience:clientId,algorithms:['RS256'],requiredClaims:['sub','exp','iat','nonce'],maxTokenAge:'10m',clockTolerance:5});
 if(payload.nonce!==nonce||typeof payload.sub!=='string'||!payload.sub||typeof payload.email!=='string'||payload.email_verified!==true)throw new Error('Invalid Google identity');
 return {subject:payload.sub,email:payload.email,name:typeof payload.name==='string'&&payload.name.trim()?payload.name.trim().slice(0,60):'Traveler'};
}
