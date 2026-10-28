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
} from 'lucide-react';
import { useApp } from '@/lib/store';

export default function StudentPortal() {
  const { students, assignments, submissions, submitHomework, evaluations, showToast } = useApp();

  // Mặc định lấy học viên đầu tiên (Lê Hoàng Thu Thảo - K98)
  const student = students[0];

  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('asg-01');

  // Bài tập hôm nay
  const todayAssignment = assignments[0];

  // Kiểm tra đã nộp chưa
  const todaySubmission = submissions.find(
    (s) => s.assignment_id === todayAssignment?.id && s.student_id === student?.id
  );

  // Đánh giá / nhận xét của giáo viên cho học viên này
  const teacherEvaluation = evaluations.find((e) => e.student_id === student?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrlInput.trim()) {
      showToast('Vui lòng dán đường link Google Drive của bài làm', 'error');
      return;
    }

    if (student) {
      submitHomework(selectedAssignmentId, student.id, student.full_name, driveUrlInput.trim());
      setDriveUrlInput('');
      setShowSubmitModal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Phần banner đỏ chuẩn ảnh mẫu 7 */}
      <div className="bg-gradient-to-r from-brand-dark via-brand-500 to-red-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white font-extrabold text-xl flex items-center justify-center border border-white/20 shadow-inner">
            LT
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
              Khóa đào tạo: <strong>{student?.course_name || 'Model Kids'}</strong> • Lớp: <strong>{student?.class_name || 'K98 – MODEL KIDS'}</strong>
            </p>
          </div>
        </div>

        {/* Thống kê số buổi */}
        <div className="flex items-center space-x-3 bg-black/20 backdrop-blur-md p-3 rounded-xl border border-white/10 self-start md:self-auto">
          <div className="px-3 text-center border-r border-white/10">
            <span className="text-[10px] text-red-200 uppercase font-bold">Đã hoàn thành</span>
            <div className="text-lg font-extrabold text-white">
              {student?.completed_sessions || 1} / {student?.total_registered_sessions || 16} buổi
            </div>
          </div>
          <div className="px-3 text-center">
            <span className="text-[10px] text-red-200 uppercase font-bold">Số buổi còn lại</span>
            <div className="text-lg font-extrabold text-emerald-300">
              {student?.remaining_sessions || 15} buổi
            </div>
          </div>
        </div>
      </div>

      {/* 2. Card "Bài tập về nhà hôm nay" */}
      {todayAssignment && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-100 gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
              <h2 className="text-lg font-extrabold text-gray-900">Bài tập về nhà hôm nay</h2>
            </div>
            <div className="flex items-center space-x-3 text-xs text-gray-500 font-medium">
              <span>Ngày giao: <strong>26/10/2026</strong></span>
              <span>•</span>
              <span className="text-brand-500 font-bold">Buổi 1</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Nội dung bài tập */}
            <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200 space-y-3">
              <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wide">
                1. Nội dung bài tập: {todayAssignment.title}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">{todayAssignment.description}</p>
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-gray-700">Yêu cầu cụ thể:</span>
                <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                  {todayAssignment.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Card Lưu ý */}
            <div className="p-4 rounded-xl bg-red-50/40 border border-red-100 space-y-3">
              <h3 className="font-bold text-xs text-brand-500 uppercase tracking-wide">
                2. Lưu ý & Hướng dẫn thực hiện
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed">{todayAssignment.notes}</p>
              <div className="text-xs text-gray-600 space-y-1 pt-1">
                <p>• Hạn nộp bài: <strong className="text-brand-500">23:59 ngày {todayAssignment.due_date}</strong></p>
                <p>• Hình thức: Tải video lên Google Drive và dán đường link chia sẻ quyền &ldquo;Bất kỳ ai có đường liên kết&rdquo;.</p>
              </div>
            </div>
          </div>

          {/* 3. Khu vực nộp bài qua Google Drive */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-200 shrink-0">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">Link nộp bài qua Google Drive</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  {todaySubmission
                    ? `Đã nộp bài lúc ${new Date(todaySubmission.submission_date).toLocaleTimeString('vi-VN')} ngày ${new Date(todaySubmission.submission_date).toLocaleDateString('vi-VN')}`
                    : 'Học viên vui lòng dán liên kết video bài làm trên Google Drive để giáo viên chấm điểm.'}
                </p>
                {todaySubmission && (
                  <a
                    href={todaySubmission.submission_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-blue-700 hover:underline mt-1"
                  >
                    <span>Xem lại bài đã nộp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedAssignmentId(todayAssignment.id);
                setShowSubmitModal(true);
              }}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-200 transition-all hover:scale-[1.02] shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{todaySubmission ? 'Cập nhật lại bài nộp' : 'Nộp bài qua Google Drive'}</span>
            </button>
          </div>

          {/* Nhận xét của giáo viên nếu có */}
          {teacherEvaluation && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Nhận xét của giáo viên ({teacherEvaluation.created_by}):</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                {teacherEvaluation.content}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Danh sách các bài tập về nhà trong khóa học */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-gray-900">
          Các bài tập về nhà trong khóa học ({student?.course_name || 'Model Kids'})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card Buổi 1 */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Buổi 1 • Đã mở
              </span>
              <span className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Đã nộp bài</span>
              </span>
            </div>
            <h4 className="font-bold text-xs text-gray-900">Quay video thực hành dáng đi Runway cơ bản</h4>
            <p className="text-[11px] text-gray-500 line-clamp-2">
              Luyện tập 10 bước đi Runway thẳng hàng, kết hợp đánh tay và tạo dáng pose 3s.
            </p>
          </div>

          {/* Card Buổi 2 */}
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/20 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-500">
                Buổi 2 • Đang mở
              </span>
              <span className="text-[11px] font-bold text-brand-500">Hạn: 04/11</span>
            </div>
            <h4 className="font-bold text-xs text-gray-900">Giải phóng hình thể và biểu cảm gương mặt</h4>
            <p className="text-[11px] text-gray-500 line-clamp-2">
              Thực hành các biểu cảm: Tự tin - Vui tươi - Quyến rũ trước gương.
            </p>
          </div>

          {/* Card Buổi 3 đến 8 khóa */}
          {[3, 4, 5, 6, 7, 8].map((num) => (
            <div
              key={num}
              className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 opacity-60 space-y-2 select-none"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                  Buổi {num}
                </span>
                <span className="text-[11px] text-gray-400 flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Đang khóa</span>
                </span>
              </div>
              <h4 className="font-bold text-xs text-gray-700">Nội dung bài học buổi {num}</h4>
              <p className="text-[11px] text-gray-400">
                Bài tập sẽ tự động mở sau khi hoàn thành buổi học thực tế trên lớp.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal nộp link bài tập */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="font-extrabold text-gray-900 text-base mb-2">
              Nộp bài tập qua Google Drive
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Vui lòng dán liên kết thư mục hoặc file video bài làm đã được chia sẻ trên Google Drive.
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
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200"
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
