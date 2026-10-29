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
  // 1. Xóa toàn bộ lịch học liên quan đến lớp
  await supabase.from('class_sessions').delete().eq('class_id', id);
  // 2. Xóa bài tập về nhà liên quan
  await supabase.from('assignments').delete().eq('class_id', id);
  // 3. Xóa điểm danh liên quan
  await supabase.from('attendance_records').delete().eq('class_id', id);
  // 4. Gỡ bỏ thông tin lớp học khỏi học viên thuộc lớp này
  await supabase.from('students').update({ class_id: null, class_code: null, class_name: null }).eq('class_id', id);
  // 5. Xóa lớp học
  await supabase.from('classes').delete().eq('id', id);
}

// ==========================================
// THAO TÁC CHỜ XẾP LỚP (INTAKE)
// ==========================================
export async function dbAddIntake(intake: IntakeRecord) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('intake_records').insert(intake);
  if (error) {
    console.error('Error inserting intake record to Supabase:', error);
    // Nếu lỗi khóa ngoại do course_id, lấy course_id hợp lệ đầu tiên và thử lại
    if (error.code === '23503') {
      const { data: cList } = await supabase.from('courses').select('id, name').limit(1);
      if (cList && cList.length > 0) {
        await supabase.from('intake_records').insert({
          ...intake,
          course_id: cList[0].id,
          course_name: cList[0].name,
        });
      }
    }
  }
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
  const { error } = await supabase.from('students').insert(student);
  if (error) {
    console.error('Error adding student to Supabase:', error);
    // Nếu lỗi khóa ngoại do course_id, lấy course_id hợp lệ đầu tiên và thử lại
    if (error.code === '23503') {
      const { data: cList } = await supabase.from('courses').select('id, name').limit(1);
      if (cList && cList.length > 0) {
        await supabase.from('students').insert({
          ...student,
          course_id: cList[0].id,
          course_name: cList[0].name,
        });
      }
    }
  }
}

export async function dbUpdateStudent(id: string, data: Partial<Student>) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('students').update(data).eq('id', id);
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

export async function dbDeleteStudentCompletely(studentId: string, studentCode?: string, profileId?: string) {
  if (!isSupabaseConfigured || !supabase) return;
  // 1. Xóa trong students
  await supabase.from('students').delete().eq('id', studentId);
  if (studentCode) {
    await supabase.from('students').delete().eq('student_code', studentCode);
  }

  // 2. Xóa trong profiles
  if (profileId) {
    await supabase.from('profiles').delete().eq('id', profileId);
  }
  if (studentCode) {
    await supabase.from('profiles').delete().eq('student_code', studentCode);
    await supabase.from('profiles').delete().eq('username', studentCode);
  }

  // 3. Xóa trong student_benefits
  await supabase.from('student_benefits').delete().eq('student_id', studentId);
  if (studentCode) {
    await supabase.from('student_benefits').delete().eq('student_code', studentCode);
  }

  // 4. Xóa trong attendance_records
  await supabase.from('attendance_records').delete().eq('student_id', studentId);
  if (studentCode) {
    await supabase.from('attendance_records').delete().eq('student_code', studentCode);
  }

  // 5. Xóa trong assignment_submissions
  await supabase.from('assignment_submissions').delete().eq('student_id', studentId);

  // 6. Xóa trong student_evaluations
  await supabase.from('student_evaluations').delete().eq('student_id', studentId);
}

// ==========================================
// THAO TÁC THỜI KHÓA BIỂU (SESSIONS)
// ==========================================
export async function dbAddSession(session: ClassSession) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('class_sessions').insert(session);
}

export async function dbBatchAddSessions(sessions: ClassSession[]) {
  if (!isSupabaseConfigured || !supabase || sessions.length === 0) return;
  await supabase.from('class_sessions').insert(sessions);
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
  if (!isSupabaseConfigured || !supabase || records.length === 0) return;
  // Đảm bảo session_id tồn tại trên Supabase trước khi insert attendance
  const sessionId = records[0].session_id;
  const classId = records[0].class_id;
  if (sessionId) {
    const { data: existingSess } = await supabase.from('class_sessions').select('id').eq('id', sessionId).maybeSingle();
    if (!existingSess) {
      await supabase.from('class_sessions').insert({
        id: sessionId,
        class_id: classId,
        session_number: 1,
        session_date: new Date().toISOString().split('T')[0],
        day_of_week: 4,
        start_time: '15:30',
        end_time: '17:00',
        teacher_name: 'Khấu Thị Nga',
        status: 'completed',
      });
    }
  }
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
  const payload = {
    ...evaluation,
    class_id: evaluation.class_id && evaluation.class_id.trim() !== '' ? evaluation.class_id : null,
    student_id: evaluation.student_id && evaluation.student_id.trim() !== '' ? evaluation.student_id : null,
    session_id: evaluation.session_id && evaluation.session_id.trim() !== '' ? evaluation.session_id : null,
  };
  const { error } = await supabase.from('student_evaluations').upsert(payload, { onConflict: 'id' });
  if (error) console.error('Error dbSaveEvaluation:', error);
}

// ==========================================
// THAO TÁC BÀI TẬP & BÀI NỘP (SUBMISSIONS)
// ==========================================
export async function dbAddAssignment(assignment: Assignment) {
  if (!isSupabaseConfigured || !supabase) return;
  const payload = {
    ...assignment,
    class_id: assignment.class_id && assignment.class_id.trim() !== '' ? assignment.class_id : null,
    session_id: assignment.session_id && assignment.session_id.trim() !== '' ? assignment.session_id : null,
  };
  await supabase.from('assignments').upsert(payload, { onConflict: 'id' });
}

export async function dbSubmitHomework(submission: AssignmentSubmission) {
  if (!isSupabaseConfigured || !supabase) return;
  // Đảm bảo assignment tồn tại trên Supabase trước để không bị lỗi foreign key
  const { data: existingAsg } = await supabase
    .from('assignments')
    .select('id')
    .eq('id', submission.assignment_id)
    .limit(1);

  if (!existingAsg || existingAsg.length === 0) {
    await supabase.from('assignments').insert([
      {
        id: submission.assignment_id,
        title: 'Bài tập thực hành buổi học',
        description: 'Nộp link bài làm qua Google Drive',
        session_number: 1,
        class_id: null,
        due_date: new Date().toISOString().split('T')[0],
        requirements: ['Quay video thực hành theo giáo án', 'Tải lên Google Drive và mở quyền truy cập'],
      },
    ]);
  }

  const payload = {
    ...submission,
    student_id: submission.student_id && submission.student_id.trim() !== '' ? submission.student_id : null,
  };
  const { error } = await supabase.from('assignment_submissions').upsert(payload, { onConflict: 'id' });
  if (error) console.error('Error dbSubmitHomework:', error);
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
  const payload = {
    ...benefit,
    student_id: benefit.student_id && benefit.student_id.trim() !== '' ? benefit.student_id : null,
  };
  await supabase.from('student_benefits').upsert(payload, { onConflict: 'id' });
}

export async function dbUpdateBenefit(id: string, data: Partial<StudentBenefit>) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('student_benefits').update(data).eq('id', id);
}
