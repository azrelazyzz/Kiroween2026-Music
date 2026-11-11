---
inclusion: always
---

# Testing Expectations

- Add tests with business logic, regressions, and trust-boundary behavior. Do not write tests merely to mirror implementation.
- Use unit tests for normalization, matching contributions, confidence thresholds, provider mapping, and analytics.
- Use fast-check property tests where invariants matter:
  - normalization is idempotent;
  - barcode keys contain only digits and preserve leading zeroes;
  - every match score is an integer in 0–100;
  - ranking is deterministic for identical inputs;
  - separate collection-copy IDs survive deduplication by release;
  - data transformations do not mutate their inputs.
- Mock external providers in automated tests. Keep live provider smoke tests opt-in to respect rate limits and avoid flaky CI.
- Test success, empty, malformed, timeout, rate-limit, and unavailable-provider outcomes.
- Verify the core demo journey after meaningful changes: enter demo → identify → inspect → save → reload collection.
- Before completion, run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
