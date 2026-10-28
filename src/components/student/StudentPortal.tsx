'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '@/lib/store';

export default function StudentPortal() {
  const { students, assignments, submissions, submitHomework, evaluations, sessions, lessonPlans, currentUser, showToast } =
    useApp();

  // Tìm hồ sơ học viên hiện tại
  const student =
    students.find(
      (s) => s.phone === currentUser.phone || s.profile_id === currentUser.id
    ) || students[0];

  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('asg-01');

  // Bài tập buổi 1 đang mở
  const activeAssignment = assignments[0] || {
    id: 'asg-01',
    session_number: 1,
    title: 'Dáng đứng thẳng tựa tường định vị trục sống lưng',
    due_date: '2026-10-30',
  };

  // Kiểm tra bài nộp của học viên này
  const activeSubmission = submissions.find(
    (s) => s.assignment_id === activeAssignment.id && (s.student_id === student?.id || s.student_name === student?.full_name)
  );

  const teacherEvaluation = evaluations.find(
    (e) => e.student_id === student?.id || e.student_name === student?.full_name
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrlInput.trim()) {
      showToast('Vui lòng dán đường link Google Drive của bài làm', 'error');
      return;
    }

    if (student && selectedAssignmentId) {
      submitHomework(selectedAssignmentId, student.id, student.full_name, driveUrlInput.trim());
      setDriveUrlInput('');
      setShowSubmitModal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Phần banner đỏ học viên chuẩn 100% Ảnh 3 */}
      <div className="bg-gradient-to-r from-brand-dark via-brand-500 to-red-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white font-extrabold text-xl flex items-center justify-center border border-white/20 shadow-inner">
            TT
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {student?.full_name || 'Lê Hoàng Thu Thảo'}
              </h1>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                {student?.student_code || 'TA-STD-998'}
              </span>
            </div>
            <p className="text-xs text-red-100 mt-1 font-medium">
              Khóa học: <strong>{student?.class_code || 'K98'} – {student?.class_name || 'MODEL KIDS'} – {student?.class_code || 'K98'} ({student?.class_code || 'K98'})</strong>
            </p>
          </div>
        </div>

        {/* 2 pills bên phải chuẩn Ảnh 3: Đã hoàn thành 0/16 buổi | Còn lại 16 buổi */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-xs font-bold text-white shadow-2xs">
            Đã hoàn thành {student?.completed_sessions || 0}/{student?.total_registered_sessions || 16} buổi
          </div>
          <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-xs font-bold text-white shadow-2xs">
            Còn lại {student?.remaining_sessions || 16} buổi
          </div>
        </div>
      </div>

      {/* Thông báo nguyên tắc mở bài tập */}
      <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center space-x-2.5 text-xs text-amber-900 font-medium">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          <strong>Quy tắc học tập:</strong> Không mở khóa bài tập hết cả khóa. Cô giáo điểm danh xong lớp buổi nào thì sẽ hiện bài tập buổi đó để học viên làm và nộp.
        </span>
      </div>

      {/* 2. Card "Bài tập về nhà hôm nay" chuẩn 100% Ảnh 3 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-100 gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
            <h2 className="text-lg font-extrabold text-gray-900">Bài tập về nhà hôm nay</h2>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-bold border border-gray-200">
              Ngày học: 26/10/2026
            </span>
            <span className="px-3 py-1 rounded-full bg-brand-500 text-white font-bold shadow-xs">
              Buổi 1
            </span>
          </div>
        </div>

        {/* 2 Subcards: 1. Nội dung bài tập & 2. Lưu ý */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subcard 1: Nội dung bài tập */}
          <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200 space-y-2.5">
            <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wide flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
              <span>1. Nội dung bài tập</span>
            </h3>
            <p className="font-extrabold text-xs text-brand-500">
              Dáng đứng thẳng tựa tường định vị trục sống lưng
            </p>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Đứng sát lưng vào mặt tường phẳng, các điểm chạm: gót chân, bắp chân, mông, 2 bờ vai và gáy sau đầu.</li>
              <li>Hai vai thả lỏng tự nhiên, không gồng cứng, hai tay buông nhẹ theo thân người.</li>
              <li>Mắt nhìn thẳng về phía trước, cằm song song sàn, duy trì hơi thở đều và nụ cười tự tin trong 3 phút.</li>
            </ul>
          </div>

          {/* Subcard 2: Lưu ý */}
          <div className="p-4 rounded-xl bg-red-50/40 border border-red-100 space-y-2.5">
            <h3 className="font-bold text-xs text-brand-500 uppercase tracking-wide flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
              <span>2. Lưu ý & Hướng dẫn nộp bài</span>
            </h3>
            <ul className="text-xs text-gray-700 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Học viên tự quay video hoặc nhờ phụ huynh quay góc ngang toàn thân để nhìn rõ toàn bộ trục cơ thể.</li>
              <li>Trang phục gọn gàng, ôm dáng (áo thun + quần legging hoặc trang phục tập luyện Model Kids).</li>
              <li>Độ dài video tối thiểu 2 đến 3 phút. Tải lên Google Drive của mình và dán liên kết chia sẻ bên dưới.</li>
              <li>Hạn chót nộp bài: Sau 4 ngày kể từ buổi học (trước 23:59 ngày 30/10/2026).</li>
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
              <h4 className="font-extrabold text-sm text-gray-900">Link nộp bài</h4>
              <p className="text-xs text-gray-600 mt-0.5">
                {activeSubmission
                  ? `Đã nộp bài lúc ${new Date(activeSubmission.submission_date).toLocaleTimeString('vi-VN')} ngày ${new Date(activeSubmission.submission_date).toLocaleDateString('vi-VN')}`
                  : 'Nhấn vào nút bên dưới để nộp bài tập buổi 1'}
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
            onClick={() => {
              setSelectedAssignmentId(activeAssignment.id);
              setShowSubmitModal(true);
            }}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-200 transition-all hover:scale-102 shrink-0 self-start sm:self-auto"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{activeSubmission ? 'Cập nhật lại link bài nộp' : 'Nộp bài qua Google Drive'}</span>
          </button>
        </div>

        {/* Nhận xét từ cô giáo nếu đã được nhận xét */}
        {activeSubmission?.teacher_feedback && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Nhận xét của giáo viên phụ trách:</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed font-semibold pl-6">
              &ldquo;{activeSubmission.teacher_feedback}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* 3. Grid 4 card: Các bài tập về nhà trong khóa học chuẩn 100% Ảnh 3 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-gray-900">
            Các bài tập về nhà trong khóa học
          </h2>
          <span className="text-xs font-semibold text-gray-500">
            Tiến độ: 1/16 buổi đã mở
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card Buổi 1: Đang mở */}
          <div className="p-4 rounded-2xl border border-emerald-200 bg-white shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  Buổi 1
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Đang mở</span>
                </span>
              </div>
              <h4 className="font-extrabold text-xs text-gray-900">
                Dáng đứng thẳng tựa tường định vị trục sống lưng
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">
                Thực hành đứng tựa tường định vị trục xương sống, giữ tư thế chuẩn trong 3 phút.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedAssignmentId(activeAssignment.id);
                setShowSubmitModal(true);
              }}
              className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors text-center"
            >
              {activeSubmission ? 'Đã nộp bài' : 'Nộp bài qua Google Drive'}
            </button>
          </div>

          {/* Card Buổi 2: Đang khóa */}
          <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 opacity-70 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                  Buổi 2
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Đang khóa</span>
                </span>
              </div>
              <h4 className="font-bold text-xs text-gray-700">
                Luyện bước đi theo nhịp nhạc sôi động
              </h4>
              <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3">
                Bật nhạc Model Kids tại nhà và sải bước 15 nhịp đúng phách nhạc.
              </p>
            </div>

            <div className="py-2 text-center text-[11px] font-semibold text-gray-400 bg-gray-100 rounded-xl">
              🔒 Mở sau khi điểm danh buổi 2
            </div>
          </div>

          {/* Card Buổi 3: Đang khóa */}
          <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 opacity-70 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                  Buổi 3
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Đang khóa</span>
                </span>
              </div>
              <h4 className="font-bold text-xs text-gray-700">
                Giải phóng hình thể và biểu cảm gương mặt
              </h4>
              <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3">
                Biểu cảm 3 sắc thái: nụ cười thanh lịch, ánh mắt tự tin, phong thái tỏa sáng.
              </p>
            </div>

            <div className="py-2 text-center text-[11px] font-semibold text-gray-400 bg-gray-100 rounded-xl">
              🔒 Mở sau khi điểm danh buổi 3
            </div>
          </div>

          {/* Card Buổi 4: Đang khóa */}
          <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 opacity-70 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                  Buổi 4
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Đang khóa</span>
                </span>
              </div>
              <h4 className="font-bold text-xs text-gray-700">
                Tương tác tự tin trước ống kính máy quay
              </h4>
              <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3">
                Quay video tự giới thiệu bản thân 1 phút với dáng đứng chuẩn mực.
              </p>
            </div>

            <div className="py-2 text-center text-[11px] font-semibold text-gray-400 bg-gray-100 rounded-xl">
              🔒 Mở sau khi điểm danh buổi 4
            </div>
          </div>
        </div>
      </div>

      {/* Modal nộp link bài tập */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <h3 className="font-extrabold text-gray-900 text-base mb-2">
              Nộp bài tập qua Google Drive
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Vui lòng dán liên kết video bài làm hoặc thư mục đã được bật quyền &ldquo;Bất kỳ ai có đường liên kết&rdquo; trên Google Drive.
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
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200 transition-all hover:scale-102"
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