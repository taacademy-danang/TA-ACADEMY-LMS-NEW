'use client';

import React, { useState, useMemo } from 'react';
import {
  FileEdit,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  BookOpen,
  Calendar,
  User,
  X,
  FileText,
} from 'lucide-react';
import { useApp } from '@/lib/store';

export default function TeacherHomeworkManager() {
  const { classes, sessions, assignments, submissions, students, currentUser, saveHomeworkFeedback, showToast } =
    useApp();

  const isTeacher = currentUser.role === 'teacher';

  // Lọc lớp theo quyền giáo viên / admin
  const availableClasses = useMemo(() => {
    if (isTeacher) {
      const myClasses = classes.filter(
        (c) =>
          c.teacher_id === currentUser.id ||
          c.teacher_name === currentUser.full_name ||
          c.teacher_name.includes(currentUser.full_name)
      );
      return myClasses.length > 0 ? myClasses : classes;
    }
    return classes;
  }, [classes, isTeacher, currentUser]);

  const [selectedClassId, setSelectedClassId] = useState<string>(
    availableClasses[0]?.id || 'cls-k98'
  );

  const selectedClass = availableClasses.find((c) => c.id === selectedClassId) || availableClasses[0];

  // Các buổi học của lớp này
  const classSessions = useMemo(() => {
    return sessions
      .filter((s) => s.class_id === selectedClass?.id || s.class_code === selectedClass?.code)
      .sort((a, b) => a.session_number - b.session_number);
  }, [sessions, selectedClass]);

  const [selectedSessionNumber, setSelectedSessionNumber] = useState<number>(1);

  // Buổi học được chọn
  const activeSession =
    classSessions.find((s) => s.session_number === selectedSessionNumber) ||
    classSessions[0] || {
      id: 'sess-01',
      session_number: 1,
      session_date: '2026-10-26',
      start_time: '17:30',
      end_time: '19:00',
      teacher_name: selectedClass?.teacher_name || 'Khấu Thị Nga',
    };

  // Bài tập của buổi này
  const activeAssignment = assignments.find(
    (a) => a.session_number === selectedSessionNumber && (a.class_id === selectedClass?.id || !a.class_id)
  ) || {
    id: `asg-${selectedSessionNumber}`,
    class_id: selectedClass?.id || '',
    session_number: selectedSessionNumber,
    title: 'Dáng đứng thẳng tựa tường định vị trục sống lưng',
    description: 'Học viên quay video 3 phút đứng tự thế và nộp qua link Google Drive.',
    requirements: [
      'Trang phục chỉnh tề, ôm sát dáng người để quan sát rõ trục cơ thể.',
      'Góc máy quay ngang toàn thân, đủ ánh sáng.',
      'Giữ tư thế 3 phút thẳng đứng, mắt nhìn thẳng tự tin.',
    ],
    due_date: '2026-10-30',
    is_unlocked: true,
    created_at: new Date().toISOString(),
  };

  // Danh sách học viên thuộc lớp này
  const classStudents = useMemo(() => {
    const list = students.filter(
      (s) => s.class_id === selectedClass?.id || s.class_code === selectedClass?.code
    );
    return list.length > 0 ? list : students.slice(0, 5);
  }, [students, selectedClass]);

  // Bộ lọc tab & search
  const [filterTab, setFilterTab] = useState<'all' | 'submitted' | 'unsubmitted'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Draft comments lưu tạm cho từng học viên
  const [draftComments, setDraftComments] = useState<Record<string, string>>({});

  // Lấy dữ liệu bài nộp cho từng học viên
  const studentRows = useMemo(() => {
    return classStudents.map((st) => {
      const sub = submissions.find(
        (s) => s.assignment_id === activeAssignment.id && (s.student_id === st.id || s.student_name === st.full_name)
      );

      const isSubmitted = !!sub && !!sub.submission_link;
      const hasFeedback = !!sub?.teacher_feedback?.trim();

      let statusBadge: 'submitted_reviewed' | 'submitted_unreviewed' | 'not_submitted' = 'not_submitted';
      if (isSubmitted) {
        statusBadge = hasFeedback ? 'submitted_reviewed' : 'submitted_unreviewed';
      }

      return {
        student: st,
        submission: sub,
        isSubmitted,
        hasFeedback,
        statusBadge,
        currentComment: draftComments[st.id] !== undefined ? draftComments[st.id] : (sub?.teacher_feedback || ''),
      };
    });
  }, [classStudents, submissions, activeAssignment.id, draftComments]);

  // Lọc theo tabs & search
  const filteredRows = useMemo(() => {
    return studentRows.filter((row) => {
      if (filterTab === 'submitted' && !row.isSubmitted) return false;
      if (filterTab === 'unsubmitted' && row.isSubmitted) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          row.student.full_name.toLowerCase().includes(term) ||
          row.student.student_code.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [studentRows, filterTab, searchTerm]);

  const submittedCount = studentRows.filter((r) => r.isSubmitted).length;
  const unsubmittedCount = studentRows.filter((r) => !r.isSubmitted).length;

  const handleCommentChange = (studentId: string, value: string) => {
    if (value.length <= 500) {
      setDraftComments((prev) => ({ ...prev, [studentId]: value }));
    }
  };

  const handleSaveComment = (studentId: string) => {
    const textToSave = draftComments[studentId];
    if (textToSave === undefined) {
      showToast('Nội dung nhận xét chưa có thay đổi mới', 'info');
      return;
    }
    saveHomeworkFeedback(activeAssignment.id, studentId, textToSave);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header chính chuẩn Ảnh 5 */}
      <div className="flex items-center space-x-3.5">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-red-200 shrink-0">
          <FileEdit className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Bài tập học viên</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Xem bài tập học viên đã nộp và nhận xét từng buổi học.
          </p>
        </div>
      </div>

      {/* 2. Thanh chọn lớp học & Buổi học */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Lớp học</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Buổi học</label>
            <select
              value={selectedSessionNumber}
              onChange={(e) => setSelectedSessionNumber(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {classSessions.length > 0 ? (
                classSessions.map((s) => (
                  <option key={s.id} value={s.session_number}>
                    Buổi {s.session_number} ({new Date(s.session_date).toLocaleDateString('vi-VN')})
                  </option>
                ))
              ) : (
                <option value={1}>Buổi 1 (26/10/2026)</option>
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={() => showToast('Đã tải lại danh sách nộp bài mới nhất')}
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-200 transition-all hover:scale-102 shrink-0 h-[42px]"
          >
            Tải danh sách
          </button>
        </div>
      </div>

      {/* 3. Banner thông tin buổi học (Thời gian học & Giáo viên phụ trách) */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-blue-900 font-semibold gap-2">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>
            Thời gian học: <strong className="font-extrabold text-blue-950">{activeSession.start_time} - {activeSession.end_time} ({new Date(activeSession.session_date).toLocaleDateString('vi-VN')})</strong>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-blue-600" />
          <span>
            Giáo viên phụ trách: <strong className="font-extrabold text-blue-950">{selectedClass?.teacher_name || 'Khấu Thị Nga'}</strong>
          </span>
        </div>
      </div>

      {/* 4. Card "Bài tập buổi X" */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-brand-500 uppercase tracking-wider">
            Bài tập buổi {selectedSessionNumber}
          </span>
          <h2 className="text-base font-extrabold text-gray-900">{activeAssignment.title}</h2>
          <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
            {activeAssignment.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowDetailModal(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 border border-brand-300 text-brand-500 hover:bg-brand-50 rounded-xl text-xs font-bold transition-colors shrink-0 self-start md:self-auto"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Xem chi tiết bài tập</span>
        </button>
      </div>

      {/* 5. Bộ lọc Tabs (Danh sách học viên, Đã nộp, Chưa nộp) & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'all'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Danh sách học viên ({studentRows.length})
            </button>
            <button
              onClick={() => setFilterTab('submitted')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'submitted'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Đã nộp ({submittedCount})
            </button>
            <button
              onClick={() => setFilterTab('unsubmitted')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'unsubmitted'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Chưa nộp ({unsubmittedCount})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm học viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* 6. Bảng dữ liệu 100% chuẩn Ảnh 5 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[11px] bg-gray-50/50">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-4 min-w-[160px]">Họ và tên</th>
                <th className="py-3 px-3 min-w-[140px]">Trạng thái nộp bài</th>
                <th className="py-3 px-3 min-w-[130px]">Link bài nộp</th>
                <th className="py-3 px-3 min-w-[120px]">Ngày nộp</th>
                <th className="py-3 px-4 min-w-[320px]">Nhận xét bài tập về nhà</th>
                <th className="py-3 px-2 w-10 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                    Không tìm thấy học viên nào phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const student = row.student;
                  const sub = row.submission;
                  const isSubmitted = row.isSubmitted;
                  const commentVal = row.currentComment;

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* # */}
                      <td className="py-4 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>

                      {/* Họ và tên */}
                      <td className="py-4 px-4 font-bold text-gray-900">
                        <div>{student.full_name}</div>
                        <div className="text-[10px] text-gray-400 font-normal">{student.student_code}</div>
                      </td>

                      {/* Trạng thái nộp bài */}
                      <td className="py-4 px-3">
                        {isSubmitted ? (
                          row.statusBadge === 'submitted_reviewed' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Đã nộp</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertCircle className="w-3 h-3" />
                              <span>Đã nộp, chưa nhận xét</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                            <span>Chưa nộp</span>
                          </span>
                        )}
                      </td>

                      {/* Link bài nộp */}
                      <td className="py-4 px-3">
                        {isSubmitted && sub?.submission_link ? (
                          <a
                            href={sub.submission_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                          >
                            <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">
                              📁
                            </span>
                            <span>Xem bài nộp</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Ngày nộp */}
                      <td className="py-4 px-3 text-gray-600 text-[11px]">
                        {isSubmitted && sub?.submission_date ? (
                          <div>
                            <div>{new Date(sub.submission_date).toLocaleDateString('vi-VN')}</div>
                            <div className="text-gray-400">
                              {new Date(sub.submission_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Nhận xét bài tập về nhà: Textarea + Counter + Button Lưu */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <textarea
                            rows={2}
                            maxLength={500}
                            placeholder="Nhập nhận xét bài tập..."
                            value={commentVal}
                            onChange={(e) => handleCommentChange(student.id, e.target.value)}
                            className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all leading-relaxed"
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 font-mono">
                              {commentVal.length}/500
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSaveComment(student.id)}
                              className="px-3.5 py-1 bg-brand-500 hover:bg-brand-600 text-white font-bold text-[11px] rounded-lg shadow-sm shadow-red-200 transition-colors"
                            >
                              Lưu
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-2 text-center">
                        <button
                          type="button"
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Tùy chọn khác"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Xem chi tiết bài tập */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">
                Chi tiết bài tập Buổi {selectedSessionNumber}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <span className="font-bold text-gray-500 uppercase text-[10px]">Tiêu đề:</span>
                <p className="font-extrabold text-sm text-gray-900 mt-0.5">{activeAssignment.title}</p>
              </div>

              <div>
                <span className="font-bold text-gray-500 uppercase text-[10px]">Mô tả bài tập:</span>
                <p className="text-gray-700 mt-0.5 leading-relaxed">{activeAssignment.description}</p>
              </div>

              <div>
                <span className="font-bold text-gray-500 uppercase text-[10px]">Yêu cầu cụ thể:</span>
                <ul className="mt-1 space-y-1 list-disc pl-5 text-gray-700">
                  {activeAssignment.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-brand-700 font-semibold">
                Hạn nộp bài tập: {activeAssignment.due_date}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2 bg-brand-500 text-white text-xs font-bold rounded-xl"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}