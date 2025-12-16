-- התחלת טרנזקציה (אם חלק נכשל, הכל יבוטל)
BEGIN;

-- הפעלת תוספים
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

----------------------------------------------------------------
-- 1. יצירת טבלאות בסיס (USERS & STUDIOS)
----------------------------------------------------------------

-- יצירת טבלת USERS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  phone_number VARCHAR(20),
  profile_image_url TEXT,
  role VARCHAR(20) CHECK (role IN ('ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT')) DEFAULT 'STUDENT',
  studio_id UUID, 
  status VARCHAR(20) CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')) DEFAULT 'ACTIVE',
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- יצירת טבלת STUDIOS
CREATE TABLE IF NOT EXISTS public.studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  admin_id UUID NOT NULL REFERENCES public.users(id),
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הוספת הקישור החסר (Circular Dependency) בין users ל-studios
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS fk_users_studio;

ALTER TABLE public.users
ADD CONSTRAINT fk_users_studio
FOREIGN KEY (studio_id) REFERENCES public.studios(id) ON DELETE SET NULL;

----------------------------------------------------------------
-- 2. יצירת שאר הטבלאות
----------------------------------------------------------------

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  type VARCHAR(20) CHECK (type IN ('ARTS', 'SPORTS', 'WELLNESS', 'ACADEMIC')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLASSES
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  instructor_id UUID NOT NULL REFERENCES public.users(id),
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')) DEFAULT 'ACTIVE',
  payment_status VARCHAR(20) CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE')) DEFAULT 'PENDING',
  total_amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.users(id),
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.users(id),
  session_date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('PRESENT', 'ABSENT', 'EXCUSED', 'LATE')) DEFAULT 'ABSENT',
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.users(id),
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  amount_ils DECIMAL(10, 2) NOT NULL CHECK (amount_ils > 0),
  currency VARCHAR(3) DEFAULT 'ILS',
  payment_method VARCHAR(50) CHECK (payment_method IN ('CREDIT_CARD', 'BANK_TRANSFER', 'CHECK', 'CASH')),
  transzilla_transaction_id VARCHAR(100),
  status VARCHAR(20) CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')) DEFAULT 'PENDING',
  invoice_number VARCHAR(50),
  invoice_url TEXT,
  due_date DATE NOT NULL,
  paid_date TIMESTAMP WITH TIME ZONE,
  refund_date TIMESTAMP WITH TIME ZONE,
  refund_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INSTRUCTOR COMMISSIONS
CREATE TABLE IF NOT EXISTS public.instructor_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.users(id),
  class_id UUID NOT NULL REFERENCES public.classes(id),
  commission_percentage DECIMAL(5, 2),
  commission_fixed DECIMAL(10, 2),
  billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('PER_SESSION', 'MONTHLY', 'QUARTERLY')),
  payment_status VARCHAR(20) CHECK (payment_status IN ('PENDING', 'PAID', 'OVERDUE')) DEFAULT 'PENDING',
  total_earned DECIMAL(10, 2) DEFAULT 0,
  total_paid DECIMAL(10, 2) DEFAULT 0,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SCHEDULE SESSIONS
CREATE TABLE IF NOT EXISTS public.schedule_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location_room VARCHAR(100),
  capacity INTEGER,
  enrollment_count INTEGER DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('SCHEDULED', 'CANCELLED', 'COMPLETED', 'RESCHEDULED')) DEFAULT 'SCHEDULED',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  type VARCHAR(50) CHECK (type IN ('SCHEDULE_CHANGE', 'PAYMENT_DUE', 'ENROLLMENT_CONFIRMED', 'SYSTEM')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

----------------------------------------------------------------
-- 3. יצירת אינדקסים
----------------------------------------------------------------
-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_studio_id ON public.users(studio_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Studios
CREATE INDEX IF NOT EXISTS idx_studios_admin_id ON public.studios(admin_id);

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_studio_id ON public.categories(studio_id);

-- Classes
CREATE INDEX IF NOT EXISTS idx_classes_studio_id ON public.classes(studio_id);
CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON public.classes(instructor_id);

-- Enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON public.enrollments(class_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_unique ON public.enrollments(student_id, class_id, start_date);

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique ON public.attendance(enrollment_id, session_date);

----------------------------------------------------------------
-- 4. פונקציות וטריגרים (חשוב מאוד!)
----------------------------------------------------------------

-- פונקציה לטיפול בנרשמים חדשים (מעתיקה מ-Auth ל-Public)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'STUDENT', -- ברירת מחדל
    'ACTIVE'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- יצירת הטריגר
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- פונקציה לעדכון מונה נרשמים בטבלת השיעורים
CREATE OR REPLACE FUNCTION increment_enrollment(class_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.classes
  SET current_enrollment = COALESCE(current_enrollment, 0) + 1
  WHERE id = class_id_input;
END;
$$ LANGUAGE plpgsql;

----------------------------------------------------------------
-- 5. הגדרת ROW LEVEL SECURITY (RLS) - מתוקן
----------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

-- התיקון הקריטי: מאפשר לראות משתמשים אחרים באותו סטודיו
CREATE POLICY "Users can view members of their own studio" ON public.users
FOR SELECT USING (
  studio_id = (SELECT studio_id FROM public.users WHERE id = auth.uid())
);

-- Classes Policies
CREATE POLICY "Users can view active classes in their studio" ON public.classes
FOR SELECT USING (
  studio_id = (SELECT studio_id FROM public.users WHERE id = auth.uid())
);

-- Enrollments Policies
CREATE POLICY "Users can view relevant enrollments" ON public.enrollments
FOR SELECT USING (
  student_id = auth.uid()
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  OR class_id IN (SELECT id FROM public.classes WHERE instructor_id = auth.uid())
);

-- Attendance Policies
CREATE POLICY "Instructors can view class attendance" ON public.attendance
FOR SELECT USING (
  class_id IN (SELECT id FROM public.classes WHERE instructor_id = auth.uid())
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
);

COMMIT;