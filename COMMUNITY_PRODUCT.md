# Community product

The existing Next.js frontend now uses MongoDB Atlas and Netlify Blobs for its community features. The existing Free plans are unchanged. Supabase, paid AI services and new subscriptions are not required.

## Accounts and profiles

Google sign-in creates an account on the first visit and signs in returning users. Google credentials are verified on the server and exchanged for expiring HttpOnly sessions. This release preserves a user's edited display name on subsequent Google sign-ins.

`/profile` supports a unique case-insensitive username, display name, bio and an owned uploaded photo. `/travelers/<username>` shows public contributions, uploaded travel photos, places visited and helpful votes. Emails, session identifiers and saved trips are never included in the public profile response. Names attached to new reviews and comments come from the signed-in account.

## Destinations and contributions

Featured destinations use `/india/<state>/<destination>`, for example `/india/himachal-pradesh/manali`. Existing featured `/destination/...` links redirect permanently. New contributions create normalized destination and place records, linked from each review. These are community-supplied names, not verified business listings or geocoded places. Destination feeds also match state to avoid mixing similarly named towns.

Reviews collect rating, date visited, category, exact place/service, amount, payment basis, trip type, optional trip duration, review/story text and up to four owned photos with captions/categories. Search spans destinations, categories, places and text with independent terms and travel synonyms. Recent reports and cost summaries use genuine contributions only; sample stories stay labeled and excluded.

## Private trips

`/saved` creates empty named trips and supports renaming, deleting and removing individual items. A trip may contain destinations, places and experiences. Experiences can be saved into multiple trips. Old bookmarks migrate idempotently into their existing named collections on the owner's next visit. Every operation checks the authenticated owner on the server.

Collections: `accounts`, `sessions`, `login_nonces`, `destinations`, `places`, `posts` (reviews and trip stories), `photos`, `votes`, `comments`, `trips`, `trip_items`, `reports`, `moderation_actions`. Legacy `saves` is retained only for migration. Necessary uniqueness and query indexes are created when the database connects.

## Reports and moderation

Signed-in travelers can report experiences or Q&A comments. A report does not automatically hide content. The owner approved `princepatel1551756@gmail.com` as the sole moderator; the allowlist is server-only in `app/product-server.ts`. An optional server-side `MODERATOR_EMAILS` environment variable overrides it (a blank value disables moderator access). Client form fields cannot grant privileges.

The profile's **Review reports** link opens `/moderation`. The queue puts unresolved reports first (up to 100). Moderators can inspect the text and photos, hide, dismiss or restore a contribution, with a required reason stored in an audit record. Hidden reviews are excluded from public feeds, search, profile contributions and detail APIs. Their photos are unavailable to anonymous visitors unless also used by another public contribution or profile; the owner and authorized moderator can inspect them. Hidden comments disappear from Q&A. Reporter identities are not disclosed to contributors.

## Current limits and next phase

- Signup and login use Google; separate password accounts and password recovery are not implemented.
- Genuine data is currently sparse. The website does not claim invented traveler counts, verification, costs or AI-backed answers.
- Public profiles and feeds load up to 500 recent contributions; search returns up to 60; Q&A and moderation have bounded result limits. Add pagination and dedicated aggregate queries as the community grows.
- Place matching is based on state/destination/name. No GPS, verified-business ownership, bookings, automatic moderation, receipt verification, account bans or appeal workflow is implemented.
- Usernames/profile text/photos currently have no dedicated reporting flow; review and comment reports cover the initial public contribution surfaces.
- Public profile/detail content remains client-loaded and excluded from indexing until server-rendered content metadata is implemented. Existing SEO verification is preserved.
- **Ask Kisse Safar Ke** is deferred until enough genuine experiences exist. Any future answer must cite the source contributions and distinguish facts from estimates.

## Validation

`npm run build` checks production compilation and types. `npm test` uses a uniquely named disposable local MongoDB database, never production records. Integration coverage includes profile privacy and username uniqueness, foreign-photo rejection, private trip ownership and migration, canonical destination redirects, reporting permissions, hide/restore propagation through feeds/search/photos/profiles, Q&A, votes, sessions and Google JWT validation.

Google Cloud must list the live domain `https://kissesafarke.netlify.app` as an authorized JavaScript origin for its existing OAuth client. Domain renames do not update Google settings automatically.
