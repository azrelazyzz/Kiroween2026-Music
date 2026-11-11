# Music Cataloguing MVP Design

## Architecture summary

Music Cataloguing App is a Next.js App Router application deployed on Vercel with Supabase for identity, PostgreSQL, and private uploads. Server route handlers mediate all metadata and AI providers. A local demo repository uses versioned browser storage so the hackathon path remains usable without secrets.

```text
Browser
  ├─ App Router pages and server-rendered shell
  ├─ TanStack Query for provider requests and mutations
  ├─ CollectionRepository interface
  │    ├─ SupabaseCollectionRepository (authenticated production)
  │    └─ DemoCollectionRepository (local, clearly labeled)
  └─ Camera BarcodeDetector (progressive enhancement)

Next.js server
  ├─ /api/search          validated provider search
  ├─ /api/identify        evidence normalization + search + rank
  ├─ /api/vision          optional clue extraction
  ├─ MetadataProvider
  │    ├─ MusicBrainzProvider (MVP default)
  │    └─ DiscogsProvider (optional, feature-gated)
  └─ VisionProvider
       ├─ Configured OpenAI-compatible adapter
       └─ UnavailableVisionProvider

Supabase
  ├─ Auth
  ├─ PostgreSQL with RLS
  └─ private `record-images` bucket
```

## Key decisions

### Next.js 16 App Router

Use React Server Components for layouts and static/editorial content. Client components own camera access, local demo state, interactive collection controls, and TanStack Query. Route handlers keep provider credentials and provider-specific response mapping off the client.

### MusicBrainz first

MusicBrainz supports public structured search, barcode fields, release identifiers, and source URLs without requiring a private API key. The adapter sends a descriptive User-Agent, serializes outbound requests through a process-local limiter, caches safe GET responses, honors `Retry-After`, and applies a hard timeout. Vercel instances cannot guarantee a global one-request-per-second limit, so production scale requires a shared queue/cache or a commercial MetaBrainz arrangement.

Cover art uses the Cover Art Archive by MusicBrainz release ID. Images are external copyrighted material; the UI attributes the source, does not claim ownership, and provides a no-art fallback. The deployment owner must review usage before commercial operation.

Discogs is not enabled by default. Its token, API terms, image rules, and caching constraints require explicit operator configuration and review. The abstraction reserves it without pretending it is available.

### Trust boundary

AI vision returns `IdentificationClues`, never a `Release`. Clues pass through Zod validation and are used to query structured providers. The resulting provider records are authoritative only to the extent identified by source attribution. Missing data remains missing.

### Demo mode

Demo records are original fictional fixtures with locally generated abstract artwork. `source.provider = "demo"` appears in both data and interface. Demo changes persist in namespaced local storage and can be reset. External search remains real when reachable.

## Domain model

```ts
type MetadataProviderName = "musicbrainz" | "discogs" | "demo" | "manual";

type Release = {
  source: { provider: MetadataProviderName; releaseId: string; url?: string };
  artist: string;
  title: string;
  releaseDate?: string;
  year?: number;
  country?: string;
  labels: Array<{ name: string; catalogueNumber?: string }>;
  formats: Array<{ name: string; details: string[] }>;
  barcode?: string;
  identifiers: Array<{ type: string; value: string }>;
  genres: string[];
  styles: string[];
  tracks: Array<{ position?: string; title: string; duration?: string }>;
  coverArtUrl?: string;
};

type Evidence = {
  artist?: string;
  title?: string;
  label?: string;
  catalogueNumber?: string;
  barcode?: string;
  matrix?: string;
  country?: string;
  year?: number;
  format?: string;
};

type MatchCandidate = {
  release: Release;
  score: number;
  confidence: "high" | "possible" | "verify";
  reasons: Array<{
    field: keyof Evidence;
    outcome: "match" | "conflict" | "missing";
    explanation: string;
    points: number;
  }>;
};

type CollectionCopy = {
  id: string;
  ownerId: string;
  release: Release;
  evidence: Evidence;
  identificationMethod:
    "search" | "barcode" | "photo" | "runout" | "manual" | "demo";
  mediaCondition?: Condition;
  sleeveCondition?: Condition;
  notes?: string;
  shelf?: string;
  tags: string[];
  favorite: boolean;
  addedAt: string;
  updatedAt: string;
};
```

## Database schema

### `profiles`

- `id uuid primary key references auth.users on delete cascade`
- `display_name text`
- `created_at timestamptz`
- `updated_at timestamptz`

### `releases`

Provider metadata is deduplicated globally, while mutable user data stays separate.

- `id uuid primary key`
- `provider text check (...)`
- `provider_release_id text`
- `source_url text`
- `artist text not null`
- `title text not null`
- `release_date text`
- `release_year smallint`
- `country text`
- `barcode text`
- `labels jsonb not null default '[]'`
- `formats jsonb not null default '[]'`
- `identifiers jsonb not null default '[]'`
- `genres text[] not null default '{}'`
- `styles text[] not null default '{}'`
- `tracks jsonb not null default '[]'`
- `cover_art_url text`
- `raw_metadata jsonb` (bounded provider snapshot; never secrets)
- unique `(provider, provider_release_id)`

Authenticated users may read releases. Writes occur through trusted server code. Demo data never enters this table automatically.

### `collection_copies`

- `id uuid primary key`
- `owner_id uuid not null references auth.users`
- `release_id uuid references releases`
- `release_snapshot jsonb` stores the selected provider snapshot or a manual release when no shared release row exists
- `identification_method text`
- `evidence jsonb`
- `media_condition text`
- `sleeve_condition text`
- `notes text`
- `shelf text`
- `tags text[]`
- `is_favorite boolean`
- `idempotency_key uuid`
- timestamps
- unique `(owner_id, idempotency_key)`

RLS permits owners to select, insert, update, and delete only their rows.

### `identification_sessions`

- `id uuid primary key`
- `owner_id uuid not null`
- `method text`
- `status text`
- `original_input jsonb` (bounded and redacted)
- `normalized_evidence jsonb`
- `selected_provider text`
- `selected_release_id text`
- timestamps

This supports resumable identification and later batch processing. RLS is owner-only.

### `record_images`

- `id uuid primary key`
- `owner_id uuid not null`
- `storage_path text not null`
- `mime_type text not null`
- `byte_size integer not null`
- `purpose text`
- `retention_until timestamptz`
- timestamps

Storage path begins with the owner's UUID. Storage and table policies enforce ownership.

## Matching strategy

### Normalization

- Preserve all original evidence.
- Unicode-normalize text with NFKC.
- Compare case-insensitively and collapse whitespace.
- Remove punctuation only in comparison keys, not stored display values.
- Barcode key: digits only; preserve leading zeroes.
- Catalogue key: uppercase alphanumeric only.
- Matrix key: uppercase, collapse separators to spaces, preserve a token sequence and compact key.
- Artist/title similarity: normalized token Dice coefficient with exact-string bonus.

### Score weights

Evidence contributes only when the user supplied it and the candidate has a comparable value.

| Evidence         |        Exact / strong |                         Partial | Conflict penalty |
| ---------------- | --------------------: | ------------------------------: | ---------------: |
| Barcode          |                   +55 | +20 (validated UPC/EAN variant) |              -45 |
| Matrix/runout    |                   +50 |           +30 token containment |              -25 |
| Catalogue number |                   +35 |                             +20 |              -25 |
| Artist           |                   +18 |                       up to +14 |              -12 |
| Title            |                   +18 |                       up to +14 |              -12 |
| Label            |                   +12 |                              +7 |               -5 |
| Country          |                    +8 |                               — |               -4 |
| Year             | +8 exact, +4 adjacent |                               — |               -4 |
| Format           |                    +8 |                              +4 |               -4 |

The total is clamped to 0–100. Strong-identifier conflicts cap the score below the high-confidence threshold. Missing candidate fields add zero and are explained as missing. Stable order is score descending, exact strong-identifier count descending, release date ascending, provider release ID ascending.

Threshold names describe workflow guidance, not probability:

- **High confidence:** 80–100 and no strong-identifier conflict.
- **Possible match:** 50–79.
- **Needs verification:** 0–49.

### Duplicate handling

The same provider release may have many collection copies. The save UI warns when the release already exists, but never blocks an intentional duplicate. Request idempotency prevents double-click duplicates while copy records preserve separate condition and notes.

## UI/UX strategy

### Visual language

- Near-black `#12100f` foundation, warm paper `#f2ecdf`, oxblood `#8f2f3f`, brass `#c49a5a`, muted moss `#68705a`.
- Editorial serif display type paired with a clean sans-serif UI face, both loaded through `next/font`.
- Artwork is the visual anchor. Surfaces rely on spacing, tone, and soft shadow rather than boxed borders.
- Vinyl motifs appear as subtle radial grooves and circular crops, never as decorative clutter.

### Information architecture

Primary navigation: Home, Collection, Identify, Dashboard, Settings. Mobile uses a reachable bottom bar; desktop uses a compact left rail/top editorial header. A persistent “Identify a record” action remains prominent.

### Golden path

1. Dashboard presents one primary identify action.
2. Identify opens directly to barcode with text and photo alternatives one tap away.
3. Successful capture/search transitions in place to ranked candidates.
4. Candidate cards expose edition differences and score reasons; details expand without a separate confirmation page.
5. “Add this copy” opens a short drawer with optional copy details.
6. Save gives immediate feedback and a direct link to the collection item.

### Core states

Every data view defines loading skeleton, empty, error, partial, and success states. Provider outages retain entered evidence. Unsupported camera APIs explain the manual fallback. Reduced-motion users receive opacity-only or no transitions.

## API routes

- `GET /api/search?q=&artist=&title=&label=&catno=&year=&country=&format=`
- `POST /api/identify` with validated `Evidence`
- `POST /api/vision` multipart image, optional and rate limited
- Supabase CRUD occurs through server actions or a typed repository with RLS; demo CRUD stays client-side.

Responses use `{ data, meta }` or `{ error: { code, message, retryable } }`. Provider payloads are never passed through unchanged.

## Caching and rate control

- Cache normalized MusicBrainz searches for 15 minutes; detailed release metadata for 24 hours.
- Deduplicate identical in-flight requests in a process.
- Use a process-local 1.1-second limiter for development and low traffic.
- Read provider rate headers when available.
- Abort after 8 seconds. Retry once only for 429/503/network errors, honoring `Retry-After` within the request budget.
- Document that serverless multi-instance deployments require shared rate coordination before substantial traffic.

## Error model

Stable user-facing codes: `VALIDATION_ERROR`, `PROVIDER_UNAVAILABLE`, `PROVIDER_RATE_LIMITED`, `VISION_NOT_CONFIGURED`, `CAMERA_UNAVAILABLE`, `UNAUTHORIZED`, `SAVE_CONFLICT`, `UNKNOWN_ERROR`. Detailed provider bodies stay server-side and are sanitized before logging.

## Testing strategy

- Unit tests: normalization, score contribution, confidence thresholds, deterministic ranking, provider mapping, schema validation.
- Property tests with fast-check: normalization idempotence; score always integer 0–100; ranking deterministic; digit-only barcode key; duplicate copies never collapse by release ID.
- Integration tests: route validation and mocked provider failure/success.
- Journey checks: demo entry → identify fixture → confirm → save → collection reload; real provider smoke test is opt-in to avoid abusing APIs.
- Accessibility: automated component/page audit plus keyboard and screen-reader-oriented manual checklist.

## Deployment

Vercel hosts Next.js. Supabase hosts Auth, PostgreSQL, and private object storage. Required production variables are documented in `.env.example`; no secret uses a `NEXT_PUBLIC_` prefix. Demo mode requires no variables. Database setup is applied from `supabase/migrations`.
