# Classly - Product Requirements Document (PRD)
## Full Supabase Stack Edition

**Project Name:** Classly  
**Project Date:** December 7, 2025  
**Version:** 2.0 (Supabase Edition)  
**Status:** Final  

---

## Executive Summary

Classly is a comprehensive digital platform for managing classes and studios, designed to streamline administrative processes including student registration, online payments, class scheduling, attendance tracking, and financial reporting. The system serves three primary user roles: Studio Administrators, Instructors, and Students/Parents. Built on Supabase PostgreSQL for robust, scalable data management.

---

## 1. Product Overview

### 1.1 Vision
Create a unified, intuitive digital ecosystem that simplifies class and studio management while strengthening the arts and sports community in Israel through automation, transparency, and real-time coordination.

### 1.2 Mission
Eliminate manual processes, reduce administrative burden, and provide an integrated platform where administrators efficiently manage operations, instructors focus on teaching, and students enjoy a seamless registration and learning experience.

### 1.3 Problem Statement
- **Manual Processes:** Registration and payments conducted through private messages and manual systems
- **Fragmented Scheduling:** No centralized, changeable schedule system
- **Lack of Transparency:** Payment tracking opaque for both studio and instructors
- **No Digital Attendance:** Missing digital attendance management tools
- **Inefficiency:** Administrators spend excessive time on administrative tasks instead of program development

**Result:** Administrative chaos, human errors, low efficiency, and poor user experience.

---

## 2. Objectives & Goals

### 2.1 Primary Objectives
1. **Process Automation** - Automate registration, payments, scheduling, and attendance
2. **Centralization** - Unite all operations on a single platform
3. **Transparency** - Provide real-time visibility into payments and registrations for all stakeholders
4. **User Experience** - Deliver intuitive, role-specific interfaces
5. **Scalability** - Support high concurrent users during peak registration/payment periods

### 2.2 Key Performance Indicators (KPIs)
- System uptime: 99.9%
- Average page load time: < 2 seconds
- Support for 1000+ concurrent users during peak periods
- Registration completion rate: > 95%
- Payment success rate: > 98%
- User adoption rate: > 80% within first 3 months

---

## 3. Technology Stack

### 3.1 Frontend
- **Framework:** React 18+ with Next.js 14+ (TypeScript)
- **Rendering:** Server-Side Rendering (SSR) with Next.js for SEO & performance
- **Styling:** Tailwind CSS
- **UI Component Library:** Material-UI (@mui/material)
- **State Management:** Redux Toolkit (@reduxjs/toolkit)
- **Data Fetching:** TanStack React Query (@tanstack/react-query) + Supabase Client
- **Form Handling:** Formik + Yup validation
- **Animations:** Framer Motion
- **Notifications:** React Toastify
- **File Upload:** React Dropzone
- **HTTP Client:** Axios / Fetch API

### 3.2 Backend
- **Runtime:** Node.js 18+ with TypeScript
- **Backend Framework:** Next.js API Routes (serverless)
- **Database:** Supabase PostgreSQL (managed, free tier available)
- **Authentication:** Supabase Auth (OAuth + Email/Password)
- **Real-time Sync:** Supabase Realtime (WebSocket-based)
- **Payment Processing:** Transzilla API (Israeli payment gateway)
- **Storage:** Supabase Storage (file uploads, documents)
- **Deployment:** Vercel (with Next.js native support)

### 3.3 Database
- **Primary DB:** Supabase PostgreSQL (Managed, cloud-hosted)
- **Type:** Relational SQL with full ACID compliance
- **Features:**
  - Real-time subscriptions via WebSocket
  - Row-Level Security (RLS) policies
  - Full-text search support
  - Built-in authentication integration
  - Automatic backups and point-in-time recovery
  - PostGIS for geospatial queries (future)

### 3.4 Infrastructure & DevOps
- **Hosting:** Vercel (Next.js) + Supabase Cloud (PostgreSQL)
- **CDN:** Vercel Edge Network
- **Monitoring:** Vercel Analytics + Supabase Logs + Sentry
- **CI/CD:** GitHub Actions → Vercel automatic deployment
- **Database Migrations:** Supabase CLI + Knex.js
- **Environment Management:** .env.local, .env.production
- **Version Control:** Git + GitHub

### 3.5 External Integrations
| Service | Purpose | Integration Type |
|---------|---------|------------------|
| **Supabase Auth** | User authentication, JWT tokens, RBAC | OAuth, Email/Password, Session management |
| **Supabase PostgreSQL** | Relational data storage, real-time | SQL, REST API, WebSocket |
| **Supabase Storage** | File uploads, documents, certificates | REST API, Signed URLs |
| **Transzilla** | Payment processing, invoices | REST API, Webhooks |
| **SendGrid/Resend** | Email notifications, receipts | REST API, Email service |

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer (Browser/Mobile)            │
│                      React + Next.js + TypeScript                │
│  (Components, Pages, Services, State Management via Redux)      │
└────────────────────────────┬──────────────────────────────────────┘
                             │ HTTPS
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
    ┌─────────────┐   ┌──────────────┐   ┌─────────────┐
    │ Supabase    │   │ Next.js API  │   │  Transzilla │
    │ Auth        │   │ Routes       │   │  Payments   │
    └─────────────┘   └──────┬───────┘   └─────────────┘
                             │
                    ┌────────┴────────┐
                    │ Supabase        │
                    │ PostgreSQL      │
                    │ (Real-time RLS) │
                    └─────────────────┘
                             │
                    ┌────────┴────────┐
                    │ Supabase        │
                    │ Storage         │
                    │ (Files/Docs)    │
                    └─────────────────┘
```

### 4.2 Architectural Principles
1. **Serverless-First:** No server management with Vercel + Supabase
2. **Real-time Data Sync:** Supabase Realtime subscriptions for live updates
3. **Row-Level Security:** PostgreSQL RLS policies for data isolation
4. **API-First:** REST API via Supabase + custom Next.js endpoints
5. **Security-By-Default:** HTTPS, JWT auth, RLS, encryption at rest

### 4.3 Deployment Pipeline
```
Code Push → GitHub → GitHub Actions → Vercel Build → Edge CDN → Production
                                     ↓
                            Database Migrations
                                     ↓
                            Supabase PostgreSQL
```

---

## 5. Database Schema (PostgreSQL/SQL)

### 5.1 SQL Table Definitions

#### 5.1.1 Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  phone_number VARCHAR(20),
  profile_image_url TEXT,
  role VARCHAR(20) CHECK (role IN ('ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT')),
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')) DEFAULT 'ACTIVE',
  last_login_at TIMESTAMP,
  login_count INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_studio_id ON users(studio_id);
CREATE INDEX idx_users_role ON users(role);
```

#### 5.1.2 Studios Table
```sql
CREATE TABLE studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  admin_id UUID NOT NULL REFERENCES users(id),
  address VARCHAR(255),
  city VARCHAR(100),
  coordinates POINT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  website_url TEXT,
  bank_account_holder VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_code VARCHAR(10),
  cancellation_deadline_hours INTEGER DEFAULT 24,
  refund_percentage DECIMAL(5, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_studios_admin_id ON studios(admin_id);
CREATE INDEX idx_studios_city ON studios(city);
```

#### 5.1.3 Categories Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  type VARCHAR(20) CHECK (type IN ('ARTS', 'SPORTS', 'WELLNESS', 'ACADEMIC')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_studio_id ON categories(studio_id);
CREATE INDEX idx_categories_type ON categories(type);
```

#### 5.1.4 Classes Table
```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  instructor_id UUID NOT NULL REFERENCES users(id),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Asia/Jerusalem',
  location_room VARCHAR(100),
  location_building VARCHAR(100),
  max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
  current_enrollment INTEGER DEFAULT 0,
  age_range_min INTEGER,
  age_range_max INTEGER,
  level VARCHAR(20) CHECK (level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS')),
  price_ils DECIMAL(10, 2) NOT NULL CHECK (price_ils >= 0),
  billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('MONTHLY', 'SEMESTER', 'YEARLY')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_classes_studio_id ON classes(studio_id);
CREATE INDEX idx_classes_category_id ON classes(category_id);
CREATE INDEX idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX idx_classes_day_time ON classes(day_of_week, start_time);
```

#### 5.1.5 Enrollments Table
```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  enrollment_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')) DEFAULT 'ACTIVE',
  payment_status VARCHAR(20) CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE')) DEFAULT 'PENDING',
  total_amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_payment_status ON enrollments(payment_status);
CREATE UNIQUE INDEX idx_enrollments_unique ON enrollments(student_id, class_id, start_date);
```

#### 5.1.6 Attendance Table
```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES users(id),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES users(id),
  session_date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('PRESENT', 'ABSENT', 'EXCUSED', 'LATE')) DEFAULT 'ABSENT',
  notes TEXT,
  recorded_at TIMESTAMP DEFAULT NOW(),
  recorded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_class_id ON attendance(class_id);
CREATE INDEX idx_attendance_session_date ON attendance(session_date);
CREATE UNIQUE INDEX idx_attendance_unique ON attendance(enrollment_id, session_date);
```

#### 5.1.7 Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES users(id),
  instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount_ils DECIMAL(10, 2) NOT NULL CHECK (amount_ils > 0),
  currency VARCHAR(3) DEFAULT 'ILS',
  payment_method VARCHAR(50) CHECK (payment_method IN ('CREDIT_CARD', 'BANK_TRANSFER', 'CHECK', 'CASH')),
  transzilla_transaction_id VARCHAR(100),
  status VARCHAR(20) CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')) DEFAULT 'PENDING',
  invoice_number VARCHAR(50),
  invoice_url TEXT,
  due_date DATE NOT NULL,
  paid_date TIMESTAMP,
  refund_date TIMESTAMP,
  refund_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_enrollment_id ON payments(enrollment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paid_date ON payments(paid_date);
```

#### 5.1.8 InstructorCommissions Table
```sql
CREATE TABLE instructor_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES users(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  commission_percentage DECIMAL(5, 2),
  commission_fixed DECIMAL(10, 2),
  billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('PER_SESSION', 'MONTHLY', 'QUARTERLY')),
  payment_status VARCHAR(20) CHECK (payment_status IN ('PENDING', 'PAID', 'OVERDUE')) DEFAULT 'PENDING',
  total_earned DECIMAL(10, 2) DEFAULT 0,
  total_paid DECIMAL(10, 2) DEFAULT 0,
  last_payment_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_instructor_commissions_instructor_id ON instructor_commissions(instructor_id);
CREATE INDEX idx_instructor_commissions_class_id ON instructor_commissions(class_id);
```

#### 5.1.9 Schedule (TimeSlots) Table
```sql
CREATE TABLE schedule_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_room VARCHAR(100),
  capacity INTEGER,
  enrollment_count INTEGER DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('SCHEDULED', 'CANCELLED', 'COMPLETED', 'RESCHEDULED')) DEFAULT 'SCHEDULED',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_schedule_class_id ON schedule_sessions(class_id);
CREATE INDEX idx_schedule_session_date ON schedule_sessions(session_date);
CREATE UNIQUE INDEX idx_schedule_unique ON schedule_sessions(class_id, session_date);
```

#### 5.1.10 Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  type VARCHAR(50) CHECK (type IN ('SCHEDULE_CHANGE', 'PAYMENT_DUE', 'ENROLLMENT_CONFIRMED', 'SYSTEM')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

#### 5.1.11 Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_studio_id ON audit_logs(studio_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### 5.2 Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Admins can view all users in their studio
CREATE POLICY "Admins can view studio users"
ON users FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  AND studio_id = (SELECT studio_id FROM users WHERE id = auth.uid())
);

-- Students can only view classes in their studio
CREATE POLICY "Students can view active classes"
ON classes FOR SELECT
USING (
  is_active = true
  AND studio_id = (SELECT studio_id FROM users WHERE id = auth.uid())
);

-- Instructors can view their own classes
CREATE POLICY "Instructors can view own classes"
ON classes FOR SELECT
USING (
  instructor_id = auth.uid()
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
);

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
ON enrollments FOR SELECT
USING (
  student_id = auth.uid()
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  OR instructor_id = (SELECT id FROM users WHERE id = auth.uid())
);

-- Instructors can view attendance for their classes
CREATE POLICY "Instructors can view class attendance"
ON attendance FOR SELECT
USING (
  class_id IN (SELECT id FROM classes WHERE instructor_id = auth.uid())
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
);
```

### 5.3 Indexes & Query Optimization

```sql
-- Compound indexes for common queries
CREATE INDEX idx_classes_studio_category ON classes(studio_id, category_id, is_active);
CREATE INDEX idx_enrollments_student_status ON enrollments(student_id, status);
CREATE INDEX idx_enrollments_class_status ON enrollments(class_id, status);
CREATE INDEX idx_payments_student_status ON payments(student_id, status);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, session_date DESC);
CREATE INDEX idx_classes_search ON classes USING GIN (to_tsvector('english', name || ' ' || description));

-- Full-text search index
CREATE INDEX idx_classes_fts ON classes USING GIN (to_tsvector('english', name || ' ' || description));

-- Geospatial index (if using PostGIS)
CREATE INDEX idx_studios_location ON studios USING GIST (coordinates);
```

---

## 6. Folder Architecture & Project Structure

### 6.1 Root Directory Structure
```
classly/
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       ├── test.yml
│       └── db-migrations.yml
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_indexes.sql
│   ├── seed.sql
│   └── config.toml
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── auth/
│   │   │   ├── signin/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── callback/
│   │   │       └── page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (admin)/
│   │   │   │   ├── classes/
│   │   │   │   ├── instructors/
│   │   │   │   ├── students/
│   │   │   │   ├── payments/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   │   ├── (instructor)/
│   │   │   │   ├── schedule/
│   │   │   │   ├── attendance/
│   │   │   │   ├── earnings/
│   │   │   │   └── students/
│   │   │   └── (student)/
│   │   │       ├── my-classes/
│   │   │       ├── enroll/
│   │   │       ├── schedule/
│   │   │       └── payments/
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── callback/route.ts
│   │       │   └── logout/route.ts
│   │       ├── webhook/
│   │       │   ├── transzilla/route.ts
│   │       │   └── supabase/route.ts
│   │       ├── admin/
│   │       │   ├── classes/route.ts
│   │       │   ├── students/route.ts
│   │       │   └── payments/route.ts
│   │       ├── student/
│   │       │   ├── enroll/route.ts
│   │       │   └── classes/route.ts
│   │       └── instructor/
│   │           ├── attendance/route.ts
│   │           └── earnings/route.ts
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── Modal.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── admin/
│   │   │   ├── ClassManagement.tsx
│   │   │   ├── StudentManagement.tsx
│   │   │   ├── PaymentManagement.tsx
│   │   │   ├── ReportsPanel.tsx
│   │   │   └── AnalyticsDashboard.tsx
│   │   ├── instructor/
│   │   │   ├── AttendanceSheet.tsx
│   │   │   ├── ClassSchedule.tsx
│   │   │   └── EarningsReport.tsx
│   │   ├── student/
│   │   │   ├── ClassBrowser.tsx
│   │   │   ├── EnrollmentForm.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   └── MySchedule.tsx
│   │   └── forms/
│   │       ├── ClassForm.tsx
│   │       ├── EnrollmentForm.tsx
│   │       ├── PaymentForm.tsx
│   │       └── ValidationSchemas.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useClasses.ts
│   │   ├── useEnrollments.ts
│   │   ├── usePayments.ts
│   │   ├── useAttendance.ts
│   │   ├── useNotifications.ts
│   │   ├── useSupabase.ts
│   │   └── useUser.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── admin.ts
│   │   │   ├── queries.ts
│   │   │   └── subscriptions.ts
│   │   ├── auth/
│   │   │   ├── supabaseAuth.ts
│   │   │   └── session.ts
│   │   ├── payment/
│   │   │   ├── transzilla.ts
│   │   │   └── invoice.ts
│   │   ├── notifications/
│   │   │   ├── email.ts
│   │   │   └── realtime.ts
│   │   └── analytics/
│   │       └── tracking.ts
│   ├── store/
│   │   ├── store.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── userSlice.ts
│   │   │   ├── classesSlice.ts
│   │   │   ├── enrollmentSlice.ts
│   │   │   ├── uiSlice.ts
│   │   │   └── notificationSlice.ts
│   │   └── middleware/
│   │       └── authMiddleware.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── class.ts
│   │   ├── enrollment.ts
│   │   ├── payment.ts
│   │   ├── attendance.ts
│   │   ├── database.ts
│   │   └── api.ts
│   ├── utils/
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   ├── dateHelpers.ts
│   │   ├── errorHandling.ts
│   │   └── constants.ts
│   ├── middleware.ts
│   └── env.ts
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   └── SUPABASE.md
├── .env.local
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

### 6.2 Component Layer Architecture

```
src/components/
├── common/                 # Shared across all roles
│   ├── Navbar/
│   │   ├── Navbar.tsx
│   │   ├── Navbar.module.css
│   │   └── NavbarUser.tsx
│   ├── Sidebar/
│   │   ├── Sidebar.tsx
│   │   └── SidebarItem.tsx
│   └── ...
├── admin/                  # Admin-only components
│   ├── dashboards/
│   ├── modals/
│   └── tables/
├── instructor/             # Instructor-only
│   ├── attendance/
│   ├── schedule/
│   └── earnings/
├── student/                # Student-only
│   ├── browsing/
│   ├── enrollment/
│   └── registration/
└── forms/                  # Reusable forms
    ├── ClassForm/
    ├── PaymentForm/
    └── ...
```

### 6.3 Services Layer Architecture

```
src/services/
├── api/
│   ├── endpoints.ts        # API URLs
│   ├── client.ts           # Axios instance
│   └── middleware.ts       # Request/response interceptors
├── supabase/
│   ├── client.ts           # Supabase client setup
│   ├── admin.ts            # Admin client with service role
│   ├── queries.ts          # Reusable SQL queries
│   ├── subscriptions.ts    # Real-time subscriptions
│   └── rls.ts              # RLS policy helpers
├── auth/
│   ├── supabaseAuth.ts     # Supabase Auth integration
│   └── session.ts          # Session management
├── payment/
│   ├── transzilla.ts       # Payment gateway
│   └── invoice.ts          # Invoice generation
├── notifications/
│   ├── email.ts
│   └── realtime.ts         # Real-time updates via WebSocket
└── analytics/
    └── tracking.ts         # Analytics events
```

### 6.4 Database Migration Structure

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql       # All tables
│   ├── 002_rls_policies.sql         # Row-level security
│   ├── 003_indexes.sql              # Performance indexes
│   ├── 004_functions.sql            # PL/pgSQL functions
│   └── 005_triggers.sql             # Automatic update_at triggers
├── seed.sql                          # Seed data for development
└── config.toml                       # Supabase CLI config
```

---

## 7. Feature Specifications

### 7.1 Authentication & Authorization

#### User Roles & Permissions
| Role | Capabilities |
|------|--------------|
| **Admin** | Full system access, user management, class creation, payment management, reports, studio settings |
| **Instructor** | View own schedule, record attendance, view earnings, manage students in their classes |
| **Student** | Browse classes, enroll, make payments, view schedule, track attendance |
| **Parent** | View child's enrollment and attendance (if applicable) |

#### Authentication Flow
1. User navigates to `/auth/signin`
2. Supabase Auth (Email/OAuth)
3. JWT token issued and stored in session
4. RLS policies enforce data access at database level
5. User redirected based on role to dashboard

#### Real-time Features
- **Live Class Updates:** WebSocket subscriptions via Supabase Realtime
- **Attendance Changes:** Instant notifications when attendance marked
- **Payment Status:** Real-time payment confirmations
- **Schedule Changes:** Push notifications for schedule updates

### 7.2 Core Features by Role

#### Admin Dashboard
- **Student Management:** CRUD operations with bulk import
- **Class Management:** Create, edit, delete, schedule with conflict detection
- **Payment Management:** View payments, generate invoices, send reminders
- **Instructor Management:** Manage instructors, commissions, earnings tracking
- **Reports:** Attendance, revenue, enrollment trends with export to CSV
- **Studio Settings:** Studio info, policies, payment methods, team management

#### Instructor Portal
- **Schedule:** View personal class schedule with real-time updates via Realtime subscriptions
- **Attendance:** Mark attendance with bulk operations, notes, excuses
- **Student Roster:** View enrolled students, contact info, attendance history
- **Earnings:** Track commissions, payment history, monthly statements
- **Notifications:** Real-time updates on schedule changes and student updates

#### Student Dashboard
- **Browse Classes:** Filter by category, level, schedule, instructor ratings
- **Smart Enrollment Algorithm:** AI-powered class recommendations
- **Enroll & Pay:** Streamlined enrollment with integrated Transzilla payment
- **My Schedule:** Personal timetable, class details, location info, reminders
- **Attendance:** View attendance record with historical data
- **Notifications:** Schedule changes, payment reminders, enrollment confirmations

### 7.3 Smart Enrollment Algorithm

**Goal:** Recommend optimal class combinations based on preferences

**Algorithm Components:**
1. **Input:** Student preferences (days, times, level, location, distance tolerance)
2. **Filtering:** Remove schedule conflicts via SQL window functions
3. **Scoring:** Rank by compatibility score using PostgreSQL:
   - Time convenience (preferred times)
   - Distance/location preference
   - Level match
   - Capacity availability
   - Instructor quality/reviews
4. **Output:** Top 3-5 recommended course combinations

**Implementation:**
```typescript
// SQL Query for recommendations
const recommendedClasses = await supabase
  .from('classes')
  .select('*, categories(*), users(*)')
  .eq('studio_id', studioId)
  .eq('is_active', true)
  .gt('max_capacity', 'current_enrollment')
  .order('score', { ascending: false })
  .limit(5);
```

---

## 8. Security Requirements

### 8.1 Authentication & Authorization
- **JWT Tokens:** Supabase Auth with secure JWT tokens
- **RBAC:** Role-Based Access Control via database RLS policies
- **Session Management:** 24-hour token expiration with refresh mechanism
- **Multi-factor Auth:** Optional for admin accounts via Supabase MFA

### 8.2 Data Protection
- **HTTPS Only:** All data transmitted encrypted (TLS 1.3+)
- **Database Encryption:** Supabase PostgreSQL encrypted at rest
- **PCI Compliance:** Transzilla handles payment PCI compliance
- **RLS Policies:** Row-level security enforces data isolation
- **Data Privacy:** GDPR/Israeli privacy law compliance
- **Audit Logs:** All admin actions logged in audit_logs table

### 8.3 API Security
- **CORS:** Whitelist specific domains in middleware
- **Rate Limiting:** 100 requests/minute per user via middleware
- **Input Validation:** Parameterized SQL queries prevent injection
- **Output Encoding:** HTML entities encoded to prevent XSS
- **CSRF Protection:** SameSite cookie flags

### 8.4 Supabase-Specific Security
- **RLS Policies:** Enforce access control at database level
- **Service Role Key:** Used only on server for admin operations
- **Anon Key:** Used by client with RLS policies
- **API Gateway:** Supabase handles authentication and throttling

---

## 9. API Endpoints

### 9.1 Authentication Endpoints
```
POST   /api/auth/callback          - Supabase callback handler
GET    /api/auth/logout            - Logout user (clear session)
GET    /api/auth/user              - Get current user from session
POST   /api/auth/refresh           - Refresh JWT token
```

### 9.2 Admin Endpoints
```
GET    /api/admin/dashboard        - Dashboard stats (aggregated queries)
GET    /api/admin/classes          - List all classes with filters
POST   /api/admin/classes          - Create class
PATCH  /api/admin/classes/:id      - Update class
DELETE /api/admin/classes/:id      - Delete class (soft delete)

GET    /api/admin/students         - List students with pagination
POST   /api/admin/students         - Add student (bulk import)
PATCH  /api/admin/students/:id     - Update student
DELETE /api/admin/students/:id     - Delete student (soft delete)

GET    /api/admin/payments         - Payment history with filters
GET    /api/admin/reports/revenue  - Revenue report (time-series)
GET    /api/admin/reports/attendance - Attendance report (filtered)
POST   /api/admin/reports/export   - Export reports to CSV
```

### 9.3 Student Endpoints
```
GET    /api/student/classes        - Browse available classes (RLS filtered)
GET    /api/student/classes/:id    - Get class details
GET    /api/student/schedule       - Personal schedule (via RLS)
POST   /api/student/enroll         - Enroll in class (transaction)
GET    /api/student/enrollments    - My enrollments (RLS filtered)
POST   /api/student/payments       - Initiate Transzilla payment
GET    /api/student/attendance     - Attendance record (RLS filtered)
```

### 9.4 Instructor Endpoints
```
GET    /api/instructor/schedule    - My schedule (RLS filtered)
POST   /api/instructor/attendance  - Record attendance (bulk)
GET    /api/instructor/students    - Class roster (RLS filtered)
GET    /api/instructor/earnings    - Commission/earnings breakdown
POST   /api/instructor/reports     - Generate personal reports
```

### 9.5 External Webhooks
```
POST   /api/webhook/transzilla     - Payment confirmations (verify signature)
POST   /api/webhook/supabase       - Database change events (if using)
```

---

## 10. Testing Strategy

### 10.1 Unit Tests
- **Framework:** Jest + Vitest
- **Coverage Target:** > 80%
- **Focus Areas:**
  - Validation functions
  - Algorithms (smart enrollment)
  - Utility helpers
  - Redux slices
  - Database query builders

### 10.2 Integration Tests
- **Framework:** Jest + React Testing Library
- **Test Cases:**
  - User authentication flow (Supabase Auth)
  - Class enrollment flow (with RLS)
  - Payment processing (with Transzilla mock)
  - Data synchronization (Realtime subscriptions)
  - RLS policy enforcement

### 10.3 End-to-End Tests
- **Framework:** Cypress / Playwright
- **Critical User Journeys:**
  - Student: Browse → Enroll → Pay (full transaction)
  - Instructor: Login → Record attendance → View earnings
  - Admin: Create class → Manage students → Generate report
  - Payment flow with Transzilla webhook verification

### 10.4 Performance Tests
- **Database:** Query performance < 500ms (test with real data)
- **API:** Response time < 2s for paginated results
- **Real-time:** WebSocket latency < 100ms
- **Concurrent:** Load test with 1000+ simultaneous users

### 10.5 Security Tests
- **RLS Policies:** Verify users can only access their own data
- **SQL Injection:** Test parameterized queries
- **XSS Prevention:** Test output encoding
- **CSRF Protection:** Verify SameSite cookies

---

## 11. Deployment & DevOps

### 11.1 Deployment Architecture
```
GitHub Repo
    ↓
GitHub Actions (CI)
    ├── Run Tests
    ├── Lint & Type Check
    ├── Build Next.js
    ├── Run Database Migrations
    └── Deploy to Vercel (CD)
         ↓
    Vercel Edge Network
         ↓
    Next.js Runtime
         ↓
    Supabase PostgreSQL + Storage
         ↓
    External APIs (Transzilla, Email)
```

### 11.2 Environment Management
```
.env.local (development - local Supabase project)
.env.production (production - Supabase Cloud)
.env.example (template)

Variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- TRANSZILLA_API_KEY
- TRANSZILLA_SECRET_KEY
- SENDGRID_API_KEY
- NEXT_PUBLIC_API_URL
```

### 11.3 Database Migrations
```bash
# Using Supabase CLI
supabase migration new initial_schema
supabase migration new add_rls_policies
supabase db push              # Deploy to cloud
supabase db pull              # Pull changes from cloud
```

### 11.4 Monitoring & Logging
- **Uptime Monitoring:** Uptime Robot
- **Error Tracking:** Sentry (client-side errors)
- **Database Logs:** Supabase Logs (query logs, RLS violations)
- **Analytics:** Vercel Analytics, custom events
- **Logs:** Vercel Logs, Supabase SQL Editor

---

## 12. Implementation Timeline

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 1: Planning & Setup** | 75 hours | Supabase project, DB schema, Architecture |
| **Phase 2: Auth & Infrastructure** | 20 hours | Supabase Auth, RLS policies, Session setup |
| **Phase 3: UI/UX Design** | 25 hours | Wireframes, Mockups, Design system |
| **Phase 4: Core Features** | 120 hours | Class mgmt, Enrollment, Smart algorithm, Payments |
| **Phase 5: User-Specific Interfaces** | 85 hours | Admin, Instructor, Student dashboards |
| **Phase 6: Testing & Launch** | 45 hours | Unit, Integration, E2E tests, Production deploy |
| **Total** | ~350 hours | Full platform ready for launch |

---

## 13. Success Metrics

### User Adoption
- 80% of target users active within first month
- 95% class enrollment completion rate
- 98% payment success rate

### Performance
- 99.9% system uptime
- < 2s average page load time
- Support 1000+ concurrent users
- Database queries < 500ms

### User Satisfaction
- Net Promoter Score (NPS) > 50
- Student satisfaction rating > 4.5/5
- Instructor satisfaction rating > 4.5/5

### Business Metrics
- Reduce admin time by 70%
- Increase payment collection efficiency by 60%
- Support up to 10 studios by end of Year 1

---

## 14. Risk Management

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Payment gateway failures | Low | High | Implement retry logic, fallback payment methods |
| Database connection issues | Low | High | Connection pooling, automatic reconnect |
| RLS policy misconfigurations | Medium | High | Comprehensive testing, policy documentation |
| Real-time sync delays | Medium | Medium | WebSocket fallback to polling, caching |
| User adoption resistance | Medium | Medium | Onboarding tutorials, customer support |
| Security vulnerabilities | Low | Critical | Regular audits, SQL injection tests, penetration testing |

---

## 15. Future Enhancements (Post-Launch)

1. **Mobile Apps:** Native iOS/Android applications (with Supabase SDK)
2. **Video Conferencing:** Zoom/Google Meet integration for online classes
3. **Parent Portal:** Extended features for parents with separate RLS policies
4. **Waitlist Management:** Automated waitlist and cancellation handling
5. **Advanced Analytics:** Machine learning-based insights with Python functions
6. **Multi-Language:** Hebrew, English, Arabic support with i18n
7. **Geospatial Search:** Find classes by proximity using PostGIS
8. **Community Features:** Student forums, instructor profiles, reviews
9. **Marketplace:** Connect freelance instructors with students
10. **Integration Marketplace:** Third-party app ecosystem with Supabase Functions

---

## 16. Glossary

| Term | Definition |
|------|-----------|
| **Class** | A course offered by the studio (e.g., "Advanced Yoga") |
| **Enrollment** | A student's registration for a specific class |
| **Session** | One instance of a recurring class (e.g., "Yoga on Dec 15") |
| **Attendance** | Record of student presence at a class session |
| **Commission** | Payment to instructor based on sessions taught or revenue |
| **RLS** | Row-Level Security - database-level access control |
| **JWT** | JSON Web Token - stateless authentication |
| **RBAC** | Role-Based Access Control |
| **Supabase** | Open-source PostgreSQL platform with Auth, Storage, Realtime |
| **Transzilla** | Israeli payment gateway for processing card payments |

---

## Appendix A: Database Schema Diagram (PostgreSQL)

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│ auth.users      │◄────────│ users        │────────►│ studios         │
│ (Supabase)      │  1:1    │ (profiles)   │   1:M   │ (owned by admin)│
└─────────────────┘         └──────────────┘         └────────┬────────┘
                                   ▲                          │
                                   │                    1:M   │ 1:M
                                   │                   ┌──────┴──────┐
                              1:1  │              ┌─────▼─────┐  ┌──▼──────────┐
                                   │              │ categories│  │ audit_logs  │
                                   │              └─────┬─────┘  └─────────────┘
                            ┌──────┴──────┐            │ 1:M
                            │             │            ▼
                         ┌──┴──────┐   ┌──┴──────┐ ┌─────────┐
                         │ classes │   │ schedule│ │ classes │
                         └─┬───────┘   │_session │ │(many)   │
                           │ 1:M       └─────────┘ └─────┬───┘
        ┌──────────────────┼──────────────────┐         │ 1:M
        │                  │                  │         │
        ▼                  ▼                  ▼         ▼
┌──────────────┐    ┌──────────────┐   ┌──────────────────────┐
│ instructor   │    │ category     │   │ enrollments          │
│(FK users)    │    │(FK classes)  │   │ (student → class)    │
└──────────────┘    └──────────────┘   └────────┬─────────────┘
                                                 │ 1:M
                                    ┌────────────┼───────────┐
                                    │            │           │
                                    ▼            ▼           ▼
                            ┌──────────────┐ ┌────────┐ ┌──────────────┐
                            │ payments     │ │attendance │commissions│
                            │(enrollment)  │ │(student)  │(instructor)│
                            └──────────────┘ └────────┘ └──────────────┘
```

---

## Appendix B: Sample Code Structures (Supabase)

### TypeScript Types (Generated from DB)
```typescript
// types/database.ts (auto-generated by Supabase CLI)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' | 'PARENT';
          studio_id: string | null;
          status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
          created_at: string;
          updated_at: string;
        };
      };
      classes: {
        Row: {
          id: string;
          studio_id: string;
          name: string;
          instructor_id: string;
          max_capacity: number;
          price_ils: number;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at: string;
        };
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          class_id: string;
          status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
          payment_status: 'PENDING' | 'PAID' | 'OVERDUE';
          created_at: string;
        };
      };
    };
  };
}
```

### Supabase Client Setup
```typescript
// services/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### Real-time Subscription Hook
```typescript
// hooks/useClasses.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase/client';
import type { Database } from '@/types/database';

type Class = Database['public']['Tables']['classes']['Row'];

export function useClasses(studioId: string) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    supabase
      .from('classes')
      .select('*')
      .eq('studio_id', studioId)
      .then(({ data }) => {
        setClasses(data || []);
        setLoading(false);
      });

    // Real-time subscription
    const subscription = supabase
      .channel(`classes:${studioId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'classes', filter: `studio_id=eq.${studioId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setClasses([...classes, payload.new as Class]);
          } else if (payload.eventType === 'UPDATE') {
            setClasses(classes.map(c => c.id === (payload.new as Class).id ? payload.new as Class : c));
          } else if (payload.eventType === 'DELETE') {
            setClasses(classes.filter(c => c.id !== (payload.old as Class).id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [studioId]);

  return { classes, loading };
}
```

### SQL Query with RLS
```typescript
// services/supabase/queries.ts
import { supabase } from './client';

export async function getStudentEnrollments(studentId: string) {
  // RLS automatically filters to only student's enrollments
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      classes(
        id,
        name,
        instructor_id,
        start_time,
        end_time,
        categories(name)
      ),
      payments(id, status, amount_ils)
    `)
    .eq('student_id', studentId)
    .eq('status', 'ACTIVE');

  if (error) throw error;
  return data;
}
```

### API Route with RLS
```typescript
// app/api/student/enrollments/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // RLS policy enforces student_id = session.user.id
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('student_id', session.user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
```

---

## Appendix C: Supabase CLI Commands

```bash
# Initialize project
supabase init

# Create local dev environment
supabase start

# Create migration
supabase migration new create_users_table

# Apply migrations locally
supabase db reset

# Push to production
supabase db push

# Generate TypeScript types
supabase gen types typescript --project-id your-project-id > types/database.ts

# Pull schema from cloud
supabase db pull

# Seed development data
supabase db seed seed.sql
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 7, 2025 | Dev Team | Initial PRD (Convex) |
| 2.0 | Dec 15, 2025 | Dev Team | Full Supabase PostgreSQL edition |

---

**Document Status:** APPROVED  
**Last Updated:** December 15, 2025  
**Next Review:** March 2026  

---
