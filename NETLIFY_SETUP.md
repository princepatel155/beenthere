# BeenThere on Netlify Free Legacy

Your existing Netlify team is on **Free Legacy**. Keep that exact plan. Do not select a credit-plan migration, paid add-on, AI Agent Runner, paid database, or paid upgrade. No account plan or payment settings were changed during this migration.

## What runs where
- Website and API: Next.js on Netlify, using the automatic Next.js adapter.
- Accounts, sessions, posts, votes, comments, and saves: MongoDB.
- Published uploads: Netlify Blobs. Photos are limited to 3 MB each to fit function payload limits; up to four per experience.
- Local development: your running MongoDB service and ignored .local/photos files.
- Google login: Google Identity Services; only basic identity, with no client secret.

## Before deploying
Your Desktop has local MongoDB/Compass. An online Atlas cluster named BeenThere is ACTIVE on the Free tier ($0/hour, 512 MB), in AWS Mumbai. Organization: Student; project: Project 0. No paid tier or billing details were selected. The beenthere_app database user has readWrite access limited to beenthere. Atlas authentication and application index creation succeeded. The local app now uses Atlas through the ignored .env.local file; its community API returned HTTP 200. Netlify production variables have been saved as secrets, restricted to the production context. Netlify cannot reach mongodb://127.0.0.1:27017 on your computer.

Use the existing **BeenThere MongoDB Atlas Free (M0)** cluster for production: https://cloud.mongodb.com/v2/6ab659b302812f284ac40d29#/overview . Atlas Free is a limited shared database, not unlimited storage. Do not select Flex, Dedicated, or a paid tier. Set an application database named beenthere, so existing project data stays separate. Use a database user limited to that database. Keep the connection string private.

The owner explicitly approved the Atlas 0.0.0.0/0 network access entry, which has been saved for Netlify's changing outbound addresses. It permits connection attempts from any IPv4 address; database authentication and the database-specific role remain required. Review this broad rule if the hosting or networking architecture changes.

The Atlas driver URI template is mongodb+srv://beenthere_app:<URL_ENCODED_PASSWORD>@beenthere.pw6jdxu.mongodb.net/?appName=BeenThere. Configure MONGODB_DB_NAME=beenthere. Never commit the completed URI. The temporary password-entry file was removed after configuration. The local connection remains in ignored .env.local; production credentials are stored in Netlify.

A Free plan has usage limits. Keeping both providers on Free avoids automatic paid upgrades, but the app can stop serving requests when provider limits are reached. Never upgrade to resolve a limit without the owner's approval.

## Netlify settings
Use a Git repository deployment with this folder as the app root. If the repository contains a parent folder, set Base directory to beenthere.

- Build command: npm run build
- Publish directory: .next
- Node: 24 (configured in netlify.toml)
- Framework: Next.js (automatically detected)

This is a server-rendered app with API routes. Uploading just public/ or a static dist folder through Netlify Drop will not deploy the backend.

Set production-scoped environment variables in Netlify:
- MONGODB_URI: the Atlas driver connection string; mark it secret.
- MONGODB_DB_NAME: beenthere
- GOOGLE_CLIENT_ID: the public client ID ending in .apps.googleusercontent.com

Do not put these values in netlify.toml, commit .env, or prefix database credentials with NEXT_PUBLIC_. Netlify Blobs credentials are supplied automatically by Netlify; do not add a personal access token to the app.

MongoDB collections and indexes initialize on the first database request. No SQL migration or paid Netlify Database service is used. Deploy previews should use a separate test MongoDB database and credentials, not production credentials. Their photo store is separated from production.

## Google sign-in
After Netlify assigns a stable https://YOUR-SITE.netlify.app address, add that exact origin to the BeenThere web OAuth client in Google Cloud. No path or trailing slash. Add your custom domain too if you later use one.

Google project: BeenThere (synthetic-hash-509710-s3). Branding and the data policy are completed. The BeenThere Web client and its Netlify origin are configured; see GOOGLE_AUTH_SETUP.md.

See GOOGLE_AUTH_SETUP.md. Google can block sign-in in embedded browsers; test in a normal browser.

## Existing data and deployment
The earlier private ChatGPT Site remains at its existing address. This source now targets Netlify; do not send its Next.js output to the previous Sites deployment.

Existing Cloudflare data and uploaded photos have not been copied to MongoDB or Netlify Blobs. Keep the old deployment if you need its data; export and import deliberately before a public migration. Illustrative sample content is bundled in the source and appears automatically.

## Run and test locally
Use Node 24 and ensure the local MongoDB Windows service is running.
1. npm ci
2. Copy .env.example to .env (keep existing settings if already present).
3. npm run dev
4. Open http://localhost:5173

npm test runs Google cryptographic checks and integration tests against a uniquely named disposable LOCAL MongoDB database. It starts a local test server on port 5183 and removes only the test database and its generated photos afterward. No Atlas credentials or existing application databases are used by the tests.

npm run build verifies the production Next.js output.

## References
- https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
- https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-legacy-plans/legacy-pricing-plans/
- https://docs.netlify.com/build/data-and-storage/netlify-blobs/
- https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/
- https://www.mongodb.com/pricing

## Deployment identity
Private source repository: https://github.com/princepatel155/beenthere
Netlify project: beenthere-india-prince (89ecff38-d35e-411c-b89e-701c4f06cb27). The displayed website name remains BeenThere. Netlify rejected beenthere.netlify.app because that project name is already taken.
The deployment checkout is .local/netlify-source, with its own Git history and no private environment files. Keep source changes synchronized from this workspace before committing there.

## Production verification (2026-09-25)
Live URL: https://beenthere-india-prince.netlify.app . Deployment 6ab68d545dce250008981d3c uses application commit e53aa74. Production Google setup returned HTTP 200 with configured=true and a nonce; the community API returned HTTP 200. The live login page rendered the Google button. A complete Google account round trip remains unverified because the embedded browser returned a FedCM token NetworkError; check in a normal Chrome or Edge browser.
Netlify's secret scanner passed with MONGODB_URI scanning enabled. Only GOOGLE_CLIENT_ID and MONGODB_DB_NAME are excluded as public identifiers. No paid services or plan changes were enabled.
