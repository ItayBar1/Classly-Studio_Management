# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Classly is a full-stack SaaS platform for fitness and wellness studio management. It supports multi-tenant studios with role-based access for SUPER_ADMIN, ADMIN, INSTRUCTOR, and STUDENT roles. The UI is RTL (Hebrew). Each **studio** is an isolated tenant with its own branches, rooms, classes, enrollments, and payments.

## Environment & Execution

**CRITICAL:** The project runs strictly via Docker Compose. Do not use local `npm start` or `npm run dev` to start the servers. Environment variables are managed through Docker Compose and `.env` files.

```bash
docker compose up -d                    # Start all services
docker compose up -d --build            # Rebuild and start (after code changes)
docker compose logs -f                  # Stream all logs
docker compose logs -f backend          # Stream backend logs only
docker compose exec [service] [cmd]     # Run a command inside a container
docker compose down                     # Stop (keeps volumes)
docker compose down -v                  # Stop + wipe DB volume (full reset)
```

Services: `db` (PostgreSQL on :5432), `backend` (Express API on :5000), `frontend` (React+Nginx on :80), `loki` (:3100), `grafana` (:3001).

## Development Commands

### Running tests

```bash
# From repo root (requires Node locally):
npm run test              # Client + server unit tests
npm run typecheck         # Typecheck both packages

# Inside containers:
docker compose exec backend npm test
docker compose exec backend npm run test:integration

# Run a single test file (from server/):
npx jest tests/unit/paymentService.test.ts

# Run a single test file (from client/):
npx vitest run components/__tests__/ResetPassword.test.tsx
```

### Server (inside container or with local Node.js)
```bash
cd server
npm run dev               # nodemon + ts-node (port 5000)
npm run build             # tsc compile to dist/
npm test                  # All Jest tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:watch        # Jest watch mode
```

### Client (inside container or with local Node.js)
```bash
cd client
npm run dev       # Vite dev server (port 3000) — run against VITE_API_URL=http://localhost:5000/api
npm run build     # Production build
npm test          # Run Vitest tests (watch mode)
npm run test:unit # One-shot Vitest
```

### Database / Prisma (run inside the backend container)
```bash
docker compose exec backend npx prisma generate        # Regenerate Prisma client
docker compose exec backend npx prisma studio          # Open Prisma Studio GUI (:5555)
docker compose exec db psql -U classly -d classly       # Postgres REPL
```

> **No migrations directory exists.** Schema changes require: (1) edit `server/prisma/schema.prisma`, (2) run `ALTER TABLE ...` manually in psql, (3) `npx prisma generate`, (4) update `studio_management_schema_setup.sql` for fresh boots, (5) add the same change to `server/prisma/sql/2026-08-16_repair_schema_drift.sql` so existing databases get it too.

> **`studio_management_schema_setup.sql` never runs on an existing database.** It is mounted at `/docker-entrypoint-initdb.d/setup.sql`, which Postgres executes only when the data directory is empty. Every edit made to it after the first boot is invisible to running environments, and Prisma names every column explicitly in its SQL — so one missing column makes *every* query on that table fail with a 500. Repair an environment with:
>
> ```bash
> docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
>   < server/prisma/sql/2026-08-16_repair_schema_drift.sql
> ```
>
> The script is idempotent and prints what it repaired.

## Architecture

### Monorepo Structure
- `client/` — React 19 + Vite frontend (TypeScript, `strict: true`)
- `server/` — Express.js backend (TypeScript, `strict: true`)
- `docker/` — Loki and Grafana configuration
- `docker-compose.yml` — Full service orchestration
- `studio_management_schema_setup.sql` — Initial DB schema (mounted into `db` on first boot)
- `docs/ONBOARDING.md` — Detailed developer guide
- `docs/ARCHITECTURE_REVIEW.md` — Known defects and refactor roadmap

### Backend Request Flow (`server/src/`)

```
HTTP Request
  ↓ requestLogger (attaches req.logger, req.requestId)
  ↓ helmet → rateLimit (100 req/15min/IP) → cors → cookieParser
  ↓ express.raw (only /api/webhooks) | express.json (everything else)
  ↓ Router (routes/*.ts)
  ↓ authenticateUser — reads classly_token cookie, verifies JWT, hydrates req.user + req.studioId
  ↓ requireRole([...]) — RBAC gate
  ↓ validate(zodSchema) — sanitize-html + Zod (auth routes; most routes lack this)
  ↓ Controller → Service → Prisma → PostgreSQL
```

Key files: `app.ts` (middleware stack), `middleware/authMiddleware.ts` (JWT verify + RBAC), `middleware/errorMiddleware.ts` (centralized error handler), `utils/AppError.ts` (throwable with statusCode).

All API routes are prefixed `/api`. Public routes: `/api/health`, `/api/auth/*`, `/api/webhooks/stripe`.

### Frontend (`client/`)

- `App.tsx` — Root component. On mount calls `AuthService.me()` to hydrate `isAuthenticated`, `currentUser`, `userRole` (three separate `useState` values — known race condition; see pitfalls below). Renders role-specific shell via `getComponentForTab()`. Role dashboards are lazy-loaded.
- `services/api.ts` — Single Axios client (`withCredentials: true`). Exports all service objects (`AuthService`, `CourseService`, etc.) as thin wrappers. On 401, clears `classly_user` from localStorage and triggers `window.location.reload()` — no refresh-token flow.
- `components/` — Organized by role: `admin/`, `instructor/`, `student/`, `super-admin/`, `landing/`, `common/`
- **No global store.** Auth state lives in `App.tsx` local state and is prop-drilled down. Never call `axios` directly in a component — use the service objects from `api.ts`.

Role tab access:
- `SUPER_ADMIN`: Dashboard, Administration
- `ADMIN`: Dashboard, Students, Schedule, Payments, Administration, Settings
- `INSTRUCTOR`: Dashboard, Students, Schedule
- `STUDENT`: Dashboard, Browse Courses

### Authentication & Session

- JWT is stored in the `classly_token` HttpOnly cookie (JS cannot read it). Token payload: `{ userId, role, studioId, iat, exp }`. Expires in 7 days — no refresh flow.
- A sanitized user snapshot is cached in `localStorage` as `classly_user` for UI bootstrap.
- **`/api/auth/me`** must stay lean — no joins; only returns `{ id, email, role, studio_id }`.
- Logout clears the cookie but does **not** invalidate the JWT server-side.

### Database (PostgreSQL + Prisma)

Schema: `server/prisma/schema.prisma`. Core models: `studios → branches → studio_rooms`, `users`, `classes → enrollments → attendance`, `payments`, `instructor_commissions`, `pending_registrations`, `password_reset_tokens`, `audit_logs`.

All primary keys are UUIDs (`gen_random_uuid()`). Timestamps use `timestamptz`. Cascade deletes follow the `studios → branches → rooms → classes → enrollments` chain. **Non-unique indexes on `studio_id`, `status`, and time columns are missing** — do not copy the current schema as a pattern for indexing.

### Key Integrations
- **Stripe**: Payment intents created server-side; Elements rendered client-side. Webhooks hit `/api/webhooks/stripe` (raw body, Stripe signature validated). The `express.raw` middleware for `/api/webhooks` must run **before** `express.json` in `app.ts` — do not reorder.
- **Supabase**: Initialized in `client/services/supabaseClient.ts` but currently unused — reserved for file storage.
- **Nodemailer/Resend**: Invitation emails and password reset links. In dev with no SMTP config, logs to stdout.
- **Pino + Loki + Grafana**: Structured JSON logs stream to Loki; Grafana at `:3001`. Use `req.logger` (per-request child) inside handlers, not the global logger.

## Coding Conventions

### Backend
- **Errors flow through `AppError` + `errorMiddleware`** — never `res.status(500).json(...)` in a controller. Always `throw new AppError('message', statusCode)` or `next(err)`.
- **Every tenant-scoped query must include `studio_id` in the `where` clause.** Use `findFirst({ where: { id, studio_id } })` not `findUnique({ where: { id } })`. Treat a miss as 404.
- **Multi-write operations must use `prisma.$transaction`** — e.g., enrollment + payment record together.
- **Sanitization lives in `middleware/validate.ts`**, not in services.
- **Zod schemas** belong in `server/src/validations/`; apply them via the `validate()` middleware in routes.
- Use `req.logger` for all request-scoped logging; attach IDs (`studioId`, `enrollmentId`). Never log passwords, tokens, or full `req.body`.

### Frontend
- **Functional components and hooks only.** No class components.
- **Components are per-role** (`components/admin/`, `components/instructor/`, etc.). Shared presentational widgets go in `components/common/`.
- **All HTTP calls go through service objects in `api.ts`**, not raw axios.
- RTL-aware styling: prefer Tailwind logical utilities (`ms-*`, `me-*`) over directional ones (`ml-*`, `mr-*`).
- Path alias `@/*` maps to `client/*` (configured in `vite.config.ts` and `tsconfig.json`).

### Commits
Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.

## Known Pitfalls

- **`CourseService.getAllCourses`, `getCourseById`, `updateCourse` do not scope by `studio_id`** — cross-tenant data leak. Do not copy this pattern; it is a known CRITICAL defect tracked in `docs/ARCHITECTURE_REVIEW.md`.
- **Prisma is mocked in all tests.** Green tests ≠ correct schema. Integration tests use Supertest against the real Express app but with mocked Prisma — schema drift is not caught.
- **Invitation JWTs are stateless and reusable** until expiry. Do not use them as single-use tokens without adding DB-backed deduplication.
- **A `SUPER_ADMIN` invite carries no studio** (`InvitationController.createInvite` passes the creator's `studio_id`, which is `NULL` for a super admin), so the invited `ADMIN` registers with `studio_id = NULL` and must create their studio through the onboarding form. `StudioService.getStudioForUser` re-links such a user through `studios.admin_id` once their studio exists.
- **Never treat a failed request as "no data" in the admin screens.** `Administration` used to fall back to the studio-creation form on any error, so a 500 looked like a brand-new studio while every other tab showed the real data.
- **`register` accepts `studio_serial`** without an invitation, silently creating a `STUDENT` in that studio.
- **Auth state race condition in `App.tsx`:** `isAuthenticated`, `currentUser`, `userRole` update asynchronously. Default `userRole` is `'STUDENT'` so an admin may briefly see the wrong UI on load.
- **No CI test gate.** Push to `main` deploys immediately to production via `.github/workflows/deploy.yml`. Treat `main` = production.
- **Never run `cf-tunnel` outside production.** Cloudflare accepts several connectors per tunnel and load-balances public traffic across them, so a second `docker compose up` holding the production `CF_TUNNEL_TOKEN` starts serving `classly-studio-management.uk` from that machine's database. Symptom: the same login returns a different user on different requests, and half the traffic never reaches the production logs. `docker-compose.override.yml` parks the service behind an unactivated profile so a local checkout cannot do this; the deploy passes `--file docker-compose.yml` only, so production still starts it.
- **`SUPER_ADMIN` has no provisioning flow** — must be seeded manually with SQL.
- **`ClassCard` is duplicated** in `common/ClassCard.tsx`, `landing/ClassCard.tsx`, and `student/CourseCard.tsx` — keep changes in sync or consolidate.
- **No frontend live reload in Docker.** Code changes to the client require `docker compose up -d --build frontend`.
