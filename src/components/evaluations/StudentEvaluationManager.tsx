'use client';

import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  RotateCcw,
  BookOpen,
  Award,
  CheckCircle,
  FileText,
  Filter,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Student } from '@/types';

export default function StudentEvaluationManager() {
  const { students, evaluations, sessions, classes, saveEvaluation, currentUser, showToast } =
    useApp();

  const isStudent = currentUser.role === 'student';
  const isTeacher = currentUser.role === 'teacher';

  const [filterDate, setFilterDate] = useState('2026-10-26');
  const [subTab, setSubTab] = useState<'session' | 'general' | 'history'>('session');
  const [content, setContent] = useState('');

  // Nếu là giáo viên, chỉ lấy các lớp do giáo viên này dạy
  const teacherClasses = classes.filter(
    (c) =>
      !isTeacher ||
      c.teacher_id === currentUser.id ||
      c.teacher_name === currentUser.full_name ||
      c.teacher_name.includes(currentUser.full_name)
  );
  const teacherClassCodes = teacherClasses.map((c) => c.code);

  // Tìm các buổi học diễn ra vào ngày filterDate
  const sessionsOnDate = sessions.filter(
    (s) =>
      s.session_date === filterDate &&
      (!isTeacher || s.teacher_id === currentUser.id || s.teacher_name === currentUser.full_name)
  );
  const activeClassCodesOnDate = sessionsOnDate.map((s) => s.class_code);
  const activeClassIdsOnDate = sessionsOnDate.map((s) => s.class_id);

  // Chỉ lọc những học viên học buổi đó trong ngày được chọn và thuộc lớp của cô giáo
  const studentsOnDate = students.filter((st) => {
    if (isTeacher && !teacherClassCodes.includes(st.class_code || '')) return false;
    return (
      activeClassCodesOnDate.includes(st.class_code) ||
      (st.class_id && activeClassIdsOnDate.includes(st.class_id))
    );
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    studentsOnDate[0]?.id || students[0]?.id || ''
  );

  const activeStudent =
    students.find((s) => s.id === selectedStudentId) || studentsOnDate[0] || students[0];

  const studentEvaluations = evaluations.filter((e) => e.student_id === activeStudent?.id);

  React.useEffect(() => {
    if (activeStudent) {
      const existing = evaluations.find(
        (e) => e.student_id === activeStudent.id && e.session_date === filterDate
      );
      if (existing) {
        setContent(existing.content);
      } else {
        setContent('');
      }
    }
  }, [selectedStudentId, filterDate, evaluations, activeStudent]);

  const handleSave = () => {
    if (isStudent) {
      showToast('Học viên chỉ có quyền xem nhận xét đánh giá', 'error');
      return;
    }

    if (!content.trim()) {
      showToast('Vui lòng nhập nội dung đánh giá trước khi lưu', 'error');
      return;
    }

    if (!activeStudent) return;

    saveEvaluation({
      student_id: activeStudent.id,
      student_name: activeStudent.full_name,
      class_id: activeStudent.class_id || '',
      class_code: activeStudent.class_code || 'K98',
      course_name: activeStudent.course_name || 'Model Kids',
      session_date: filterDate,
      content: content,
      evaluation_type: subTab === 'general' ? 'general' : 'session',
      created_by: currentUser.full_name,
    });
  };

  const handleInsertTag = (openTag: string, closeTag: string) => {
    setContent((prev) => `${prev} ${openTag}nội dung${closeTag} `);
  };

  // NẾU LÀ HỌC VIÊN: Hiển thị giao diện xem đánh giá cá nhân (Read-only)
  if (isStudent) {
    const myStudent =
      students.find(
        (s) => s.phone === currentUser.phone || s.profile_id === currentUser.id
      ) || students[0];
    const myEvals = evaluations.filter(
      (e) => e.student_id === myStudent?.id || e.student_name === myStudent?.full_name
    );

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Đánh Giá & Nhận Xét Của Giáo Viên
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Xem những nhận xét chi tiết sau mỗi buổi học từ cô giáo phụ trách của bạn
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-extrabold text-sm text-gray-900">
              Học viên: {myStudent?.full_name} ({myStudent?.class_code})
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {myEvals.length} nhận xét
            </span>
          </div>

          <div className="space-y-3">
            {myEvals.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-400">
                Chưa có nhận xét nào từ giáo viên.
              </div>
            ) : (
              myEvals.map((ev) => (
                <div key={ev.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-500">Buổi học ngày: {ev.session_date}</span>
                    <span className="text-gray-500 text-[11px] font-semibold">
                      Cô giáo nhận xét: {ev.created_by}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{ev.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // GIAO DIỆN GIÁO VIÊN & ADMIN
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Trái — Danh sách học viên có bộ lọc theo ngày */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2 text-sm font-bold text-gray-900">
              <Users className="w-4 h-4 text-brand-500" />
              <span>{isTeacher ? 'Học viên lớp bạn dạy' : 'Danh sách học viên'}</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-red-50 text-brand-500 border border-red-100">
              {studentsOnDate.length} học viên
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700">
              <Calendar className="w-3.5 h-3.5 text-brand-500" />
              <span>Lọc học viên có lịch học ngày:</span>
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <p className="text-[10px] text-gray-500 font-medium">
              Chỉ hiển thị các bạn có lịch học trong ngày {filterDate}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-2 w-8 text-center">#</th>
                  <th className="py-2.5 px-3">Học viên</th>
                  <th className="py-2.5 px-3">Mã lớp</th>
                  <th className="py-2.5 px-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {studentsOnDate.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400 text-xs">
                      Không có học viên nào có lịch học vào ngày này.
                    </td>
                  </tr>
                ) : (
                  studentsOnDate.map((st, idx) => {
                    const isSelected = st.id === selectedStudentId;
                    return (
                      <tr
                        key={st.id}
                        onClick={() => setSelectedStudentId(st.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-red-50/50' : 'hover:bg-gray-50/60'
                        }`}
                      >
                        <td className="py-3 px-2 text-center text-gray-400 font-bold">{idx + 1}</td>
                        <td
                          className={`py-3 px-3 font-bold ${
                            isSelected ? 'text-brand-500' : 'text-gray-900'
                          }`}
                        >
                          {st.full_name}
                        </td>
                        <td className="py-3 px-3 text-gray-600 font-bold">{st.class_code || 'K98'}</td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentId(st.id);
                            }}
                            className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg text-xs shadow-sm shadow-red-200 transition-colors"
                          >
                            Đánh giá
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

        {/* Panel Phải — Nội dung đánh giá */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-extrabold text-gray-900">
                  {activeStudent?.full_name || 'Chọn học viên'}
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  {activeStudent?.class_code || 'K98'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Khóa đào tạo:{' '}
                <strong className="text-gray-800">{activeStudent?.course_name || 'Model Kids'}</strong>
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setSubTab('session')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  subTab === 'session'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Đánh giá theo buổi
              </button>
              <button
                onClick={() => setSubTab('general')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  subTab === 'general'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Nhận xét chung
              </button>
              <button
                onClick={() => setSubTab('history')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  subTab === 'history'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lịch sử đánh giá
              </button>
            </div>
          </div>

          {subTab !== 'history' ? (
            <div className="space-y-4">
              {subTab === 'session' && (
                <div className="flex items-center space-x-3">
                  <label className="text-xs font-bold text-gray-700">Buổi học ngày:</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="px-3.5 py-2 text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Nội dung đánh giá</label>
                <div className="border border-red-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all bg-white">
                  <div className="flex items-center space-x-1 p-2 bg-gray-50 border-b border-gray-200 text-gray-600 text-xs">
                    <button
                      type="button"
                      onClick={() => handleInsertTag('**', '**')}
                      className="p-1.5 hover:bg-gray-200 rounded text-gray-700"
                      title="In đậm (Bold)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTag('*', '*')}
                      className="p-1.5 hover:bg-gray-200 rounded text-gray-700"
                      title="In nghiêng (Italic)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTag('<u>', '</u>')}
                      className="p-1.5 hover:bg-gray-200 rounded text-gray-700"
                      title="Gạch chân (Underline)"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-px h-4 bg-gray-300 mx-1"></span>
                    <button
                      type="button"
                      onClick={() => setContent((p) => p + '\n- ')}
                      className="p-1.5 hover:bg-gray-200 rounded text-gray-700"
                      title="Danh sách gạch đầu dòng"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setContent((p) => p + '\n1. ')}
                      className="p-1.5 hover:bg-gray-200 rounded text-gray-700"
                      title="Danh sách đánh số"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-px h-4 bg-gray-300 mx-1"></span>
                    <button
                      type="button"
                      onClick={() => setContent('')}
                      className="p-1.5 hover:bg-gray-200 rounded text-gray-700"
                      title="Xóa trắng"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    maxLength={2000}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Nhập nhận xét, đánh giá chi tiết về buổi học của học viên... Ví dụ: thái độ, tiến bộ, điểm mạnh, điểm cần cải thiện, định hướng cho buổi học tiếp theo,..."
                    className="w-full p-4 text-xs text-gray-800 placeholder-gray-400 focus:outline-none resize-none leading-relaxed"
                  />

                  <div className="px-4 py-2 bg-white text-right text-[11px] text-gray-400 font-mono">
                    {content.length}/2000
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold text-brand-500">
                  <FileText className="w-4 h-4 text-brand-500" />
                  <span>Gợi ý nội dung đánh giá</span>
                </div>
                <ul className="text-gray-600 space-y-1.5 list-disc pl-5">
                  <li>Nhận xét tổng thể về thái độ, tinh thần học tập</li>
                  <li>Những tiến bộ nổi bật trong buổi học</li>
                  <li>Điểm cần cải thiện và hướng dẫn thêm</li>
                  <li>Định hướng cho buổi học tiếp theo (nếu có)</li>
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setContent('')}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-200 transition-all hover:scale-[1.02]"
                >
                  Lưu đánh giá
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {studentEvaluations.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400">
                  Học viên này chưa có lịch sử đánh giá nào được lưu.
                </div>
              ) : (
                studentEvaluations.map((ev) => (
                  <div key={ev.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-brand-500">Buổi học ngày: {ev.session_date}</span>
                      <span className="text-gray-400 text-[11px]">Người nhận xét: {ev.created_by}</span>
                    </div>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{ev.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
