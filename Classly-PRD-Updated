# Classly - Product Requirements Document (PRD)
## Stripe + Express.js + Supabase Stack Edition

**Project Name:** Classly  
**Project Date:** December 7, 2025  
**Version:** 3.1 (Updated with User/Course Registration & Permissions)  
**Status:** Final  

---

## Executive Summary

Classly is a comprehensive digital platform for managing classes and studios, designed to streamline administrative processes including student registration, online payments, class scheduling, attendance tracking, and financial reporting. The system serves three primary user roles: Studio Administrators, Instructors, and Students/Parents. Built on Supabase PostgreSQL for robust data management, Express.js backend for business logic, and Stripe for global payment processing with role-based permissions and access control.

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
- **Permission Confusion:** Users seeing data they shouldn't have access to
- **Complex Registration:** Payment and registration steps mixed together

**Result:** Administrative chaos, human errors, low efficiency, poor user experience, and data exposure.

---

## 2. Objectives & Goals

### 2.1 Primary Objectives
1. **Process Automation** - Automate registration, payments, scheduling, and attendance
2. **Centralization** - Unite all operations on a single platform
3. **Transparency** - Provide real-time visibility into payments and registrations for all stakeholders
4. **User Experience** - Deliver intuitive, role-specific interfaces with precise permissions
5. **Scalability** - Support high concurrent users during peak registration/payment periods
6. **Security** - Enforce strict role-based access control at database and UI levels
7. **Flexible Registration** - Allow students to browse and register for courses with integrated payment

### 2.2 Key Performance Indicators (KPIs)
- System uptime: 99.9%
- Average page load time: < 2 seconds
- Support for 1000+ concurrent users during peak periods
- Registration completion rate: > 95%
- Payment success rate: > 98%
- User adoption rate: > 80% within first 3 months
- Permission violation incidents: 0
- Registration flow completion time: < 3 minutes

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
- **Payment UI:** @stripe/react-stripe-js + @stripe/stripe-js

### 3.2 Backend
- **Runtime:** Node.js 18+ with TypeScript
- **Backend Framework:** Express.js 4.18+ (REST API server)
- **Database:** Supabase PostgreSQL (managed, free tier available)
- **Authentication:** Supabase Auth (JWT tokens + Session management)
- **Real-time Sync:** Supabase Realtime (WebSocket-based)
- **Payment Processing:** Stripe Payment Intents API (Global + ILS support)
- **Storage:** Supabase Storage (file uploads, documents)
- **Deployment Frontend:** Vercel (Next.js native support)
- **Deployment Backend:** Railway / Render (Express.js server)

### 3.3 Database
- **Primary DB:** Supabase PostgreSQL (Managed, cloud-hosted)
- **Type:** Relational SQL with full ACID compliance
- **Features:**
  - Real-time subscriptions via WebSocket
  - Row-Level Security (RLS) policies for role-based access
  - Full-text search support
  - Built-in authentication integration
  - Automatic backups and point-in-time recovery
  - PostGIS for geospatial queries (future)

### 3.4 Infrastructure & DevOps
- **Frontend Hosting:** Vercel (Next.js serverless)
- **Backend Hosting:** Railway / Render (Express.js dedicated server)
- **Database:** Supabase Cloud (PostgreSQL managed)
- **CDN:** Vercel Edge Network (frontend)
- **Monitoring:** Vercel Analytics + Sentry + Railway Logs
- **CI/CD:** GitHub Actions → Vercel (frontend) & Railway/Render (backend)
- **Database Migrations:** Supabase CLI + Knex.js
- **Environment Management:** .env.local, .env.production
- **Version Control:** Git + GitHub

### 3.5 External Integrations
| Service | Purpose | Integration Type |
|---------|---------|------------------|
| **Supabase Auth** | User authentication, JWT tokens, RBAC | OAuth, Email/Password, Session management |
| **Supabase PostgreSQL** | Relational data storage, real-time | SQL, REST API, WebSocket |
| **Supabase Storage** | File uploads, documents, certificates | REST API, Signed URLs |
| **Stripe** | Payment processing (ILS + global currencies) | Payment Intents API, Webhooks, REST |
| **SendGrid/Resend** | Email notifications, receipts, invoices | REST API, Email service |

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Client Layer (Browser/Mobile)                   │
│              React + Next.js 14+ (TypeScript)                    │
│    (Components, Pages, Services, Redux State Management)        │
│            Role-based UI rendering (Admin/Instructor/Student)   │
└───────────────────────┬──────────────────────────────────────────┘
                        │ HTTPS / REST API
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌────────────────┐ ┌──────────────┐
│ Supabase     │ │ Express.js     │ │ Stripe API   │
│ Auth (JWT)   │ │ Backend Server │ │ (Payments)   │
└──────────────┘ │ (Port 5000)    │ └──────────────┘
        │        │ • Controllers  │
        │        │ • Middleware   │
        │        │ • Services     │
        │        │ • Webhooks     │
        │        │ • RLS Enforce  │
        │        └────────┬───────┘
        │                 │
        └─────────┬───────┘
                  │ WebSocket + SQL Queries (RLS filtered)
        ┌─────────▼────────────────────┐
        │ Supabase PostgreSQL Database │
        │ • Tables (RLS enabled)       │
        │ • Row-Level Security         │
        │ • Real-time Subscriptions    │
        │ • Storage (files/docs)       │
        └──────────────────────────────┘
```

### 4.2 Architectural Principles
1. **Role-Based Access Control (RBAC):** Enforced at database (RLS) and UI levels
2. **Serverless Frontend:** Vercel + Next.js for fast deployments
3. **Dedicated Backend:** Express.js for complex business logic and webhooks
4. **Real-time Data Sync:** Supabase Realtime subscriptions for live updates
5. **Row-Level Security:** PostgreSQL RLS policies filter data by role and studio
6. **API-First Design:** REST API via Express + custom endpoints with permission checks
7. **Webhook-Driven:** Stripe webhooks for payment confirmations
8. **Security-By-Default:** HTTPS, JWT auth, RLS, webhook verification

### 4.3 Deployment Pipeline
```
Code Push → GitHub → GitHub Actions
                    ├─ Frontend → Vercel Build → Edge CDN
                    └─ Backend → Railway/Render → Express Server
                                ↓
                    Database Migrations → Supabase PostgreSQL
```

### 4.4 Express.js Backend Flow with Permissions
```
Request (Frontend) → Express Router → JWT Middleware (verify token & role)
    ↓
    ├─ Check User Role (ADMIN/INSTRUCTOR/STUDENT)
    ├─ Check Studio Access (RLS policy via Supabase)
    ├─ Permission Controller → Verify action allowed for role
    ├─ Business Logic → Execute action if authorized
    └─ Return filtered results based on RLS policies
    ↓
Response + Real-time WebSocket Updates via Supabase Realtime
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
  role VARCHAR(20) CHECK (role IN ('ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT')) NOT NULL,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE NOT NULL,
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
CREATE INDEX idx_users_studio_role ON users(studio_id, role);
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
  stripe_connect_id VARCHAR(100),
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
CREATE INDEX idx_classes_active ON classes(is_active, studio_id);
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
CREATE INDEX idx_enrollments_student_class ON enrollments(student_id, class_id);
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

#### 5.1.7 Payments Table (STRIPE INTEGRATION)
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES users(id),
  instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount_ils DECIMAL(10, 2) NOT NULL CHECK (amount_ils > 0),
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'ILS',
  payment_method VARCHAR(50) CHECK (payment_method IN ('STRIPE', 'BANK_TRANSFER', 'CHECK', 'CASH')),
  stripe_payment_intent_id VARCHAR(100),
  stripe_charge_id VARCHAR(100),
  status VARCHAR(20) CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED')) DEFAULT 'PENDING',
  invoice_number VARCHAR(50),
  invoice_url TEXT,
  due_date DATE NOT NULL,
  paid_date TIMESTAMP,
  refund_date TIMESTAMP,
  refund_amount DECIMAL(10, 2),
  refund_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_enrollment_id ON payments(enrollment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_paid_date ON payments(paid_date);
CREATE INDEX idx_payments_studio_id ON payments(studio_id);
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
  type VARCHAR(50) CHECK (type IN ('SCHEDULE_CHANGE', 'PAYMENT_DUE', 'ENROLLMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'SYSTEM')),
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

### 5.2 Row-Level Security (RLS) Policies - UPDATED FOR PERMISSIONS

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- USERS TABLE RLS
-- Admins can view all users in their studio
CREATE POLICY "Admins can view all studio users"
ON users FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  AND studio_id = (SELECT studio_id FROM users WHERE id = auth.uid())
);

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Instructors can view students in their courses
CREATE POLICY "Instructors can view course students"
ON users FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'INSTRUCTOR'
  AND role = 'STUDENT'
  AND id IN (
    SELECT student_id FROM enrollments 
    WHERE class_id IN (
      SELECT id FROM classes WHERE instructor_id = auth.uid()
    )
  )
  AND studio_id = (SELECT studio_id FROM users WHERE id = auth.uid())
);

-- Students can only view themselves
CREATE POLICY "Students can only view themselves"
ON users FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
  AND id = auth.uid()
);

-- CLASSES TABLE RLS
-- Admins can view all classes
CREATE POLICY "Admins can view all classes"
ON classes FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  AND studio_id = (SELECT studio_id FROM users WHERE id = auth.uid())
);

-- Instructors can view only their own classes
CREATE POLICY "Instructors can view own classes"
ON classes FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'INSTRUCTOR'
  AND instructor_id = auth.uid()
);

-- Students can view only active classes they can enroll in OR are enrolled in
CREATE POLICY "Students can view available classes"
ON classes FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
  AND is_active = true
  AND studio_id = (SELECT studio_id FROM users WHERE id = auth.uid())
);

-- ENROLLMENTS TABLE RLS
-- Admins can view all enrollments in their studio
CREATE POLICY "Admins can view all enrollments"
ON enrollments FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  AND studio_id = (SELECT studio_id FROM users WHERE id = auth.uid())
);

-- Instructors can view enrollments for their classes
CREATE POLICY "Instructors can view class enrollments"
ON enrollments FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'INSTRUCTOR'
  AND class_id IN (
    SELECT id FROM classes WHERE instructor_id = auth.uid()
  )
);

-- Students can view only their own enrollments
CREATE POLICY "Students can view own enrollments"
ON enrollments FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
  AND student_id = auth.uid()
);

-- PAYMENTS TABLE RLS
-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
ON payments FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  AND studio_id = (SELECT studio_id FROM users WHERE id = auth.uid())
);

-- Students can view only their own payments
CREATE POLICY "Students can view own payments"
ON payments FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
  AND student_id = auth.uid()
);

-- Instructors can view payments for their classes
CREATE POLICY "Instructors can view class payments"
ON payments FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'INSTRUCTOR'
  AND enrollment_id IN (
    SELECT id FROM enrollments 
    WHERE class_id IN (
      SELECT id FROM classes WHERE instructor_id = auth.uid()
    )
  )
);

-- ATTENDANCE TABLE RLS
-- Admins can view all attendance
CREATE POLICY "Admins can view all attendance"
ON attendance FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  AND studio_id = (SELECT studio_id FROM users WHERE id = auth.uid())
);

-- Instructors can view attendance for their classes
CREATE POLICY "Instructors can view class attendance"
ON attendance FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'INSTRUCTOR'
  AND class_id IN (
    SELECT id FROM classes WHERE instructor_id = auth.uid()
  )
);

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance"
ON attendance FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'STUDENT'
  AND student_id = auth.uid()
);
```

### 5.3 Indexes & Query Optimization

```sql
-- Compound indexes for common queries
CREATE INDEX idx_classes_studio_active ON classes(studio_id, is_active, instructor_id);
CREATE INDEX idx_enrollments_student_status ON enrollments(student_id, status);
CREATE INDEX idx_enrollments_class_status ON enrollments(class_id, status);
CREATE INDEX idx_payments_student_status ON payments(student_id, status);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, session_date DESC);
CREATE INDEX idx_classes_instructor_active ON classes(instructor_id, is_active);

-- Full-text search index
CREATE INDEX idx_classes_fts ON classes USING GIN (to_tsvector('english', name || ' ' || description));

-- Geospatial index (if using PostGIS)
CREATE INDEX idx_studios_location ON studios USING GIST (coordinates);
```

---

## 6. Feature Specifications - UPDATED

### 6.1 Role-Based Permissions & UI Display

#### Admin Dashboard
**Permissions:**
- ✅ View ALL courses in studio
- ✅ View ALL students in studio
- ✅ View ALL instructors in studio
- ✅ Create new courses
- ✅ Edit courses
- ✅ Delete courses (soft delete: set is_active = false)
- ✅ Delete students (with cascade or soft delete)
- ✅ Delete instructors (with validation)
- ✅ View all payments and enrollments
- ✅ Manage instructor commissions
- ✅ Generate reports
- ✅ Access studio settings
- ✅ Manage audit logs

**UI Display:**
- Course Management Table: ALL active + inactive courses
- Student Management Table: ALL students in studio
- Instructor Management Table: ALL instructors in studio
- Bulk action buttons: Delete course, Delete student, Delete instructor
- Payment Management: ALL payments in studio
- Reports: Studio-wide analytics and insights

#### Instructor Dashboard
**Permissions:**
- ✅ View ONLY their own courses
- ✅ View ONLY students enrolled in their courses
- ✅ Record attendance for their courses
- ✅ View earnings/commissions
- ✅ Cannot create/edit/delete courses
- ✅ Cannot view other instructors' data
- ✅ Cannot delete students
- ✅ Cannot delete courses

**UI Display:**
- Course Schedule: ONLY their courses
- Student Roster: ONLY students in their courses (with filters by course)
- Attendance Sheet: ONLY for their courses
- Earnings Report: ONLY their commissions
- NO course creation/deletion buttons
- NO instructor/student management buttons

#### Student Dashboard
**Permissions:**
- ✅ View ONLY courses they're registered for
- ✅ View classmates in their enrolled courses
- ✅ Browse available courses (active courses not yet enrolled)
- ✅ Enroll in new courses (through registration flow)
- ✅ Make payments
- ✅ View attendance record (their own)
- ✅ Cannot create/edit/delete courses
- ✅ Cannot delete students/instructors
- ✅ Cannot view all students/instructors

**UI Display:**
- My Courses: ONLY enrolled courses
- Browse Courses: Available courses with registration flow
- Class Details: Shows enrolled classmates only from their enrolled courses
- Attendance: ONLY their attendance records
- NO course management, student management, or payment management buttons (except for their own payments)

---

### 6.2 Course Management Features

#### Admin: Create/Edit Course
- Course name, description
- Category selection
- Instructor assignment
- Schedule (day, time, duration)
- Location (room, building)
- Max capacity
- Age range (optional)
- Level
- Fixed price (in ILS)
- Billing cycle

#### Admin: Delete Course
- Soft delete (set is_active = false)
- Option to reassign students to other courses or cancel with refund
- Audit log entry created

#### Instructor: View Own Courses
- Course list with schedule
- Real-time status (active, completed, scheduled)
- Attendance quick access
- Student count / Capacity indicator

---

### 6.3 Student Management & Registration

#### Admin: Student Management
- **View All Students:** Name, email, phone, status, enrollment count
- **Add Student:** Manual entry or bulk import via CSV
- **Edit Student:** Update profile, status, phone, etc.
- **Delete Student:** Soft delete or hard delete (cascade enrollments with refund option)
- **View Student Details:** All enrollments, payments, attendance history

#### Improved "Add Student" Functionality
Instead of being embedded in student list, create proper workflow:
1. **Admin clicks "Add Student to Course"** button
2. **Step 1:** Select course from course list (with capacity/enrollment info)
3. **Step 2:** Select student(s) from student list (multi-select with search)
4. **Step 3:** Confirm enrollment
5. **Success:** Student enrolled, payment status set to PENDING if course requires payment

#### Student Self-Registration (NEW)
1. **Student navigates to "Browse Courses"**
2. **Step 1: Browse Available Courses**
   - Display ALL active courses not yet enrolled in
   - Filter by category, level, instructor, schedule
   - Show course details: name, description, instructor, schedule, capacity, PRICE
   - Search functionality

3. **Step 2: Select Course**
   - Click "Register" button on course card
   - Opens modal with course details and registration form

4. **Step 3: Registration Details Modal**
   - Course name, schedule, instructor, capacity
   - Price displayed prominently (₪ format)
   - Student confirmation: "Register me for this course"
   - Button: "Proceed to Payment" or "Cancel"

5. **Step 4: Payment (Stripe Integration)**
   - Fixed price from course (database value)
   - Stripe payment form
   - "Complete Payment" button
   - Webhook updates database on success

6. **Step 5: Success Message**
   - "✓ Successfully registered for [Course Name]"
   - Confirmation sent to email
   - Student redirected to "My Courses" showing new enrollment
   - Enrollment status: ACTIVE
   - Payment status: PAID (after Stripe confirmation)

---

### 6.4 Course Registration Component (REPLACES Payment Component)

The payment component is replaced with a comprehensive course registration component:

#### Components Structure:
```
src/components/
├── registration/
│   ├── BrowseCoursesPage.tsx          # Course browser
│   │   ├── CourseList.tsx             # Grid/List of courses
│   │   ├── CourseFilters.tsx          # Category, level, instructor filters
│   │   └── CourseSearch.tsx           # Search by name
│   ├── CourseDetailModal.tsx          # Expanded course info
│   ├── RegistrationForm.tsx           # Enrollment confirmation
│   ├── StripeCheckoutModal.tsx        # Payment (Stripe)
│   └── RegistrationSuccess.tsx        # Success page
```

#### Key Features:
- **Real-time Capacity:** Show "3/20 spots available" (current_enrollment / max_capacity)
- **Course Status:** Show if course is at capacity (disable registration if full)
- **Price Display:** Course price from database in ILS (₪)
- **Instructor Info:** Name, image (if available)
- **Schedule:** Day of week + time in Hebrew timezone
- **Level & Age Range:** Filter + display criteria
- **One-Step Registration:** Select course → Confirm → Payment → Success

---

### 6.5 Backend Permission Enforcement

#### Express.js Permission Middleware
```typescript
// Middleware checks user role before allowing action
async function checkPermission(req: Request, res: Response, next: NextFunction) {
  const userId = req.user.id;
  const userRole = req.user.role;
  const action = req.method + ' ' + req.path;

  // ADMIN: All permissions
  if (userRole === 'ADMIN') {
    return next();
  }

  // INSTRUCTOR: Only own courses
  if (userRole === 'INSTRUCTOR') {
    if (action.includes('/classes/')) {
      const classId = req.params.id;
      const classData = await supabase.from('classes').select('instructor_id').eq('id', classId).single();
      if (classData.data.instructor_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }
    if (action.includes('DELETE')) {
      return res.status(403).json({ error: 'Instructors cannot delete' });
    }
  }

  // STUDENT: Only own enrollments/payments
  if (userRole === 'STUDENT') {
    if (action.includes('DELETE') || action.includes('POST /classes')) {
      return res.status(403).json({ error: 'Students cannot create/delete' });
    }
    if (action.includes('/enrollments/')) {
      const enrollmentId = req.params.id;
      const enrollment = await supabase.from('enrollments').select('student_id').eq('id', enrollmentId).single();
      if (enrollment.data.student_id !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }
  }

  next();
}
```

---

### 6.6 API Endpoints - UPDATED

#### Admin Endpoints
```
GET    /api/admin/courses           - Get ALL courses with filters
POST   /api/admin/courses           - Create course
PATCH  /api/admin/courses/:id       - Edit course
DELETE /api/admin/courses/:id       - Delete course (soft)

GET    /api/admin/students          - Get ALL students
POST   /api/admin/students          - Add student (manual or bulk)
PATCH  /api/admin/students/:id      - Edit student
DELETE /api/admin/students/:id      - Delete student

GET    /api/admin/instructors       - Get ALL instructors
DELETE /api/admin/instructors/:id   - Delete instructor

POST   /api/admin/enrollments       - Manually add student to course
DELETE /api/admin/enrollments/:id   - Remove enrollment
```

#### Instructor Endpoints
```
GET    /api/instructor/courses      - Get ONLY own courses
GET    /api/instructor/students     - Get students in own courses
POST   /api/instructor/attendance   - Record attendance
GET    /api/instructor/earnings     - Get own earnings
```

#### Student Endpoints
```
GET    /api/student/courses         - Get ONLY enrolled courses
GET    /api/student/browse-courses  - Browse available courses (not enrolled)
GET    /api/student/courses/:id     - Get course details

POST   /api/student/register        - Register for course (creates enrollment + initiates payment)
GET    /api/student/enrollments     - Get own enrollments
GET    /api/student/attendance      - Get own attendance

POST   /api/student/payment/create-intent  - Create Stripe payment intent
POST   /api/student/payment/confirm        - Confirm payment
```

#### Webhook Endpoints
```
POST   /api/webhook/stripe          - Stripe payment webhook (verify & update)
```

---

## 7. Payment Flow with Stripe - UPDATED

### 7.1 Course Registration + Payment Flow

#### Flowchart:
```
Student browses courses
    ↓
Student clicks "Register" on course
    ↓
Registration Modal opens
    ├─ Course details (name, schedule, instructor, price)
    ├─ Student confirmation button
    └─ "Proceed to Payment" button
    ↓
Frontend calls: POST /api/student/register
    ↓
Backend:
    ├─ Verify student role
    ├─ Check course availability (RLS + capacity)
    ├─ Create enrollment (PENDING status)
    ├─ Create payment record (PENDING status)
    ├─ Return Stripe client secret
    ↓
Stripe Checkout Modal opens
    ├─ Payment form
    ├─ Course price displayed
    ├─ "Complete Payment" button
    ↓
Frontend confirms payment with Stripe
    ├─ Stripe processes payment
    ├─ Returns intent status
    ↓
Stripe webhook hits backend: /api/webhook/stripe
    ├─ Verify webhook signature
    ├─ If payment_intent.succeeded:
    │   ├─ Update payment status to SUCCEEDED
    │   ├─ Update enrollment status to ACTIVE
    │   ├─ Update payment_status to PAID
    │   └─ Send confirmation email
    ↓
Frontend shows success message
    ├─ "✓ Successfully registered for [Course]"
    ├─ Confirmation code
    ├─ Button: "View My Courses"
    ↓
Student redirected to "My Courses" dashboard
    └─ New course appears in list
```

---

## 8. Database Updates for Permissions

### New Indexes
```sql
-- Optimize instructor's view of own classes
CREATE INDEX idx_classes_instructor_studio ON classes(instructor_id, studio_id, is_active);

-- Optimize student's view of enrolled courses
CREATE INDEX idx_enrollments_student_studio ON enrollments(student_id, studio_id, status);

-- Optimize course availability queries
CREATE INDEX idx_classes_active_capacity ON classes(studio_id, is_active, current_enrollment, max_capacity);
```

### New Audit Triggers
```sql
-- Trigger for enrollment creation
CREATE TRIGGER audit_enrollment_insert
AFTER INSERT ON enrollments
FOR EACH ROW
EXECUTE FUNCTION audit_log_function('INSERT', 'enrollments');

-- Trigger for course deletion
CREATE TRIGGER audit_class_delete
AFTER UPDATE ON classes
FOR EACH ROW
WHEN (NEW.is_active != OLD.is_active)
EXECUTE FUNCTION audit_log_function('SOFT_DELETE', 'classes');

-- Trigger for student deletion
CREATE TRIGGER audit_user_delete
AFTER UPDATE ON users
FOR EACH ROW
WHEN (NEW.status != OLD.status)
EXECUTE FUNCTION audit_log_function('STATUS_CHANGE', 'users');
```

---

## 9. Frontend Components - UPDATED

### 9.1 Admin Dashboard Components
```typescript
// src/app/dashboard/(admin)/page.tsx
- CourseManagementTable (ALL courses)
- StudentManagementTable (ALL students)
- InstructorManagementTable (ALL instructors)
- DeleteCourseButton
- DeleteStudentButton
- DeleteInstructorButton
- AddStudentToCourseModal

// src/components/admin/
- CourseForm.tsx (create/edit)
- StudentForm.tsx (create/edit)
- BulkStudentImport.tsx (CSV)
- DeleteConfirmationModal.tsx
```

### 9.2 Instructor Dashboard Components
```typescript
// src/app/dashboard/(instructor)/page.tsx
- MyCoursesTable (ONLY their courses)
- StudentRosterByClass (ONLY their students)
- AttendanceSheet (ONLY their courses)
- EarningsReport (ONLY their earnings)
- NO delete/create buttons visible

// src/components/instructor/
- CourseScheduleCard.tsx
- StudentRosterTable.tsx (filtered to course)
- AttendanceForm.tsx (for their courses)
```

### 9.3 Student Dashboard Components - NEW
```typescript
// src/app/dashboard/(student)/page.tsx
- MyCoursesTable (ONLY enrolled courses)
- BrowseCoursesSection (new registration flow)
- ClassmatesSection (students in enrolled courses)
- AttendanceRecordTable (student's own)
- NO admin/delete buttons visible

// src/components/student/
- BrowseCourses.tsx (NEW - main component)
  ├─ CourseList.tsx (grid/list view)
  ├─ CourseFilters.tsx (category, level, instructor)
  ├─ CourseSearch.tsx (full-text search)
  └─ CourseCard.tsx (with "Register" button)

- CourseDetailModal.tsx (NEW)
  ├─ Course info (name, description, instructor, schedule)
  ├─ Price display (₪)
  ├─ Capacity info ("3/20 spots")
  ├─ "Proceed to Payment" button

- RegistrationForm.tsx (NEW)
  ├─ Confirmation message
  ├─ Course details recap
  ├─ "Confirm Registration" button

- StripeCheckoutModal.tsx (NEW)
  ├─ Stripe payment form
  ├─ Course price
  ├─ Loading state

- RegistrationSuccess.tsx (NEW)
  ├─ Success checkmark
  ├─ Confirmation details
  ├─ "View My Courses" button
```

---

## 10. Security & Permissions Validation

### 10.1 Backend Permission Checks
All API endpoints must validate:
1. **JWT Token:** Valid and not expired
2. **User Role:** Admin/Instructor/Student
3. **Studio Access:** User belongs to same studio as resource
4. **Resource Ownership:** For instructor/student, verify ownership
5. **RLS Policy:** Database enforces additional layer

### 10.2 Frontend Permission Checks
1. **Conditional Rendering:** Hide UI elements based on role
2. **Route Protection:** Redirect unauthorized users to appropriate dashboard
3. **Button Visibility:** Delete/Create/Edit buttons only for authorized roles
4. **Form Visibility:** Only show forms users can access

### 10.3 Delete Operations
- **Admin can delete:** Courses, Students, Instructors
- **Delete method:** Soft delete (set is_active/status = false) for audit trail
- **Cascade handling:** Enrollments cascade, payments preserved for refunds
- **Audit log:** All deletes logged with user, timestamp, reason

---

## 11. Implementation Priority

### Phase 1: Core Permissions
- [ ] Update RLS policies in Supabase
- [ ] Add role checks in Express middleware
- [ ] Implement permission validator functions
- [ ] Add new database indexes

### Phase 2: Admin Features
- [ ] Course create/edit/delete with soft delete
- [ ] Student management (CRUD)
- [ ] Instructor management (CRUD)
- [ ] Improved "Add Student to Course" workflow
- [ ] Delete confirmation modals

### Phase 3: Student Registration (NEW)
- [ ] Browse courses component
- [ ] Course detail modal
- [ ] Registration form
- [ ] Stripe checkout integration
- [ ] Success page

### Phase 4: UI Refinement by Role
- [ ] Admin dashboard (all features visible)
- [ ] Instructor dashboard (own courses only)
- [ ] Student dashboard (new registration flow)
- [ ] Conditional button rendering
- [ ] Role-based route protection

### Phase 5: Testing & Deployment
- [ ] Permission testing (each role)
- [ ] Delete operation testing
- [ ] Registration flow testing
- [ ] Payment webhook testing
- [ ] Production deployment

---

## 12. Success Metrics

- ✅ Payment success rate > 98%
- ✅ Registration completion rate > 95%
- ✅ Average registration time < 3 minutes
- ✅ Permission violation incidents: 0
- ✅ Data access according to role: 100%
- ✅ Course capacity enforcement: 100%
- ✅ Delete operation audit trail: 100%
- ✅ User satisfaction > 4.5/5

---

## Glossary

| Term | Definition |
|------|-----------|
| **RBAC** | Role-Based Access Control - Admin/Instructor/Student permissions |
| **RLS** | Row-Level Security - database-level access control by role |
| **Soft Delete** | Set is_active/status = false instead of hard deleting |
| **Permission** | Authorization to perform specific action (view/edit/delete) |
| **Enrollment** | Student registration for a specific course |
| **Capacity** | Maximum students allowed in a course (current_enrollment vs max_capacity) |
| **Payment Intent** | Stripe object representing a payment transaction |
| **Webhook** | HTTP callback triggered by Stripe on payment events |

---

**Document Status:** ✅ FINAL - UPDATED  
**Last Updated:** December 16, 2025  
**Version:** 3.1 (Updated Permissions & Registration Flow)