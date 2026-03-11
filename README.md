# Classly - Studio Management

Classly is a comprehensive full-stack platform designed to streamline operations for fitness and wellness studios. It provides an all-in-one centralized dashboard for handling classes, enrollments, user management, advanced analytics, and automated billing. The system is built with a robust REST API and a highly responsive React 19 frontend that seamlessly adapts to different user roles: Admin, Instructor, and Student.

## 🚀 Key Features and Enhancements
- **Dynamic Role-Based Architecture:** Specialized workflows and gated features based on the logged-in user's role (Admin, Instructor, Student).
- **Streamlined Studio Management:** Manage course catalogs, weekly schedules, real-time class enrollments, and daily attendance records end-to-end.
- **Secure Payment Processing:** Fully integrated Stripe Elements in the frontend communicating securely with Stripe SDK in the backend for processing self-checkout purchases and subscriptions.
- **Automated Communication:** Custom Nodemailer integration for operations like automated transactional emails and secure password reset routing.
- **Advanced State & Theme Management:** Equipped with Dark/Light mode capabilities built seamlessly throughout all user dashboards to ensure a premium UI/UX.

## 🛠 Tech Stack

### Frontend (Client-Side)
- **Framework:** React 19 with Vite (blazing-fast build tool)
- **Language:** TypeScript for type-safe components
- **Styling:** Tailwind CSS & custom CSS for modern, fully responsive UI and dynamic themes (Dark/Light Modes)
- **Data Visualization & Icons:** Recharts for admin analytics and Lucide React for consistent, crisp SVG iconography
- **Integrations:** Axios for API requests, Supabase JS Client for seamless file & storage syncing, and Stripe Elements for secure checkout handling.

### Backend (Server-Side)
- **Core API Layer:** Node.js, Express, and TypeScript
- **Database & Active ORM:** PostgreSQL 18 integrated seamlessly via Prisma ORM for efficient querying, relation management, and migrations.
- **Authentication & Security:** Custom JWT (JSON Web Tokens) with bcryptjs handling user sessions. Hardened API through Helmet, Express-Rate-Limit, and strict CORS configuration.
- **Utility & Ecosystem:** Pino (structured logging logging layer), Nodemailer (mailing services), and Stripe SDK server interactions.

### Infrastructure & DevOps
- **Containerization:** Fully dockerized ecosystem powered by Docker and Docker Compose for predictable builds and parity across environments.
- **CI/CD Pipeline:** Fully automated deployments utilizing GitHub Actions with custom self-hosted runners.
- **Database Persistence:** Utilizing Docker volumes securely mapped to the Postgres 18 service.

---

## 🏗 System Architecture & Docker Ecosystem

The platform relies on a robust `docker-compose.yml` configuration orchestrating the services autonomously. Here is the structure and behavior:
- **`db` (Postgres 18):** Relational database utilizing a persistent named volume (`postgres_data`) for data retention. Initialized seamlessly via `studio_management_schema_setup.sql`.
- **`backend` (Express API):** The Node.js application container mapping locally to port 5000 serving as the platform workhorse.
- **`backend-tools`:** Abstracted transient build/target environment for isolated task-running (e.g., schema linting, Prisma migrations).
- **`frontend` (React + Vite):** High-performance production client bundled successfully and mapping locally to port 80.

---

## ⚙️ Automated CI/CD Deployment Flow (GitHub Actions)

We utilize a robust workflow defined in `github/workflows/deploy.yml` that drastically shortens our release cycles and ensures safe delivery. 

**Whenever new code is pushed directly to the `main` branch:**
1. **Runner Trigger:** The GitHub Action pipeline is fired autonomously on our **self-hosted runner**.
2. **Environment Variable Provisioning:** Essential secrets (API credentials, Stripe tokens, Database connection strings) securely stored inside GitHub Secrets are seamlessly injected into the server instance. This dynamically reconstructs the required `.env`, `server/.env`, and `client/.env` credentials.
3. **Application Build & Launch:** The action triggers `docker compose --project-name classly-studio up -d --build`. This intelligently compiles all changed services and restarts only the necessary production docker containers, keeping downtime strictly minimized.
4. **Maintenance & Cleanup:** An automated `docker image prune -f` prevents standard persistent runners from hoarding unused gigabytes of redundant container fragments, preserving optimal server disk capacity.

---

## 📡 API Documentation & Routing Constraints

All backend paths are prefixed with `/api`. Global routing embraces the internal `authenticateUser` logic and role-guard middleware utilizing specialized `requireRole(ROLE)` validators.

| Endpoint Target | Method | Description | Role / Auth Requirement |
| --- | --- | --- | --- |
| `/api/health` | `GET` | Perform routine system health & uptime checks. | Public |
| `/api/courses` | `GET` / `POST` | Retrieve existing class directory or launch new courses. | Auth (`ADMIN` / `INSTRUCTOR`) |
| `/api/courses/available` | `GET` | Retrieve publicly enrollable classes for self-registration. | Auth (`STUDENT`) |
| `/api/courses/:id` | `PATCH` / `DELETE`| Modify course properties or cleanly soft-delete unused listings. | Auth (`ADMIN`) |
| `/api/students` | `GET` | Granular pagination retrieving global studio active accounts. | Auth (`ADMIN`) |
| `/api/dashboard/admin` | `GET` | Request structured time-series data populating complex React views. | Auth (`ADMIN`)|
| `/api/payments/create-intent` | `POST` | Communicate with Stripe integration creating formal Payment Intents. | Auth (All logged in users) |
| `/api/webhooks/stripe` | `POST` | Asynchronous validation of Stripe signatures checking payment status. | Public (`Stripe Webhook`) |

*(Additional endpoints governing attendance, multi-instructor dynamics, authentication token management, and file uploads are structured following REST best practices).*

---

## 👩‍💻 User Experience (Role Capabilities)

### 👑 Admin
- **Global Dashboard:** Track aggregated metrics outlining historic enrollment trends and gross revenue comparisons utilizing Recharts visual representations.
- **Student Data Master:** Browse a fully paginated, searchable grid of cross-studio student profiles resolving operational conflicts instantly.
- **Timetable Configurator:** Blueprint long-term daily schedules, balancing resources inside the Studio Schedule Manager.
- **Ledger Control:** Oversee global payment history validating transactions processed across Stripe systems.

### 🏋️ Instructor
- **Dashboard Hub:** Visual tracker isolating performance, personal enrollments, and customized instructor analytics.
- **Class Rosters:** Complete visibility detailing real-time attendance rosters sorted natively by session slots.
- **Attendance Toggling:** Dynamically log explicit absent/present ratios for sessions adjusting core business logic instantaneously.

### 🎓 Student
- **Profile Hub:** Visual representation tracking completed classes against ongoing active class registrations.
- **Class Marketplace:** Intuitive interface cataloging incoming courses. Register seamlessly initiating integrated Stripe Elements checkouts bypassing manual redirects completely.

---

## 🏁 Getting Started & Local Development

### Prerequisites
- [Docker & Docker Compose](https://docs.docker.com/get-docker/) installed.
- **Node.js 20+** running bare-metal for localized package development.
- Active Stripe Account (API secret key & Webhook token) alongside any generalized keys.

### 1. Configure Environments

Create your distinct `.env` files establishing the foundational connection layer bridging React, Express, and PostgreSQL configurations seamlessly.

**`client/.env`:**
```ini
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_A11Y_WIDGET_ENABLED=true
```

**`server/.env`:**
```ini
PORT=5000
CLIENT_URL=http://localhost
DATABASE_URL=postgresql://itay:YOUR_PASSWORD@localhost:5432/classly_db
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Streamlined Docker Start
Leverage the complete docker setup natively ensuring zero dependency drift across environments:

```bash
docker compose up -d --build
```
> Web UI fires on port `80`, API proxy bounds locally to `5000`, DB actively mapped onto `5432`.

### 3. Dedicated Bare-Metal Server Run (Optional)
Prefer to code and interact directly via Express.js uncontained from Docker instances:

```bash
cd server
npm install
npm run dev
```

### 4. Database Schema Handling (Prisma)
Manage your data-modeling strictly through Prisma core utilizing commands standardizing relational DB schema checks:

```bash
cd server
npx prisma generate
npx prisma migrate dev
```

---

## 🧪 Testing and Quality Control

Comprehensive dual-faceted testing ensures deep platform reliability halting critical integration bugs.

**Backend Execution (Jest & Supertest Frameworks):**
- Execute complete Unit Logic Check: `npm run test:unit`
- Fire Mocked Services and Route Testing: `npm run test:integration`

**Frontend Executions (Vitest Testing Tooling):**
- Safely check Component and DOM structures: `npm test`