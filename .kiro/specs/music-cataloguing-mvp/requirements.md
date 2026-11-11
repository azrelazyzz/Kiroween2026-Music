# Music Cataloguing MVP Requirements

## Product scope

The MVP delivers the shortest trustworthy journey from a physical record to a saved digital collection entry:

1. Enter through an authorized demonstration mode or Supabase authentication.
2. Search MusicBrainz by text or identify by barcode.
3. Review ranked release candidates and the evidence behind each rank.
4. Confirm one release, add copy-specific details, and save it.
5. Browse, search, edit, favorite, and remove saved records.
6. View a useful collection summary.

Photo clue extraction, camera barcode scanning where the browser supports `BarcodeDetector`, manual record creation, and a small batch queue are included only after the core path is stable. Discogs remains an optional provider adapter because its API terms and token requirements require deployment-owner approval. AI vision remains optional and cannot supply authoritative metadata.

## Personas

- **New collector:** needs guided identification and plain language.
- **Experienced collector:** needs edition identifiers, evidence, and override controls.
- **DJ:** needs fast search, tags, shelves, duplicates, and mobile use.
- **Hackathon judge:** needs a dependable, clearly labeled demo without private credentials.

## Functional requirements

### FR-1 Access and demo mode

- FR-1.1 WHEN Supabase is configured, THE SYSTEM SHALL support email-based authentication using Supabase Auth.
- FR-1.2 WHEN a visitor chooses demo mode, THE SYSTEM SHALL create an isolated local demo session without implying that it is an authenticated cloud account.
- FR-1.3 THE SYSTEM SHALL visibly label fictional fixtures and local-only persistence.
- FR-1.4 IF cloud services are unavailable, THEN THE SYSTEM SHALL preserve demo access and explain the limitation.

### FR-2 Release search

- FR-2.1 WHEN a user submits a valid query, THE SYSTEM SHALL search an enabled structured metadata provider server-side.
- FR-2.2 THE SYSTEM SHALL support artist, title, label, catalogue number, year, country, format, and barcode evidence where supported by the provider.
- FR-2.3 WHEN MusicBrainz is enabled, THE SYSTEM SHALL send an identifying User-Agent and respect its service rate policy.
- FR-2.4 IF a provider times out, rate-limits, or fails, THEN THE SYSTEM SHALL show an actionable error without fabricating results.
- FR-2.5 THE SYSTEM SHALL identify every external result by provider and link to its source.

### FR-3 Barcode identification

- FR-3.1 WHEN the browser supports the Barcode Detection API and camera access, THE SYSTEM SHALL allow camera-assisted barcode capture.
- FR-3.2 THE SYSTEM SHALL always offer manual barcode entry as a fallback.
- FR-3.3 WHEN a barcode is submitted, THE SYSTEM SHALL preserve the original value and search using a normalized digit-only value.
- FR-3.4 IF no exact result exists, THEN THE SYSTEM SHALL keep the barcode as evidence and offer text search or manual creation.

### FR-4 Photo clue extraction

- FR-4.1 THE SYSTEM SHALL validate uploaded image type and size before processing.
- FR-4.2 WHEN a vision provider is configured, THE SYSTEM SHALL extract only identification clues such as artist, title, label, catalogue number, and visible barcode.
- FR-4.3 THE SYSTEM SHALL treat extracted clues as untrusted suggestions and verify candidates through structured metadata.
- FR-4.4 WHEN no vision provider is configured, THE SYSTEM SHALL explain that photo analysis is unavailable and offer barcode or text search.
- FR-4.5 THE SYSTEM SHALL never present model-generated release metadata as authoritative.

### FR-5 Matching and ranking

- FR-5.1 THE SYSTEM SHALL score candidates using deterministic weighted evidence.
- FR-5.2 THE SYSTEM SHALL weight exact barcode, matrix/runout, and catalogue-number matches above artist/title/year similarities.
- FR-5.3 THE SYSTEM SHALL clamp every score to the inclusive range 0–100.
- FR-5.4 THE SYSTEM SHALL label scores as High confidence (>= 80), Possible match (50–79), or Needs verification (< 50), without describing them as calibrated probabilities.
- FR-5.5 THE SYSTEM SHALL display matched, conflicting, and missing evidence in plain language.
- FR-5.6 WHEN scores tie, THE SYSTEM SHALL apply a stable deterministic tie-breaker.
- FR-5.7 THE SYSTEM SHALL always allow candidate rejection, query correction, or manual entry.

### FR-6 Identification confirmation

- FR-6.1 WHEN candidates are returned, THE SYSTEM SHALL allow side-by-side inspection of edition-defining fields.
- FR-6.2 THE SYSTEM SHALL require an explicit candidate selection before save.
- FR-6.3 BEFORE save, THE SYSTEM SHALL allow copy-specific condition, notes, shelf, tags, and favorite state.
- FR-6.4 THE SYSTEM SHALL prevent accidental duplicate submissions while allowing intentional duplicate copies.

### FR-7 Collection management

- FR-7.1 THE SYSTEM SHALL persist saved records to the signed-in user's Supabase collection when configured.
- FR-7.2 IN demo mode, THE SYSTEM SHALL persist collection changes in that browser using versioned local storage.
- FR-7.3 THE SYSTEM SHALL preserve provider release ID, provider name, source URL, edition fields, and identification evidence.
- FR-7.4 THE SYSTEM SHALL support collection browse, text search, filtering, and sorting.
- FR-7.5 THE SYSTEM SHALL support editing condition, notes, shelf, tags, and favorite state.
- FR-7.6 THE SYSTEM SHALL support explicit deletion with a confirmation step.
- FR-7.7 THE SYSTEM SHALL represent duplicate copies as separate collection entries linked to the same source release.

### FR-8 Record detail

- FR-8.1 THE SYSTEM SHALL show only metadata returned by the provider or entered by the user.
- FR-8.2 THE SYSTEM SHALL distinguish release metadata from personal copy data.
- FR-8.3 THE SYSTEM SHALL display track listings when supplied by the provider.
- FR-8.4 THE SYSTEM SHALL provide an authoritative source link.

### FR-9 Dashboard

- FR-9.1 THE SYSTEM SHALL display total copies, unique releases, favorites, and unidentified entries computed from stored records.
- FR-9.2 THE SYSTEM SHALL display recent additions.
- FR-9.3 THE SYSTEM SHALL display useful genre and decade distributions when data exists.
- FR-9.4 THE SYSTEM SHALL use honest empty states rather than invented analytics.

### FR-10 Manual entry and batch queue

- FR-10.1 WHEN identification fails, THE SYSTEM SHALL allow a user-created record with clearly marked provenance.
- FR-10.2 THE SYSTEM SHALL preserve incomplete fields rather than inventing values.
- FR-10.3 AFTER the individual workflow is complete, THE SYSTEM SHOULD support a bounded batch queue with Pending, Identifying, Awaiting confirmation, Saved, and Failed states.
- FR-10.4 EACH batch item SHALL remain independently retryable and editable.

## Nonfunctional requirements

### NFR-1 Performance

- The initial application shell SHOULD reach usable interaction quickly on a typical modern mobile connection.
- Search input SHALL be debounced by 300–500 ms where suggestions are automatic; explicit form submission SHALL not be delayed.
- Provider calls SHALL use server-side caching, deduplication, an 8-second timeout, and no more than one safe retry.
- Collection lists SHALL paginate or virtualize before rendering more than 100 entries.
- Images SHALL use responsive sizing and lazy loading outside the initial viewport.

### NFR-2 Reliability

- Domain ranking and normalization SHALL be deterministic and side-effect free.
- External failures SHALL not destroy unsaved user input.
- Mutations SHALL use stable idempotency keys where network retries could duplicate entries.
- The demo fixture path SHALL not depend on external services.

### NFR-3 Security and privacy

- Secrets SHALL remain server-side.
- Every database table containing user data SHALL enforce row-level security by `auth.uid()`.
- Uploads SHALL use private storage, content-type allowlists, size limits, unpredictable paths, and signed access URLs.
- Inputs SHALL be validated with shared typed schemas at trust boundaries.
- Logs SHALL omit uploaded images, access tokens, personal notes, and full model prompts.
- Image retention SHALL be explicit and user-deletable.

### NFR-4 Accessibility

- Core workflows SHALL be keyboard operable.
- Controls SHALL have accessible names and visible focus states.
- Text and interactive elements SHALL meet WCAG 2.2 AA contrast targets.
- Motion SHALL respect `prefers-reduced-motion`.
- Status changes SHALL be announced through appropriate live regions.

### NFR-5 Compatibility

- The application SHALL support current stable Chrome, Safari, Firefox, and Edge on desktop and mobile.
- Camera barcode scanning SHALL be progressive enhancement; unsupported browsers SHALL retain manual entry.
- Layouts SHALL function from 320 px width upward.

### NFR-6 Maintainability

- TypeScript SHALL use strict mode.
- Provider DTOs SHALL be mapped to provider-independent domain models.
- UI, domain logic, persistence, and integrations SHALL remain separate.
- Schema changes SHALL use committed SQL migrations.
- Important pure business rules SHALL have example-based and property-based tests.

## MVP acceptance scenarios

1. GIVEN demo mode, WHEN a judge opens the dashboard, THEN clearly fictional records are visible without credentials.
2. GIVEN MusicBrainz is reachable, WHEN a user searches for an artist and title, THEN real attributed release candidates appear.
3. GIVEN a barcode, WHEN a user submits it, THEN the app searches by normalized barcode and explains candidate evidence.
4. GIVEN multiple candidates, WHEN a user inspects them, THEN country, date, label, catalogue number, format, barcode, and score reasons can distinguish editions where available.
5. GIVEN a selected candidate, WHEN the user confirms save, THEN a new collection copy persists and appears in browse and dashboard views.
6. GIVEN a saved copy, WHEN the user edits copy details, THEN the changes survive a reload in the active persistence mode.
7. GIVEN an unavailable provider, WHEN a search fails, THEN the query remains and the UI offers retry, demo identification, or manual entry.
8. GIVEN production configuration, WHEN quality checks run, THEN lint, type check, tests, and the production build pass.
