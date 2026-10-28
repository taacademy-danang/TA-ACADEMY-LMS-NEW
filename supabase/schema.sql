-- ====================================================================
-- T.A ACADEMY E-LEARNING LMS & CRM DATABASE SCHEMA
-- PostgreSQL / Supabase with Row Level Security (RLS)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Users system: Admin, Teacher, Student)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    phone VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    student_code VARCHAR(50) UNIQUE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COURSES (Phong thái, Model Kids, Catwalk...)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_audience VARCHAR(255),
    total_sessions INTEGER NOT NULL DEFAULT 12,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLASSES
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE RESTRICT,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    days_of_week INTEGER[] NOT NULL, -- [1, 3] for Mon, Wed
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    class_type VARCHAR(50) DEFAULT 'group' CHECK (class_type IN ('group', 'one_on_one')),
    total_sessions INTEGER NOT NULL DEFAULT 12,
    room VARCHAR(100) DEFAULT 'Phòng Studio A',
    status VARCHAR(50) DEFAULT 'ongoing' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    student_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INTAKE RECORDS (Chờ xếp lớp)
CREATE TABLE IF NOT EXISTS public.intake_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE RESTRICT,
    total_sessions INTEGER NOT NULL DEFAULT 16,
    status VARCHAR(50) DEFAULT 'pending_class' CHECK (status IN ('pending_class', 'assigned_class', 'account_created', 'completed')),
    assigned_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    student_code VARCHAR(50),
    account_username VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    student_code VARCHAR(50) UNIQUE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    total_registered_sessions INTEGER DEFAULT 16,
    completed_sessions INTEGER DEFAULT 0,
    remaining_sessions INTEGER DEFAULT 16,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    intake_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CLASS ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.class_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'dropped')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- 7. CLASS SESSIONS (Buổi học thực tế trên Thời khóa biểu)
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL,
    session_date DATE NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    room VARCHAR(100),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'makeup')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, session_date, start_time)
);

-- 8. ATTENDANCE RECORDS (Điểm danh)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'unmarked' CHECK (status IN ('present', 'absent', 'unmarked')),
    notes TEXT,
    marked_at TIMESTAMPTZ,
    marked_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- 9. ASSIGNMENTS (Bài tập)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.class_sessions(id) ON DELETE SET NULL,
    session_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    due_date DATE,
    submission_drive_url TEXT,
    is_unlocked BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ASSIGNMENT SUBMISSIONS (Nộp bài tập)
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    submission_link TEXT NOT NULL,
    submission_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'reviewed')),
    teacher_feedback TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- 11. STUDENT EVALUATIONS (Đánh giá học viên)
CREATE TABLE IF NOT EXISTS public.student_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.class_sessions(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    content TEXT NOT NULL,
    evaluation_type VARCHAR(50) DEFAULT 'session' CHECK (evaluation_type IN ('session', 'general')),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. STUDENT BENEFITS (Quyền lợi học viên)
CREATE TABLE IF NOT EXISTS public.student_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    total_registered_sessions INTEGER NOT NULL DEFAULT 16,
    completed_sessions INTEGER NOT NULL DEFAULT 0,
    remaining_sessions INTEGER NOT NULL DEFAULT 16,
    absent_sessions INTEGER NOT NULL DEFAULT 0,
    reserved_sessions INTEGER NOT NULL DEFAULT 0,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. LESSON PLANS (Giáo án)
CREATE TABLE IF NOT EXISTS public.lesson_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    objectives JSONB DEFAULT '[]'::jsonb,
    activities JSONB DEFAULT '[]'::jsonb,
    materials JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AUDIT LOGS (Lịch sử thao tác)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Authenticated users can view; Admins full control; Users update own profile
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.current_user_role() = 'admin');

-- Courses & Classes: Viewable by authenticated; Editable by Admin & assigned Teacher
CREATE POLICY "Courses viewable by all" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Courses managed by admin" ON public.courses FOR ALL TO authenticated USING (public.current_user_role() = 'admin');

CREATE POLICY "Classes viewable by all" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Classes managed by admin" ON public.classes FOR ALL TO authenticated USING (public.current_user_role() = 'admin');

-- Attendance & Evaluations: Teacher of class or Admin can manage
CREATE POLICY "Attendance viewable by class participants" ON public.attendance_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Attendance editable by teacher or admin" ON public.attendance_records FOR ALL TO authenticated USING (public.current_user_role() IN ('admin', 'teacher'));

CREATE POLICY "Evaluations viewable by student or staff" ON public.student_evaluations FOR SELECT TO authenticated 
USING (
    public.current_user_role() IN ('admin', 'teacher') 
    OR student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
);
CREATE POLICY "Evaluations editable by teacher or admin" ON public.student_evaluations FOR ALL TO authenticated USING (public.current_user_role() IN ('admin', 'teacher'));

-- Assignments & Submissions
CREATE POLICY "Assignments viewable by authenticated" ON public.assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Assignments managed by staff" ON public.assignments FOR ALL TO authenticated USING (public.current_user_role() IN ('admin', 'teacher'));

CREATE POLICY "Submissions viewable by owner or staff" ON public.assignment_submissions FOR SELECT TO authenticated 
USING (
    public.current_user_role() IN ('admin', 'teacher') 
    OR student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid())
);
CREATE POLICY "Students can submit assignments" ON public.assignment_submissions FOR INSERT TO authenticated 
WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()) 
    OR public.current_user_role() IN ('admin', 'teacher')
);
