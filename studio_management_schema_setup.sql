-- התחלת טרנזקציה (אם חלק נכשל, הכל יבוטל)
BEGIN;

-- ניקוי טבלאות ישנות (מאפס את הדאטה-בייס כדי למנוע התנגשויות)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.schedule_sessions CASCADE;
DROP TABLE IF EXISTS public.instructor_commissions CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.pending_registrations CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
DROP TABLE IF EXISTS public.studios CASCADE;

-- ניקוי פונקציות ישנות
DROP FUNCTION IF EXISTS public.increment_enrollment(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.increment_enrollment_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.decrement_enrollment_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_studio_id() CASCADE;

-- הפעלת תוספים
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

----------------------------------------------------------------
-- 1. יצירת טבלאות בסיס (USERS & STUDIOS & BRANCHES)
----------------------------------------------------------------

-- יצירת טבלת STUDIOS
CREATE TABLE IF NOT EXISTS public.studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(20) UNIQUE,
  description TEXT,
  admin_id UUID NOT NULL, -- FK יוגדר בהמשך
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

-- יצירת טבלת BRANCHES
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'Main Branch',
  address VARCHAR(255),
  city VARCHAR(100),
  coordinates POINT,
  phone_number VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת PENDING_REGISTRATIONS (אבטחה: אימות studio_id לפני הרשמה)
-- טבלה זו מאחסנת studio_id מאומת לפני שהמשתמש מסיים הרשמה
-- זה מונע מהלקוח לשלוח studio_id שרירותי ב-metadata
CREATE TABLE IF NOT EXISTS public.pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  invitation_token VARCHAR(500), -- אם ההרשמה באה מהזמנה
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- אינדקס לחיפוש מהיר לפי email
CREATE INDEX IF NOT EXISTS idx_pending_registrations_email ON public.pending_registrations(email) WHERE NOT used;

-- יצירת טבלת USERS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  phone_number VARCHAR(20),
  profile_image_url TEXT,
  role VARCHAR(20) CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT')) DEFAULT 'STUDENT',
  studio_id UUID REFERENCES public.studios(id) ON DELETE SET NULL, 
  status VARCHAR(20) CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')) DEFAULT 'ACTIVE',
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- הוספת הקישור החסר (Circular Dependency) עבור admin_id בטבלת studios
ALTER TABLE public.studios
ADD CONSTRAINT fk_studios_admin
FOREIGN KEY (admin_id) REFERENCES public.users(id);

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
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
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

-- PAYMENTS (עודכן עם שדות ל-Stripe)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.users(id),
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  amount_ils DECIMAL(10, 2) NOT NULL CHECK (amount_ils > 0),
  amount_cents INTEGER, -- עבור Stripe
  currency VARCHAR(3) DEFAULT 'ILS',
  -- הוספת STRIPE לרשימת הערכים המותרים
  payment_method VARCHAR(50) CHECK (payment_method IN ('CREDIT_CARD', 'BANK_TRANSFER', 'CHECK', 'CASH', 'STRIPE')),
  transzilla_transaction_id VARCHAR(100),
  stripe_payment_intent_id VARCHAR(255), -- מזהה תשלום מ-Stripe
  stripe_charge_id VARCHAR(255), -- מזהה חיוב סופי מ-Stripe
  status VARCHAR(20) CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'SUCCEEDED')) DEFAULT 'PENDING',
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
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_studio_id ON public.users(studio_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

CREATE INDEX IF NOT EXISTS idx_studios_admin_id ON public.studios(admin_id);
CREATE INDEX IF NOT EXISTS idx_studios_serial ON public.studios(serial_number);

CREATE INDEX IF NOT EXISTS idx_branches_studio_id ON public.branches(studio_id);

CREATE INDEX IF NOT EXISTS idx_categories_studio_id ON public.categories(studio_id);

CREATE INDEX IF NOT EXISTS idx_classes_studio_id ON public.classes(studio_id);
CREATE INDEX IF NOT EXISTS idx_classes_branch_id ON public.classes(branch_id);
CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON public.classes(instructor_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON public.enrollments(class_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_unique ON public.enrollments(student_id, class_id, start_date);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique ON public.attendance(enrollment_id, session_date);



----------------------------------------------------------------
-- 4. פונקציות וטריגרים
----------------------------------------------------------------

-- פונקציית עזר למניעת לולאה אינסופית ב-RLS
CREATE OR REPLACE FUNCTION public.get_my_studio_id()
RETURNS UUID 
AS $$
  SELECT studio_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- פונקציה לטיפול בנרשמים חדשים
-- SECURITY FIX: studio_id now comes from server-validated pending_registrations table
-- instead of trusting client-supplied metadata, preventing unauthorized studio access
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  validated_studio_id UUID;
  default_studio_id UUID;
  user_role VARCHAR;
  pending_reg_id UUID;
BEGIN
  -- SECURITY: Look up validated studio_id from pending_registrations table
  -- This prevents attackers from self-assigning to arbitrary studios via metadata
  SELECT id, studio_id INTO pending_reg_id, validated_studio_id
  FROM public.pending_registrations
  WHERE email = NEW.email
    AND NOT used
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- If found, mark as used to prevent reuse
  IF pending_reg_id IS NOT NULL THEN
    UPDATE public.pending_registrations
    SET used = true
    WHERE id = pending_reg_id;
  ELSE
    -- Fallback: If no pending registration exists, use the oldest studio
    -- This should rarely happen in production with proper registration flow
    SELECT id INTO default_studio_id 
    FROM public.studios 
    ORDER BY created_at ASC 
    LIMIT 1;
    validated_studio_id := default_studio_id;
  END IF;

  -- Security: Prevent users from self-assigning privileged roles via metadata
  -- Only allow STUDENT or PARENT. Everything else defaults to STUDENT.
  IF (UPPER(NEW.raw_user_meta_data->>'role') IN ('ADMIN', 'INSTRUCTOR', 'SUPER_ADMIN')) THEN
      user_role := 'STUDENT';
  ELSE
      user_role := COALESCE(UPPER(NEW.raw_user_meta_data->>'role'), 'STUDENT');
  END IF;

  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role, 
    phone_number, 
    status,
    studio_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.raw_user_meta_data->>'phone', NEW.phone),
    'ACTIVE',
    validated_studio_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- יצירת הטריגר
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- פונקציה לעדכון מונה נרשמים (עודכן שם ופרמטר)
CREATE OR REPLACE FUNCTION public.increment_enrollment_count(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.classes
  SET current_enrollment = COALESCE(current_enrollment, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

-- פונקציה להפחתת מונה נרשמים (חדש!)
CREATE OR REPLACE FUNCTION public.decrement_enrollment_count(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.classes
  SET current_enrollment = GREATEST(COALESCE(current_enrollment, 0) - 1, 0)
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

----------------------------------------------------------------
-- 5. הגדרת ROW LEVEL SECURITY (RLS)
----------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;


-- ניקוי מדיניות ישנה
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view members of their own studio" ON public.users;
DROP POLICY IF EXISTS "Admins can view studio users" ON public.users;
DROP POLICY IF EXISTS "Users can view branches of their studio" ON public.branches;
DROP POLICY IF EXISTS "Users can view active classes in their studio" ON public.classes;
DROP POLICY IF EXISTS "Students can view active classes" ON public.classes;
DROP POLICY IF EXISTS "Instructors can view own classes" ON public.classes;
DROP POLICY IF EXISTS "Users can view relevant enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "View attendance based on role" ON public.attendance;
DROP POLICY IF EXISTS "Instructors can view class attendance" ON public.attendance;

-- Users Policies
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view members of their own studio" ON public.users
FOR SELECT USING (
  studio_id = public.get_my_studio_id()
  OR id = auth.uid()
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

-- Branches Policies
CREATE POLICY "Users can view branches of their studio" ON public.branches
FOR SELECT USING (
  studio_id = public.get_my_studio_id()
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

-- Classes Policies
CREATE POLICY "Users can view active classes in their studio" ON public.classes
FOR SELECT USING (
  studio_id = public.get_my_studio_id()
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

CREATE POLICY "Admins and Instructors can insert classes" ON public.classes
FOR INSERT WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'INSTRUCTOR')
  AND studio_id = public.get_my_studio_id()
);

CREATE POLICY "Admins and Instructors can update their classes" ON public.classes
FOR UPDATE USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'INSTRUCTOR')
  AND studio_id = public.get_my_studio_id()
);


-- Enrollments Policies
CREATE POLICY "Users can view relevant enrollments" ON public.enrollments
FOR SELECT USING (
  student_id = auth.uid()
  OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'SUPER_ADMIN')
  OR class_id IN (SELECT id FROM public.classes WHERE instructor_id = auth.uid())
);

CREATE POLICY "Students can insert their own enrollments" ON public.enrollments
FOR INSERT WITH CHECK (
    student_id = auth.uid()
    AND studio_id = public.get_my_studio_id()
);

-- Attendance Policies
CREATE POLICY "View attendance based on role" ON public.attendance
FOR SELECT USING (
  -- תלמיד רואה נוכחות של עצמו
  student_id = auth.uid()
  
  -- מדריך רואה נוכחות של השיעורים שלו
  OR class_id IN (SELECT id FROM public.classes WHERE instructor_id = auth.uid())
  
  -- אדמין רואה הכל בסטודיו שלו
  OR (
      public.get_my_studio_id() IS NOT NULL 
      AND studio_id = public.get_my_studio_id() 
      AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'ADMIN'
  )
  -- סופר אדמין
  OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

-- Pending Registrations Policies
-- SECURITY: Only backend service (via SECURITY DEFINER functions) can manage this table
-- Regular authenticated users have no direct access to prevent manipulation
CREATE POLICY "Backend service can manage pending registrations" ON public.pending_registrations
FOR ALL USING (
  -- Allow access when called from SECURITY DEFINER context (handle_new_user, etc.)
  -- Block direct user access by checking if user is authenticated
  auth.uid() IS NULL OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

COMMIT;