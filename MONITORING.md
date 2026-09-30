# Owner monitoring

Open `https://kissesafarke.netlify.app/admin` and sign in with `princepatel1551756@gmail.com`. The same link is in the owner's profile. Both the page and API check the authenticated account on the server; moderator access alone does not grant monitoring access. Responses are private, uncached and excluded from indexing.

## What works

- Database counts: accounts, visible reviews/stories, photos, trips, comments, helpful votes, hidden posts and open reports. Today begins at midnight Asia/Kolkata; selectable periods are rolling 24 hours, 7 days or 30 days. Existing photos without timestamps are counted all-time but excluded from period counts.
- Consented first-party browser analytics: page views, search terms/results, destination and review views, registration attempts/completions, contribution starts/completions, uploaded review photos, helpful clicks, saves and explicit trip creation. Visitor IDs expire after 30 days. Counts are observed browsers, not verified people; activity reach is not an ordered funnel. No historical traffic is invented.
- Search opportunities: common terms, no-results searches and destinations receiving contributions. Sensitive-looking searches are redacted. No-results refers to real community reviews, not the existence of a destination guide.
- API monitoring: aggregated counts, HTTP status, mean/max handler time and last occurrence for Google login, logout, community, member, search, photo upload/download and experience details. Request bodies, cookies, exception messages and credentials are never logged. Browser error reports are generic, unverified counts.
- Checks: homepage content and `/api/health` (database ping), every 30 minutes in the `site-monitor` Netlify scheduled function, plus an owner-only manual check with a 60-second cooldown. Fixed check URLs prevent arbitrary network access. A stale schedule is flagged after 45 minutes. Checks run only on published deploys.
- Actions: inspect and moderate reports, acknowledge API signals, create/complete/reopen tasks, export a JSON report, and follow links to provider logs, deployment/rollback controls, security and database dashboards. New errors reopen acknowledged signals. Acknowledging is not a repair. Existing moderation actions retain their original audit trail; dashboard actions have a separate 30-day audit history.

## Privacy and limits

Analytics defaults off until consent, honors Do Not Track, excludes the authenticated owner, and offers a persistent preferences control. Declining stops collection and removes the local browser ID; already collected events expire normally. No email, account ID, IP, precise location, session replay, private trip contents, raw URL queries, or exception payload is stored in analytics. Event ingestion does not authenticate a browser or eliminate all bot traffic.

Analytics batches contain up to 20 events and are sent every 10 seconds or on page exit. Shared MongoDB counters cap collection at 60 events/browser/minute, 300/minute globally and 2,000/day globally (UTC). Retries and rejected batches can consume budget. Duplicate event IDs do not create duplicate observations. Raw events, counters, API aggregates, checks and dashboard audit entries have a 30-day TTL. Dashboard action tasks are capped at 100. MongoDB TTL cleanup is asynchronous. These application caps reduce overhead; Netlify and Atlas resource limits still apply and must be checked in their provider dashboards. No paid plan, payment method, automatic top-up or external telemetry service was added.

## Limits of coverage

This is not a firewall, full security audit, confirmed spam detector or stack-trace service. HTTP 4xx can reflect ordinary input errors; unusual traffic is not proof of hacking. API aggregates exclude static assets and page-render requests. Country data, Google impressions/clicks/indexing, Netlify bandwidth/blocked totals and provider quotas are not imported. Optional client events may be lost, blocked or spoofed; authoritative contribution totals come from the database.

The scheduled monitor shares Netlify and MongoDB with the application. An outage of either may prevent checks from running or being saved. Missing checks are unknown; a ratio of successful samples is not continuous uptime. There are no email/SMS alerts or independent outage checks. For independent alerts, an external monitor can request `https://kissesafarke.netlify.app/api/health`. GA4, Search Console reporting, PostHog, Sentry and UptimeRobot are not connected. The dashboard labels these gaps and links to their setup pages. Existing Google site verification is preserved.

## Verification and operations

`npm test` runs only against disposable local MongoDB data and verifies owner authorization, CSRF/origin protection, event validation/redaction, consent, Do Not Track, duplicate events, owner exclusion, collection caps, real aggregates, task actions, API acknowledgement and existing community behavior. `npm run build` verifies production compilation/types. In Netlify, open Functions → site-monitor to see the schedule and invoke Run now; then check the dashboard for the stored result. A public invocation of the scheduled function is not supported by Netlify.
