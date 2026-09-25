# Google registration and sign-in

The same Google button creates an account on first login and signs into it afterward. The integration stays inactive until GOOGLE_CLIENT_ID is configured.

## Current setup
Google Cloud project BeenThere (synthetic-hash-509710-s3) exists. Branding and the Google API Services User Data Policy are completed. The BeenThere Web client has been created with the production origin https://beenthere-india-prince.netlify.app and the local development origins below. Its public Client ID is 605254231625-9e7lhclmihsko6lkfl40fsm246rfffqm.apps.googleusercontent.com. It is configured in ignored .env.local and the Netlify production environment. No Google billing or paid trial was enabled.

## Reference setup for additional domains
1. Open https://console.cloud.google.com/auth/clients?project=synthetic-hash-509710-s3
2. Edit the existing Web application client named BeenThere Web; do not create a duplicate.
3. Add authorized JavaScript origins:
   - http://localhost
   - http://localhost:5173
   - http://127.0.0.1:5173
   - Your exact https://YOUR-SITE.netlify.app origin, without a path or trailing slash.
   - http://localhost:8888 only if you use Netlify Dev.
4. Copy the public Client ID ending in .apps.googleusercontent.com.
5. Add GOOGLE_CLIENT_ID to the ignored local .env and to Netlify production environment variables, then redeploy.

The popup/FedCM integration does not use a client secret or redirect URI. Request only openid, email, and profile. Review Google's audience/testing settings before launch and add test users if required by the console.

## Session security
The server verifies Google's signature, issuer, audience, expiry, verified email, and a browser-bound nonce. MongoDB consumes each nonce atomically. Expired nonces are rejected even before TTL cleanup occurs.

Accounts are identified by Google's subject, never automatically merged by email. Sessions contain random opaque tokens. MongoDB stores only their SHA-256 hashes, with a seven-day expiration and TTL cleanup. HttpOnly, SameSite=Lax cookies use Secure on HTTPS. Logout revokes the session in MongoDB. No Google access or refresh tokens are stored.

## Verify before launch
Sign in with a real Google account, create a review, save a trip, sign out, and sign back in. Check that another account cannot access saved trips or unpublished photos. Test in a normal browser if Google refuses the embedded browser.

Cryptographic verification and local session/ownership tests are automated. A real Google round trip requires the final Client ID, hosted MongoDB, and authorized production origin; it has not been verified yet.

## Official references
- https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
- https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- https://developers.google.com/identity/gsi/web/reference/js-reference
