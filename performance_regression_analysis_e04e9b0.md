# Performance Regression Analysis - Commit e04e9b0 (Infrastructure Focus)

## Executive Summary
Your updated symptom (“**all DB-related operations are slow**”) points less to an isolated feature bug and more to a **shared database bottleneck** (pool saturation / lock waits / high DB CPU). Based on the PR diff itself, the strongest candidate is the payment/webhook change that now performs heavier transactional work per event and processes webhooks synchronously before acknowledging Stripe. Under retry pressure, this can consume DB connections and degrade unrelated requests like Login, Signup, and Dashboard.

Importantly: I did **not** find evidence in this PR of Prisma singleton breakage or new global auth middleware scans on large tables.

---

## Detailed Findings

### 1) Connection Pooling / Long-running transactions / Un-awaited promises

#### What changed in the PR
- The payment success path was refactored into `processSuccessfulPayment()` with a DB transaction containing:
  1. `payments.updateMany(...)` on `stripe_payment_intent_id + status='PENDING'`
  2. `payments.findUnique(...)`
  3. conditional `enrollments.updateMany(...)`
- Both client confirmation and Stripe webhook success now go through this path.

#### Why this can become a global bottleneck
- During bursts (or Stripe retries), each success event does multiple DB operations inside one transaction.
- Webhook requests **wait** for DB processing before returning success to Stripe, so any slowdown increases webhook retry traffic.
- That feedback loop can saturate Prisma pool/DB connections and increase latency for all endpoints.

#### Evidence from code
- Transactional payment path: `prisma.$transaction(...)` with multiple statements.  
- Shared usage by both `confirmPayment` and webhook flow.  
- Webhook handler awaits processing before `res.json({ received: true })`.

### 2) Prisma instantiation (multiple clients vs singleton)

#### Result
- No regression found in this PR.
- Prisma client remains a singleton (`globalThis` cache in non-production), and the PR does not modify `server/src/config/prisma.ts`.

#### Implication
- The slowdown is unlikely caused by accidental multiple PrismaClient instances introduced by this PR.

### 3) Missing indexes on global/auth queries

#### What I checked
- Auth middleware query path (`authenticateUser`) and auth controller login/register paths.
- Dashboard queries used by admin/instructor screens.

#### Result
- No new middleware/guard query introduced by this PR in auth middleware.
- Login still uses `users.findUnique({ where: { email } })` (index-friendly if unique email constraint exists).
- Middleware uses `users.findUnique({ where: { id } })` (PK lookup).

#### Caveat
- Dashboard/service reads can still be expensive at scale if index coverage is weak (e.g., filters on `payments(studio_id, status, created_at)`), but this appears pre-existing rather than introduced in this PR.

### 4) Deadlocks / row locks impact on Login & Dashboard

#### Risk assessment
- `processSuccessfulPayment` updates `payments` and `enrollments` rows in a transaction; this can cause lock waits on those tables.
- Login touches `users`, so it should not be directly blocked by row locks on payments/enrollments.
- However, if webhook/payment traffic causes **pool exhaustion** or DB CPU saturation, login/dashboard can still slow down globally.

#### Practical conclusion
- Primary cross-cutting failure mode is likely **resource contention** (connections/CPU/IO), not direct lock conflict between login rows and payment rows.

---

## Recommended Fixes (Prioritized)

1. **Fast-ack Stripe webhooks**
   - Verify signature + persist minimal event metadata + return `200` quickly.
   - Process DB side effects asynchronously (queue/worker).
   - Deduplicate by Stripe `event.id` to avoid repeat work.

2. **Reduce transaction footprint in payment success flow**
   - Keep idempotency, but minimize statements inside one transaction.
   - Only run enrollment update when payment actually transitions `PENDING -> SUCCEEDED`.

3. **Protect the DB pool**
   - Set explicit Prisma pool limits and monitor pool wait time.
   - Add backpressure/rate limits on webhook endpoint to absorb spikes.

4. **Index audit for high-frequency reads**
   - Confirm execution plans for:
     - `payments` filters used in dashboard (`studio_id`, `status`, `created_at`)
     - enrollment filters used in instructor/dashboard paths.

5. **Operational guardrails**
   - Add timeout budgets around external Stripe calls and fail-fast policies.
   - Add alerting on webhook retry anomalies.

---

## Monitoring Suggestions to Confirm the Theory

Track these at the same time window:

- **Prisma / app-layer**
  - Active DB connections
  - Pool wait time / query queueing
  - Request latency p50/p95/p99 by route (`/api/auth/login`, `/api/users/me`, `/api/dashboard/*`, `/api/webhook/stripe`)

- **Database**
  - DB CPU and IO utilization
  - Lock waits by table (`payments`, `enrollments`)
  - Top SQL by total time + rows scanned
  - Transaction duration percentiles

- **Stripe webhook health**
  - Webhook delivery latency
  - Retry count and duplicate event rate

If latency spikes correlate with webhook retry spikes + pool wait + DB CPU, it strongly supports the shared-bottleneck hypothesis.

---

## Quick Verification Checklist (Runbook)

1. Inspect route-level latency before/after webhook spikes.
2. Compare DB active connections vs pool max at incident time.
3. Run EXPLAIN ANALYZE for dashboard payment queries.
4. Verify Stripe retry logs around the same timestamps.
5. Temporarily disable webhook side-effect processing (or queue it) in staging and load-test.

