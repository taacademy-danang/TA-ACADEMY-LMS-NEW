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

// Danh mục khóa học đồng bộ chính xác với cơ sở dữ liệu Supabase
export const initialCourses: Course[] = [
  {
    id: 'c-1793240717033',
    code: 'PT1',
    name: 'PHONG THÁI',
    description: 'Chương trình rèn luyện cốt cách, dáng ngồi, dáng đứng và giao tiếp thanh lịch chuẩn mực.',
    target_audience: 'Phụ nữ',
    total_sessions: 8,
    status: 'active',
    created_at: '2026-10-29T02:25:17.033Z',
  },
  {
    id: 'c-1793240769975',
    code: 'PT2',
    name: 'PHONG THÁI',
    description: 'Chương trình rèn luyện nâng cao phong thái và khí chất.',
    target_audience: 'Phụ nữ',
    total_sessions: 14,
    status: 'active',
    created_at: '2026-10-29T02:26:09.975Z',
  },
  {
    id: 'c-1793240790547',
    code: 'PT3',
    name: 'PHONG THÁI',
    description: 'Chương trình chuyên sâu rèn luyện thần thái và biểu cảm đỉnh cao.',
    target_audience: 'Phụ nữ',
    total_sessions: 18,
    status: 'active',
    created_at: '2026-10-29T02:26:30.547Z',
  },
  {
    id: 'c-1793240821192',
    code: 'MK1',
    name: 'MODEL KIDS',
    description: 'Đào tạo kỹ năng người mẫu nhí cơ bản, dáng đi và sự tự tin sân khấu.',
    target_audience: 'Trẻ em',
    total_sessions: 8,
    status: 'active',
    created_at: '2026-10-29T02:27:01.192Z',
  },
  {
    id: 'c-1793240838312',
    code: 'MK2',
    name: 'MODEL KIDS',
    description: 'Đào tạo kỹ năng người mẫu nhí toàn diện, catwalk và chụp ảnh thời trang.',
    target_audience: 'Trẻ em',
    total_sessions: 20,
    status: 'active',
    created_at: '2026-10-29T02:27:18.312Z',
  },
  {
    id: 'c-1793240856456',
    code: 'MK3',
    name: 'MODEL KIDS - NÂNG CAO',
    description: 'Kỹ thuật trình diễn sân khấu lớn và rèn luyện bản lĩnh người mẫu nhí chuyên nghiệp.',
    target_audience: 'Trẻ em',
    total_sessions: 20,
    status: 'active',
    created_at: '2026-10-29T02:27:36.456Z',
  },
  {
    id: 'c-1793240894728',
    code: 'CW1',
    name: 'CATWALK',
    description: 'Kỹ thuật catwalk cơ bản, bước đi và giữ thăng bằng.',
    target_audience: 'Người mẫu',
    total_sessions: 15,
    status: 'active',
    created_at: '2026-10-29T02:28:14.728Z',
  },
  {
    id: 'c-1793240917214',
    code: 'CW2',
    name: 'CATWALK',
    description: 'Kỹ thuật trình diễn thời trang chuyên nghiệp, catwalk đầm dạ hội và áo dài.',
    target_audience: 'Người mẫu',
    total_sessions: 20,
    status: 'active',
    created_at: '2026-10-29T02:28:37.214Z',
  },
  {
    id: 'c-1793240938363',
    code: 'CW3',
    name: 'CATWALK',
    description: 'Chương trình đào tạo người mẫu trình diễn thời trang quốc tế và sân khấu lớn.',
    target_audience: 'Người mẫu',
    total_sessions: 48,
    status: 'active',
    created_at: '2026-10-29T02:28:58.363Z',
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
