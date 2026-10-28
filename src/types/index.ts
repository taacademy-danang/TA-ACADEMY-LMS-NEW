export type UserRole = 'admin' | 'teacher' | 'student';

export interface Profile {
  id: string;
  email: string;
  username?: string;
  full_name: string;
  role: UserRole;
  phone: string;
  avatar_url?: string;
  student_code?: string;
  status: 'active' | 'inactive' | 'locked';
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  profile_id?: string;
  full_name: string;
  phone: string;
  student_code: string;
  course_id?: string;
  course_name?: string;
  class_id?: string;
  class_code?: string;
  class_name?: string;
  total_registered_sessions: number;
  completed_sessions: number;
  remaining_sessions: number;
  status: 'active' | 'paused' | 'completed';
  intake_date: string;
  created_at: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  target_audience: string;
  total_sessions: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export type ClassType = 'group' | 'one_on_one';

export interface ClassItem {
  id: string;
  code: string;
  name: string;
  course_id: string;
  course_name: string;
  teacher_id: string;
  teacher_name: string;
  start_date: string;
  end_date?: string;
  days_of_week: number[]; // 1: Thứ 2, 2: Thứ 3, ..., 7: Chủ nhật
  start_time: string; // e.g. "08:30"
  end_time: string;   // e.g. "10:00" (Lớp nhóm 1h30, Kèm 1h)
  class_type: ClassType;
  total_sessions: number;
  room: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  student_count: number;
  created_at: string;
}

export type IntakeStatus = 'pending_class' | 'assigned_class' | 'account_created' | 'completed';

export interface IntakeRecord {
  id: string;
  full_name: string;
  phone: string;
  course_id: string;
  course_name: string;
  total_sessions: number;
  status: IntakeStatus;
  assigned_class_id?: string;
  assigned_class_code?: string;
  assigned_class_name?: string;
  assigned_teacher_name?: string;
  student_code?: string;
  account_username?: string;
  created_at: string;
  updated_at?: string;
}

export interface ClassSession {
  id: string;
  class_id: string;
  class_code: string;
  class_name: string;
  course_name: string;
  session_number: number;
  session_date: string; // YYYY-MM-DD
  day_of_week: number;
  start_time: string;
  end_time: string;
  teacher_id: string;
  teacher_name: string;
  room: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'makeup';
}

export type AttendanceStatus = 'present' | 'absent' | 'unmarked';

export interface AttendanceRecord {
  id: string;
  session_id: string;
  class_id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  status: AttendanceStatus;
  notes?: string;
  marked_at?: string;
  marked_by?: string;
}

export interface Assignment {
  id: string;
  class_id: string;
  session_id?: string;
  session_number: number;
  title: string;
  description: string;
  requirements: string[];
  notes?: string;
  due_date: string;
  submission_drive_url?: string;
  is_unlocked: boolean;
  created_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  submission_link: string;
  submission_date: string;
  status: 'submitted' | 'late' | 'reviewed';
  teacher_feedback?: string;
  reviewed_at?: string;
}

export interface StudentEvaluation {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string;
  class_code: string;
  course_name: string;
  session_id?: string;
  session_date: string;
  content: string;
  evaluation_type: 'session' | 'general';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StudentBenefit {
  id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  class_code: string;
  course_name: string;
  total_registered_sessions: number;
  completed_sessions: number;
  remaining_sessions: number;
  absent_sessions: number;
  reserved_sessions: number;
  expiry_date?: string;
  status: 'active' | 'expiring_soon' | 'expired';
}

export interface LessonPlan {
  id: string;
  course_id: string;
  course_name: string;
  session_number: number;
  title: string;
  objectives: string[];
  activities: string[];
  materials?: string[];
}
