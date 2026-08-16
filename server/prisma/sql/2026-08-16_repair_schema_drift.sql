-- ============================================================================
-- Schema drift repair — safe to run repeatedly, on any environment.
--
-- WHY THIS FILE EXISTS
-- studio_management_schema_setup.sql is mounted into the db container at
-- /docker-entrypoint-initdb.d/setup.sql, so Postgres runs it ONLY when the data
-- directory is empty (a brand-new volume). Every schema change made to that
-- file after the first boot never reaches an existing database, and the repo
-- has no migrations directory. The result is drift: Prisma's models list
-- columns the live database does not have, and because Prisma names every
-- column explicitly in its SELECT/INSERT statements, a single missing column
-- makes every query against that table fail with `column ... does not exist`
-- (surfacing as HTTP 500).
--
-- Known drift this repairs:
--   * studios.schedule_start_hour / schedule_end_hour  (added 2026-06-03)
--     -> breaks GET /api/studios/my-studio and POST /api/studios on every
--        database created before that date.
--   * schedule_sessions.status CHECK missing 'IN_PROGRESS'  (added 2026-08-16)
--     -> breaks saving attendance with sessionStatus = IN_PROGRESS.
--   * enrollments.status CHECK missing 'PENDING'  (added 2026-03-11)
--   * public.studio_serial_sequence  (added 2026-03-10)
--     -> studio creation cannot generate a serial number without it.
-- Any other column the setup script has gained since is repaired as well: the
-- list below covers every column of every table.
--
-- HOW TO RUN (from the repo root on the server):
--   docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
--     < server/prisma/sql/2026-08-16_repair_schema_drift.sql
--
-- Nothing here drops data: only ADD COLUMN IF NOT EXISTS, CREATE ... IF NOT
-- EXISTS, and CHECK constraint definitions being refreshed.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Columns the live schema may be missing
-- ---------------------------------------------------------------------------
DO $repair$
DECLARE
  r       record;
  added   int := 0;
  skipped int := 0;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
    ('studios', 'name', 'VARCHAR(255)'),
    ('studios', 'serial_number', 'VARCHAR(20)'),
    ('studios', 'description', 'TEXT'),
    ('studios', 'admin_id', 'UUID'),
    ('studios', 'contact_email', 'VARCHAR(255)'),
    ('studios', 'contact_phone', 'VARCHAR(20)'),
    ('studios', 'website_url', 'TEXT'),
    ('studios', 'bank_account_holder', 'VARCHAR(255)'),
    ('studios', 'bank_account_number', 'VARCHAR(50)'),
    ('studios', 'bank_code', 'VARCHAR(10)'),
    ('studios', 'cancellation_deadline_hours', 'INTEGER DEFAULT 24'),
    ('studios', 'refund_percentage', 'DECIMAL(5, 2) DEFAULT 0'),
    ('studios', 'schedule_start_hour', 'INTEGER DEFAULT 7'),
    ('studios', 'schedule_end_hour', 'INTEGER DEFAULT 23'),
    ('studios', 'is_active', 'BOOLEAN DEFAULT true'),
    ('studios', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('studios', 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('branches', 'studio_id', 'UUID REFERENCES public.studios(id) ON DELETE CASCADE'),
    ('branches', 'name', 'VARCHAR(255) NOT NULL DEFAULT ''Main Branch'''),
    ('branches', 'address', 'VARCHAR(255)'),
    ('branches', 'city', 'VARCHAR(100)'),
    ('branches', 'coordinates', 'POINT'),
    ('branches', 'phone_number', 'VARCHAR(20)'),
    ('branches', 'is_active', 'BOOLEAN DEFAULT true'),
    ('branches', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('branches', 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('studio_rooms', 'studio_id', 'UUID REFERENCES public.studios(id) ON DELETE CASCADE'),
    ('studio_rooms', 'branch_id', 'UUID REFERENCES public.branches(id) ON DELETE CASCADE'),
    ('studio_rooms', 'name', 'VARCHAR(255)'),
    ('studio_rooms', 'capacity', 'INTEGER'),
    ('studio_rooms', 'is_active', 'BOOLEAN DEFAULT true'),
    ('studio_rooms', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('studio_rooms', 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('pending_registrations', 'email', 'VARCHAR(255)'),
    ('pending_registrations', 'studio_id', 'UUID REFERENCES public.studios(id) ON DELETE CASCADE'),
    ('pending_registrations', 'invitation_token', 'VARCHAR(500)'),
    ('pending_registrations', 'role', 'VARCHAR(20) CHECK (role IS NULL OR role IN (''ADMIN'', ''INSTRUCTOR'', ''SUPER_ADMIN''))'),
    ('pending_registrations', 'validated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('pending_registrations', 'expires_at', 'TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL ''1 hour'')'),
    ('pending_registrations', 'used', 'BOOLEAN DEFAULT false'),
    ('pending_registrations', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('users', 'email', 'VARCHAR(255)'),
    ('users', 'password_hash', 'TEXT'),
    ('users', 'full_name', 'VARCHAR(255)'),
    ('users', 'phone_number', 'VARCHAR(20)'),
    ('users', 'profile_image_url', 'TEXT'),
    ('users', 'role', 'VARCHAR(20) CHECK (role IN (''SUPER_ADMIN'', ''ADMIN'', ''INSTRUCTOR'', ''STUDENT'', ''PARENT'')) DEFAULT ''STUDENT'''),
    ('users', 'studio_id', 'UUID REFERENCES public.studios(id) ON DELETE SET NULL'),
    ('users', 'status', 'VARCHAR(20) CHECK (status IN (''ACTIVE'', ''INACTIVE'', ''SUSPENDED'')) DEFAULT ''ACTIVE'''),
    ('users', 'last_login_at', 'TIMESTAMP WITH TIME ZONE'),
    ('users', 'login_count', 'INTEGER DEFAULT 0'),
    ('users', 'preferences', 'JSONB DEFAULT ''{}''::jsonb'),
    ('users', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('users', 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('categories', 'studio_id', 'UUID REFERENCES public.studios(id) ON DELETE CASCADE'),
    ('categories', 'name', 'VARCHAR(255)'),
    ('categories', 'description', 'TEXT'),
    ('categories', 'color', 'VARCHAR(7)'),
    ('categories', 'icon', 'VARCHAR(50)'),
    ('categories', 'type', 'VARCHAR(20) CHECK (type IN (''ARTS'', ''SPORTS'', ''WELLNESS'', ''ACADEMIC''))'),
    ('categories', 'sort_order', 'INTEGER DEFAULT 0'),
    ('categories', 'is_active', 'BOOLEAN DEFAULT true'),
    ('categories', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('categories', 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('classes', 'studio_id', 'UUID REFERENCES public.studios(id) ON DELETE CASCADE'),
    ('classes', 'branch_id', 'UUID REFERENCES public.branches(id) ON DELETE SET NULL'),
    ('classes', 'category_id', 'UUID REFERENCES public.categories(id) ON DELETE SET NULL'),
    ('classes', 'name', 'VARCHAR(255)'),
    ('classes', 'description', 'TEXT'),
    ('classes', 'instructor_id', 'UUID REFERENCES public.users(id)'),
    ('classes', 'day_of_week', 'INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6)'),
    ('classes', 'start_time', 'TIME'),
    ('classes', 'end_time', 'TIME'),
    ('classes', 'timezone', 'VARCHAR(50) DEFAULT ''Asia/Jerusalem'''),
    ('classes', 'location_room', 'VARCHAR(100)'),
    ('classes', 'location_building', 'VARCHAR(100)'),
    ('classes', 'max_capacity', 'INTEGER CHECK (max_capacity > 0)'),
    ('classes', 'current_enrollment', 'INTEGER DEFAULT 0'),
    ('classes', 'age_range_min', 'INTEGER'),
    ('classes', 'age_range_max', 'INTEGER'),
    ('classes', 'level', 'VARCHAR(20) CHECK (level IN (''BEGINNER'', ''INTERMEDIATE'', ''ADVANCED'', ''ALL_LEVELS''))'),
    ('classes', 'price_ils', 'DECIMAL(10, 2) CHECK (price_ils >= 0)'),
    ('classes', 'billing_cycle', 'VARCHAR(20) CHECK (billing_cycle IN (''MONTHLY'', ''SEMESTER'', ''YEARLY''))'),
    ('classes', 'is_active', 'BOOLEAN DEFAULT true'),
    ('classes', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('classes', 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('classes', 'room_id', 'UUID REFERENCES public.studio_rooms(id) ON DELETE SET NULL'),
    ('enrollments', 'studio_id', 'UUID REFERENCES public.studios(id) ON DELETE CASCADE'),
    ('enrollments', 'student_id', 'UUID REFERENCES public.users(id) ON DELETE CASCADE'),
    ('enrollments', 'class_id', 'UUID REFERENCES public.classes(id) ON DELETE CASCADE'),
    ('enrollments', 'parent_id', 'UUID REFERENCES public.users(id) ON DELETE SET NULL'),
    ('enrollments', 'enrollment_date', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('enrollments', 'status', 'VARCHAR(20) CHECK (status IN (''ACTIVE'', ''PAUSED'', ''COMPLETED'', ''CANCELLED'', ''PENDING'')) DEFAULT ''ACTIVE'''),
    ('enrollments', 'payment_status', 'VARCHAR(20) CHECK (payment_status IN (''PENDING'', ''PAID'', ''PARTIAL'', ''OVERDUE'')) DEFAULT ''PENDING'''),
    ('enrollments', 'total_amount_due', 'DECIMAL(10, 2) NOT NULL DEFAULT 0'),
    ('enrollments', 'total_amount_paid', 'DECIMAL(10, 2) NOT NULL DEFAULT 0'),
    ('enrollments', 'start_date', 'DATE'),
    ('enrollments', 'end_date', 'DATE'),
    ('enrollments', 'cancellation_reason', 'TEXT'),
    ('enrollments', 'notes', 'TEXT'),
    ('enrollments', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('enrollments', 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('attendance', 'studio_id', 'UUID REFERENCES public.studios(id) ON DELETE CASCADE'),
    ('attendance', 'class_id', 'UUID REFERENCES public.classes(id) ON DELETE CASCADE'),
    ('attendance', 'instructor_id', 'UUID REFERENCES public.users(id)'),
    ('attendance', 'enrollment_id', 'UUID REFERENCES public.enrollments(id) ON DELETE SET NULL'),
    ('attendance', 'student_id', 'UUID REFERENCES public.users(id)'),
    ('attendance', 'session_date', 'DATE'),
    ('attendance', 'status', 'VARCHAR(20) CHECK (status IN (''PRESENT'', ''ABSENT'', ''EXCUSED'', ''LATE'')) DEFAULT ''ABSENT'''),
    ('attendance', 'notes', 'TEXT'),
    ('attendance', 'recorded_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('attendance', 'recorded_by', 'UUID REFERENCES public.users(id)'),
    ('attendance', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('attendance', 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('payments', 'studio_id', 'UUID REFERENCES public.studios(id) ON DELETE CASCADE'),
    ('payments', 'enrollment_id', 'UUID REFERENCES public.enrollments(id) ON DELETE SET NULL'),
    ('payments', 'student_id', 'UUID REFERENCES public.users(id)'),
    ('payments', 'instructor_id', 'UUID REFERENCES public.users(id) ON DELETE SET NULL'),
    ('payments', 'amount_ils', 'DECIMAL(10, 2) CHECK (amount_ils > 0)'),
    ('payments', 'amount_cents', 'INTEGER'),
    ('payments', 'currency', 'VARCHAR(3) DEFAULT ''ILS'''),
    ('payments', 'payment_method', 'VARCHAR(50) CHECK (payment_method IN (''CREDIT_CARD'', ''BANK_TRANSFER'', ''CHECK'', ''CASH'', ''STRIPE''))'),
    ('payments', 'transzilla_transaction_id', 'VARCHAR(100)'),
    ('payments', 'stripe_payment_intent_id', 'VARCHAR(255)'),
    ('payments', 'stripe_charge_id', 'VARCHAR(255)'),
    ('payments', 'status', 'VARCHAR(20) CHECK (status IN (''PENDING'', ''COMPLETED'', ''FAILED'', ''REFUNDED'', ''SUCCEEDED'')) DEFAULT ''PENDING'''),
    ('payments', 'invoice_number', 'VARCHAR(50)'),
    ('payments', 'invoice_url', 'TEXT'),
    ('payments', 'due_date', 'DATE'),
    ('payments', 'paid_date', 'TIMESTAMP WITH TIME ZONE'),
    ('payments', 'refund_date', 'TIMESTAMP WITH TIME ZONE'),
    ('payments', 'refund_reason', 'TEXT'),
    ('payments', 'notes', 'TEXT'),
    ('payments', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('payments', 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('instructor_commissions', 'studio_id', 'UUID REFERENCES public.studios(id) ON DELETE CASCADE'),
    ('instructor_commissions', 'instructor_id', 'UUID REFERENCES public.users(id)'),
    ('instructor_commissions', 'class_id', 'UUID REFERENCES public.classes(id)'),
    ('instructor_commissions', 'commission_percentage', 'DECIMAL(5, 2)'),
    ('instructor_commissions', 'commission_fixed', 'DECIMAL(10, 2)'),
    ('instructor_commissions', 'billing_cycle', 'VARCHAR(20) CHECK (billing_cycle IN (''PER_SESSION'', ''MONTHLY'', ''QUARTERLY''))'),
    ('instructor_commissions', 'payment_status', 'VARCHAR(20) CHECK (payment_status IN (''PENDING'', ''PAID'', ''OVERDUE'')) DEFAULT ''PENDING'''),
    ('instructor_commissions', 'total_earned', 'DECIMAL(10, 2) DEFAULT 0'),
    ('instructor_commissions', 'total_paid', 'DECIMAL(10, 2) DEFAULT 0'),
    ('instructor_commissions', 'last_payment_date', 'TIMESTAMP WITH TIME ZONE'),
    ('instructor_commissions', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('instructor_commissions', 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('schedule_sessions', 'studio_id', 'UUID REFERENCES public.studios(id) ON DELETE CASCADE'),
    ('schedule_sessions', 'class_id', 'UUID REFERENCES public.classes(id) ON DELETE CASCADE'),
    ('schedule_sessions', 'session_date', 'DATE'),
    ('schedule_sessions', 'start_time', 'TIME'),
    ('schedule_sessions', 'end_time', 'TIME'),
    ('schedule_sessions', 'location_room', 'VARCHAR(100)'),
    ('schedule_sessions', 'capacity', 'INTEGER'),
    ('schedule_sessions', 'enrollment_count', 'INTEGER DEFAULT 0'),
    ('schedule_sessions', 'status', 'VARCHAR(20) DEFAULT ''SCHEDULED'''),
    ('schedule_sessions', 'notes', 'TEXT'),
    ('schedule_sessions', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('schedule_sessions', 'updated_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('notifications', 'user_id', 'UUID REFERENCES public.users(id) ON DELETE CASCADE'),
    ('notifications', 'studio_id', 'UUID REFERENCES public.studios(id) ON DELETE CASCADE'),
    ('notifications', 'type', 'VARCHAR(50) CHECK (type IN (''SCHEDULE_CHANGE'', ''PAYMENT_DUE'', ''ENROLLMENT_CONFIRMED'', ''SYSTEM''))'),
    ('notifications', 'title', 'VARCHAR(255)'),
    ('notifications', 'message', 'TEXT'),
    ('notifications', 'related_entity_id', 'UUID'),
    ('notifications', 'is_read', 'BOOLEAN DEFAULT false'),
    ('notifications', 'read_at', 'TIMESTAMP WITH TIME ZONE'),
    ('notifications', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('audit_logs', 'studio_id', 'UUID REFERENCES public.studios(id) ON DELETE CASCADE'),
    ('audit_logs', 'user_id', 'UUID REFERENCES public.users(id)'),
    ('audit_logs', 'action', 'VARCHAR(100)'),
    ('audit_logs', 'table_name', 'VARCHAR(100)'),
    ('audit_logs', 'record_id', 'UUID'),
    ('audit_logs', 'changes', 'JSONB'),
    ('audit_logs', 'ip_address', 'INET'),
    ('audit_logs', 'user_agent', 'TEXT'),
    ('audit_logs', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'),
    ('password_reset_tokens', 'user_id', 'UUID REFERENCES public.users(id) ON DELETE CASCADE'),
    ('password_reset_tokens', 'token_hash', 'VARCHAR(255)'),
    ('password_reset_tokens', 'used', 'BOOLEAN DEFAULT false'),
    ('password_reset_tokens', 'expires_at', 'TIMESTAMP WITH TIME ZONE'),
    ('password_reset_tokens', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()')
    ) AS t(tbl, col, coldef)
  LOOP
    IF to_regclass('public.' || quote_ident(r.tbl)) IS NULL THEN
      RAISE WARNING 'table public.% is missing entirely — run the full setup script on a fresh volume', r.tbl;
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = r.tbl AND column_name = r.col
    ) THEN
      RAISE NOTICE 'adding missing column %.%', r.tbl, r.col;
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I %s', r.tbl, r.col, r.coldef);
      added := added + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'columns added: %, missing tables: %', added, skipped;
END
$repair$;

-- ---------------------------------------------------------------------------
-- 2. Serial-number sequence used by StudioService.createStudio()
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.studio_serial_sequence START 1;

-- Never hand out a serial that already exists (studios.serial_number is UNIQUE).
SELECT setval(
  'public.studio_serial_sequence',
  GREATEST(
    (SELECT last_value FROM public.studio_serial_sequence),
    COALESCE((
      SELECT MAX(split_part(serial_number, '-', 2)::bigint)
      FROM public.studios
      WHERE serial_number ~ '^[0-9]{6}-[0-9]+$'
    ), 0)
  )
);

-- ---------------------------------------------------------------------------
-- 3. CHECK constraints that gained allowed values after the initial boot
-- ---------------------------------------------------------------------------
DO $checks$
DECLARE
  c record;
BEGIN
  -- schedule_sessions.status must accept IN_PROGRESS (attendance saved mid-class)
  IF to_regclass('public.schedule_sessions') IS NOT NULL THEN
    FOR c IN
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.schedule_sessions'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
      EXECUTE format('ALTER TABLE public.schedule_sessions DROP CONSTRAINT %I', c.conname);
    END LOOP;

    ALTER TABLE public.schedule_sessions
      ADD CONSTRAINT schedule_sessions_status_check
      CHECK (status IN ('SCHEDULED', 'CANCELLED', 'COMPLETED', 'RESCHEDULED', 'IN_PROGRESS'));
  END IF;

  -- enrollments.status must accept PENDING (enrollment awaiting payment)
  IF to_regclass('public.enrollments') IS NOT NULL THEN
    FOR c IN
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.enrollments'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%status%'
        AND pg_get_constraintdef(oid) NOT ILIKE '%payment_status%'
    LOOP
      EXECUTE format('ALTER TABLE public.enrollments DROP CONSTRAINT %I', c.conname);
    END LOOP;

    ALTER TABLE public.enrollments
      ADD CONSTRAINT enrollments_status_check
      CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'PENDING'));
  END IF;
END
$checks$;

-- ---------------------------------------------------------------------------
-- 4. Indexes (no-ops when they already exist)
-- ---------------------------------------------------------------------------
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
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON public.password_reset_tokens(token_hash) WHERE NOT used;

COMMIT;

-- ---------------------------------------------------------------------------
-- 5. Verification
-- ---------------------------------------------------------------------------
\echo '--- studios columns (schedule_start_hour + schedule_end_hour must be present) ---'
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'studios'
ORDER BY ordinal_position;

\echo '--- admins pointing at a studio row that does not exist (expect 0 rows) ---'
SELECT u.id AS user_id, u.email, u.studio_id
FROM public.users u
LEFT JOIN public.studios s ON s.id = u.studio_id
WHERE u.role IN ('ADMIN', 'SUPER_ADMIN')
  AND u.studio_id IS NOT NULL
  AND s.id IS NULL;

\echo '--- admins who own a studio but are not linked to it (self-heals on next load) ---'
SELECT u.id AS user_id, u.email, s.id AS owned_studio_id, u.studio_id AS linked_studio_id
FROM public.users u
JOIN public.studios s ON s.admin_id = u.id
WHERE u.studio_id IS DISTINCT FROM s.id;
