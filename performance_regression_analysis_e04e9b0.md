# Performance Regression Analysis - Commit e04e9b0

## Executive Summary
The most likely regression risk introduced by PR #98 is in the **payment success flow** (`PaymentService.processSuccessfulPayment`) where each successful payment now executes a **multi-step DB transaction** (`updateMany` + `findUnique` + conditional `enrollments.updateMany`) instead of a single `update`. Under concurrent webhook retries and client confirmation calls, this can increase row lock contention and DB write pressure, which can spill over into broad API latency if the DB pool is near saturation.

A secondary risk is that the payments listing endpoint (`getAllPayments`) still performs an **unbounded `findMany` with nested includes**, which becomes expensive as data grows and can amplify perceived slowness when admin traffic is present.

## Detailed Findings

### 1) Hot-path payment write amplification and transaction contention
- `confirmPayment()` and webhook handler now both funnel into `processSuccessfulPayment()`.
- That method wraps multiple writes/reads in `prisma.$transaction(...)`:
  - `payments.updateMany(...)` filtered by `stripe_payment_intent_id` and `status='PENDING'`
  - `payments.findUnique(...)`
  - `enrollments.updateMany(...)` when enrollment exists
- This is safer for idempotency, but increases DB round trips and lock windows vs the previous single-row update pattern.

**Why this can slow production:**
- Stripe can retry webhooks aggressively on transient failures.
- Client confirmation and webhook can race on same intent.
- High payment throughput creates many short write transactions on `payments` + `enrollments`; if pool/IO is tight, p95+ latency can rise for unrelated endpoints.

## 2) Heavy synchronous webhook path
- `WebhookController.handleStripeWebhook` awaits full DB processing before returning `200` to Stripe.
- Any DB slowness directly elongates webhook request time.

**Why this can slow production:**
- Slow webhook responses trigger retries, increasing duplicate traffic and DB pressure.
- This positive feedback loop can degrade overall API responsiveness.

## 3) Potentially expensive unpaginated payments read
- `PaymentService.getAllPayments()` uses unpaginated `findMany` with nested `include` for student and class details.

**Why this can slow production:**
- Large result sets increase DB CPU, memory transfer, and Node serialization time.
- Admin page loads can become expensive and contend with transactional workload.

## Recommended Fixes

1. **Shorten critical transaction path in payment success flow**
   - Keep idempotency, but reduce work inside the transaction:
     - First perform a conditional single-row update (`UPDATE ... WHERE status='PENDING'`) with `RETURNING` semantics (Prisma raw SQL or optimized pattern).
     - Move non-critical reconciliation/logging outside the transaction.
   - Ensure `enrollments` update only runs if payment transition actually occurred.

2. **Acknowledge webhook quickly**
   - Persist a minimal webhook event record (or queue task), return `200`, then process asynchronously.
   - Add dedup key on `event.id` to prevent replay work.

3. **Paginate payment history endpoint**
   - Add `limit/offset` (or cursor) and only select fields required by UI.
   - Consider summary + detail endpoints to avoid over-fetching.

4. **Validate indexing explicitly**
   - Confirm indexes exist and are used for:
     - `payments(stripe_payment_intent_id)` (unique already expected)
     - `payments(status)` or composite access path if queries often filter by status + studio/date
     - `enrollments(id, payment_status)` (or rely on PK id and avoid additional predicates if possible)

5. **Add timeout/circuit behavior around Stripe retrieval path**
   - `confirmPayment()` currently blocks on Stripe retrieve; add strict timeout/retry budget and fail-fast behavior to avoid thread/event-loop backlog during Stripe issues.

## Monitoring Suggestions
To confirm/refute this theory after deployment, monitor these metrics together:

- **API latency:** p50/p95/p99 by route (`/webhook`, `/payments`, global)
- **DB health:**
  - active connections / pool wait time
  - transaction duration
  - lock wait events and deadlocks
  - top queries by total time (especially `payments` and `enrollments` updates)
- **Webhook behavior:**
  - Stripe webhook delivery latency
  - retry counts and duplicate event rate
- **JVM/Node runtime:**
  - event-loop lag, CPU, heap usage, GC pause (if JVM services also depend on same DB)
- **Error rates:**
  - 5xx and timeout rates on payment + webhook endpoints

If these metrics show spikes aligned with payment success/webhook traffic, prioritize webhook decoupling + transaction simplification first.
