# Changelog

## Unreleased
- Centralized environment loading in `src/config/env.ts` to validate Supabase, Stripe, and app configuration consistently.
- Standardized request logging with request IDs and duration via `requestLogger`; error handling now includes request metadata while preserving the existing client error shape.
- No API contract changes: endpoints, payloads, and status codes remain the same.
- Added Jest + ts-jest test harness with Supertest integration coverage (`npm test`, `npm run test:unit`, `npm run test:integration`, `npm run test:watch`).
- Tests and execution commands are documented in the server `package.json` scripts and README.
- Known limitations: Supabase and Stripe calls still require valid credentials; webhook verification depends on configured Stripe secrets.
