# Classly — Developer Onboarding Guide

> **Audience:** New engineers joining the Classly codebase. After reading this, you should be able to run the stack locally, navigate the code, understand the domain, and ship a change safely.
>
> **Stability:** This doc describes how the system works *today*. For known defects and planned refactors, see [`ARCHITECTURE_REVIEW.md`](./ARCHITECTURE_REVIEW.md).

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack at a Glance](#2-tech-stack-at-a-glance)
3. [Repository Layout](#3-repository-layout)
4. [Running the Stack Locally](#4-running-the-stack-locally)
5. [Backend Architecture](#5-backend-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Database & Prisma](#7-database--prisma)
8. [Authentication, RBAC, Multi-Tenancy](#8-authentication-rbac-multi-tenancy)
9. [External Integrations](#9-external-integrations)
10. [Security Model](#10-security-model)
11. [Logging & Observability](#11-logging--observability)
12. [Testing](#12-testing)
13. [CI / CD & Deployment](#13-ci--cd--deployment)
14. [Coding Conventions](#14-coding-conventions)
15. [Common Tasks (Recipes)](#15-common-tasks-recipes)
16. [Debugging Playbook](#16-debugging-playbook)
17. [Known Pitfalls](#17-known-pitfalls)
18. [Glossary](#18-glossary)

---

## 1. Product Overview

**Classly** is a multi-tenant SaaS platform for managing fitness & wellness studios (yoga, pilates, dance, martial arts, etc.). Each **studio** is an isolated tenant with its own users, branches, rooms, classes, enrollments, and payments.

### Personas

| Role | Scope | Primary Views |
|---|---|---|
| `SUPER_ADMIN` | Platform-wide | Platform administration, cross-studio metrics |
| `ADMIN` | Single studio | Dashboard, Students, Schedule, Payments, Admin, Settings |
| `INSTRUCTOR` | Classes they teach | Dashboard, Students (their classes), Schedule |
| `STUDENT` | Self-service | Dashboard, Browse/Enroll Courses, Payments |
| `PARENT` (schema only) | Children's records | *Not yet wired in UI* |

### Key Flows

- **Studio signup** — Super-admin creates a studio (gets a `serial_number`); admin is invited via JWT invitation link.
- **Invitation** — Existing admin invites instructors/students by email; JWT-encoded link includes role + studio_id.
- **Enrollment** — Student browses → clicks "Register" → Stripe `PaymentIntent` created → Stripe Elements collects card → webhook confirms → enrollment activated.
- **Attendance** — Instructor marks students present/absent per session; drives commission calculations.
- **Commissions** — Instructor compensation tracked per enrollment/session.

### UI Conventions

- **RTL + Hebrew** — All UI is right-to-left. Most strings are hardcoded Hebrew (no i18n layer yet).
- **Mobile-first** — `BottomNav` for small screens, `Sidebar` for desktop.

---

## 2. Tech Stack at a Glance

### Runtime

| Layer | Technology | Version |
|---|---|---|
| DB | PostgreSQL | 18 (via `postgres:18` image) |
| Backend runtime | Node.js | 20+ (from `node:20-alpine` in Dockerfile) |
| Backend framework | Express | 4.19 |
| ORM | Prisma | 5.x |
| Frontend framework | React | 19.2 |
| Frontend build | Vite | 6.2 |
| Styling | TailwindCSS | 3.4 |
| Container | Docker Compose | v2 |
| Reverse proxy | Nginx | alpine |
| Edge tunnel | Cloudflare Tunnel | via `cloudflared` |
| Logs | Pino → Loki → Grafana | 3.x / 11.x |

### Languages & Type System

- **TypeScript** everywhere — `strict: true` in both `client/tsconfig.json` and `server/tsconfig.json`.
- **Zod** for runtime validation on the backend (auth routes today — most other routes unvalidated; see review doc).

### Key Libraries — Backend

| Library | Purpose |
|---|---|
| `@prisma/client` | Type-safe DB queries |
| `express`, `cors`, `helmet`, `express-rate-limit` | HTTP + security middleware |
| `cookie-parser` | Parses the `classly_token` HttpOnly cookie |
| `jsonwebtoken` | JWT sign/verify |
| `bcryptjs` | Password hashing (salt=10) |
| `stripe` | Payment intents + webhook verification |
| `nodemailer` | Transactional email (via Resend SMTP) |
| `pino`, `pino-loki`, `pino-pretty` | Structured logging |
| `zod` | Input validation schemas |
| `sanitize-html` | XSS sanitization middleware |
| `uuid` | Request ID fallback |

### Key Libraries — Frontend

| Library | Purpose |
|---|---|
| `react`, `react-dom` | UI |
| `axios` | HTTP client (`withCredentials: true`) |
| `@stripe/react-stripe-js`, `@stripe/stripe-js` | Stripe Elements (PaymentElement) |
| `@supabase/supabase-js` | Initialized but unused — reserved for file storage |
| `recharts` | Dashboard charts |
| `date-fns` | Date formatting (Jerusalem TZ) |
| `tailwindcss` | Styling |
| `vitest`, `@testing-library/react` | Tests |

---

## 3. Repository Layout

```
Classly - Studio Management/
├── CLAUDE.md                     # Claude Code project instructions
├── README.md                     # Marketing blurb / quick start
├── docker-compose.yml            # Main service definitions
├── docker-compose.override.yml   # Dev-only port mappings & env
├── studio_management_schema_setup.sql  # Initial DB schema (loaded on first boot)
├── package.json                  # Root scripts (test, typecheck)
├── .husky/pre-commit             # Prettier + tsc + unit tests
│
├── server/                       # Express + Prisma backend
│   ├── Dockerfile                # Multi-stage build (builder → runtime)
│   ├── prisma/
│   │   └── schema.prisma         # Data model (no migrations/ dir — see §7)
│   ├── src/
│   │   ├── index.ts              # HTTP server entry
│   │   ├── app.ts                # Express app + middleware stack
│   │   ├── config/               # env validation, Prisma singleton
│   │   ├── routes/               # Express routers (one per resource)
│   │   ├── controllers/          # Request/response adapters
│   │   ├── services/             # Business logic (Prisma queries live here)
│   │   ├── middleware/           # auth, validate, error handler
│   │   ├── validations/          # Zod schemas (currently auth only)
│   │   ├── utils/                # AppError, cryptoUtils
│   │   └── logger.ts             # Pino + Loki transport
│   └── tests/
│       ├── unit/                 # 6 files, Prisma mocked
│       ├── integration/          # 4 files, Supertest + mocked Prisma
│       ├── setup.ts              # Clears mocks
│       └── setupEnv.ts           # Sets NODE_ENV=test
│
├── client/                       # React + Vite frontend
│   ├── Dockerfile                # Multi-stage (build → nginx)
│   ├── nginx.conf                # Production Nginx (SPA fallback)
│   ├── nginx.dev.conf            # Dev Nginx (no HTTPS)
│   ├── vite.config.ts            # Bundler + Vitest config
│   ├── index.html                # App shell
│   ├── App.tsx                   # Root component (routing, auth state)
│   ├── main.tsx                  # ReactDOM entry
│   ├── components/
│   │   ├── admin/                # Admin-only pages (Dashboard, StudentMgmt, ClassSchedule, Payments, Admin, Settings)
│   │   ├── instructor/           # Instructor pages
│   │   ├── student/              # Student pages
│   │   ├── super-admin/          # Platform admin
│   │   ├── landing/              # Marketing pages
│   │   ├── common/               # BaseModal, ClassCard, FormFields
│   │   ├── __tests__/            # 1 test file (ResetPassword)
│   │   └── *.tsx                 # AuthPage, Sidebar, BottomNav, etc.
│   ├── services/
│   │   ├── api.ts                # Axios client + all *Service exports
│   │   ├── logger.ts             # Client logger → POST /api/logs
│   │   └── supabaseClient.ts     # Supabase init (unused)
│   ├── hooks/                    # Custom hooks
│   ├── utils/                    # dateUtils, storage
│   ├── types/
│   │   ├── types.ts              # App types (hand-rolled)
│   │   └── database.ts           # Supabase-generated DB types
│   └── src/setupTests.ts         # Vitest setup
│
├── docker/                       # Loki + Grafana configs
│   ├── loki/loki-config.yaml
│   └── grafana/
│
└── .github/workflows/deploy.yml  # Self-hosted deploy (NO test gates — see §13)
```

---

## 4. Running the Stack Locally

### Prerequisites

- Docker Desktop (v2+)
- Git
- (Optional) Node 20 + npm for IDE type-checking outside the container

### First-time setup

```bash
# 1. Clone
git clone <repo> && cd "Classly - Studio Management"

# 2. Create env files (see §9 for required vars)
cp .env.example .env            # (repo has no .env.example today — copy from ops)
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. Boot the stack
docker compose up -d --build
```

### Services

| Service | Host | Port | Purpose |
|---|---|---|---|
| `frontend` | localhost | 80 | Nginx serving the SPA |
| `backend` | localhost | 5000 | Express API (`/api/*`) |
| `db` | localhost | 5432 | Postgres 18 |
| `loki` | localhost | 3100 | Log aggregation |
| `grafana` | localhost | 3001 | Log/metrics UI (default admin/admin) |
| `cf-tunnel` | — | — | Exposes frontend via a Cloudflare URL |

### Daily commands

```bash
docker compose up -d                  # Start (uses cached images)
docker compose up -d --build          # Rebuild after dep/code changes
docker compose logs -f backend        # Tail backend logs
docker compose exec backend sh        # Shell into backend container
docker compose exec db psql -U classly -d classly  # Postgres REPL
docker compose down                   # Stop (keeps volumes)
docker compose down -v                # Stop + wipe DB volume
```

### Running tests

```bash
# From the host (requires Node locally):
npm run test              # Runs client + server unit tests
npm run typecheck         # Typecheck both packages

# Or inside the containers:
docker compose exec backend npm test
docker compose exec backend npm run test:integration
```

### Hot reload

- **Frontend:** Vite dev server *is not* exposed by default in `docker-compose.override.yml`. In dev, you build once → Nginx serves `dist/`. For live reload, run `npm run dev` on the host against `VITE_API_URL=http://localhost:5000/api`.
- **Backend:** No `nodemon` in the container. Code changes require `docker compose up -d --build backend` or an explicit restart. *(Candidate for improvement — see review doc §"Quick Wins".)*

---

## 5. Backend Architecture

### Layered request flow

```
HTTP Request
  ↓
Express middleware stack (app.ts)
  1. trust proxy
  2. requestLogger  (attaches req.logger, req.requestId)
  3. helmet         (CSP + security headers)
  4. rateLimit      (100 req / 15min / IP — global)
  5. cors
  6. cookieParser
  7. express.raw    (only on /api/webhooks)
  8. express.json   (everything else)
  ↓
Router (routes/*.ts)
  - authenticateUser (middleware/authMiddleware.ts) — JWT cookie → req.user, req.studioId
  - requireRole(['ADMIN', ...])                     — RBAC gate
  - validate(zodSchema)                             — sanitize + Zod (auth routes only)
  ↓
Controller (controllers/*.ts)
  - Reads req.body, req.params, req.studioId, req.user
  - Calls Service methods
  - Shapes the HTTP response
  - Throws AppError on expected failures → passed to errorMiddleware
  ↓
Service (services/*.ts)
  - Owns Prisma queries
  - Owns business rules (capacity, pricing, status transitions)
  - Uses prisma.$transaction for multi-write operations
  ↓
Prisma Client → PostgreSQL
```

### Key files

| File | Role |
|---|---|
| [`server/src/index.ts`](../server/src/index.ts) | Boots HTTP listener (or exports app for serverless). |
| [`server/src/app.ts`](../server/src/app.ts) | Middleware stack + route registration. |
| [`server/src/config/env.ts`](../server/src/config/env.ts) | Validates required env vars; throws in production if missing. |
| [`server/src/config/prisma.ts`](../server/src/config/prisma.ts) | Prisma singleton (with dev-mode global cache to avoid reconnects on hot reload). |
| [`server/src/middleware/authMiddleware.ts`](../server/src/middleware/authMiddleware.ts) | `authenticateUser` (reads `classly_token` cookie, verifies JWT, hydrates `req.user`, checks suspension) + `requireRole`. |
| [`server/src/middleware/validate.ts`](../server/src/middleware/validate.ts) | HTML-sanitizes all string fields (except `password`, `token`, `invitationToken`) then runs a Zod schema. |
| [`server/src/middleware/errorMiddleware.ts`](../server/src/middleware/errorMiddleware.ts) | Centralized handler. Distinguishes `AppError` (operational) from programmer errors. |
| [`server/src/utils/AppError.ts`](../server/src/utils/AppError.ts) | Throwable class with `statusCode` and `isOperational`. |
| [`server/src/logger.ts`](../server/src/logger.ts) | Pino + pino-loki + pino-pretty (dev). Per-request child logger with `requestId`. |

### Route inventory

```
/api/health                   public
/api/auth/*                   public (login, register, forgot/reset, logout, me)
/api/webhooks/stripe          public (signature-verified; raw body)

/api/users/*                  authenticated
/api/studios/*                authenticated + role gated
/api/branches/*               authenticated + role gated
/api/rooms/*                  authenticated + role gated
/api/students/*               authenticated + role gated
/api/instructors/*            authenticated + role gated
/api/courses/*                authenticated (partial scoping — see review doc)
/api/enrollments/*            authenticated + role gated
/api/payments/*               authenticated + role gated
/api/attendance/*             authenticated + role gated
/api/invitations/*            authenticated (create) / public (validate)
/api/dashboard/*              authenticated + role gated
/api/logs                     authenticated (frontend log ingest)
```

### Error handling contract

**Never** write `res.status(500).json({error:...})` in a controller. Instead:

```ts
throw new AppError('Course not found', 404);
// errorMiddleware maps this to { error: 'Course not found' } with status 404.
```

Programmer errors (undefined access, etc.) bubble as 500 with a generic message client-side; full stack logged server-side.

---

## 6. Frontend Architecture

### Root flow

```
main.tsx
  ↓
App.tsx
  - useEffect on mount: AuthService.me() → hydrate currentUser + userRole
  - Renders either:
      <LandingPage>        (unauthenticated, on /)
      <AuthPage>           (unauthenticated, on /login or /register)
      <ResetPassword>      (token in URL)
      <RoleShell>          (authenticated — Sidebar + BottomNav + getComponentForTab())
  ↓
Role-specific dashboards (lazy-loaded)
```

### State management

There is **no global store**. Authentication and user data live in `App.tsx` local state:

```tsx
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [currentUser, setCurrentUser] = useState<User | null>(null);
const [userRole, setUserRole] = useState<UserRole>('STUDENT');
const [activeTab, setActiveTab] = useState<TabId>('dashboard');
```

- `currentUser` + a *sanitized* copy are persisted to `localStorage` via `utils/storage.ts` as `classly_user`.
- The JWT itself is in an **HttpOnly cookie** (`classly_token`) — JavaScript cannot read it.
- Tab state is prop-drilled through `Sidebar` / `BottomNav` / dashboards (4 levels deep in some paths).

> Known limitation: `isAuthenticated`, `currentUser`, `userRole` update asynchronously; a race can leave `userRole` briefly out of sync with `currentUser`. See review doc.

### Services layer (`client/services/api.ts`)

Every API call goes through the `apiClient` axios instance:

```ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. http://localhost:5000/api
  withCredentials: true,                 // sends/receives the HttpOnly cookie
  timeout: 30000,
});
```

**Request interceptor** — logs the outgoing method + URL.

**Response interceptor** — on a 401 that is *not* to an auth path, it clears `classly_user` from `localStorage` and triggers `window.location.reload()`. There is **no refresh-token flow**; expired sessions cause a full reload (and lose any in-progress form state).

The file also exports role-specific service objects:

```
AuthService, UserService, StudioService, BranchService, RoomService,
InvitationService, StudentService, CourseService, EnrollmentService,
PaymentService, DashboardService
```

Each service is a thin shim over `apiClient.get/post/patch/delete`.

### Component organization

Folders are per-role (`admin/`, `instructor/`, `student/`, `super-admin/`) plus `common/` and `landing/`. Components are functional; there are no class components.

### Styling & layout

- **TailwindCSS** utility classes directly in JSX.
- RTL direction set via `<div dir="rtl">` at the App root.
- No CSS-in-JS library.

### Lazy loading

Role dashboards and landing pages are `React.lazy()`d with `Suspense` fallbacks. Modals are *not* lazy — they ship with their parent bundle.

---

## 7. Database & Prisma

### Source of truth

- **Schema definition:** [`server/prisma/schema.prisma`](../server/prisma/schema.prisma) (~358 lines)
- **Initial SQL:** [`studio_management_schema_setup.sql`](../studio_management_schema_setup.sql) — mounted into the `db` service on first boot.
- **Migrations directory:** **does not exist**. Today, schema is applied via the raw SQL on first boot; the `schema.prisma` is kept in sync by hand.

### Core models

```
studios (id, serial_number UNIQUE, name, plan, is_active, created_at, ...)
  └─ branches (id, studio_id, name, address, ...)
       └─ studio_rooms (id, branch_id, name, capacity, ...)

users (id, email UNIQUE, password_hash, full_name, role, studio_id, status, login_count, ...)
  - role: SUPER_ADMIN | ADMIN | INSTRUCTOR | STUDENT | PARENT
  - status: ACTIVE | SUSPENDED

classes (id, studio_id, branch_id, room_id, instructor_id, name, level, price,
         billing_cycle, max_capacity, is_active, schedule, ...)
  └─ enrollments (id, class_id, student_id, studio_id, parent_id?, status,
                  payment_status, enrolled_at, ...)
       └─ attendance (id, enrollment_id, session_date, status)
          — composite unique (enrollment_id, session_date)

payments (id, enrollment_id, studio_id, amount, status, stripe_payment_intent_id UNIQUE,
          stripe_charge_id, payment_method, paid_at, ...)
  - status: PENDING | SUCCEEDED | FAILED | REFUNDED

instructor_commissions (id, instructor_id, enrollment_id, amount, period, ...)

pending_registrations (id, email, studio_serial, expires_at DEFAULT now()+1h, ...)

password_reset_tokens (id, user_id, token_hash, used, expires_at, used_at)

audit_logs (id, actor_user_id, studio_id, entity, entity_id, action, changes JSONB, created_at)
```

### Conventions

- **IDs:** UUIDs via `gen_random_uuid()`.
- **Timestamps:** `timestamptz` with `DEFAULT now()`.
- **Multi-tenant key:** every tenant-scoped table has `studio_id`. *Note: enforcement of this scope in queries is inconsistent — see review doc.*
- **Cascades:** `studios → branches → rooms → classes → enrollments` all cascade on delete.

### Working with Prisma

```bash
# Regenerate client after schema edits
docker compose exec backend npx prisma generate

# Inspect data
docker compose exec backend npx prisma studio
# → opens http://localhost:5555

# Ad-hoc SQL
docker compose exec db psql -U classly -d classly
```

> **There is no `prisma migrate` workflow today.** Schema changes require both (a) editing `schema.prisma` and (b) applying the change via raw SQL (or `prisma db push`). Adding a proper migrations dir is a tracked improvement.

### Indexes

Unique indexes exist on `users.email`, `studios.serial_number`, `payments.stripe_payment_intent_id`, and `(enrollment_id, session_date)` on attendance. **Non-unique indexes on `studio_id`, `status`, `is_active`, and time-range columns are missing** and will seq-scan under load — see review doc.

---

## 8. Authentication, RBAC, Multi-Tenancy

### Session lifecycle

1. **Register** `POST /api/auth/register`
   - With `invitationToken`: JWT decoded → role + `studio_id` lifted from token.
   - With `studio_serial`: studio looked up by serial; user created as `STUDENT` in that studio. *(This path bypasses invitation — see review doc.)*
   - Password hashed with `bcrypt.genSalt(10)`.

2. **Login** `POST /api/auth/login`
   - `bcrypt.compare` against `password_hash`.
   - Rejects `SUSPENDED` users.
   - Signs a JWT: `{ userId, role, studioId, iat, exp }`, `expiresIn: '7d'`.
   - Sets cookie: `classly_token`, `HttpOnly: true`, `Secure: NODE_ENV==='production'`, `SameSite: 'lax'`.
   - Body response includes `{ user: {...} }` — the client caches this in `localStorage`.

3. **Every request** → `authenticateUser` middleware
   - Reads `classly_token` from cookie (falls back to `Authorization: Bearer` header).
   - Verifies JWT signature.
   - Fetches the user from DB (selects only `id, role, studio_id, status`).
   - Rejects if user is `SUSPENDED` or deleted.
   - Attaches `req.user`, `req.studioId`.

4. **`/api/auth/me`**
   - Lightweight poll endpoint. Returns `{ id, email, role, studio_id }`.
   - Must stay lean — **no joins** (team convention).

5. **Logout** `POST /api/auth/logout`
   - Clears the cookie. **Does not invalidate the JWT server-side** — tokens remain valid until `exp`. No blacklist today.

### Password reset flow

1. `POST /api/auth/forgot-password` with email.
2. Server generates `crypto.randomBytes(32).toString('hex')` → raw token.
3. Stores SHA-256 hash in `password_reset_tokens` with `expires_at = now() + 1h`.
4. Emails the raw token to the user (or logs it to stdout in dev).
5. `POST /api/auth/reset-password` with `{ token, newPassword }`.
6. Server hashes the incoming token, looks up the row, verifies `!used && expires_at > now()`.
7. Inside a `$transaction`: updates `users.password_hash` + marks token `used`.
8. Auto-issues a JWT cookie (user is logged in).

### Invitation flow

`InvitationService.createInvitation(role, studioId, creatorId)` signs a JWT with those claims, 7-day expiry, and the configured issuer/audience. The link is emailed or copied to clipboard. On acceptance, the recipient's role and `studio_id` are updated in the DB.

> **Statelessness caveat:** there is no DB record of the invitation; the JWT itself *is* the invitation. A token can be redeemed multiple times until it expires. See review doc for a DB-backed replacement.

### RBAC

- **Route-level:** `requireRole(['ADMIN', 'INSTRUCTOR'])` middleware guards most resource routes.
- **Controller-level:** Some controllers additionally check ownership (e.g., `enrollmentController.verifyInstructorClass`). Coverage is inconsistent.
- **Service-level:** Services trust the caller's auth claims; they do not re-check roles.
- **Client-side:** UI hides tabs/buttons based on `userRole`. **This is cosmetic only** — never rely on it for security.

### Multi-tenancy

The intent is that every query is scoped by `studio_id` taken from `req.studioId`. In practice:

- ✅ `StudentService`, `BranchService`, `RoomService`, `DashboardService`, `PaymentService`, `AttendanceService` scope correctly.
- ❌ `CourseService.getAllCourses / getCourseById / updateCourse` do **not** scope by `studio_id`.
- ⚠️ `EnrollmentService.getStudentEnrollments` filters by `student_id` but not by `studio_id`.

These gaps are documented as CRITICAL in the review doc — assume they will be fixed soon. When adding new queries, **always filter by `studio_id` first**.

---

## 9. External Integrations

### Stripe

- **Client side** (`client/components/admin/Payments.tsx`):
  - `loadStripe(VITE_STRIPE_PUBLISHABLE_KEY)` initializes the SDK.
  - `<Elements>` + `<PaymentElement>` collect card data without it ever touching our server.

- **Server side** (`server/src/services/paymentService.ts`):
  - `createPaymentIntent(amount, enrollmentId)` — amount is stored in agorot/cents.
  - Webhook at `POST /api/webhooks/stripe`:
    - Receives raw body (configured via `express.raw({ type: 'application/json' })` scoped to `/api/webhooks`).
    - Verifies via `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`.
    - Handles `payment_intent.succeeded` → marks payment `SUCCEEDED`, enrollment `ACTIVE` + `PAID`, inside a `$transaction`.
    - Handles `payment_intent.payment_failed` → marks `FAILED`.
    - Idempotency is *partial*: it uses a conditional `updateMany({ where: { status: 'PENDING' } })` so a retried webhook no-ops. The Stripe `event.id` is **not** recorded, so there's no true dedup — this is a known gap.

- **Required env**:
  - `STRIPE_SECRET_KEY` (server)
  - `STRIPE_WEBHOOK_SECRET` (server)
  - `VITE_STRIPE_PUBLISHABLE_KEY` (client build)

### Supabase

Initialized in `client/services/supabaseClient.ts` with the anon key. **Currently unused** in the UI — reserved for future file/image uploads. No RLS policies in use today.

### Nodemailer / Resend

- SMTP configured via `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- Provider: Resend (`smtp.resend.com`).
- In dev, if SMTP is unset, the service logs the email body to stdout (including reset links).
- Used for: invitation emails, password reset links.

### Cloudflare Tunnel

- `cf-tunnel` service runs `cloudflared` with `CF_TUNNEL_TOKEN`.
- Exposes the frontend publicly at the configured Cloudflare hostname without opening a port on the host.

### Loki + Grafana

- Backend sends structured JSON logs via `pino-loki` transport to `http://loki:3100`.
- Grafana at `:3001` with the Loki datasource pre-provisioned (see `docker/grafana/provisioning/`).
- Default Grafana creds: `admin / admin` on first login (force change on prod).

### Environment variables (consolidated)

| Scope | Var | Notes |
|---|---|---|
| root `.env` | `DB_PASSWORD` | Used by `postgres` and `backend`. |
| root `.env` | `CF_TUNNEL_TOKEN` | Cloudflared auth. |
| `server/.env` | `DATABASE_URL` | Prisma connection string. |
| `server/.env` | `JWT_SECRET` | **Required in production**, must be ≥32 chars. |
| `server/.env` | `CLIENT_URL` | CORS origin + invitation links. |
| `server/.env` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Payments. |
| `server/.env` | `SMTP_*`, `SMTP_FROM` | Email. |
| `server/.env` | `LOKI_URL` | Defaults to `http://loki:3100`. |
| `server/.env` | `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` | First-boot bootstrap. |
| `client/.env` | `VITE_API_URL` | Usually `http://localhost:5000/api` in dev. |
| `client/.env` | `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe test/live publishable key. |
| `client/.env` | `VITE_GRAFANA_URL` | Deep-link from admin UI. |

> **Security note:** `.env` files are in `.gitignore` *now*, but they have been committed to git history in the past. Treat any secret you find in git history as compromised. Rotate, don't rely. See review doc.

---

## 10. Security Model

### What we protect against

| Threat | Mitigation |
|---|---|
| XSS (script injection) | Helmet CSP (`default-src 'self'`), `sanitize-html` middleware strips tags from all non-sensitive string inputs. |
| SQL injection | Prisma parameterizes everything. One `$queryRaw` exists (`studioService.ts:31`) and is literal — no user input. |
| CSRF | `SameSite=Lax` on the auth cookie (partial). No CSRF tokens today. |
| Clickjacking | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'`. |
| Brute force login | Global rate limit only (100/15min/IP). No per-endpoint limit on auth — **known gap**. |
| Password cracking | bcrypt, cost=10. |
| Token theft | `HttpOnly` + `Secure` (in prod) cookie. |
| Supply chain | `npm audit` reports 0 vulns at time of writing. No automated Dependabot yet. |

### What we do NOT protect against (today)

- **Cross-studio data access** via guessed IDs on some endpoints (see review doc).
- **Webhook replay** — the handler does not dedupe by `event.id`.
- **Reuse of invitation tokens** before expiry.
- **Session revocation** — a stolen cookie is valid until JWT expiry.
- **PII in logs** — some controllers log full `req.body`.

### Secret management

- Local dev: `.env` files (git-ignored).
- Production: GitHub Actions secrets → injected into `.env` at deploy time (`deploy.yml:15-21`).
- No vault / KMS integration yet.

### Security headers set by Helmet

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' js.stripe.com; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer (default via helmet)
Strict-Transport-Security: (configured if HTTPS terminated upstream)
```

---

## 11. Logging & Observability

### Backend

Every HTTP request gets:

```json
{
  "level": "info",
  "time": "2026-04-16T09:00:00.000Z",
  "requestId": "f6c3...",
  "method": "POST",
  "path": "/api/enrollments/register",
  "status": 200,
  "duration_ms": 42,
  "msg": "request completed"
}
```

- **`requestId`** comes from `X-Request-ID` header (client sets one per request) or a UUID fallback.
- **Per-request child logger** is attached as `req.logger` — always use it instead of the global logger inside request handlers.
- **Service-scoped loggers** use `logger.child({ service: 'paymentService' })` for cross-cutting filters in Grafana.
- **Pino-Loki transport** batches logs and POSTs them to Loki. If Loki is down, logs silently fail — worth hardening.

### Frontend

`client/services/logger.ts` exposes `logger.info/warn/error(message, context)`. It:
1. Writes to `console.*`.
2. In production, sends a POST to `/api/logs` (failure is silent).
3. Sanitizes `password` / `token` fields to `***`.

### Grafana

- Default board: request latency (p50/p95/p99) by path.
- Pre-provisioned Loki datasource — queries use LogQL, e.g.:
  ```
  {service="backend"} |= "payment_intent.succeeded"
  ```

---

## 12. Testing

### Backend (Jest + Supertest)

- Located in `server/tests/{unit,integration}`.
- `jest.config.ts` uses `ts-jest` preset, Node env.
- Run everything: `npm test` (inside `server/`).
- Run unit only: `npm run test:unit`.
- Run integration only: `npm run test:integration`.
- **Prisma is mocked** in all tests — schema drift is not caught by the suite. Integration tests use Supertest against the real Express app with mocked middleware.

### Frontend (Vitest + React Testing Library)

- Config lives inside `client/vite.config.ts` (`test:` block), env = `jsdom`.
- Setup: `src/setupTests.ts` imports `@testing-library/jest-dom`.
- **Only one test file exists today:** `components/__tests__/ResetPassword.test.tsx`.
- Run: `npm run test:unit` (one-shot) or `npm test` (watch).

### Coverage today

| Layer | Coverage |
|---|---|
| Backend services | ~2 of 14 have tests (payment, enrollment) |
| Backend controllers | 1 of 17 (auth) |
| Frontend components | 1 of 49 (ResetPassword) |
| Frontend hooks/services | 0 |

Adding tests is the single highest-leverage area for a new joiner. See review doc for prioritized gaps.

### Husky pre-commit hook

Runs on every `git commit`:

1. Prettier via `lint-staged` on staged files.
2. `npm run typecheck` in `client/` and `server/`.
3. `npm run test:unit` in both.

It does **not** run ESLint or integration tests. A failed hook aborts the commit.

---

## 13. CI / CD & Deployment

### GitHub Actions

`.github/workflows/deploy.yml` triggers on push to `main` and runs on a **self-hosted** runner:

1. Checkout.
2. Write `.env` files from GitHub Secrets.
3. `docker compose up -d --build`.
4. Prune dangling images.

> **There are no test gates.** Linting, typechecking, and tests are *not* run in CI. The pre-commit hook is the only automated safety net.

### Recommended flow for contributors

```
feature branch
  ├─ push → PR
  ├─ (manual) request review
  ├─ merge to main
  └─ deploy.yml fires → prod restarts in ~2-3 min
```

Because there is no staging, treat `main` = production. Use feature flags or dark launches for risky changes.

### Rollback

`docker compose` keeps the previous image tag on the runner until the prune step. If you need to roll back quickly:

```bash
# on the runner:
docker compose down backend
docker image tag classly-backend:previous classly-backend:latest
docker compose up -d backend
```

Better: add image tagging and a rollback job (tracked in review doc).

---

## 14. Coding Conventions

### General

- **TypeScript strict mode** — no `any` without a comment explaining why.
- **`async/await`** over `.then` chains.
- **Named exports** preferred over default exports (except React components).
- **Path alias** `@/*` → `client/*` in the frontend.
- **No barrel `index.ts`** files in `services/` or `controllers/` — import directly.

### Backend

- **Errors flow through `AppError` + `errorMiddleware`**. Never `res.status(500).json(...)` directly.
- **`studio_id` belongs in every tenant query**. If you write a `prisma.*.findMany` without a `studio_id` filter, pause and justify it.
- **Sanitization lives in middleware, not services.** Don't call `sanitize-html` inside a service method — it belongs in `middleware/validate.ts` before the body reaches the controller.
- **Zod schemas for new routes** — use the `validate()` middleware pattern even if it's aspirational today.
- **Transactions** — any write that touches more than one table (e.g., enrollment + payment record) must be inside `prisma.$transaction`.
- **Logging** — use `req.logger`, attach relevant IDs (`studioId`, `enrollmentId`), **never log passwords/tokens/full bodies**.

### Frontend

- **Functional components + hooks only.**
- **Components are per-role** — put a new admin feature under `components/admin/`, not at the root.
- **Shared, presentational widgets** go in `components/common/`.
- **Services** for HTTP — don't call `axios` directly inside a component.
- **Error display** — show errors inline near the action that caused them, not via `alert()`.
- **Loading states** — every async action should disable its trigger while in flight.
- **RTL-aware styling** — avoid hard `margin-left` / `padding-right`; prefer `ms-*` / `me-*` (logical) Tailwind utilities.

### Commits

- **Conventional commits:** `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- Keep diffs small. A commit that touches five concerns is five commits.

---

## 15. Common Tasks (Recipes)

### Add a new API endpoint (e.g., `GET /api/courses/:id/attendance-summary`)

1. `server/src/routes/courseRoutes.ts`:
   ```ts
   router.get('/:id/attendance-summary', authenticateUser, requireRole(['ADMIN', 'INSTRUCTOR']), courseController.getAttendanceSummary);
   ```
2. `server/src/controllers/courseController.ts`:
   ```ts
   export async function getAttendanceSummary(req: AuthedRequest, res: Response, next: NextFunction) {
     try {
       const summary = await courseService.getAttendanceSummary(req.params.id, req.studioId!);
       res.json(summary);
     } catch (err) {
       next(err);
     }
   }
   ```
3. `server/src/services/courseService.ts`:
   ```ts
   export async function getAttendanceSummary(classId: string, studioId: string) {
     const cls = await prisma.classes.findFirst({ where: { id: classId, studio_id: studioId } });
     if (!cls) throw new AppError('Course not found', 404);
     // ... aggregate
     return { /* ... */ };
   }
   ```
4. Add a test in `server/tests/unit/courseService.test.ts` covering the happy path and the cross-studio rejection.
5. On the client, add a method to `CourseService` in `client/services/api.ts`.

### Add a new DB column

1. Edit `server/prisma/schema.prisma` — add the field.
2. Open a shell: `docker compose exec db psql -U classly -d classly`.
3. Run the matching `ALTER TABLE ...` (since migrations/ is empty).
4. `docker compose exec backend npx prisma generate` to refresh the client.
5. Commit both the schema change and a note in `studio_management_schema_setup.sql` so fresh boots pick it up.

### Add a new role-restricted page

1. Create the component under `client/components/<role>/YourPage.tsx`.
2. Register it in `App.tsx` — add the tab ID to the `TabId` union, add a case in `getComponentForTab()`, add it to the role's allowed-tabs list in `Sidebar.tsx` + `BottomNav.tsx`.
3. Wire an entry in `services/api.ts` for any new endpoints.
4. Backend must still enforce the role — don't rely on the UI hiding the tab.

### Run a local Stripe webhook

```bash
# In one terminal:
stripe listen --forward-to localhost:5000/api/webhooks/stripe
# stripe-cli prints a `whsec_...` — put it in server/.env as STRIPE_WEBHOOK_SECRET and restart the backend.

# In another:
stripe trigger payment_intent.succeeded
```

### Reset the database

```bash
docker compose down -v           # wipes volumes
docker compose up -d              # re-runs studio_management_schema_setup.sql
```

---

## 16. Debugging Playbook

### "My request returns 401"

1. Confirm the cookie is set: DevTools → Application → Cookies → look for `classly_token`.
2. Confirm `VITE_API_URL` points to the same origin (or CORS + credentials are configured for cross-origin).
3. Check backend logs: `docker compose logs -f backend | grep <requestId>`.
4. Decode the JWT at jwt.io to check `exp`.

### "My request returns 403"

The user passed auth but failed `requireRole`. Check which roles the route allows. For debugging, `GET /api/auth/me` returns the role the server believes the user has.

### "Stripe webhook returns 400 signature mismatch"

- Was the body parsed as JSON before reaching the webhook? The `express.raw` middleware must run *before* `express.json` for `/api/webhooks`. Verify `app.ts` order.
- Is `STRIPE_WEBHOOK_SECRET` in the container env? `docker compose exec backend env | grep STRIPE`.
- Are you hitting the right URL? The CLI's `--forward-to` must match your backend.

### "Prisma says column does not exist"

Schema drift. Either:
- `docker compose exec backend npx prisma generate` (client out of date), or
- You edited `schema.prisma` but didn't run the matching SQL.

### "Logs aren't showing up in Grafana"

- `docker compose logs loki` — is Loki up?
- `curl http://localhost:3100/ready` from the backend container — is it reachable?
- Check Grafana datasource URL (`http://loki:3100` from inside the network).

---

## 17. Known Pitfalls

- **Pushing to `main` deploys immediately.** There is no staging, no test gate.
- **`.env` files have been in git history.** Assume the committed secrets are compromised.
- **`CourseService` does not scope by `studio_id`** on reads/updates — do not copy this pattern.
- **`register` endpoint accepts `studio_serial`** — be careful before relying on "only invited users can join a studio".
- **Invitation JWTs can be reused** until expiry. Don't use them as single-use coupons.
- **No refresh tokens.** Expired cookies cause a full page reload. Long-running forms will lose data.
- **Prisma is mocked in all tests.** "Green tests" ≠ "schema is correct".
- **Client `ClassCard` is duplicated** three times with incompatible props (`common/ClassCard.tsx`, `landing/ClassCard.tsx`, `student/CourseCard.tsx`).
- **Request bodies are logged in some controllers.** Avoid adding PII fields to routes that hit these loggers.
- **`SUPER_ADMIN` is referenced in routes but no provisioning flow creates one** — seed manually via SQL for now.

---

## 18. Glossary

| Term | Meaning |
|---|---|
| **Studio** | A tenant — one fitness business. Top of the ownership tree. |
| **Branch** | A physical location owned by a studio. |
| **Room** | A trainable space inside a branch. |
| **Class** | A recurring course (e.g., "Monday Vinyasa 7pm") offered by a studio. |
| **Enrollment** | A student's registration in one class. Has a lifecycle (PENDING → ACTIVE → COMPLETED/CANCELED). |
| **Attendance** | A per-session record for an enrollment. |
| **Payment** | One Stripe `PaymentIntent` tied to one enrollment. |
| **Commission** | An instructor's pay for a given enrollment/session. |
| **`studio_id`** | The tenant key. Every tenant-scoped query must filter by it. |
| **`requestId`** | Correlation ID for a single HTTP request. Propagated to logs. |
| **`classly_token`** | HttpOnly cookie that stores the session JWT. |
| **`classly_user`** | `localStorage` key holding a non-sensitive user snapshot for UI bootstrap. |
| **`AppError`** | Throwable with `statusCode` + `isOperational=true`. Safe to surface to clients. |

---

## Where to ask for help

- `CLAUDE.md` — project-specific AI assistant instructions.
- `README.md` — product-facing overview.
- `ARCHITECTURE_REVIEW.md` (sibling file) — current known defects + planned refactors.

Welcome aboard.
