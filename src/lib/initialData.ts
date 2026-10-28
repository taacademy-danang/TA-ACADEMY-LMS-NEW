import {
  Profile,
  Course,
  ClassItem,
  IntakeRecord,
  Student,
  ClassSession,
  AttendanceRecord,
  Assignment,
  StudentEvaluation,
  StudentBenefit,
  LessonPlan,
  AssignmentSubmission,
} from '@/types';

// Danh sách tài khoản hệ thống cốt lõi: Admin và Giáo viên phụ trách
export const initialProfiles: Profile[] = [
  {
    id: 'p-admin-01',
    email: 'admin@taacademy.vn',
    username: 'admin',
    full_name: 'Ban Giám Đốc T.A (Admin)',
    role: 'admin',
    phone: '0901234567',
    status: 'active',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'p-gv-01',
    email: 'khauthinga@ta.edu.vn',
    username: 'khauthinga',
    full_name: 'Khấu Thị Nga',
    role: 'teacher',
    phone: '0908889901',
    status: 'active',
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'p-gv-03',
    email: 'vongocnhuy@ta.edu.vn',
    username: 'vongocnhuy',
    full_name: 'Võ Ngọc Như Ý',
    role: 'teacher',
    phone: '0908889903',
    status: 'active',
    created_at: '2026-10-03T08:00:00Z',
    updated_at: '2026-10-03T08:00:00Z',
  },
  {
    id: 'p-gv-02',
    email: 'nguyenphuongtra@ta.edu.vn',
    username: 'nguyenphuongtra',
    full_name: 'Nguyễn Phương Trà',
    role: 'teacher',
    phone: '0908889902',
    status: 'active',
    created_at: '2026-10-02T08:00:00Z',
    updated_at: '2026-10-02T08:00:00Z',
  },
  {
    id: 'p-gv-04',
    email: 'nguyenhothuytran@ta.edu.vn',
    username: 'nguyenhothuytran',
    full_name: 'Nguyễn Hồ Thùy Trân',
    role: 'teacher',
    phone: '0908889904',
    status: 'active',
    created_at: '2026-10-04T08:00:00Z',
    updated_at: '2026-10-04T08:00:00Z',
  },
];

// Danh mục khóa học mặc định của học viện T.A (GIỮ LẠI ĐỂ SEED SUPABASE)
export const initialCourses: Course[] = [
  {
    id: 'c-pt',
    code: 'PT',
    name: 'Phong thái',
    description: 'Chương trình rèn luyện cốt cách, dáng ngồi, dáng đứng và giao tiếp thanh lịch chuẩn mực.',
    target_audience: 'Nữ giới, thanh thiếu niên, phụ nữ hiện đại',
    total_sessions: 12,
    image_url: '/images/phong-thai.png',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c-cw',
    code: 'CW',
    name: 'Catwalk',
    description: 'Kỹ thuật trình diễn thời trang chuyên nghiệp, catwalk đầm dạ hội, áo dài và phong cách biểu cảm.',
    target_audience: 'Học viên muốn biểu diễn chuyên nghiệp',
    total_sessions: 16,
    image_url: '/images/catwalk.png',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c-mk',
    code: 'MK',
    name: 'Model Kids',
    description: 'Đào tạo kỹ năng người mẫu nhí, dáng đi, giải phóng hình thể và sự tự tin sân khấu.',
    target_audience: 'Trẻ em từ 4 - 14 tuổi',
    total_sessions: 16,
    image_url: '/images/model-kids.png',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c-gt',
    code: 'GT',
    name: 'Giao tiếp & Giọng nói',
    description: 'Nghệ thuật làm chủ giọng nói, ngôn ngữ hình thể và thuyết trình lôi cuốn trước đám đông.',
    target_audience: 'Mọi lứa tuổi',
    total_sessions: 10,
    image_url: '/images/phong-thai.png',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
  },
];

// Các mảng dữ liệu nghiệp vụ: Trạng thái rỗng (empty state) sạch sẽ, sẵn sàng kết nối và lưu dữ liệu thật
export const initialClasses: ClassItem[] = [];
export const initialStudents: Student[] = [];
export const initialIntakeRecords: IntakeRecord[] = [];
export const initialSessions: ClassSession[] = [];
export const initialAttendance: AttendanceRecord[] = [];
export const initialLessonPlans: LessonPlan[] = [];
export const initialAssignments: Assignment[] = [];
export const initialEvaluations: StudentEvaluation[] = [];
export const initialBenefits: StudentBenefit[] = [];
export const initialSubmissions: AssignmentSubmission[] = [];
