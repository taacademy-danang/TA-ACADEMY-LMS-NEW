-- ====================================================================
-- T.A ACADEMY E-LEARNING LMS & CRM — SUPABASE DATABASE SCHEMA
-- Phiên bản chính thức chuẩn hóa 100% nghiệp vụ T.A Academy
-- ====================================================================

-- 1. Bật Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. BẢNG PROFILES (Người dùng hệ thống: Admin, Teacher, Student)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    phone VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    student_code VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG COURSES (Khóa học mặc định: Phong thái, Catwalk, Model Kids...)
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_audience VARCHAR(255),
    total_sessions INTEGER NOT NULL DEFAULT 12,
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG CLASSES (Lớp học)
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE RESTRICT,
    course_name VARCHAR(255) NOT NULL,
    teacher_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    teacher_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    days_of_week INTEGER[] NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    class_type VARCHAR(50) DEFAULT 'group' CHECK (class_type IN ('group', 'one_on_one')),
    total_sessions INTEGER NOT NULL DEFAULT 16,
    room VARCHAR(100) DEFAULT 'Phòng Studio A1',
    status VARCHAR(50) DEFAULT 'ongoing' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    student_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BẢNG INTAKE_RECORDS (Phễu tiếp nhận & Chờ xếp lớp)
CREATE TABLE IF NOT EXISTS public.intake_records (
    id TEXT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE RESTRICT,
    course_name VARCHAR(255) NOT NULL,
    total_sessions INTEGER NOT NULL DEFAULT 16,
    status VARCHAR(50) DEFAULT 'pending_class' CHECK (status IN ('pending_class', 'assigned_class', 'account_created', 'completed')),
    assigned_class_id TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
    assigned_class_code VARCHAR(50),
    assigned_class_name VARCHAR(255),
    assigned_teacher_name VARCHAR(255),
    student_code VARCHAR(50),
    account_username VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BẢNG STUDENTS (Học viên chính thức)
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    profile_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    student_code VARCHAR(50) UNIQUE NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL,
    course_name VARCHAR(255),
    class_id TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
    class_code VARCHAR(50),
    class_name VARCHAR(255),
    total_registered_sessions INTEGER DEFAULT 16,
    completed_sessions INTEGER DEFAULT 0,
    remaining_sessions INTEGER DEFAULT 16,
    absent_sessions INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    intake_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BẢNG CLASS_SESSIONS (Thời khóa biểu từng buổi học)
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id TEXT PRIMARY KEY,
    class_id TEXT REFERENCES public.classes(id) ON DELETE CASCADE,
    class_code VARCHAR(50),
    class_name VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    session_type VARCHAR(50) DEFAULT 'group' CHECK (session_type IN ('group', 'private')),
    student_name VARCHAR(255),
    session_number INTEGER NOT NULL,
    session_date DATE NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    teacher_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    teacher_name VARCHAR(255) NOT NULL,
    room VARCHAR(100),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'makeup')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BẢNG ATTENDANCE_RECORDS (Điểm danh học viên)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    class_id TEXT REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    student_code VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'unmarked' CHECK (status IN ('present', 'absent', 'unmarked')),
    notes TEXT,
    marked_at TIMESTAMPTZ,
    marked_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BẢNG LESSON_PLANS (Khung giáo án & Bài tập đính kèm)
CREATE TABLE IF NOT EXISTS public.lesson_plans (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    course_name VARCHAR(255) NOT NULL,
    session_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    homework_title VARCHAR(255) NOT NULL,
    homework_desc TEXT NOT NULL,
    homework_due_days INTEGER DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. BẢNG ASSIGNMENTS (Bài tập buổi học)
CREATE TABLE IF NOT EXISTS public.assignments (
    id TEXT PRIMARY KEY,
    class_id TEXT REFERENCES public.classes(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES public.class_sessions(id) ON DELETE SET NULL,
    session_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    due_date DATE,
    submission_drive_url TEXT,
    is_unlocked BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. BẢNG ASSIGNMENT_SUBMISSIONS (Bài nộp & Nhận xét của giáo viên)
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id TEXT PRIMARY KEY,
    assignment_id TEXT REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    submission_link TEXT NOT NULL,
    submission_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'reviewed')),
    teacher_feedback TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. BẢNG STUDENT_EVALUATIONS (Đánh giá & Nhận xét học viên theo ngày)
CREATE TABLE IF NOT EXISTS public.student_evaluations (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    class_id TEXT REFERENCES public.classes(id) ON DELETE CASCADE,
    class_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    session_id TEXT REFERENCES public.class_sessions(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    content TEXT NOT NULL,
    evaluation_type VARCHAR(50) DEFAULT 'session' CHECK (evaluation_type IN ('session', 'general')),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. BẢNG STUDENT_BENEFITS (Quyền lợi video tốt nghiệp buổi 17 & Link Drive)
CREATE TABLE IF NOT EXISTS public.student_benefits (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    student_code VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    class_code VARCHAR(50) NOT NULL,
    drive_link TEXT,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('completed', 'in_progress', 'overdue')),
    overdue_days INTEGER DEFAULT 0,
    completed_date VARCHAR(50),
    is_milestone_17 BOOLEAN DEFAULT false,
    completed_sessions INTEGER DEFAULT 0,
    total_registered_sessions INTEGER DEFAULT 16,
    absent_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- SEED DỮ LIỆU BAN ĐẦU CỐT LÕI (DANH MỤC KHÓA HỌC & TÀI KHOẢN ADMIN/GV)
-- ====================================================================

-- Seed Danh mục khóa học chuẩn
INSERT INTO public.courses (id, code, name, description, target_audience, total_sessions, image_url, status)
VALUES
  ('c-pt', 'PT', 'Phong thái', 'Chương trình rèn luyện cốt cách, dáng ngồi, dáng đứng và giao tiếp thanh lịch chuẩn mực.', 'Nữ giới, thanh thiếu niên, phụ nữ hiện đại', 12, '/images/phong-thai.png', 'active'),
  ('c-cw', 'CW', 'Catwalk', 'Kỹ thuật trình diễn thời trang chuyên nghiệp, catwalk đầm dạ hội, áo dài và phong cách biểu cảm.', 'Học viên muốn biểu diễn chuyên nghiệp', 16, '/images/catwalk.png', 'active'),
  ('c-mk', 'MK', 'Model Kids', 'Đào tạo kỹ năng người mẫu nhí, dáng đi, giải phóng hình thể và sự tự tin sân khấu.', 'Trẻ em từ 4 - 14 tuổi', 16, '/images/model-kids.png', 'active'),
  ('c-gt', 'GT', 'Giao tiếp & Giọng nói', 'Nghệ thuật làm chủ giọng nói, ngôn ngữ hình thể và thuyết trình lôi cuốn trước đám đông.', 'Mọi lứa tuổi', 10, '/images/phong-thai.png', 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed Tài khoản cốt lõi (Admin & Giáo viên phụ trách)
INSERT INTO public.profiles (id, email, username, full_name, role, phone, status)
VALUES
  ('p-admin-01', 'admin@taacademy.vn', 'admin', 'Ban Giám Đốc T.A (Admin)', 'admin', '0901234567', 'active'),
  ('p-gv-01', 'khauthinga@ta.edu.vn', 'khauthinga', 'Khấu Thị Nga', 'teacher', '0908889901', 'active'),
  ('p-gv-03', 'vongocnhuy@ta.edu.vn', 'vongocnhuy', 'Võ Ngọc Như Ý', 'teacher', '0908889903', 'active'),
  ('p-gv-02', 'nguyenphuongtra@ta.edu.vn', 'nguyenphuongtra', 'Nguyễn Phương Trà', 'teacher', '0908889902', 'active'),
  ('p-gv-04', 'nguyenhothuytran@ta.edu.vn', 'nguyenhothuytran', 'Nguyễn Hồ Thùy Trân', 'teacher', '0908889904', 'active')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_benefits ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc/ghi từ client khi có Anon Key (đã được phân quyền UI theo Role)
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public modify profiles" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Public modify courses" ON public.courses FOR ALL USING (true);

CREATE POLICY "Public read classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Public modify classes" ON public.classes FOR ALL USING (true);

CREATE POLICY "Public read intake_records" ON public.intake_records FOR SELECT USING (true);
CREATE POLICY "Public modify intake_records" ON public.intake_records FOR ALL USING (true);

CREATE POLICY "Public read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Public modify students" ON public.students FOR ALL USING (true);

CREATE POLICY "Public read class_sessions" ON public.class_sessions FOR SELECT USING (true);
CREATE POLICY "Public modify class_sessions" ON public.class_sessions FOR ALL USING (true);

CREATE POLICY "Public read attendance_records" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Public modify attendance_records" ON public.attendance_records FOR ALL USING (true);

CREATE POLICY "Public read lesson_plans" ON public.lesson_plans FOR SELECT USING (true);
CREATE POLICY "Public modify lesson_plans" ON public.lesson_plans FOR ALL USING (true);

CREATE POLICY "Public read assignments" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Public modify assignments" ON public.assignments FOR ALL USING (true);

CREATE POLICY "Public read assignment_submissions" ON public.assignment_submissions FOR SELECT USING (true);
CREATE POLICY "Public modify assignment_submissions" ON public.assignment_submissions FOR ALL USING (true);

CREATE POLICY "Public read student_evaluations" ON public.student_evaluations FOR SELECT USING (true);
CREATE POLICY "Public modify student_evaluations" ON public.student_evaluations FOR ALL USING (true);

CREATE POLICY "Public read student_benefits" ON public.student_benefits FOR SELECT USING (true);
CREATE POLICY "Public modify student_benefits" ON public.student_benefits FOR ALL USING (true);
