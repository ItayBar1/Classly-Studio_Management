# Classly — Architecture Review & Improvement Roadmap

> **Date:** 2026-04-16
> **Scope:** Full-stack audit — backend, frontend, DB, tests, CI, security posture.
> **Companion doc:** [`ONBOARDING.md`](./ONBOARDING.md) describes how the system works *today*; this doc describes what's **wrong** with it and how to improve it.

---

## Executive Summary

Classly is a well-structured MVC app with solid foundational patterns — layered backend, clean Prisma models, HttpOnly cookie auth, Stripe integration done the right way. However, the codebase has **four critical defects** that would cause real harm in a multi-studio production deployment:

1. **Secrets are in git history** (DB password, JWT secret, Stripe key, SMTP key, Cloudflare tunnel token).
2. **Multi-tenant isolation is incomplete** — several endpoints leak data across studios.
3. **Stripe webhooks have no event deduplication** — retries can cause double-processing.
4. **No CI test gate** — every push to `main` deploys straight to production.

Beyond these, there's a long tail of medium-severity issues (missing DB indexes, no token refresh, prop-drilled auth state, 2–27 % test coverage) that together slow delivery and add risk.

This doc is organized in three parts:

- **Part A — Defects**, prioritized by severity.
- **Part B — Architectural deepening candidates**, per the "deep modules" rubric (small interface, large implementation, better testability).
- **Part C — Quick wins & roadmap**.

---

# Part A — Defects

## A1. CRITICAL

### A1.1 Secrets committed to git

**Evidence:** `server/.env`, `client/.env`, and root `.env` are in `.gitignore` *today* but have been committed previously. The files contain:

- `DB_PASSWORD=SERVICEphonenumber4441355705`
- `JWT_SECRET=<full 256-char key>`
- `STRIPE_SECRET_KEY=sk_test_51SeyMs...`
- `SMTP_PASS=<YOUR_RESEND_API_KEY>` (Resend)
- `CF_TUNNEL_TOKEN=eyJhIjoi...` (Cloudflare)
- `SUPERADMIN_EMAIL=superadmin@superadmin.com` + plaintext password

**Impact:** Anyone with read access to the repo — now or historically — has these credentials. Resend and Stripe test keys can be revoked; the DB password is harder because it's hardcoded in the Docker volume.

**Fix:**
1. **Rotate all secrets immediately.** New JWT secret, new DB password, regenerate Stripe/SMTP/CF tokens.
2. Scrub history with `git filter-repo --invert-paths --path server/.env --path client/.env --path .env`.
3. Force-push to main (coordinate with the team — this rewrites history).
4. Add `.env.example` files with placeholders so new devs know what to set.
5. Long term: move to a secret manager (Doppler, Vault, or GitHub Actions secrets only, never `.env` committed).

---

### A1.2 Multi-tenant data leak in `CourseService` — RESOLVED 2026-08-16

> **Status: fixed.** Every method below now takes a `studioId` and resolves through
> `findFirst({ where: { id, studio_id } })`, treating a miss as 404; list reads
> return `[]` when there is no studio context. Regression coverage lives in
> `tests/unit/enrollmentService.test.ts` and `tests/integration/enrollment.test.ts`.
> The leak survived in production long after the first partial fix because
> `classly-api` was still serving a pre-fix `dist/` — see the deploy note in `CLAUDE.md`.

**Evidence (as originally found):**

- [`server/src/services/courseService.ts:27-57`](../server/src/services/courseService.ts#L27) — `getAllCourses()` has no `studio_id` filter; it returns every course across every studio.
- [`server/src/services/courseService.ts:86-110`](../server/src/services/courseService.ts#L86) — `getCourseById()` selects by primary key only. A user in Studio A who learns a course ID from Studio B can read it.
- [`server/src/services/courseService.ts:153-178`](../server/src/services/courseService.ts#L153) — `updateCourse()` updates by ID without a `studio_id` guard. An admin in Studio A can modify Studio B's courses.
- [`server/src/controllers/studentController.ts:31-45`](../server/src/controllers/studentController.ts#L31) — `getById()` has no studio check. Same issue.
- [`server/src/controllers/instructorController.ts:24-51`](../server/src/controllers/instructorController.ts#L24) — missing cross-studio check.
- [`server/src/services/enrollmentService.ts`](../server/src/services/enrollmentService.ts) — `getStudentEnrollments()` scopes by `student_id` only, not `studio_id`.

**Impact:** **Cross-tenant data disclosure and modification.** Any authenticated user who can guess or enumerate UUIDs can read/write data belonging to other studios. This is a GDPR/privacy-grade issue.

**Fix:**
- Add `studio_id` to the `where` clause of every `findMany`, `findUnique`, `findFirst`, `update`, `delete` in these services.
- Prefer `findFirst({ where: { id, studio_id } })` over `findUnique({ where: { id } })`.
- Treat a miss as 404, not 403 — don't confirm existence of cross-tenant resources.
- Add integration tests that assert cross-studio access is rejected. This is the right place for **boundary tests** on the tenant-scope module (see B1 below).

---

### A1.3 Stripe webhook has no event-level idempotency

**Evidence:** [`server/src/controllers/webhookController.ts:32-63`](../server/src/controllers/webhookController.ts#L32). The handler switches on `event.type` and calls `processSuccessfulPayment(paymentIntent)`. It never checks whether `event.id` has been seen before. Stripe explicitly retries on non-2xx responses and network timeouts.

The *only* idempotency is a conditional `updateMany({ where: { status: 'PENDING' } })` — which correctly prevents double-updating a payment row, but:

- It succeeds silently on retries (no "already processed" branch), so monitoring can't tell real double-events from expected retries.
- Any future non-DB side effect (sending a receipt email, notifying the instructor, enqueueing a commission) would fire twice.

**Fix:**
1. Add a `webhook_events` table: `(id, stripe_event_id UNIQUE, event_type, payload JSONB, processed_at, result)`.
2. At the top of the handler: `INSERT ... ON CONFLICT (stripe_event_id) DO NOTHING RETURNING id`. If no row returned, return 200 immediately (already processed).
3. Wrap the existing logic plus the row-finalize in a `$transaction`.

See B3 — this is also a deepening candidate.

---

### A1.4 No CI test gate

**Evidence:** [`.github/workflows/deploy.yml:1-34`](../.github/workflows/deploy.yml). The workflow runs on push to `main`, writes `.env` files, and calls `docker compose up -d --build`. There is no `npm test`, no `npm run lint`, no typecheck, no e2e.

The only automated check is the Husky pre-commit hook, which:
- Can be bypassed with `--no-verify`.
- Only runs unit tests (skips integration).
- Doesn't run ESLint.
- Is local-only — a PR from a collaborator without the hook installed has no safety net.

**Impact:** A typo that breaks every request, a type error that ships in production, or a failing integration test — none of these block deployment.

**Fix:**

Add `.github/workflows/ci.yml`:
```yaml
name: CI
on: [pull_request, push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci --prefix server && npm ci --prefix client
      - run: npm run typecheck --prefix server && npm run typecheck --prefix client
      - run: npm run lint --prefix client
      - run: npm test --prefix server
      - run: npm run test:unit --prefix client
```

Then: require "CI" as a status check for merges to `main` in repo settings.

---

## A2. HIGH

### A2.1 Missing DB indexes

**Evidence:** [`server/prisma/schema.prisma`](../server/prisma/schema.prisma). Tenant-scoped tables have no `@@index([studio_id])`; status-filtered tables have no `@@index([studio_id, status])`; time-range aggregation (dashboard revenue queries) has no `@@index([studio_id, created_at])`. Only unique indexes exist.

**Impact:** Every `SELECT * FROM payments WHERE studio_id = $1 AND status = 'SUCCEEDED'` is a sequential scan. Fine at 100 rows; unacceptable at 100k.

**Fix:** Add:
```prisma
// users, classes, enrollments, payments, attendance, audit_logs, ...
@@index([studio_id])
@@index([studio_id, status])
@@index([studio_id, is_active])
@@index([studio_id, created_at])
```

Then create the matching migration (or raw SQL, given there's no migrations/ dir yet).

---

### A2.2 Client auth state race conditions

**Evidence:** [`client/App.tsx:98-157`](../client/App.tsx#L98). `isAuthenticated`, `currentUser`, `userRole` are three independent `useState` values. On mount, `fetchUserRole()` runs in the background; there's no guarantee it completes before a child component reads `userRole`. The default fallback is `'STUDENT'`, so an admin briefly sees the student UI.

**Impact:** UX bugs (flashing wrong dashboard), and a theoretical security lapse if a component gates *only* on stale client state.

**Fix:** Move auth state into a single `useReducer` or Context:
```tsx
type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: User; role: UserRole };
```

Children render based on `status`; no split.

---

### A2.3 No token refresh flow

**Evidence:** [`client/services/api.ts:65-102`](../client/services/api.ts#L65). The 401 interceptor calls `removeStoredUser()` + `window.location.reload()` on any non-auth 401. There is no refresh endpoint, no retry queue.

**Impact:** Every 7 days, every logged-in user's session ends mid-action with a hard reload and loss of form state. With a shorter TTL (recommended), this would happen daily.

**Fix:** Design pattern (choose one):

- **Refresh token + access token split:** short-lived (15 min) access cookie, long-lived (30 day) refresh cookie; silent refresh on 401.
- **Sliding session:** extend the `exp` on every request if > 50 % of lifetime elapsed (simple, no new endpoint).

See B2 — this is a deepening candidate.

---

### A2.4 Tests don't exercise tenant isolation

**Evidence:** None of the unit or integration tests call endpoints as a user from Studio A and assert that Studio B's data is unreachable. The `Prisma is mocked in all tests` comment from `ONBOARDING.md §12` compounds this.

**Impact:** The defects in A1.2 are not caught by CI (if there were a CI).

**Fix:** Stand up a real Postgres in CI (via `services:` in GitHub Actions), drop the Prisma mocks for integration tests, add:

- `tests/integration/tenant-isolation.test.ts` — create two studios, try to read/modify across them, assert 404.
- One test per resource that has cross-studio risk (courses, students, instructors, enrollments).

---

### A2.5 Frontend has near-zero test coverage

**Evidence:** 1 test file for 49 components (`ResetPassword.test.tsx`). No tests for `App.tsx`, `AuthPage`, any dashboard, any service, any hook.

**Impact:** Every change is a regression risk. Refactoring is scary, so tech debt accumulates.

**Fix:** Prioritize tests for:

1. `AuthService` + `App.tsx` auth flow (login → role-based redirect).
2. `PaymentService` flow + Stripe Elements mock.
3. `api.ts` interceptors (401 → reload, request logger, error shape).
4. High-traffic components: `StudentManagement`, `BrowseCourses`, `Dashboard`.

Target 60 % line coverage on services + hooks before touching components.

---

## A3. MEDIUM

### A3.1 Rate limit is global only

**Evidence:** [`server/src/app.ts:53-61`](../server/src/app.ts#L53). A single 100 / 15min / IP limiter on all `/api/*` routes. `/api/auth/login`, `/api/auth/forgot-password`, `/api/payments/create-intent` all share the budget.

**Impact:** Brute-force login and password-reset email bombing are plausible. A logged-in user with high UI activity eats their own budget.

**Fix:** Per-endpoint limiters (`rate-limit-redis` for multi-instance):

- `/api/auth/login` → 5 / 15min / IP + email.
- `/api/auth/forgot-password` → 3 / hour / email.
- `/api/auth/register` → 3 / hour / IP.
- `/api/payments/*` → 10 / min / user.
- Everything else → 300 / 15min / user (up from 100 / IP).

---

### A3.2 Invitation tokens are reusable

**Evidence:** [`server/src/services/invitationService.ts:48-70`](../server/src/services/invitationService.ts#L48). Invitations are stateless JWTs. A single token can be redeemed multiple times until its `exp`. Comment at line 96-99 acknowledges the limitation.

**Impact:** An attacker who gets a copy of an invitation link (forwarded email, browser history) can use it even after the intended recipient has accepted.

**Fix:** DB-backed tokens (similar to `password_reset_tokens`):
```prisma
model invitations {
  id          String   @id @default(uuid())
  token_hash  String   @unique
  role        String
  studio_id   String
  creator_id  String
  email       String
  expires_at  DateTime
  used_at     DateTime?
  created_at  DateTime @default(now())
}
```

See B4 — deepening candidate.

---

### A3.3 `register` accepts `studio_serial` without invitation

**Evidence:** [`server/src/controllers/authController.ts:65-89`](../server/src/controllers/authController.ts#L65). If `invitationToken` is absent, the handler falls back to `studio_serial` and assigns the new user to that studio as `STUDENT`.

**Impact:** If a studio serial leaks (shown on a printed brochure, in customer support emails), anyone can create a `STUDENT` account in that studio without being invited.

**Fix:** Make the serial path explicit — only use it if a separate `publicRegistrationEnabled` flag is set on the studio, or remove it entirely and require invitation.

---

### A3.4 PII in request-body logs

**Evidence:** [`server/src/controllers/enrollmentController.ts:15`](../server/src/controllers/enrollmentController.ts#L15), [`server/src/controllers/courseController.ts:93-94`](../server/src/controllers/courseController.ts#L93). These `logger.info({ body: req.body })` calls ship full request bodies to Loki — including phone numbers, parent emails, and any other student PII present on that route.

**Impact:** PII in long-term log storage. GDPR risk.

**Fix:** Either:
- Don't log bodies. Log only IDs and operation names.
- Or, add a Pino `redact` config:
  ```ts
  pino({ redact: { paths: ['req.body.password', 'req.body.phone', 'req.body.email', 'req.body.token'], remove: true } });
  ```

---

### A3.5 No CSRF defense

**Evidence:** The only CSRF control is `SameSite=Lax` on the auth cookie ([`server/src/controllers/authController.ts:19-25`](../server/src/controllers/authController.ts#L19)). No CSRF token is generated or validated.

**Impact:** Lax is strong on modern browsers for cross-site POSTs, but weak against same-site attacks and third-party cookie compatibility edge cases.

**Fix:** One of:
- Double-submit cookie pattern: issue a `csrf_token` (non-HttpOnly) on login; require it in an `X-CSRF-Token` header on state-changing routes.
- Or, flip to `SameSite=Strict` and accept the deep-link UX cost.

---

### A3.6 Duplicate `ClassCard` components

**Evidence:**
- [`client/components/common/ClassCard.tsx`](../client/components/common/ClassCard.tsx) — admin view, 125 lines.
- [`client/components/landing/ClassCard.tsx`](../client/components/landing/ClassCard.tsx) — marketing, 30 lines.
- [`client/components/student/CourseCard.tsx`](../client/components/student/CourseCard.tsx) — student enrollment, 88 lines.

All three duplicate capacity formatting, level translation, and day mapping logic.

**Impact:** Every level/day/capacity change has to be made three times, inconsistently.

**Fix:** Single `<ClassCard mode="admin" | "landing" | "student" course={...} />`. Shared `levelToHebrew`, `dayMap` utilities in `client/utils/`.

---

### A3.7 No Prisma migrations directory

**Evidence:** `server/prisma/migrations/` doesn't exist. Schema is applied via the raw `studio_management_schema_setup.sql` on first boot; changes are hand-applied.

**Impact:** No schema history. Rollback is manual. New env bootstrap is two-step (boot, then patch).

**Fix:**
```bash
docker compose exec backend npx prisma migrate dev --name initial_baseline
```
Commit the generated `0000_initial_baseline/migration.sql`. Going forward, every schema change flows through `migrate dev`.

---

## A4. LOW

| # | Issue | File | Fix |
|---|---|---|---|
| A4.1 | JWT fallback secret `"dev-secret-change-in-production"` | `server/src/config/env.ts:33` | Throw in non-test env too; force explicit `JWT_SECRET`. |
| A4.2 | `SUPER_ADMIN` role referenced but never provisioned | `server/src/routes/studioRoutes.ts:15,22,29` | Add a one-shot SQL seed or admin CLI. |
| A4.3 | `users.studio_id` nullable, but most code assumes non-null | `schema.prisma:22` | Make required for `ADMIN/INSTRUCTOR/STUDENT`; keep null only for `SUPER_ADMIN`. Enforce via check constraint. |
| A4.4 | `upgradeInsecureRequests: []` in Helmet CSP | `app.ts` | Set to `true`. |
| A4.5 | No HSTS header | `app.ts` | Add `hsts: { maxAge: 31536000 }` in Helmet. |
| A4.6 | `paymentStatus` enum drift between `types.ts` and DB | `client/types/types.ts` vs `client/types/database.ts` | Generate client types from DB; remove the hand-rolled one. |
| A4.7 | No error boundary on client | `App.tsx` | Wrap route tree in `<ErrorBoundary>` with a fallback. |
| A4.8 | No request cancellation on unmount | multiple components | Extract `useFetch(fn, deps)` hook using `AbortController`. |
| A4.9 | Modals not lazy-loaded | `components/admin/*Modal.tsx` | Wrap in `React.lazy` + `Suspense`. |
| A4.10 | Loki transport fails silently | `logger.ts:36` | Add `onError` to the pino-loki config; fall back to stdout. |

---

# Part B — Architectural Deepening Candidates

The findings in Part A include many tactical fixes. But some defects cluster — they're symptoms of one shallow module that ought to become deeper. Below are the four strongest candidates where the *right* fix is a refactor, not a patch.

> **Criterion (John Ousterhout):** A deep module has a **small interface** and a **large implementation**. Callers get a simple API; the module owns the complexity. This makes testing easier (test at the boundary, not the internals) and makes the code more navigable for humans and AI agents.

---

## B1. `TenantScope` / scoped repository

**Modules involved:**
- All files under `server/src/services/*.ts` that query Prisma.
- Especially `courseService`, `studentService`, `enrollmentService` — plus the shape leaks into controllers.

**Why they're coupled:** Every service that queries a tenant-scoped table must pass `studio_id` to Prisma. Today this is ad-hoc — some services do, some don't; the discipline lives in human review.

**Dependency category:** *Shared type + cross-cutting concern.* Every repo query shares the same studio-scoping concern.

**What would be hidden:** The `studio_id` filter itself. Callers would call `tenantDb(req.studioId).courses.findMany({ where })` and be *unable* to construct an unscoped query.

**Test impact:**
- Boundary tests: one test asserts `tenantDb('A').courses.findFirst({ where: { id: 'B-owned' } })` returns null.
- Internal service tests become simpler — they no longer need to assert "did you include studio_id?"
- The 50+ duplicated "oops forgot studio_id" bugs become one fixed place.

**Prior art:** Prisma `$extends` client extensions, or simply a `getScopedClient(studioId)` factory that returns a typed subset.

---

## B2. `SessionManager`

**Modules involved:**
- `server/src/controllers/authController.ts` (login, register, logout, refresh, me, reset)
- `server/src/middleware/authMiddleware.ts` (JWT verify + user hydrate)
- `client/services/api.ts` (401 interceptor + `withCredentials`)
- `client/App.tsx` (three `useState` for auth)
- `client/utils/storage.ts` (localStorage user cache)

**Why they're coupled:** They all implement different pieces of "is this user logged in and who are they?" Each piece has drift — cookie lifecycle in the controller, token verification in middleware, hydration in the SPA, reload-on-401 in axios. A single session decision (expire, revoke, refresh) touches four files.

**Dependency category:** *Cross-cutting, cross-boundary* (server + client share the concept).

**What would be hidden:**
- Token issuance + cookie setting.
- Token verification + user hydration.
- Refresh logic (currently nonexistent).
- Revocation (currently impossible).
- Client-side session state machine (`loading` / `authenticated` / `unauthenticated`).

**Interface sketch** (server only):
```ts
sessionManager.issue(user) → cookie header + payload
sessionManager.verify(request) → { user, studioId } | null
sessionManager.rotate(request) → cookie header (refresh)
sessionManager.revoke(request) → void (adds to blacklist)
```

**Test impact:** Replace auth-endpoint tests + middleware tests + client storage tests with boundary tests on the single `sessionManager`. 60 % reduction in auth-test surface.

---

## B3. `WebhookEventProcessor`

**Modules involved:**
- `server/src/controllers/webhookController.ts`
- `server/src/services/paymentService.ts` (`processSuccessfulPayment`, `handlePaymentFailure`)
- Implicit: the outbox-like status checks that fake idempotency today.

**Why they're coupled:** The controller dispatches on `event.type` → calls a service method → service does a "conditional update" pretending to be idempotent. Event ID is ignored. Order is fragile. Latest-charge extraction is done inline.

**Dependency category:** *Ports & adapters* — we want to depend on an abstract "event stream with dedup + replay" not on Stripe specifics.

**What would be hidden:**
- Event deduplication (via `webhook_events` table).
- Retry / replay logic.
- Per-type handler registration.
- Side-effect ordering (DB update → email → commission calc).
- Stripe-specific payload shape.

**Interface sketch:**
```ts
webhookProcessor.handle('payment_intent.succeeded', async (event) => { ... })
webhookProcessor.handle('payment_intent.payment_failed', async (event) => { ... })
// Router just calls: webhookProcessor.dispatch(rawBody, signatureHeader).
```

**Test impact:** Replay tests become trivial — feed the same event ID twice, assert handler fires once. Adding a new event type is one registration, not a switch-case edit.

---

## B4. `InvitationIssuer`

**Modules involved:**
- `server/src/services/invitationService.ts`
- `server/src/controllers/invitationController.ts`
- `server/src/controllers/authController.ts` (accepts `invitationToken` on register)
- `client/services/api.ts` `InvitationService.validate()`

**Why they're coupled:** Invitations are JWTs today; there is no DB record. Validation, single-use enforcement, and expiry all leak out of the service — e.g., "can this be used again?" has to be answered by code scattered across register and accept flows.

**Dependency category:** *Domain concept under-modeled*. "Invitation" is a first-class entity but implemented as a transient token.

**What would be hidden:**
- Token generation (currently JWT, could become random + DB hash).
- Single-use enforcement.
- Expiry + cleanup.
- Creator / recipient tracking.
- Email dispatch (or returning a copy-paste link).

**Interface sketch:**
```ts
invitations.issue({ role, studioId, creatorId, email }) → Invitation & { link: string }
invitations.redeem(token, newUserData) → User  // atomic; fails if used/expired
invitations.list({ studioId }) → Invitation[]  // admin UI
invitations.revoke(id) → void
```

**Test impact:** Redemption becomes a single tested atomic operation. Replay/reuse attempts become explicit test cases at the boundary.

---

### Which to tackle first?

**Recommendation:** `TenantScope` (B1). It closes the CRITICAL defect in A1.2, it's the one that most naturally produces boundary tests (A2.4), and once it's in place, every subsequent service you write becomes safer *for free*. The other three are good next steps, but B1 unblocks them — each of them will benefit from a scoped client internally.

**Second pick:** `WebhookEventProcessor` (B3) — fixes the other CRITICAL (A1.3), and adding it is mostly additive (the existing handlers stay, wrapped).

Happy to drill into any of these — next step would be to pick one and run the "design 3+ interfaces in parallel" phase before opening an RFC issue.

---

# Part C — Quick Wins & Roadmap

## C1. Quick wins (1-day each)

| # | Task | Unblocks |
|---|---|---|
| QW1 | Rotate all leaked secrets + scrub git history. | A1.1 |
| QW2 | Add `.github/workflows/ci.yml` with typecheck + unit + integration + lint. | A1.4 |
| QW3 | Add `@@index([studio_id])` + `@@index([studio_id, status])` to 8 models. | A2.1 |
| QW4 | Add Pino `redact` for PII fields; remove body-logging from two controllers. | A3.4 |
| QW5 | Flip `SUPER_ADMIN`-referencing routes off until the role is provisioned; add an admin CLI seed script. | A4.2 |
| QW6 | `npx prisma migrate dev --name baseline` + commit. | A3.7 |
| QW7 | Dedupe `ClassCard` → single component with `mode` prop. | A3.6 |
| QW8 | Add `ErrorBoundary` around the app. | A4.7 |
| QW9 | Add per-endpoint rate limits for auth routes. | A3.1 |

## C2. Medium-term (1-2 weeks each)

| # | Task | Unblocks |
|---|---|---|
| MT1 | Build and roll out `TenantScope` (B1). | A1.2, A2.4 |
| MT2 | Build `WebhookEventProcessor` (B3). | A1.3 |
| MT3 | Design `SessionManager` (B2), ship refresh-token flow. | A2.3 |
| MT4 | Move to DB-backed invitations (B4). | A3.2 |
| MT5 | Bring client tests to 60 % on services + hooks. | A2.5 |
| MT6 | Introduce React Query / SWR for caching + invalidation. | A2.2 (auth state), A4.8 |
| MT7 | Remove hand-rolled `types.ts`; generate from Prisma/Supabase. | A4.6 |

## C3. Long-term (monthly themes)

- **Month 1:** Security hardening — secrets, tenant isolation, webhook dedup, CSRF.
- **Month 2:** Observability — richer dashboards, alerting on webhook failures, tenant-scoped query metrics.
- **Month 3:** Performance — N+1 audit, Prisma connection pool tuning, CDN for static assets.
- **Month 4:** i18n — extract Hebrew strings, add English.

---

## How to use this doc

1. **New joiner:** Read `ONBOARDING.md` first; skim this to know what's already tracked.
2. **Tech lead / PM:** Part C is the roadmap conversation.
3. **AI agent:** When you propose a change in an area covered above, cross-reference the defect ID (A1.2, A3.4, etc.) in the PR description so the review is easier.

Found something not on this list? Add it under the appropriate severity bucket and open a PR.
