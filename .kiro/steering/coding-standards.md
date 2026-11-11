---
inclusion: always
---

# Coding Standards

- TypeScript is strict. Avoid `any`; use `unknown` plus validation at trust boundaries.
- Validate request bodies, URL parameters, environment variables, external provider payloads, and persisted browser data with Zod.
- Prefer small pure functions for normalization, scoring, mapping, and analytics.
- Use named domain types and discriminated unions for states and errors.
- Preserve original identifiers. Derive comparison keys separately.
- Keep React components focused. Extract behavior when a component becomes difficult to scan, not according to arbitrary line counts.
- Use Server Components by default and mark the smallest possible client boundary with `"use client"`.
- Use accessible native elements before custom controls.
- Do not hardcode secrets, provider tokens, deployment URLs, or user-specific data.
- Do not swallow errors. Convert expected failures into typed, actionable states and log only sanitized operational detail.
- Do not perform unrelated refactors while implementing a task.
- Comments explain non-obvious decisions and constraints, not restate syntax.
- Run formatting, lint, strict type checks, relevant tests, and a production build before claiming completion.
