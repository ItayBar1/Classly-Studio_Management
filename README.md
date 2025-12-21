# Classly Studio Management

Classly is a full-stack platform for managing classes, enrollments, and payments for studios. The system combines a Supabase-secured REST API with a React 19 dashboard that adapts to Admin, Instructor, and Student roles.

## Project Overview
- **Purpose:** Manage studios end-to-end—courses, schedules, enrollments, attendance, payments, and role-based analytics.
- **Backend:** Express + TypeScript API backed by Supabase (PostgreSQL) with Stripe payment processing and role-aware middleware.
- **Frontend:** React 19 + Vite single-page dashboard with role-driven navigation and feature gating.
- **Database:** PostgreSQL schema (Supabase) with RLS policies, triggers, and indexes defined in `studio_management_schema_setup.sql`.

## Tech Stack
- **API:** Node.js, Express, TypeScript, Pino, Helmet, Rate limiting, CORS, Supabase Admin SDK, Stripe SDK.
- **Web:** React 19, TypeScript, Vite, Recharts, Lucide Icons, Supabase client, Axios, Stripe Elements.
- **Database:** PostgreSQL (Supabase) with RLS, triggers for auth user provisioning, and domain tables for studios, classes, enrollments, attendance, and payments.

## API Documentation
All routes are prefixed with `/api` and secured by `authenticateUser` unless noted. Role enforcement uses `requireRole`.

| Method | Path | Description | Auth / Role | Params & Notes |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | Health check. | Public | — |
| GET | `/api/courses` | List courses; admins see all, others see relevant/active. | Auth (ADMIN/INSTRUCTOR/STUDENT) | Optional query filters forwarded to service. |
| GET | `/api/courses/my-courses` | Instructor’s courses. | Auth (INSTRUCTOR/ADMIN) | — |
| GET | `/api/courses/available` | Courses open for student registration. | Auth (STUDENT) | — |
| GET | `/api/courses/:id` | Course details. | Auth | `:id` course id. |
| POST | `/api/courses` | Create course in user’s studio. | Auth (ADMIN) | Body: course fields (merged with `studio_id` from user). |
| PATCH | `/api/courses/:id` | Update course. | Auth (ADMIN) | `:id` course id; body: partial updates. |
| DELETE | `/api/courses/:id` | Soft delete (deactivate) course. | Auth (ADMIN) | `:id` course id. |
| GET | `/api/students` | Paginated students for studio. | Auth (ADMIN) | Query: `page`, `limit`, `search`. Requires `studioId` on request. |
| POST | `/api/students` | Create student in studio. | Auth (ADMIN) | Body: student payload. |
| DELETE | `/api/students/:id` | Soft delete student (status update). | Auth (ADMIN) | `:id` student id. |
| GET | `/api/students/my-students` | Students assigned to instructor. | Auth (INSTRUCTOR/ADMIN) | — |
| GET | `/api/students/:id` | Student details. | Auth (ADMIN/INSTRUCTOR) | `:id` student id. |
| GET | `/api/instructors` | List instructors in studio. | Auth (ADMIN) | — |
| GET | `/api/instructors/earnings` | Earnings/commissions for logged-in instructor. | Auth (INSTRUCTOR) | — |
| GET | `/api/instructors/:id` | Instructor profile (self or admin). | Auth (ADMIN/INSTRUCTOR) | `:id` instructor id; controller ensures self-access or admin. |
| DELETE | `/api/instructors/:id` | Soft delete instructor. | Auth (ADMIN) | `:id` instructor id. |
| POST | `/api/attendance` | Bulk upsert attendance for a class session. | Auth (INSTRUCTOR) | Body: `classId`, `date`, `records[{studentId,status,notes}]`; verifies instructor owns class unless admin. |
| GET | `/api/attendance/class/:classId` | Attendance history for class (optional date filter). | Auth (INSTRUCTOR/ADMIN) | `:classId`; query `date`; instructors must own class. |
| GET | `/api/attendance/my-history` | Logged-in student attendance history. | Auth (STUDENT) | — |
| POST | `/api/enrollments/admin` | Admin enrolls student and marks paid. | Auth (ADMIN) | Body: `studentId`, `classId`, optional `notes`. |
| POST | `/api/enrollments/register` | Student self-registration -> pending enrollment + Stripe intent. | Auth (STUDENT) | Body: `classId`. Returns Stripe client secret. |
| GET | `/api/enrollments/my-enrollments` | Logged-in student enrollments. | Auth (STUDENT) | — |
| GET | `/api/enrollments/class/:classId` | Enrollments for class. | Auth (ADMIN/INSTRUCTOR) | `:classId`; instructor must own class. |
| DELETE | `/api/enrollments/:id` | Cancel enrollment (soft delete/update). | Auth (ADMIN) | `:id` enrollment id. |
| GET | `/api/dashboard/admin` | Studio-level metrics (students, revenue, classes, attendance). | Auth (ADMIN) | Requires `studioId`. |
| GET | `/api/dashboard/instructor` | Instructor metrics. | Auth (INSTRUCTOR/ADMIN) | Uses logged-in instructor id. |
| GET | `/api/payments` | Payment history for studio. | Auth (ADMIN/INSTRUCTOR in routes) | Requires `studioId`; route comment suggests limiting to admin. |
| POST | `/api/payments/create-intent` | Create Stripe Payment Intent. | Auth | Body: `amount` (required), `currency`, `description`, `metadata`. |
| POST | `/api/payments/confirm` | Confirm payment and update status. | Auth | Body: `paymentIntentId`. |
| GET | `/api/users/me` | Current user profile from Supabase users table. | Auth | — |
| POST | `/api/webhooks/stripe` | Stripe webhook receiver (raw body, signature validated). | Public (Stripe) | Header `stripe-signature`; processes payment events. |

## Client-Side UX
Role determines available tabs and content rendered via `Sidebar` and `App.tsx` state machine.

### Admin
- **Dashboard:** Metrics, revenue & attendance charts fed by `/api/dashboard/admin`.
- **Students:** Advanced roster with search, pagination, CSV export, class filter, and sorting. Integrates API-backed fetching and course list loading for filters.
- **Schedule:** Weekly class timetable with capacity indicators (see `components/admin/ClassSchedule.tsx`).
- **Payments:** Payment history view (admin-only tab).
- **Settings:** Placeholder tab for future admin settings.

### Instructor
- **Dashboard:** Instructor KPIs via `/api/dashboard/instructor` (uses `InstructorDashboard`).
- **Students:** List of students registered to instructor’s classes (`/api/students/my-students`).
- **Schedule:** Instructor’s schedule view (`InstructorSchedule`).
- **Attendance:** Mark attendance through `/api/attendance` (accessed from schedule/related UI elements).

### Student
- **Dashboard:** Personalized overview of enrollments and attendance (`StudentDashboard`).
- **Browse Courses:** Discover enrollable courses (`/api/courses/available`) and initiate self-registration/payment via `/api/enrollments/register` and Stripe Elements.

Navigation: `Sidebar` filters available tabs per role (Admin: dashboard, students, schedule, payments, settings; Instructor: dashboard, students, schedule; Student: dashboard, browse courses). Logout calls Supabase sign-out.

## Database Schema
Key tables from `studio_management_schema_setup.sql`:

| Table | Purpose | Key Columns & Relationships |
| --- | --- | --- |
| `users` | Profiles synced with Supabase Auth users; includes roles and studio membership. | `id` (PK, FK auth.users), `role`, `studio_id` (FK studios), `status`, audit fields. |
| `studios` | Studio entities owned by admin users. | `admin_id` (FK users), contact/billing info, `is_active`. |
| `categories` | Class categories per studio. | `studio_id` FK studios, `type`, `is_active`, display fields. |
| `classes` | Class definitions/schedules. | `studio_id` FK studios, `category_id` FK categories, `instructor_id` FK users, timing, capacity, pricing, `is_active`. |
| `enrollments` | Student enrollment records with payment status and date range. | `studio_id` FK studios, `student_id` FK users, `class_id` FK classes, `parent_id` FK users, `status`, `payment_status`, `start_date`/`end_date`. |
| `attendance` | Attendance logs per session and enrollment. | `studio_id` FK studios, `class_id` FK classes, `instructor_id` FK users, `enrollment_id` FK enrollments, `student_id` FK users, `session_date`, `status`. |
| `payments` | Payment records with linkage to enrollments and instructors. | `studio_id` FK studios, `enrollment_id` FK enrollments, `student_id`/`instructor_id` FK users, `amount_ils`, `payment_method`, `status`, invoice fields. |
| `instructor_commissions` | Commission settings and payouts. | `studio_id` FK studios, `instructor_id`/`class_id` FK users/classes, `commission_percentage`, `billing_cycle`, `payment_status`. |
| `schedule_sessions` | Individual session occurrences for classes. | `studio_id` FK studios, `class_id` FK classes, `session_date`, time span, `status`, capacity counts. |
| `notifications` | User notifications. | `user_id`/`studio_id` FKs users/studios, `type`, `title`, `message`, `is_read`. |
| `audit_logs` | Audit trail of user actions. | `user_id`/`studio_id` FKs users/studios, `action`, `table_name`, `record_id`, `changes`. |

Additional logic: trigger `handle_new_user` seeds `users` on auth signup; `increment_enrollment` helper updates class counts; RLS policies enforce studio-scoped access and role checks.

## Getting Started

### Prerequisites
- Node.js 20+ and npm
- Supabase project (URL + service role key)
- Stripe secret key for payments

### Installation
```bash
# Clone
git clone <repository-url>
cd Classly-Studio_Management

# Install client
cd client
npm install

# Install server
cd ../server
npm install
```

### Environment Variables
Create `.env` files:

`client/.env`
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_A11Y_WIDGET_ENABLED=true  # Set to true to enable the accessibility widget
```

`server/.env`
```
PORT=5000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### Running Locally
```bash
# API
cd server
npm run dev

# Web
cd ../client
npm run dev
```
Visit the client on the Vite dev URL (default `http://localhost:5173`) and ensure the server port matches `CLIENT_URL` CORS configuration.

## Server Development

The Express API lives in `/server/src` and follows a routes → controllers → services layout:
- **Entry point:** `src/index.ts` exports the Express app for serverless platforms and starts the listener locally.
- **App wiring:** `src/app.ts` registers security middleware, request logging, CORS, rate limiting, webhooks, and routes.
- **Configuration:** `src/config/env.ts` centralizes environment parsing/validation (Supabase, Stripe, JWT, client URL, port).
- **Logging:** `src/logger.ts` configures Pino and a `requestLogger` middleware that attaches a request ID and duration to every request. Errors are surfaced via `middleware/errorMiddleware.ts` without changing response format.
- **Authentication:** `middleware/authMiddleware.ts` attaches the authenticated Supabase user and studio metadata to each request; `requireRole` enforces role-based access.
- **Business logic:** Services under `src/services` encapsulate Supabase/Stripe access and are invoked by controllers in `src/controllers`.

### Server Scripts
- `npm run dev` — start the API in watch mode.
- `npm run build` — compile TypeScript to `dist/`.
- `npm start` — run the compiled server.
- `npm test`, `npm run test:unit`, `npm run test:integration`, `npm run test:watch` — test commands (see Tests below).

### Environment Validation
- Required: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Common: `CLIENT_URL` (CORS), `FRONTEND_URL` (invitation links), `PORT`, `LOG_LEVEL`.
- Payments: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Auth/Invites: `JWT_SECRET` (falls back to service role key in non-production).

## Features & Improvements

### Forgot Password Flow
The application supports a secure password reset flow:
1.  User requests a password reset link via the login page ("שכחת סיסמה?").
2.  Supabase sends an email with a redirect link to the application.
3.  The application routes the user to the Reset Password page (`/reset-password`).
4.  User sets a new password.

### Accessibility
-   **Widget:** An accessibility widget can be enabled via `VITE_A11Y_WIDGET_ENABLED=true`.
-   **Password Toggle:** All password fields include an accessible show/hide toggle.
-   **Forms:** Inputs are properly labeled for screen readers.

### Testing
- **Server:** Jest + Supertest (see `/server` package scripts) for unit/integration coverage of controllers, services, and middleware.
- **Client:** Vitest + React Testing Library.

**Running Server Tests:**
```bash
cd server
npm test             # all tests
npm run test:unit    # unit only
npm run test:integration  # integration only
```

**Running Client Tests:**
```bash
cd client
npm test
```

### Logging
A structured logging service is implemented for the client (`logger.ts`) to handle errors and important events securely (masking sensitive data). Server-side logging uses Pino.
