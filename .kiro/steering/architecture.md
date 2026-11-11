---
inclusion: always
---

# Architecture

- Use Next.js App Router, React, strict TypeScript, Tailwind CSS, and accessible shadcn-style primitives.
- Keep domain logic in `src/lib/domain`, provider adapters in `src/lib/providers`, persistence adapters in `src/lib/repositories`, and feature UI in `src/components` or route-local components.
- Route handlers validate all input and map external DTOs into provider-independent domain models.
- AI vision may return identification clues only. Verify candidates with a structured metadata provider.
- Keep MusicBrainz, Discogs, demo, and manual sources explicit. Never merge provider identities silently.
- Use Supabase Auth, PostgreSQL, RLS, and private object storage in production. Keep a visibly local demo repository for credential-free judging.
- Prefer server components unless browser APIs, interactive state, or client-side repositories require a client component.
- Do not add abstraction without a current second implementation or a clear trust boundary. Provider and repository interfaces are justified boundaries.
- Commit every database change as an ordered migration in `supabase/migrations`.
- Full design reference: #[[file:.kiro/specs/music-cataloguing-mvp/design.md]]
