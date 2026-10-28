import { supabase, isSupabaseConfigured } from './supabase';
import {
  Profile,
  Course,
  ClassItem,
  IntakeRecord,
  Student,
  ClassSession,
  AttendanceRecord,
  Assignment,
  AssignmentSubmission,
  StudentEvaluation,
  StudentBenefit,
  LessonPlan,
} from '@/types';

/**
 * Service đồng bộ dữ liệu 2 chiều với Supabase PostgreSQL
 */

export async function fetchAllDataFromSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    const [
      profilesRes,
      coursesRes,
      classesRes,
      intakesRes,
      studentsRes,
      sessionsRes,
      attendanceRes,
      lessonPlansRes,
      assignmentsRes,
      submissionsRes,
      evaluationsRes,
      benefitsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('courses').select('*'),
      supabase.from('classes').select('*'),
      supabase.from('intake_records').select('*'),
      supabase.from('students').select('*'),
      supabase.from('class_sessions').select('*'),
      supabase.from('attendance_records').select('*'),
      supabase.from('lesson_plans').select('*'),
      supabase.from('assignments').select('*'),
      supabase.from('assignment_submissions').select('*'),
      supabase.from('student_evaluations').select('*'),
      supabase.from('student_benefits').select('*'),
    ]);

    return {
      profiles: (profilesRes.data as Profile[]) || [],
      courses: (coursesRes.data as Course[]) || [],
      classes: (classesRes.data as ClassItem[]) || [],
      intakeRecords: (intakesRes.data as IntakeRecord[]) || [],
      students: (studentsRes.data as Student[]) || [],
      sessions: (sessionsRes.data as ClassSession[]) || [],
      attendance: (attendanceRes.data as AttendanceRecord[]) || [],
      lessonPlans: (lessonPlansRes.data as LessonPlan[]) || [],
      assignments: (assignmentsRes.data as Assignment[]) || [],
      submissions: (submissionsRes.data as AssignmentSubmission[]) || [],
      evaluations: (evaluationsRes.data as StudentEvaluation[]) || [],
      benefits: (benefitsRes.data as StudentBenefit[]) || [],
    };
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu từ Supabase:', error);
    return null;
  }
}

// ==========================================
// THAO TÁC KHÓA HỌC (COURSES)
// ==========================================
export async function dbAddCourse(course: Course) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('courses').insert(course);
}

export async function dbUpdateCourse(id: string, data: Partial<Course>) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('courses').update(data).eq('id', id);
}

export async function dbDeleteCourse(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('courses').delete().eq('id', id);
}

// ==========================================
// THAO TÁC LỚP HỌC (CLASSES)
// ==========================================
export async function dbAddClass(classItem: ClassItem) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('classes').insert(classItem);
}

export async function dbUpdateClass(id: string, data: Partial<ClassItem>) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('classes').update(data).eq('id', id);
}

export async function dbDeleteClass(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('classes').delete().eq('id', id);
}

// ==========================================
// THAO TÁC CHỜ XẾP LỚP (INTAKE)
// ==========================================
export async function dbAddIntake(intake: IntakeRecord) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('intake_records').insert(intake);
}

export async function dbUpdateIntake(id: string, data: Partial<IntakeRecord>) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('intake_records').update(data).eq('id', id);
}

export async function dbDeleteIntake(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('intake_records').delete().eq('id', id);
}

// ==========================================
// THAO TÁC HỌC VIÊN (STUDENTS) & TÀI KHOẢN (PROFILES)
// ==========================================
export async function dbAddStudent(student: Student) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('students').insert(student);
}

export async function dbAddProfile(profile: Profile) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('profiles').insert(profile);
}

export async function dbUpdateProfile(id: string, data: Partial<Profile>) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('profiles').update(data).eq('id', id);
}

export async function dbDeleteProfile(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('profiles').delete().eq('id', id);
}

// ==========================================
// THAO TÁC THỜI KHÓA BIỂU (SESSIONS)
// ==========================================
export async function dbAddSession(session: ClassSession) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('class_sessions').insert(session);
}

export async function dbUpdateSession(id: string, data: Partial<ClassSession>) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('class_sessions').update(data).eq('id', id);
}

export async function dbDeleteSession(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('class_sessions').delete().eq('id', id);
}

// ==========================================
// THAO TÁC ĐIỂM DANH (ATTENDANCE)
// ==========================================
export async function dbSaveAttendance(records: AttendanceRecord[]) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('attendance_records').upsert(records, { onConflict: 'id' });
}

// ==========================================
// THAO TÁC GIÁO ÁN (LESSON PLANS)
// ==========================================
export async function dbAddLessonPlan(plan: LessonPlan) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('lesson_plans').insert(plan);
}

export async function dbUpdateLessonPlan(id: string, data: Partial<LessonPlan>) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('lesson_plans').update(data).eq('id', id);
}

export async function dbDeleteLessonPlan(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('lesson_plans').delete().eq('id', id);
}

export async function dbBatchImportLessonPlans(courseId: string, plans: LessonPlan[], overwrite: boolean) {
  if (!isSupabaseConfigured || !supabase) return;
  if (overwrite) {
    await supabase.from('lesson_plans').delete().eq('course_id', courseId);
  }
  await supabase.from('lesson_plans').insert(plans);
}

// ==========================================
// THAO TÁC ĐÁNH GIÁ (EVALUATIONS)
// ==========================================
export async function dbSaveEvaluation(evaluation: StudentEvaluation) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('student_evaluations').insert(evaluation);
}

// ==========================================
// THAO TÁC BÀI TẬP & BÀI NỘP (SUBMISSIONS)
// ==========================================
export async function dbSubmitHomework(submission: AssignmentSubmission) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('assignment_submissions').upsert(submission, { onConflict: 'id' });
}

export async function dbSaveHomeworkFeedback(submissionId: string, feedback: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase
    .from('assignment_submissions')
    .update({
      teacher_feedback: feedback,
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId);
}

// ==========================================
// THAO TÁC QUYỀN LỢI (BENEFITS)
// ==========================================
export async function dbAddBenefit(benefit: StudentBenefit) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('student_benefits').insert(benefit);
}

export async function dbUpdateBenefit(id: string, data: Partial<StudentBenefit>) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('student_benefits').update(data).eq('id', id);
}
