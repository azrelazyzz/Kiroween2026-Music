# Music Cataloguing MVP Tasks

Task states: `[ ]` pending, `[-]` in progress, `[x]` complete, `[!]` blocked.

## 1. Foundation and governance

- [x] 1.1 Refine MVP boundaries and acceptance scenarios.
- [x] 1.2 Define architecture, domain model, database schema, matching strategy, and UX direction.
- [x] 1.3 Record current provider constraints and integration risks.
- [x] 1.4 Add product, architecture, UI, coding, AI reliability, testing, and security steering.
- [x] 1.5 Add scoped Kiro quality hooks and document where they execute.

## 2. Application foundation

Depends on: 1

- [x] 2.1 Scaffold strict Next.js App Router, Tailwind CSS, linting, formatting, Vitest, and path aliases.
- [x] 2.2 Implement design tokens, typography, accessible primitives, and responsive shell.
- [x] 2.3 Implement domain types and shared Zod validation.
- [x] 2.4 Add fictional, clearly labeled demo fixtures and original local artwork.
- [-] 2.5 Add environment validation and `.env.example`.

## 3. Persistence and access

Depends on: 2.3

- [x] 3.1 Create Supabase migration for profiles, releases, collection copies, identification sessions, private images, indexes, triggers, and RLS.
- [x] 3.2 Add server/client Supabase factories that are inert when configuration is absent.
- [x] 3.3 Implement demo session entry and versioned local collection repository.
- [x] 3.4 Implement Supabase collection repository for authenticated users.
- [x] 3.5 Build authentication/onboarding UI and clear persistence-mode labeling.

## 4. Metadata provider and matching core

Depends on: 2.3

- [x] 4.1 Define provider-independent metadata interface and error model.
- [x] 4.2 Implement MusicBrainz release search, mapping, attribution, timeout, cache, and local rate limiter.
- [x] 4.3 Implement evidence normalization without mutating originals.
- [x] 4.4 Implement explainable weighted scoring and deterministic ranking.
- [x] 4.5 Implement validated `/api/search` and `/api/identify` routes.
- [x] 4.6 Add unit and property tests for normalization, scores, ranking, and provider mapping.

## 5. Core identify-to-save journey

Depends on: 3, 4

- [x] 5.1 Build identify workspace with barcode and text search modes.
- [x] 5.2 Add progressive camera barcode scanning with a manual fallback.
- [x] 5.3 Build candidate list, confidence labels, evidence explanations, and edition comparison.
- [x] 5.4 Build copy-details confirmation drawer/form and duplicate warning.
- [x] 5.5 Persist the selected release and copy, guard repeated submissions, and show success navigation.
- [x] 5.6 Preserve evidence and input across provider errors and retries.

## 6. Collection product

Depends on: 5

- [x] 6.1 Build collection gallery with search, filters, sorting, responsive artwork, and empty states.
- [x] 6.2 Build record detail page with source metadata, identifiers, track list, and copy data.
- [x] 6.3 Implement edit, favorite, duplicate-copy, and confirmed delete actions.
- [x] 6.4 Build dashboard totals, recent additions, genre summary, and decade summary from stored data.

## 7. Secondary MVP capabilities

Depends on: stable 5 and 6

- [x] 7.1 Add manual record creation with explicit provenance.
- [-] 7.2 Add optional provider-independent vision clue extraction and unavailable state.
- [x] 7.3 Add runout/matrix input and normalization to identification.
- [x] 7.4 Add a bounded batch queue only if individual identification remains stable.
- [x] 7.5 Add settings for demo reset, source attribution, privacy, and integration status.

## 8. Quality and submission readiness

Depends on: all included MVP tasks

- [x] 8.1 Run lint, strict type check, unit/property tests, and production build.
- [ ] 8.2 Verify mobile layouts, keyboard operation, focus, contrast, loading, error, and reduced-motion states.
- [ ] 8.3 Verify demo journey and opt-in live MusicBrainz search.
- [x] 8.4 Write README setup, testing, provider policy, deployment, architecture, and demo instructions.
- [x] 8.5 Document Kiro specs, steering, hooks, and property-testing use without claiming unused features.
- [-] 8.6 Add open-source license and hackathon submission outline.

## Deferred beyond MVP

- Calibrated valuation or resale prices.
- Conversational collection assistant.
- Discogs provider activation before terms/operator review.
- Shared distributed provider rate limiter for high traffic.
- Import/export and store inventory workflows.
- Native barcode decoder fallback for browsers without `BarcodeDetector`.
