# How Kiro Shaped Development

This repository preserves the Kiro assets used to build the app. This document lists only features that are present in the repository or were used during implementation.

## Spec-driven development

The MVP began with formal requirements, architecture, scoring rules, schema design, UX strategy, risks, and ordered tasks under `.kiro/specs/music-cataloguing-mvp/`. The spec kept optional AI and valuation work behind the complete identify-to-save path.

## Steering

Repository steering under `.kiro/steering/` defines product priorities, architecture boundaries, design language, coding rules, identification reliability, testing, and privacy. These rules made several decisions explicit:

- AI creates search clues, never release facts.
- Strong identifiers outrank text similarity.
- Demo records are visibly fictional.
- Browser demo and Supabase cloud persistence are separate repository adapters.
- Important transformations use property-based tests.

## Hooks

`.kiro/hooks/` contains lightweight quality automation:

- TypeScript and TSX saves lint only the changed file through `.kiro/scripts/lint-changed.mjs`.
- Domain/provider/repository saves run the bounded unit/property suite.
- Completed spec tasks run strict type checking.

The lint helper treats hook input as untrusted data, resolves paths inside the workspace, and invokes ESLint without a shell. Hook execution depends on the Kiro client/runtime. The same checks remain available as explicit npm scripts and are run before release.

## Property-based testing

Fast-check exercises invariants that example-only tests often miss: normalization idempotence, digit-only barcode keys, score bounds, deterministic ranking, input immutability, and duplicate-copy preservation.

## AI-assisted implementation

Kiro was used to research provider constraints, establish the design, implement the vertical slice, diagnose strict-TypeScript and persistence-schema failures, and verify the production build. External metadata still comes from the named provider, never from generated knowledge.
