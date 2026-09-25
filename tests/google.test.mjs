import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from 'jose';
import { verifyGoogleCredential } from '../app/auth/verify-google.ts';

test('Google identity verification rejects wrong issuer, audience, nonce, expiry and signature', async () => {
 const {privateKey,publicKey}=await generateKeyPair('RS256');
 const jwk=await exportJWK(publicKey);jwk.kid='test-key';
 const keys=createLocalJWKSet({keys:[jwk]}),client='test.apps.googleusercontent.com',nonce='test-nonce';
 const token=async(overrides={},aud=client,iss='https://accounts.google.com',exp='5m')=>new SignJWT({email:'test@example.test',email_verified:true,name:'Traveler',nonce,...overrides}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer(iss).setAudience(aud).setSubject('subject').setIssuedAt().setExpirationTime(exp).sign(privateKey);
 assert.equal((await verifyGoogleCredential(await token(),client,nonce,keys)).subject,'subject');
 for(const invalid of [await token({},'wrong'),await token({},client,'https://invalid.test'),await token({nonce:'wrong'}),await token({email_verified:false}),await token({},client,'https://accounts.google.com','-1m')]){
  await assert.rejects(()=>verifyGoogleCredential(invalid,client,nonce,keys));
 }
 const other=await generateKeyPair('RS256');
 const forged=await new SignJWT({nonce,email:'test@example.test',email_verified:true}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer('https://accounts.google.com').setAudience(client).setSubject('subject').setIssuedAt().setExpirationTime('5m').sign(other.privateKey);
 await assert.rejects(()=>verifyGoogleCredential(forged,client,nonce,keys));
});
