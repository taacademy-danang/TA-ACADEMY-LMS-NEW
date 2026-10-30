'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  Lock,
  UploadCloud,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  FileCheck,
  FolderOpen,
  Award,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { formatDate } from '@/lib/utils';

export default function StudentPortal() {
  const {
    students,
    courses,
    classes,
    assignments,
    submissions,
    submitHomework,
    evaluations,
    sessions,
    lessonPlans,
    currentUser,
    showToast,
  } = useApp();

  // Tìm hồ sơ học viên hiện tại chính xác theo Mã học viên, profile_id hoặc số điện thoại
  const student = students.find(
    (s) =>
      (currentUser.student_code && s.student_code === currentUser.student_code) ||
      s.profile_id === currentUser.id ||
      (currentUser.phone && s.phone === currentUser.phone) ||
      s.student_code === currentUser.username
  );

  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Tìm thông tin lớp và khóa học của học viên
  const studentClass = useMemo(() => {
    return classes.find((c) => c.id === student?.class_id || c.code === student?.class_code);
  }, [classes, student]);

  const studentCourse = useMemo(() => {
    return courses.find(
      (c) =>
        c.id === student?.course_id ||
        c.id === studentClass?.course_id ||
        (studentClass && (studentClass.name?.includes(c.code) || studentClass.code?.includes(c.code))) ||
        (student?.course_name && c.name?.toLowerCase() === student.course_name.toLowerCase()) ||
        c.code === 'MK2'
    );
  }, [courses, student, studentClass]);

  // Lấy toàn bộ giáo án & bài tập về nhà của khóa học này từ Supabase / Store
  const coursePlans = useMemo(() => {
    if (!student) return [];

    // 1. Ưu tiên khớp theo course_id hoặc course_name của học viên
    let matched = lessonPlans.filter((lp) => {
      if (studentCourse && (lp.course_id === studentCourse.id || lp.course_name === studentCourse.name)) return true;
      if (student.course_id && lp.course_id === student.course_id) return true;
      if (student.course_name && lp.course_name?.toLowerCase() === student.course_name.toLowerCase()) return true;
      return false;
    });

    // 2. Nếu chưa có, ưu tiên khớp theo MODEL KIDS / MK2
    if (matched.length === 0) {
      matched = lessonPlans.filter(
        (lp) =>
          lp.course_id === 'c-1793240838312' ||
          lp.course_name?.toLowerCase().includes('model kids')
      );
    }

    // 3. Fallback: Lấy tất cả lessonPlans hiện có
    if (matched.length === 0 && lessonPlans.length > 0) {
      matched = lessonPlans;
    }

    return [...matched].sort((a, b) => a.session_number - b.session_number);
  }, [lessonPlans, student, studentCourse]);

  // Số buổi đã mở: Dựa vào số buổi đã học / điểm danh của học viên (mặc định ít nhất buổi 1 đang mở)
  const maxOpenSession = Math.max(1, student?.completed_sessions || 0);

  // Buổi học đang được chọn xem bài tập
  const [selectedSessionNumber, setSelectedSessionNumber] = useState<number>(1);

  useEffect(() => {
    if (student) {
      setSelectedSessionNumber(Math.max(1, student.completed_sessions || 0));
    }
  }, [student?.completed_sessions]);

  // Giáo án & bài tập của buổi đang chọn
  const activePlan = useMemo(() => {
    return (
      coursePlans.find((p) => p.session_number === selectedSessionNumber) ||
      coursePlans[0] ||
      null
    );
  }, [coursePlans, selectedSessionNumber]);

  // ID của bài tập cho buổi đang chọn
  const activeAssignmentId = activePlan
    ? `asg-${activePlan.course_id || 'course'}-${activePlan.session_number}`
    : `asg-${selectedSessionNumber}`;

  // Kiểm tra bài nộp của học viên cho buổi đang chọn
  const activeSubmission = submissions.find(
    (s) =>
      (s.assignment_id === activeAssignmentId ||
        s.assignment_id.endsWith(`-${selectedSessionNumber}`) ||
        (selectedSessionNumber === 1 && (s.assignment_id === 'asg-01' || s.assignment_id === 'asg-1'))) &&
      (s.student_id === student?.id || s.student_name === student?.full_name)
  );

  // Tìm buổi học thực tế trong sessions để lấy ngày học
  const activeSessionDate = useMemo(() => {
    const sess = sessions.find(
      (s) =>
        (s.class_id === student?.class_id || s.class_code === student?.class_code) &&
        s.session_number === selectedSessionNumber
    );
    if (sess?.session_date) return formatDate(sess.session_date);
    return '26/10/2026';
  }, [sessions, student, selectedSessionNumber]);

  // Chuyển đổi mô tả bài tập thành các dòng hiển thị đẹp mắt
  const homeworkLines = useMemo(() => {
    if (!activePlan?.homework_desc) {
      return [
        'Thực hành các kỹ thuật đã học trong buổi theo hướng dẫn của cô giáo.',
        'Quay video thực hành và tải lên Google Drive cá nhân để nộp link.',
      ];
    }
    return activePlan.homework_desc
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }, [activePlan]);

  // Avatar viết tắt 2 chữ cái đầu
  const userInitials = useMemo(() => {
    if (!student?.full_name) return 'TA';
    const words = student.full_name.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  }, [student?.full_name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrlInput.trim()) {
      showToast('Vui lòng dán đường link Google Drive của bài làm', 'error');
      return;
    }

    if (student) {
      submitHomework(activeAssignmentId, student.id, student.full_name, driveUrlInput.trim());
      setDriveUrlInput('');
      setShowSubmitModal(false);
      showToast(`Đã nộp bài tập Buổi ${selectedSessionNumber} thành công!`, 'success');
    }
  };

  if (!student) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-2xl mx-auto space-y-3">
        <AlertCircle className="w-10 h-10 text-brand-500 mx-auto" />
        <h2 className="text-base font-extrabold text-gray-900">Chưa tìm thấy hồ sơ học viên</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          Tài khoản này chưa được liên kết với hồ sơ học viên trong lớp đào tạo nào. Vui lòng liên hệ ban quản trị học viện T.A để được xếp lớp và cấp quyền.
        </p>
      </div>
    );
  }

  const totalSessionsCount = coursePlans.length || student.total_registered_sessions || 20;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Phần banner đỏ học viên chuẩn 100% Ảnh 3 */}
      <div className="bg-gradient-to-r from-brand-dark via-brand-500 to-red-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white font-extrabold text-xl flex items-center justify-center border border-white/20 shadow-inner shrink-0">
            {userInitials}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {student.full_name}
              </h1>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                {student.student_code || 'Chờ cấp mã'}
              </span>
            </div>
            <p className="text-xs text-red-100 mt-1 font-medium">
              Khóa học:{' '}
              <strong>
                {student.class_code || 'Lớp'} – {student.class_name || student.course_name || 'MODEL KIDS'} ({studentCourse?.code || 'MK2'})
              </strong>
            </p>
          </div>
        </div>

        {/* 2 pills bên phải: Đã hoàn thành X/Y buổi | Còn lại Z buổi */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-xs font-bold text-white shadow-2xs">
            Đã hoàn thành {student.completed_sessions || 0}/{totalSessionsCount} buổi
          </div>
          <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-xs font-bold text-white shadow-2xs">
            Còn lại {student.remaining_sessions ?? (totalSessionsCount - (student.completed_sessions || 0))} buổi
          </div>
        </div>
      </div>

      {/* Thông báo nguyên tắc mở bài tập */}
      <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center space-x-2.5 text-xs text-amber-900 font-medium">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          <strong>Quy tắc học tập:</strong> Không mở khóa bài tập hết cả khóa. Cô giáo điểm danh xong lớp buổi nào thì sẽ tự động mở bài tập buổi đó để học viên làm và nộp.
        </span>
      </div>

      {/* 2. Card "Bài tập về nhà" theo buổi được chọn */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-100 gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
            <h2 className="text-lg font-extrabold text-gray-900">
              Bài tập về nhà Buổi {selectedSessionNumber}
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-bold border border-gray-200">
              Ngày học: {activeSessionDate}
            </span>
            <span className="px-3 py-1 rounded-full bg-brand-500 text-white font-bold shadow-xs">
              Buổi {selectedSessionNumber}
            </span>
            {activeSubmission ? (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                ✓ Đã nộp bài
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
                Chưa nộp bài
              </span>
            )}
          </div>
        </div>

        {/* 2 Subcards: 1. Nội dung bài tập & 2. Lưu ý */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subcard 1: Nội dung bài tập (Cập nhật từ Giáo án đã lưu) */}
          <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200 space-y-2.5">
            <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wide flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
              <span>1. Nội dung bài tập</span>
            </h3>
            <p className="font-extrabold text-sm text-brand-500">
              {activePlan?.homework_title || `Bài tập rèn luyện Buổi ${selectedSessionNumber}`}
            </p>

            {activePlan?.title && (
              <p className="text-xs font-semibold text-gray-700 bg-white p-2 rounded-lg border border-gray-100">
                Chủ đề giáo án: <strong>{activePlan.title}</strong>
              </p>
            )}

            <ul className="text-xs text-gray-700 space-y-1.5 list-disc pl-4 leading-relaxed font-medium">
              {homeworkLines.map((line, idx) => (
                <li key={idx}>
                  {line.startsWith('•') || line.startsWith('-') ? line.slice(1).trim() : line}
                </li>
              ))}
            </ul>
          </div>

          {/* Subcard 2: Lưu ý & Hướng dẫn nộp bài */}
          <div className="p-4 rounded-xl bg-red-50/40 border border-red-100 space-y-2.5">
            <h3 className="font-bold text-xs text-brand-500 uppercase tracking-wide flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
              <span>2. Lưu ý & Hướng dẫn nộp bài</span>
            </h3>
            <ul className="text-xs text-gray-700 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Học viên tự quay video hoặc nhờ phụ huynh quay góc ngang toàn thân để nhìn rõ toàn bộ trục cơ thể.</li>
              <li>Trang phục gọn gàng, ôm dáng (áo thun + quần legging hoặc trang phục tập luyện Model Kids / T.A Academy).</li>
              <li>Độ dài video tối thiểu 1 đến 3 phút. Tải lên Google Drive cá nhân và dán liên kết chia sẻ bên dưới (chọn chế độ &ldquo;Bất kỳ ai có đường liên kết&rdquo;).</li>
              <li>
                Hạn chót nộp bài: Sau{' '}
                <strong className="text-brand-500">{activePlan?.homework_due_days || 4} ngày</strong> kể từ buổi học.
              </li>
            </ul>
          </div>
        </div>

        {/* Subcard 3: Link nộp bài qua Google Drive */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-200 shrink-0">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-gray-900">Link nộp bài qua Google Drive</h4>
              <p className="text-xs text-gray-600 mt-0.5">
                {activeSubmission
                  ? `Đã nộp bài lúc ${new Date(activeSubmission.submission_date).toLocaleTimeString('vi-VN')} ngày ${new Date(activeSubmission.submission_date).toLocaleDateString('vi-VN')}`
                  : `Nhấn vào nút bên dưới để nộp bài tập Buổi ${selectedSessionNumber}`}
              </p>
              {activeSubmission && (
                <a
                  href={activeSubmission.submission_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-xs font-bold text-blue-700 hover:underline mt-1"
                >
                  <span>Xem link bài đã nộp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-200 transition-all hover:scale-102 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{activeSubmission ? 'Cập nhật lại link bài nộp' : 'Nộp bài qua Google Drive'}</span>
          </button>
        </div>

        {/* Nhận xét CHUYÊN BIỆT cho Bài tập về nhà (khi giáo viên chấm bài) */}
        {activeSubmission?.teacher_feedback && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Lời nhận xét chấm bài tập về nhà của cô giáo:</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed font-semibold pl-6">
              &ldquo;{activeSubmission.teacher_feedback}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* 3. Grid: Toàn bộ danh sách bài tập về nhà theo giáo án khóa học (Động 100%) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-gray-900">
              Các bài tập về nhà trong khóa học ({studentCourse?.code ? `${studentCourse.code} – ` : ''}{studentCourse?.name || student.course_name || 'MODEL KIDS'})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Nhấn vào từng buổi để xem chi tiết bài tập và nộp bài
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-50 text-brand-500 border border-brand-200 self-start sm:self-auto">
            Tiến độ: {Math.min(maxOpenSession, totalSessionsCount)}/{totalSessionsCount} buổi đã mở
          </span>
        </div>

        {coursePlans.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
            Chưa có giáo án bài tập nào được tải lên cho khóa học này.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {coursePlans.map((plan) => {
              const isUnlocked = plan.session_number <= maxOpenSession;
              const isSelected = plan.session_number === selectedSessionNumber;

              const planAssignmentId = `asg-${plan.course_id || 'course'}-${plan.session_number}`;
              const planSubmission = submissions.find(
                (s) =>
                  (s.assignment_id === planAssignmentId ||
                    s.assignment_id.endsWith(`-${plan.session_number}`) ||
                    (plan.session_number === 1 && (s.assignment_id === 'asg-01' || s.assignment_id === 'asg-1'))) &&
                  (s.student_id === student.id || s.student_name === student.full_name)
              );

              return (
                <div
                  key={plan.id || plan.session_number}
                  onClick={() => {
                    if (isUnlocked) {
                      setSelectedSessionNumber(plan.session_number);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                    isSelected
                      ? 'border-brand-500 ring-2 ring-brand-500/30 bg-red-50/20 shadow-md'
                      : isUnlocked
                      ? 'border-emerald-200 bg-white hover:border-brand-300 hover:shadow-xs'
                      : 'border-gray-200 bg-gray-50/70 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                        Buổi {plan.session_number}
                      </span>
                      {isUnlocked ? (
                        planSubmission ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Đã nộp</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center space-x-1">
                            <span>Đang mở</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 flex items-center space-x-1">
                          <Lock className="w-3 h-3" />
                          <span>Đang khóa</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-xs text-gray-900 line-clamp-2">
                      {plan.homework_title || plan.title}
                    </h4>

                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">
                      {plan.homework_desc || plan.content || 'Thực hành theo hướng dẫn giáo án.'}
                    </p>
                  </div>

                  {isUnlocked ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSessionNumber(plan.session_number);
                        setShowSubmitModal(true);
                      }}
                      className={`w-full py-2 font-bold text-xs rounded-xl shadow-xs transition-colors text-center cursor-pointer ${
                        planSubmission
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-brand-500 hover:bg-brand-600 text-white'
                      }`}
                    >
                      {planSubmission ? 'Đã nộp bài (Xem lại)' : 'Nộp bài qua Drive'}
                    </button>
                  ) : (
                    <div className="py-2 text-center text-[11px] font-semibold text-gray-400 bg-gray-100 rounded-xl">
                      🔒 Mở sau khi điểm danh buổi {plan.session_number}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal nộp link bài tập */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <h3 className="font-extrabold text-gray-900 text-base mb-1">
              Nộp bài tập Buổi {selectedSessionNumber}
            </h3>
            <p className="text-xs font-semibold text-brand-500 mb-2">
              {activePlan?.homework_title || activePlan?.title || `Bài tập Buổi ${selectedSessionNumber}`}
            </p>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Vui lòng dán liên kết video bài làm hoặc thư mục bài tập đã được bật quyền &ldquo;Bất kỳ ai có đường liên kết&rdquo; trên Google Drive.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Đường dẫn Google Drive <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/..."
                  value={driveUrlInput}
                  onChange={(e) => setDriveUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200 transition-all hover:scale-102 cursor-pointer"
                >
                  Xác nhận nộp bài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
