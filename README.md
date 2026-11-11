# Reverie — Music Cataloguing App

**Old Records. New Discoveries.**

Reverie helps collectors identify vinyl pressings, compare edition evidence, and preserve physical-copy details in a searchable collection. It was built for Kiroween 2026's Resurrection category.

## Current MVP

- Barcode identification with progressive camera support and manual entry.
- Artist, title, label, catalogue, country, year, format, and runout evidence.
- Live structured release search through MusicBrainz.
- Deterministic candidate ranking with inspectable match, conflict, and missing-data reasons.
- Edition comparison and duplicate-aware copy saving.
- Collection search, sorting, conditions, shelves, tags, notes, favorites, and deletion.
- Dashboard summaries calculated only from stored collection data.
- Credential-free local demo with fictional records and original artwork.
- Optional Supabase email authentication, PostgreSQL persistence, RLS, and private image-storage policies.
- Manual record placeholders and an independently retryable batch-photo queue.

AI photo clue extraction and Discogs are deliberately disabled until an operator configures and reviews those integrations. The UI reports these limitations instead of simulating results.

## Quick start

Requirements: Node.js 22 or newer and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Supabase is optional for the local demo.

### Demo journey

1. Open **Identify**.
2. Choose **Try fictional demo barcode**, or enter `0712345678901`.
3. Compare the fictional UK and German editions.
4. Select **Add this copy** and save optional copy details.
5. Open the saved item from the collection.
6. Reset local data under **Settings** when needed.

Fictional fixtures are visibly labeled and never enter the cloud database automatically.

## Environment

Copy `.env.example` to `.env.local` and configure only the services you use:

| Variable                        | Purpose                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL; safe for clients when RLS is enabled.    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key; never substitute a service-role key. |
| `MUSICBRAINZ_CONTACT`           | Contact URL or email included in the MusicBrainz User-Agent.   |
| `NEXT_PUBLIC_APP_URL`           | Application origin used for local and deployed links.          |

The Discogs and AI variables in `.env.example` are reserved for future adapters. Their presence does not enable those features.

## Supabase setup

1. Create a Supabase project.
2. Apply migrations from `supabase/migrations` in filename order.
3. Add the project URL and anon key to `.env.local`.
4. Add `<your-origin>/auth/callback` to the Supabase authentication redirect allowlist.
5. Verify email authentication and all RLS policies in a staging project before public deployment.

The migration creates profiles, release snapshots, collection copies, identification sessions, private record-image metadata, a private storage bucket, and owner-only policies. Application-side upload signature and pixel validation is still required before enabling persisted photo uploads.

## Quality checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Tests include fast-check properties for normalization idempotence, barcode invariants, score boundaries, deterministic ranking, immutability, idempotent saves, and duplicate-copy preservation. Live provider tests are intentionally excluded from CI.

## Architecture

- Next.js App Router, React, strict TypeScript, and Tailwind CSS.
- Domain rules in `src/lib/domain`.
- Provider adapters in `src/lib/providers`.
- Persistence adapters in `src/lib/repositories`.
- Validated server routes under `src/app/api`.
- Supabase schema and RLS under `supabase/migrations`.
- Product requirements, design, tasks, steering, and hooks under `.kiro`.

See:

- [MVP requirements](.kiro/specs/music-cataloguing-mvp/requirements.md)
- [Technical design](.kiro/specs/music-cataloguing-mvp/design.md)
- [Implementation tasks](.kiro/specs/music-cataloguing-mvp/tasks.md)
- [Provider research](docs/provider-research.md)
- [How Kiro shaped development](docs/kiro-development.md)

## Provider responsibilities

Music metadata comes from [MusicBrainz](https://musicbrainz.org/). External artwork may come from the [Cover Art Archive](https://coverartarchive.org/) and remains copyrighted by its respective owners. Discogs is not enabled; review the [Discogs developer documentation](https://www.discogs.com/developers) and current API terms before adding it.

The development limiter is process-local. A horizontally scaled public deployment needs shared MusicBrainz rate coordination or an appropriate MetaBrainz service arrangement.

## Deployment

The application targets Vercel and Supabase:

1. Import this repository into Vercel.
2. configure the documented environment variables.
3. Apply and verify the Supabase migration.
4. Configure the production authentication callback URL.
5. Run the complete quality suite before promotion.

Demo mode requires no credentials and remains available if external services fail.

## License

Application code and original demo artwork are available under the [MIT License](LICENSE). External metadata and artwork retain their respective licenses and copyrights.

Content was rephrased for compliance with licensing restrictions.
