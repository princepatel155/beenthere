# Practical travel experiences

The homepage introduces experience categories separately from destination themes. Search queries public MongoDB posts using independent query terms, a small set of travel synonyms and literal regex escaping. It searches destination, state, place/service, title, body and category, returning up to 60 newest matches. Example posts are shown separately. This is text search, not a distance-based nearby search.

Explore India includes a schematic region guide with all 36 states and union territories, leading to destination listings. It is explicitly labeled as schematic; it is not a geographic boundary map.

Destination pages load up to 500 recent contributions for that destination. Their overview excludes sample posts from ratings, report counts and photo counts. Recent reports use actual visit dates within 30 days. Cost summaries use visits within 180 days, group matching categories and payment bases, and show report count and freshness. Trip totals are also separated by trip length. Unknown payment bases and illustrative samples are excluded. Single reports are labeled as one data point rather than typical prices.

Reviews support an optional place/business/service/route, payment basis, trip length and per-photo category/caption. Existing records remain compatible. Uploaded photos remain limited to four images of up to 3 MB each and are public after publication. The form reminds contributors to redact personal details on receipts and tickets.

Question threads support a question plus replies. The server derives the original-contributor label from account ownership and rejects replies to a different post or nested reply. Client-provided author/verification flags cannot grant badges. All current visits are self-reported. Booking, receipt and location verification require a future evidence and moderation process; no verified badge is awarded today.

Individual reviews load by ID, including older search results outside the current homepage feed. Saved trip collections, community votes and Google login remain in place. The Plan a trip navigation item opens saved collections; itinerary generation and AI planning are not implemented.

Validation: production build; search/recentness/cost grouping/state coverage tests; integration tests against a uniquely named disposable local MongoDB database, including ownership, photos, search, detail lookup, scoped destination feeds, threaded replies, votes, saves and sessions. Integration builds use .local/test-next to avoid conflicting with a running local preview.

No new dependency, paid API, subscription or hosting plan is required.
