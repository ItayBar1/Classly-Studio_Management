# Classly - AI Development Context (GEMINI.md)

## 🎯 Project Overview
Classly is a multi-tenant studio management platform built for the Israeli market. It manages courses, enrollments, and payments with role-based access for Admins, Instructors, and Students.

## 🛠 Tech Stack Summary
- **Backend:** Node.js (v20+), Express.js, TypeScript.
- **Frontend:** React 19, Vite, TypeScript, Material-UI (MUI), Tailwind CSS.
- **Database:** Supabase (PostgreSQL) with Row-Level Security (RLS).
- **Payments:** Stripe Payment Intents API + Webhooks.
- **Logging:** Pino.

## 📂 Project Structure Reference
- `/server/src/controllers`: Request handling and status code management.
- `/server/src/services`: Core business logic (e.g., enrollment validation, payment processing).
- `/server/src/repositories`: Database abstraction and direct Supabase calls.
- `/server/src/middleware`: Auth validation and `requireRole` checks.
- `/client/src/components/[role]`: UI restricted by user role.
- `/client/src/services/api.ts`: Centralized Axios instance for backend communication.

## 🔐 Security & RBAC Protocols
1. **RLS Awareness:** All database interactions must respect PostgreSQL RLS policies.
2. **Mandatory Filtering:** Every query must filter by `studio_id` from the authenticated user context to prevent cross-tenant data leaks.
3. **Role Gating:**
   - **ADMIN:** Access to all studio-wide data.
   - **INSTRUCTOR:** Access only to their assigned classes and students.
   - **STUDENT:** Access only to their own enrollments, attendance, and payments.

## 💡 Development Standards
- **Clean Code:** Use TypeScript interfaces; avoid `any`.
- **Soft Deletes:** Use `is_active = false` or `status` flags for courses and users; do not use `DELETE`.
- **Payment Integrity:** Enrollment activation must only happen via Stripe Webhook confirmation.
- **Error Handling:** Use the centralized error middleware and the `pino` logger.

## 🇮🇱 Localization & Preferences
- **Currency:** ILS (₪).
- **Timezone:** `Asia/Jerusalem`.
- **Formatting:** Render numbers and math LTR.
- **Dashes:** Avoid em/en dashes in strings or docs.

## 🚫 Key Constraints
- Do not add new dependencies without checking if Supabase or Stripe SDKs already provide the functionality.
- Prioritize Hebrew context for UI/Product discussions while keeping code and comments in English.