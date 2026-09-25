# BeenThere

An India-wide travel community built with React, Next.js, MongoDB, and Netlify Blobs. This checkout now targets Netlify while preserving the existing Netlify Free Legacy account plan.

## Included
- 90 featured destinations spanning all 28 states and 8 union territories
- Search, category/state filters, and community-added locations
- Destination pages, reviews, trip stories, prices, visit dates, and profiles
- Up to four photos per review (JPG, PNG, WebP; 3 MB each)
- Helpful / accurate / outdated votes, comments, and private saved-trip collections
- Google registration/sign-in, server-side ownership checks, and durable database/storage integrations
- Responsive layout and clearly labeled illustrative sample content

## Local development
Use Node 24. Start the local MongoDB Windows service, then:

```sh
npm ci
# Copy .env.example to .env without overwriting existing settings.
npm run dev
```

Open http://localhost:5173. The default database is beenthere on your local MongoDB server. Local uploads go to ignored .local/photos files. No paid service is needed for local development.

```sh
npm test
npm run build
```

Tests use a separate disposable local MongoDB database and exercise the actual API routes. Google-token signature validation uses local test keys.

## Netlify deployment
See NETLIFY_SETUP.md for deployment and GOOGLE_AUTH_SETUP.md for Google login. Keep the account on **Free Legacy**. Do not enable the newer paid/credit services or automatic upgrades.

A production deployment needs a hosted MongoDB URI (for example Atlas Free/M0). Your local MongoDB service cannot be reached by Netlify. Connection credentials belong in secret environment variables, never source control. A production Google Client ID and the final Netlify origin are still needed before live sign-in can be tested.

The old .openai, drizzle, and Sites build files are retained as deployment history, but npm run build and netlify.toml now use standard Next.js. They do not provision a Netlify database or change billing. The old private Site remains deployed; existing D1/R2 data has not been imported to MongoDB/Blobs.

## Current scope
This is an MVP. Sample reviews are distinguished from genuine contributions. AI itineraries, maps, bookings, translation, expense splitting, moderation tooling, business responses, and native mobile apps remain future work. The feed loads the latest 500 posts; pagination and moderation should be added before a large public launch.

## Photographs
Destination images are used under the Unsplash License (https://unsplash.com/license).
- Manali: Sajal Das — https://unsplash.com/photos/a-view-of-a-mountain-range-with-trees-in-the-foreground-PflVXJCsdbY
- Jaipur: Roberto Reposo — https://unsplash.com/photos/hawa-mahal-india-LgQoL6eOdHs
- Goa: abshky — https://unsplash.com/photos/palm-trees-frame-the-beach-and-ocean-YG7uLYPP66M
These photographs illustrate destinations and are not evidence supporting the sample reviews.
