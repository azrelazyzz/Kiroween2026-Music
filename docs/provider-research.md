# Metadata Provider Research

Research date: 2026-11-10. Revalidate before public launch because terms and limits can change.

## MusicBrainz

Use as the MVP metadata provider. The public web service requires a meaningful application User-Agent and is commonly limited to one request per second per source IP. MusicBrainz core data is available under CC0; supplementary data may use CC BY-NC-SA. This project maps only the fields needed for identification and links each result back to MusicBrainz.

Production caveat: independent Vercel instances cannot enforce a single global per-IP request cadence. The MVP uses caching, in-flight deduplication, and a process-local limiter. Before meaningful public traffic, add a shared limiter/queue or arrange suitable MetaBrainz service terms.

Sources:

- [MusicBrainz](https://musicbrainz.org/)
- [MetaBrainz dataset licenses](https://metabrainz.org/datasets/postgres-dumps)
- [MetaBrainz community clarification on API clients](https://community.metabrainz.org/t/api-user-login-vs-public-requests-for-rate-limiting/751568/3)

## Cover Art Archive

Use cover art by MusicBrainz release ID when available. The Cover Art Archive is operated jointly by MusicBrainz and the Internet Archive. Image copyright remains with the respective copyright owners. The app must attribute the source, avoid ownership claims, preserve a no-art fallback, and not bulk mirror images without a separate rights and service review.

Sources:

- [Cover Art Archive](https://coverartarchive.org/)
- [Internet Archive automated access guidance](https://archive.org/developers/bots.html)

## Discogs

Keep a provider adapter boundary but do not enable Discogs by default. Discogs requires an explicit review of current authentication, API terms, content display, image use, attribution, caching/storage, and rate restrictions. The deployment owner must provide and protect any token. No scraping is permitted.

Sources:

- [Discogs developer portal](https://www.discogs.com/developers)
- [Discogs API Terms of Use](https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use)

## Compliance implementation notes

- Provider names and source links accompany external metadata.
- Raw provider payloads do not pass directly to clients.
- Server caches are bounded by provider policy and can be disabled.
- Demo fixtures use fictional metadata and original generated artwork.
- No pricing data is shown.
- AI output can create search evidence, never release facts.

Content was rephrased for compliance with licensing restrictions.
