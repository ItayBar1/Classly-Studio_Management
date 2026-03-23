# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Classly is a full-stack SaaS platform for fitness and wellness studio management. It supports multi-tenant studios with role-based access for SUPER_ADMIN, ADMIN, INSTRUCTOR, and STUDENT roles. The UI supports RTL (Hebrew).

## Environment & Execution

**CRITICAL:** The project runs strictly via Docker Compose. Do not use local `npm start` or `npm run dev` to start the servers. Environment variables are managed through Docker Compose and `.env` files.

```bash
docker compose up -d                    # Start all services
docker compose up -d --build            # Rebuild and start (after code changes)
docker compose logs -f                  # Stream all logs
docker compose logs -f backend          # Stream backend logs only
docker compose exec [service] [cmd]     # Run a command inside a container
```

Services: `db` (PostgreSQL), `backend` (Express API on :5000), `frontend` (React+Nginx on :80), `loki` (:3100), `grafana` (:3001).

## Development Commands

### Client (inside container or with local Node.js)
```bash
cd client
npm run dev       # Vite dev server (port 3000)
npm run build     # Production build
npm test          # Run Vitest tests
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

### Database / Prisma (run inside the backend container)
```bash
docker compose exec backend npx prisma migrate dev     # Create and apply migration
docker compose exec backend npx prisma migrate deploy  # Apply pending migrations
docker compose exec backend npx prisma generate        # Regenerate Prisma client
docker compose exec backend npx prisma studio          # Open Prisma Studio GUI
```

## Architecture

### Monorepo Structure
- `client/` — React 19 + Vite frontend (TypeScript)
- `server/` — Express.js backend (TypeScript)
- `docker/` — Loki and Grafana configuration
- `docker-compose.yml` — Full service orchestration
- `studio_management_schema_setup.sql` — Initial DB schema (used by Docker on first run)

### Backend (`server/src/`)
Layered architecture: `routes/` → `controllers/` → `services/` → Prisma ORM → PostgreSQL.

- `app.ts` — Express app setup: Helmet, rate-limiting (100 req/15 min), CORS, route registration
- `index.ts` — Entry point; starts HTTP server or exports app for serverless
- `middleware/` — JWT auth middleware and centralized error handler
- `config/` — Environment validation, database connection, Prisma client
- `logger.ts` — Pino logger with Pino-Loki transport (streams to Grafana Loki)

All API routes are prefixed `/api`. Public routes: `/api/health`, `/api/auth/*`, `/api/webhooks/stripe`. All others require a valid JWT.

### Frontend (`client/`)
- `App.tsx` — Root component; handles auth state, role-based tab routing, and lazy-loaded page components
- `components/` — Organized by role: `admin/`, `instructor/`, `student/`, `super-admin/`, `landing/`, `common/`
- `services/api.ts` — Axios client (attaches JWT Bearer token from localStorage)
- `services/logger.ts` — Client-side logger that ships logs to `/api/logs`
- `types/` — Shared TypeScript types

Role determines which tabs/components render:
- `SUPER_ADMIN`: Dashboard, Administration
- `ADMIN`: Dashboard, Students, Schedule, Payments, Administration, Settings
- `INSTRUCTOR`: Dashboard, Students, Schedule
- `STUDENT`: Dashboard, Browse Courses

### Key Integrations
- **Stripe**: Payment intents created server-side; Elements rendered client-side. Webhooks hit `/api/webhooks/stripe` (raw body, Stripe signature validated).
- **Supabase**: Used for file/image storage from the client.
- **Nodemailer**: Invitation emails and password reset flows.
- **Pino + Loki + Grafana**: Structured JSON logs from the server stream to Loki; Grafana at `:3001` for visualization.

### Database (PostgreSQL + Prisma)
Schema lives at `server/prisma/schema.prisma`. Core models: `users`, `studios`, `branches`, `studio_rooms`, `classes`, `enrollments`, `attendance`, `payments`, `instructor_commissions`, `audit_logs`, `pending_registrations`.

All primary keys use UUID (`gen_random_uuid()`). Timestamps use `timestamptz`.

## Coding Conventions

- Use `async/await` for all asynchronous operations.
- All backend errors must be passed to the centralized Express error-handling middleware — never respond with errors directly in controllers.
- Frontend components are functional and modular.
- Path alias `@/*` maps to `client/*` in the frontend (configured in `vite.config.ts` and `tsconfig.json`).
