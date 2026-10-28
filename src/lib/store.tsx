'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  AttendanceStatus,
} from '@/types';
import {
  initialProfiles,
  initialCourses,
  initialClasses,
  initialStudents,
  initialIntakeRecords,
  initialSessions,
  initialAttendance,
  initialAssignments,
  initialEvaluations,
  initialBenefits,
  initialLessonPlans,
  initialSubmissions,
} from './initialData';
import { generateStudentCode, generateSessionsForClass } from './utils';
import { isSupabaseConfigured } from './supabase';
import {
  fetchAllDataFromSupabase,
  dbAddCourse,
  dbUpdateCourse,
  dbDeleteCourse,
  dbAddClass,
  dbUpdateClass,
  dbDeleteClass,
  dbAddIntake,
  dbUpdateIntake,
  dbDeleteIntake,
  dbAddStudent,
  dbAddProfile,
  dbUpdateProfile,
  dbDeleteProfile,
  dbAddSession,
  dbUpdateSession,
  dbDeleteSession,
  dbSaveAttendance,
  dbAddLessonPlan,
  dbUpdateLessonPlan,
  dbDeleteLessonPlan,
  dbBatchImportLessonPlans,
  dbSaveEvaluation,
  dbSubmitHomework,
  dbSaveHomeworkFeedback,
  dbAddBenefit,
  dbUpdateBenefit,
} from './supabaseService';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  // Auth state
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  isAuthenticated: boolean;
  login: (username: string, pass: string) => boolean;
  logout: () => void;

  // Data states
  profiles: Profile[];
  courses: Course[];
  classes: ClassItem[];
  students: Student[];
  intakeRecords: IntakeRecord[];
  sessions: ClassSession[];
  attendance: AttendanceRecord[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  evaluations: StudentEvaluation[];
  benefits: StudentBenefit[];
  lessonPlans: LessonPlan[];

  // Intake workflow
  addIntakeRecord: (data: { full_name: string; phone: string; course_id: string; total_sessions: number }) => void;
  editIntakeRecord: (id: string, data: { full_name: string; phone: string; course_id: string; total_sessions: number }) => void;
  assignClassToIntake: (intakeId: string, classId: string) => void;
  generateAccountForIntake: (intakeId: string) => { username: string; tempPass: string; studentCode: string };

  // Class & Schedule workflow
  addClass: (newClass: Omit<ClassItem, 'id' | 'student_count' | 'created_at'>) => void;
  editClass: (id: string, data: Partial<ClassItem>) => void;
  deleteClass: (id: string) => void;

  addSession: (sessionData: Omit<ClassSession, 'id' | 'status'>) => void;
  editSession: (id: string, updatedData: Partial<ClassSession>) => void;
  deleteSession: (sessionId: string) => void;

  // Attendance workflow
  saveAttendance: (
    sessionId: string,
    classId: string,
    records: { student_id: string; student_name: string; student_code: string; status: AttendanceStatus; notes?: string }[]
  ) => void;

  // Evaluation workflow
  saveEvaluation: (data: Omit<StudentEvaluation, 'id' | 'created_at' | 'updated_at'>) => void;

  // Assignment workflow
  submitHomework: (assignmentId: string, studentId: string, studentName: string, link: string) => void;
  saveHomeworkFeedback: (assignmentId: string, studentId: string, feedback: string) => void;

  // Benefits workflow
  updateBenefit: (id: string, data: { drive_link?: string; status?: 'completed' | 'in_progress' | 'overdue'; completed_date?: string }) => void;

  // Lesson Plans workflow
  addLessonPlan: (plan: Omit<LessonPlan, 'id'>) => void;
  editLessonPlan: (id: string, data: Partial<LessonPlan>) => void;
  deleteLessonPlan: (id: string) => void;
  batchImportLessonPlans: (
    courseId: string,
    courseName: string,
    plans: Array<{ session_number: number; title: string; content: string; homework_title: string; homework_desc: string; homework_due_days: number }>,
    overwrite?: boolean
  ) => void;

  // Account management
  toggleLockUser: (userId: string) => void;
  resetUserPassword: (userId: string) => string;
  deleteUser: (userId: string) => void;
  createNewAccount: (data: { full_name: string; username: string; role: 'admin' | 'teacher' | 'student'; phone: string; email: string }) => void;

  // Course management
  addCourse: (course: Omit<Course, 'id' | 'created_at'>) => void;
  editCourse: (id: string, course: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  // Supabase Status
  isSupabaseConfigured: boolean;

  // Notification
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile>(initialProfiles[0]); // Ban Giám Đốc T.A
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Bắt buộc đăng nhập trước khi vào trang chủ

  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [intakeRecords, setIntakeRecords] = useState<IntakeRecord[]>(initialIntakeRecords);
  const [sessions, setSessions] = useState<ClassSession[]>(initialSessions);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(initialSubmissions);
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>(initialEvaluations);
  const [benefits, setBenefits] = useState<StudentBenefit[]>(initialBenefits);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(initialLessonPlans);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Đồng bộ toàn bộ dữ liệu từ Supabase PostgreSQL khi khởi động
  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchAllDataFromSupabase().then((data) => {
        if (data) {
          if (data.profiles && data.profiles.length > 0) setProfiles(data.profiles);
          if (data.courses && data.courses.length > 0) setCourses(data.courses);
          if (data.classes) setClasses(data.classes);
          if (data.intakeRecords) setIntakeRecords(data.intakeRecords);
          if (data.students) setStudents(data.students);
          if (data.sessions) setSessions(data.sessions);
          if (data.attendance) setAttendance(data.attendance);
          if (data.lessonPlans) setLessonPlans(data.lessonPlans);
          if (data.assignments) setAssignments(data.assignments);
          if (data.submissions) setSubmissions(data.submissions);
          if (data.evaluations) setEvaluations(data.evaluations);
          if (data.benefits) setBenefits(data.benefits);
          showToast('Đã kết nối và đồng bộ dữ liệu thời gian thực từ Supabase!', 'success');
        }
      });
    }

    // Khôi phục phiên đăng nhập nếu đã đăng nhập trước đó trên trình duyệt này
    if (typeof window !== 'undefined') {
      const savedUserId = localStorage.getItem('ta_current_user_id');
      if (savedUserId) {
        const found = profiles.find((p) => p.id === savedUserId);
        if (found) {
          setCurrentUser(found);
          setIsAuthenticated(true);
        }
      }
    }
  }, []);

  // Auth: Đăng nhập
  const login = (usernameInput: string, passInput: string): boolean => {
    const u = usernameInput.trim().toLowerCase();
    const found = profiles.find(
      (p) =>
        (p.username && p.username.toLowerCase() === u) ||
        p.phone === u ||
        p.email.toLowerCase() === u
    );

    if (found && (passInput === '123456' || passInput === 'admin')) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ta_current_user_id', found.id);
      }
      showToast(`Đăng nhập thành công! Chào mừng ${found.full_name} (${found.role.toUpperCase()})`);
      return true;
    }

    // Cho phép admin mặc định
    if (u === 'admin' && (passInput === '123456' || passInput === 'admin')) {
      setCurrentUser(initialProfiles[0]);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ta_current_user_id', initialProfiles[0].id);
      }
      showToast('Đăng nhập thành công tài khoản Quản Trị Viên (Admin)');
      return true;
    }

    showToast('Tên đăng nhập hoặc mật khẩu không chính xác (Mặc định: 123456)', 'error');
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ta_current_user_id');
    }
    showToast('Đã đăng xuất khỏi hệ thống', 'info');
  };

  // 1. Tiếp nhận học viên mới
  const addIntakeRecord = (data: { full_name: string; phone: string; course_id: string; total_sessions: number }) => {
    const course = courses.find((c) => c.id === data.course_id);
    const newRecord: IntakeRecord = {
      id: `intake-${Date.now()}`,
      full_name: data.full_name,
      phone: data.phone,
      course_id: data.course_id,
      course_name: course ? course.name : 'Chưa xác định',
      total_sessions: data.total_sessions || 16,
      status: 'pending_class',
      created_at: new Date().toISOString(),
    };

    setIntakeRecords((prev) => [newRecord, ...prev]);
    dbAddIntake(newRecord);
    showToast(`Đã tiếp nhận hồ sơ học viên ${data.full_name} vào danh sách chờ xếp lớp!`);
  };

  const editIntakeRecord = (id: string, data: { full_name: string; phone: string; course_id: string; total_sessions: number }) => {
    const course = courses.find((c) => c.id === data.course_id);
    const updated = {
      full_name: data.full_name,
      phone: data.phone,
      course_id: data.course_id,
      course_name: course ? course.name : 'Chưa xác định',
      total_sessions: data.total_sessions,
      updated_at: new Date().toISOString(),
    };
    setIntakeRecords((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updated,
            }
          : item
      )
    );
    dbUpdateIntake(id, updated);
    showToast('Đã cập nhật thông tin học viên thành công!');
  };

  const assignClassToIntake = (intakeId: string, classId: string) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) {
      showToast('Không tìm thấy lớp học được chọn', 'error');
      return;
    }

    const updatedData = {
      status: 'assigned_class' as const,
      assigned_class_id: targetClass.id,
      assigned_class_code: targetClass.code,
      assigned_class_name: targetClass.name,
      assigned_teacher_name: targetClass.teacher_name,
      updated_at: new Date().toISOString(),
    };

    setIntakeRecords((prev) =>
      prev.map((item) => {
        if (item.id === intakeId) {
          return {
            ...item,
            ...updatedData,
          };
        }
        return item;
      })
    );
    dbUpdateIntake(intakeId, updatedData);
    showToast(`Đã xếp lớp ${targetClass.code} thành công! Hồ sơ chuyển sang bước Cấp tài khoản.`);
  };

  // Cấp tài khoản: Học viên nào đã cấp tài khoản rồi thì không hiện thông tin trong tab chờ xếp lớp nữa
  const generateAccountForIntake = (intakeId: string) => {
    const intake = intakeRecords.find((r) => r.id === intakeId);
    if (!intake) {
      showToast('Không tìm thấy hồ sơ học viên', 'error');
      return { username: '', tempPass: '', studentCode: '' };
    }

    const studentCode = generateStudentCode(students.length);
    const username = intake.phone;
    const tempPass = Math.floor(100000 + Math.random() * 900000).toString();

    const newProfile: Profile = {
      id: `p-${Date.now()}`,
      email: `${username}@ta.edu.vn`,
      username: username,
      full_name: intake.full_name,
      role: 'student',
      phone: intake.phone,
      student_code: studentCode,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      profile_id: newProfile.id,
      full_name: intake.full_name,
      phone: intake.phone,
      student_code: studentCode,
      course_id: intake.course_id,
      course_name: intake.course_name,
      class_id: intake.assigned_class_id,
      class_code: intake.assigned_class_code,
      class_name: intake.assigned_class_name,
      total_registered_sessions: intake.total_sessions,
      completed_sessions: 0,
      remaining_sessions: intake.total_sessions,
      absent_sessions: 0,
      status: 'active',
      intake_date: intake.created_at,
      created_at: new Date().toISOString(),
    };

    if (intake.assigned_class_id) {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === intake.assigned_class_id ? { ...c, student_count: c.student_count + 1 } : c
        )
      );
    }

    const isMilestone = intake.course_name.includes('Model Kids') || intake.course_name.includes('Catwalk');
    const newBenefit: StudentBenefit = {
      id: `ben-${Date.now()}`,
      student_id: newStudent.id,
      student_name: newStudent.full_name,
      student_code: studentCode,
      class_code: intake.assigned_class_code || '',
      course_name: intake.course_name,
      drive_link: '',
      status: 'in_progress',
      is_milestone_17: isMilestone,
      completed_sessions: 0,
      total_registered_sessions: intake.total_sessions,
      absent_sessions: 0,
      overdue_days: 0,
      completed_date: '',
    };

    // Đánh dấu completed và xóa học viên khỏi phễu chờ xếp lớp theo đúng yêu cầu!
    setIntakeRecords((prev) => prev.filter((item) => item.id !== intakeId));

    setProfiles((prev) => [...prev, newProfile]);
    setStudents((prev) => [...prev, newStudent]);
    setBenefits((prev) => [...prev, newBenefit]);

    // Lưu vào Supabase Database
    dbAddProfile(newProfile);
    dbAddStudent(newStudent);
    dbAddBenefit(newBenefit);
    dbDeleteIntake(intakeId);

    showToast(`Đã cấp tài khoản thành công cho học viên ${intake.full_name} (${studentCode})! Học viên đã hoàn tất và được chuyển vào danh sách lớp.`);
    return { username, tempPass, studentCode };
  };

  const addClass = (newClassData: Omit<ClassItem, 'id' | 'student_count' | 'created_at'>) => {
    const classId = `cls-${Date.now()}`;
    const newClass: ClassItem = {
      ...newClassData,
      id: classId,
      student_count: 0,
      created_at: new Date().toISOString(),
    };

    const generatedSessions = generateSessionsForClass(
      classId,
      newClass.code,
      newClass.name,
      newClass.course_name,
      newClass.start_date,
      newClass.days_of_week,
      newClass.start_time,
      newClass.end_time,
      newClass.total_sessions,
      newClass.teacher_id,
      newClass.teacher_name,
      newClass.room
    );

    setClasses((prev) => [newClass, ...prev]);
    setSessions((prev) => [...prev, ...generatedSessions]);

    // Lưu vào Supabase
    dbAddClass(newClass);
    generatedSessions.forEach((s) => dbAddSession(s));

    showToast(`Đã tạo lớp ${newClass.code} và tự động sinh ${generatedSessions.length} buổi học trên Thời khóa biểu!`);
  };

  const editClass = (id: string, data: Partial<ClassItem>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    dbUpdateClass(id, data);
    showToast('Đã cập nhật thông tin lớp học thành công!');
  };

  const deleteClass = (id: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setSessions((prev) => prev.filter((s) => s.class_id !== id));
    dbDeleteClass(id);
    showToast('Đã xóa lớp học và lịch học tương ứng', 'info');
  };

  const addSession = (sessionData: Omit<ClassSession, 'id' | 'status'>) => {
    const newSession: ClassSession = {
      ...sessionData,
      id: `sess-manual-${Date.now()}`,
      status: 'scheduled',
    };
    setSessions((prev) => [...prev, newSession]);
    dbAddSession(newSession);
    showToast(`Đã thêm lịch dạy ${sessionData.session_type === 'private' ? 'kèm 1-1' : 'lớp nhóm'} thành công!`);
  };

  const editSession = (id: string, updatedData: Partial<ClassSession>) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s)));
    dbUpdateSession(id, updatedData);
    showToast('Đã cập nhật thông tin buổi học thành công!');
  };

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    dbDeleteSession(sessionId);
    showToast('Đã xóa buổi học khỏi thời khóa biểu (lớp nghỉ)', 'info');
  };

  const saveAttendance = (
    sessionId: string,
    classId: string,
    records: { student_id: string; student_name: string; student_code: string; status: AttendanceStatus; notes?: string }[]
  ) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'completed' } : s))
    );

    const newAttendanceList: AttendanceRecord[] = records.map((item) => ({
      id: `att-${sessionId}-${item.student_id}`,
      session_id: sessionId,
      class_id: classId,
      student_id: item.student_id,
      student_name: item.student_name,
      student_code: item.student_code,
      status: item.status,
      notes: item.notes,
      marked_at: new Date().toISOString(),
      marked_by: currentUser.id,
    }));

    setAttendance((prev) => {
      const filtered = prev.filter((r) => r.session_id !== sessionId);
      return [...filtered, ...newAttendanceList];
    });

    dbSaveAttendance(newAttendanceList);

    records.forEach((rec) => {
      if (rec.status === 'present') {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === rec.student_id
              ? {
                  ...s,
                  completed_sessions: s.completed_sessions + 1,
                  remaining_sessions: Math.max(0, s.remaining_sessions - 1),
                }
              : s
          )
        );
        setBenefits((prev) =>
          prev.map((b) =>
            b.student_id === rec.student_id
              ? {
                  ...b,
                  completed_sessions: b.completed_sessions + 1,
                  remaining_sessions: Math.max(0, b.total_registered_sessions - (b.completed_sessions + 1)),
                }
              : b
          )
        );
      } else if (rec.status === 'absent') {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === rec.student_id
              ? { ...s, absent_sessions: (s.absent_sessions || 0) + 1 }
              : s
          )
        );
        setBenefits((prev) =>
          prev.map((b) =>
            b.student_id === rec.student_id
              ? { ...b, absent_sessions: b.absent_sessions + 1 }
              : b
          )
        );
      }
    });

    const targetSession = sessions.find((s) => s.id === sessionId);
    const sessionNum = targetSession ? targetSession.session_number : 1;
    const plan = lessonPlans.find((lp) => lp.session_number === sessionNum);

    setAssignments((prev) => {
      const exists = prev.some((a) => a.session_number === sessionNum && a.class_id === classId);
      if (exists) {
        return prev.map((a) =>
          a.session_number === sessionNum && a.class_id === classId ? { ...a, is_unlocked: true } : a
        );
      } else if (plan) {
        const newAsg: Assignment = {
          id: `asg-${classId}-${sessionNum}`,
          class_id: classId,
          session_id: sessionId,
          session_number: sessionNum,
          title: plan.homework_title,
          description: plan.homework_desc,
          requirements: ['Thực hiện video theo đúng giáo án', 'Tải lên Google Drive'],
          notes: `Hạn nộp bài sau ${plan.homework_due_days} ngày kể từ buổi học.`,
          due_date: new Date(Date.now() + plan.homework_due_days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          is_unlocked: true,
          created_at: new Date().toISOString(),
        };
        return [...prev, newAsg];
      }
      return prev;
    });

    // Cập nhật trạng thái buổi học vào Supabase
    dbUpdateSession(sessionId, { status: 'completed' });

    showToast('Đã lưu dữ liệu điểm danh và mở khóa bài tập buổi học này!');
  };

  const saveEvaluation = (data: Omit<StudentEvaluation, 'id' | 'created_at' | 'updated_at'>) => {
    const existingIndex = evaluations.findIndex(
      (e) => e.student_id === data.student_id && e.session_date === data.session_date
    );

    if (existingIndex >= 0) {
      setEvaluations((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, content: data.content, updated_at: new Date().toISOString() }
            : item
        )
      );
      showToast('Đã cập nhật đánh giá buổi học thành công!');
    } else {
      const newEval: StudentEvaluation = {
        ...data,
        id: `eval-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setEvaluations((prev) => [newEval, ...prev]);
      dbSaveEvaluation(newEval);
      showToast('Đã lưu nhận xét đánh giá học viên thành công!');
    }
  };

  const submitHomework = (assignmentId: string, studentId: string, studentName: string, link: string) => {
    const newSub: AssignmentSubmission = {
      id: `sub-${Date.now()}`,
      assignment_id: assignmentId,
      student_id: studentId,
      student_name: studentName,
      submission_link: link,
      submission_date: new Date().toISOString(),
      status: 'submitted',
    };
    setSubmissions((prev) => [newSub, ...prev.filter((s) => s.assignment_id !== assignmentId || s.student_id !== studentId)]);
    dbSubmitHomework(newSub);
    showToast('Đã nộp link bài tập thành công!');
  };

  const saveHomeworkFeedback = (assignmentId: string, studentId: string, feedback: string) => {
    let subId = '';
    setSubmissions((prev) => {
      const existing = prev.find((s) => s.assignment_id === assignmentId && s.student_id === studentId);
      if (existing) {
        subId = existing.id;
        return prev.map((s) =>
          s.id === existing.id
            ? { ...s, teacher_feedback: feedback, status: 'reviewed', reviewed_at: new Date().toISOString() }
            : s
        );
      }
      const studentObj = students.find((st) => st.id === studentId);
      const newSub: AssignmentSubmission = {
        id: `sub-${Date.now()}`,
        assignment_id: assignmentId,
        student_id: studentId,
        student_name: studentObj?.full_name || 'Học viên',
        submission_link: '',
        submission_date: new Date().toISOString(),
        status: 'reviewed',
        teacher_feedback: feedback,
        reviewed_at: new Date().toISOString(),
      };
      subId = newSub.id;
      return [newSub, ...prev];
    });
    if (subId) {
      dbSaveHomeworkFeedback(subId, feedback);
    }
    showToast('Đã lưu nhận xét bài tập thành công!');
  };

  const updateBenefit = (id: string, data: { drive_link?: string; status?: 'completed' | 'in_progress' | 'overdue'; completed_date?: string }) => {
    setBenefits((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...data } : b))
    );
    dbUpdateBenefit(id, data);
    showToast('Đã cập nhật quyền lợi & link Drive cho học viên!');
  };

  const addLessonPlan = (planData: Omit<LessonPlan, 'id'>) => {
    const newPlan: LessonPlan = {
      ...planData,
      id: `lp-${Date.now()}`,
    };
    setLessonPlans((prev) => [...prev, newPlan]);
    dbAddLessonPlan(newPlan);
    showToast(`Đã thêm buổi học ${newPlan.session_number}: ${newPlan.title} vào giáo án!`);
  };

  const editLessonPlan = (id: string, data: Partial<LessonPlan>) => {
    setLessonPlans((prev) => prev.map((lp) => (lp.id === id ? { ...lp, ...data } : lp)));
    dbUpdateLessonPlan(id, data);
    showToast('Đã cập nhật nội dung giáo án và bài tập về nhà!');
  };

  const deleteLessonPlan = (id: string) => {
    setLessonPlans((prev) => prev.filter((p) => p.id !== id));
    dbDeleteLessonPlan(id);
    showToast('Đã xóa buổi học khỏi giáo án!');
  };

  const batchImportLessonPlans = (
    courseId: string,
    courseName: string,
    plans: Array<{ session_number: number; title: string; content: string; homework_title: string; homework_desc: string; homework_due_days: number }>,
    overwrite = true
  ) => {
    const newPlans: LessonPlan[] = plans.map((p, idx) => ({
      id: `lp-${Date.now()}-${idx}`,
      course_id: courseId,
      course_name: courseName,
      session_number: p.session_number,
      title: p.title || `Buổi ${p.session_number}: ${p.content.slice(0, 30)}...`,
      content: p.content,
      homework_title: p.homework_title || `Bài tập buổi ${p.session_number}`,
      homework_desc: p.homework_desc || 'Thực hành theo hướng dẫn giáo án',
      homework_due_days: p.homework_due_days || 4,
    }));

    setLessonPlans((prev) => {
      const remaining = overwrite ? prev.filter((lp) => lp.course_id !== courseId && lp.course_name !== courseName) : prev;
      return [...remaining, ...newPlans];
    });

    dbBatchImportLessonPlans(courseId, newPlans, overwrite);
    showToast(`Đã tải lên và lưu ${newPlans.length} buổi học cho khóa ${courseName}!`);
  };

  const toggleLockUser = (userId: string) => {
    let nextStatus: 'active' | 'locked' = 'active';
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === userId) {
          const newStatus = p.status === 'locked' ? 'active' : 'locked';
          nextStatus = newStatus;
          showToast(`Đã ${newStatus === 'locked' ? 'khóa' : 'mở khóa'} tài khoản ${p.full_name}`);
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
    dbUpdateProfile(userId, { status: nextStatus });
  };

  const resetUserPassword = (userId: string): string => {
    const newPass = Math.floor(100000 + Math.random() * 900000).toString();
    showToast(`Mật khẩu mới đã được đặt lại: ${newPass}`);
    return newPass;
  };

  const deleteUser = (userId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== userId));
    dbDeleteProfile(userId);
    showToast('Đã xóa tài khoản khỏi hệ thống', 'info');
  };

  const createNewAccount = (data: { full_name: string; username: string; role: 'admin' | 'teacher' | 'student'; phone: string; email: string }) => {
    const newProfile: Profile = {
      id: `p-${Date.now()}`,
      email: data.email,
      username: data.username,
      full_name: data.full_name,
      role: data.role,
      phone: data.phone,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProfiles((prev) => [...prev, newProfile]);
    dbAddProfile(newProfile);
    showToast(`Đã cấp tài khoản mới cho ${data.full_name}!`);
  };

  const addCourse = (courseData: Omit<Course, 'id' | 'created_at'>) => {
    const newCourse: Course = {
      ...courseData,
      id: `c-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setCourses((prev) => [...prev, newCourse]);
    dbAddCourse(newCourse);
    showToast(`Đã tạo khóa học ${newCourse.name} thành công!`);
  };

  const editCourse = (id: string, courseData: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...courseData } : c)));
    dbUpdateCourse(id, courseData);
    showToast('Đã cập nhật thông tin khóa học thành công!');
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    dbDeleteCourse(id);
    showToast('Đã xóa khóa học', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        login,
        logout,
        profiles,
        courses,
        classes,
        students,
        intakeRecords,
        sessions,
        attendance,
        assignments,
        submissions,
        evaluations,
        benefits,
        lessonPlans,
        addIntakeRecord,
        editIntakeRecord,
        assignClassToIntake,
        generateAccountForIntake,
        addClass,
        editClass,
        deleteClass,
        addSession,
        editSession,
        deleteSession,
        saveAttendance,
        saveEvaluation,
        submitHomework,
        saveHomeworkFeedback,
        updateBenefit,
        addLessonPlan,
        editLessonPlan,
        deleteLessonPlan,
        batchImportLessonPlans,
        toggleLockUser,
        resetUserPassword,
        deleteUser,
        createNewAccount,
        addCourse,
        editCourse,
        deleteCourse,
        isSupabaseConfigured,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
