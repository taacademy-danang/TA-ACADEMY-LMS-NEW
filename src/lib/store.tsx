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
} from './initialData';
import { generateStudentCode, generateSessionsForClass } from './utils';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  // Current session
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;

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

  // Intake workflow
  addIntakeRecord: (data: { full_name: string; phone: string; course_id: string; total_sessions: number }) => void;
  assignClassToIntake: (intakeId: string, classId: string) => void;
  generateAccountForIntake: (intakeId: string) => { username: string; tempPass: string; studentCode: string };

  // Class & Schedule workflow
  addClass: (newClass: Omit<ClassItem, 'id' | 'student_count' | 'created_at'>) => void;
  deleteSession: (sessionId: string) => void;

  // Attendance workflow
  saveAttendance: (sessionId: string, classId: string, records: { student_id: string; student_name: string; student_code: string; status: AttendanceStatus; notes?: string }[]) => void;

  // Evaluation workflow
  saveEvaluation: (data: Omit<StudentEvaluation, 'id' | 'created_at' | 'updated_at'>) => void;

  // Assignment workflow
  submitHomework: (assignmentId: string, studentId: string, studentName: string, link: string) => void;

  // Account management
  toggleLockUser: (userId: string) => void;
  resetUserPassword: (userId: string) => string;
  deleteUser: (userId: string) => void;
  createNewAccount: (data: { full_name: string; username: string; role: 'admin' | 'teacher' | 'student'; phone: string; email: string }) => void;

  // Course management
  addCourse: (course: Omit<Course, 'id' | 'created_at'>) => void;

  // Notification
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile>(initialProfiles[4]); // Default to Lê Hoàng Thu Thảo or Admin
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [classes, setClasses] = useState<ClassItem[]>(initialClasses);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [intakeRecords, setIntakeRecords] = useState<IntakeRecord[]>(initialIntakeRecords);
  const [sessions, setSessions] = useState<ClassSession[]>(initialSessions);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>(initialEvaluations);
  const [benefits, setBenefits] = useState<StudentBenefit[]>(initialBenefits);

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
    showToast(`Đã tiếp nhận hồ sơ học viên ${data.full_name} vào danh sách chờ xếp lớp!`);
  };

  // 2. Xếp lớp cho hồ sơ
  const assignClassToIntake = (intakeId: string, classId: string) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) {
      showToast('Không tìm thấy lớp học được chọn', 'error');
      return;
    }

    setIntakeRecords((prev) =>
      prev.map((item) => {
        if (item.id === intakeId) {
          return {
            ...item,
            status: 'assigned_class',
            assigned_class_id: targetClass.id,
            assigned_class_code: targetClass.code,
            assigned_class_name: targetClass.name,
            assigned_teacher_name: targetClass.teacher_name,
            updated_at: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    showToast(`Đã xếp lớp ${targetClass.code} thành công! Hồ sơ chuyển sang bước Cấp tài khoản.`);
  };

  // 3. Cấp tài khoản và hoàn tất đồng bộ toàn hệ thống
  const generateAccountForIntake = (intakeId: string) => {
    const intake = intakeRecords.find((r) => r.id === intakeId);
    if (!intake) {
      showToast('Không tìm thấy hồ sơ học viên', 'error');
      return { username: '', tempPass: '', studentCode: '' };
    }

    const studentCode = generateStudentCode(students.length);
    const username = intake.phone;
    const tempPass = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Tạo profile
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

    // 2. Tạo student
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
      status: 'active',
      intake_date: intake.created_at,
      created_at: new Date().toISOString(),
    };

    // 3. Tăng sĩ số lớp
    if (intake.assigned_class_id) {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === intake.assigned_class_id ? { ...c, student_count: c.student_count + 1 } : c
        )
      );
    }

    // 4. Tạo quyền lợi học viên
    const newBenefit: StudentBenefit = {
      id: `ben-${Date.now()}`,
      student_id: newStudent.id,
      student_name: newStudent.full_name,
      student_code: studentCode,
      class_code: intake.assigned_class_code || '',
      course_name: intake.course_name,
      total_registered_sessions: intake.total_sessions,
      completed_sessions: 0,
      remaining_sessions: intake.total_sessions,
      absent_sessions: 0,
      reserved_sessions: 0,
      expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
    };

    // Cập nhật trạng thái intake
    setIntakeRecords((prev) =>
      prev.map((item) =>
        item.id === intakeId
          ? {
              ...item,
              status: 'account_created',
              student_code: studentCode,
              account_username: username,
            }
          : item
      )
    );

    setProfiles((prev) => [...prev, newProfile]);
    setStudents((prev) => [...prev, newStudent]);
    setBenefits((prev) => [...prev, newBenefit]);

    showToast(`Đã cấp tài khoản thành công cho học viên ${intake.full_name} (${studentCode})!`);
    return { username, tempPass, studentCode };
  };

  // 4. Thêm lớp mới và tự động sinh lịch học
  const addClass = (newClassData: Omit<ClassItem, 'id' | 'student_count' | 'created_at'>) => {
    const classId = `cls-${Date.now()}`;
    const newClass: ClassItem = {
      ...newClassData,
      id: classId,
      student_count: 0,
      created_at: new Date().toISOString(),
    };

    // Tự sinh các buổi học
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
    showToast(`Đã tạo lớp ${newClass.code} và tự động sinh ${generatedSessions.length} buổi học trên Thời khóa biểu!`);
  };

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast('Đã xóa buổi học khỏi thời khóa biểu', 'info');
  };

  // 5. Lưu điểm danh
  const saveAttendance = (
    sessionId: string,
    classId: string,
    records: { student_id: string; student_name: string; student_code: string; status: AttendanceStatus; notes?: string }[]
  ) => {
    setAttendance((prev) => {
      // Xóa các bản ghi cũ của session này để không bị trùng
      const filtered = prev.filter((r) => r.session_id !== sessionId);
      const newRecords: AttendanceRecord[] = records.map((item) => ({
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
      return [...filtered, ...newRecords];
    });

    // Cập nhật số buổi đã học / vắng trong quyền lợi & hồ sơ học viên
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
                  remaining_sessions: Math.max(0, b.remaining_sessions - 1),
                }
              : b
          )
        );
      } else if (rec.status === 'absent') {
        setBenefits((prev) =>
          prev.map((b) =>
            b.student_id === rec.student_id ? { ...b, absent_sessions: b.absent_sessions + 1 } : b
          )
        );
      }
    });

    showToast('Đã lưu dữ liệu điểm danh thành công!');
  };

  // 6. Lưu đánh giá học viên
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
      showToast('Đã lưu nhận xét đánh giá học viên thành công!');
    }
  };

  // 7. Nộp bài tập học viên
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
    showToast('Đã nộp link bài tập thành công!');
  };

  // 8. Quản lý tài khoản
  const toggleLockUser = (userId: string) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === userId) {
          const newStatus = p.status === 'locked' ? 'active' : 'locked';
          showToast(`Đã ${newStatus === 'locked' ? 'khóa' : 'mở khóa'} tài khoản ${p.full_name}`);
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  const resetUserPassword = (userId: string): string => {
    const newPass = Math.floor(100000 + Math.random() * 900000).toString();
    showToast(`Mật khẩu mới đã được đặt lại: ${newPass}`);
    return newPass;
  };

  const deleteUser = (userId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== userId));
    showToast('Đã vô hiệu hóa tài khoản thành công', 'info');
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
    showToast(`Đã cấp tài khoản mới cho ${data.full_name}!`);
  };

  const addCourse = (courseData: Omit<Course, 'id' | 'created_at'>) => {
    const newCourse: Course = {
      ...courseData,
      id: `c-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setCourses((prev) => [...prev, newCourse]);
    showToast(`Đã tạo khóa học ${newCourse.name} thành công!`);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
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
        addIntakeRecord,
        assignClassToIntake,
        generateAccountForIntake,
        addClass,
        deleteSession,
        saveAttendance,
        saveEvaluation,
        submitHomework,
        toggleLockUser,
        resetUserPassword,
        deleteUser,
        createNewAccount,
        addCourse,
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
