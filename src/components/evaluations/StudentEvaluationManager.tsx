'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Calendar,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  RotateCcw,
  Undo2,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Student } from '@/types';

export default function StudentEvaluationManager() {
  const { students, intakeRecords, evaluations, classes, saveEvaluation, currentUser, showToast } = useApp();

  const isStudent = currentUser.role === 'student';
  const isTeacher = currentUser.role === 'teacher';

  const [sessionDate, setSessionDate] = useState('2026-10-26');
  const [subTab, setSubTab] = useState<'session' | 'general' | 'history'>('session');
  const [content, setContent] = useState('');

  // Lọc học viên theo quyền giáo viên / admin
  const teacherClasses = classes.filter(
    (c) =>
      !isTeacher ||
      c.teacher_id === currentUser.id ||
      c.teacher_name === currentUser.full_name ||
      c.teacher_name.includes(currentUser.full_name)
  );
  const teacherClassCodes = teacherClasses.map((c) => c.code);

  const displayStudents = useMemo(() => {
    const list = [...students];
    (intakeRecords || []).forEach((r) => {
      if (
        (r.assigned_class_id || r.assigned_class_code) &&
        !list.some((s) => (s.phone && s.phone === r.phone) || s.full_name.trim().toLowerCase() === r.full_name.trim().toLowerCase())
      ) {
        list.push({
          id: `intake-${r.id}`,
          profile_id: '',
          full_name: r.full_name,
          phone: r.phone,
          student_code: r.student_code || 'Chờ cấp mã',
          course_id: r.course_id,
          course_name: r.course_name,
          class_id: r.assigned_class_id || '',
          class_code: r.assigned_class_code || '',
          class_name: r.assigned_class_name || '',
          total_registered_sessions: r.total_sessions,
          completed_sessions: 0,
          remaining_sessions: r.total_sessions,
          absent_sessions: 0,
          status: 'active',
          intake_date: r.created_at,
          created_at: r.created_at,
        });
      }
    });

    return list.filter((st) => {
      if (isTeacher) {
        return teacherClassCodes.includes(st.class_code || '');
      }
      return true; // Admin thấy tất cả
    });
  }, [students, intakeRecords, isTeacher, teacherClassCodes]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    displayStudents[0]?.id || ''
  );

  const activeStudent =
    displayStudents.find((s) => s.id === selectedStudentId) || displayStudents[0] || null;

  const studentEvaluations = evaluations.filter((e) => e.student_id === activeStudent?.id);

  useEffect(() => {
    if (activeStudent) {
      const existing = evaluations.find(
        (e) => e.student_id === activeStudent.id && e.session_date === sessionDate
      );
      if (existing) {
        setContent(existing.content);
      } else {
        setContent('');
      }
    }
  }, [selectedStudentId, sessionDate, evaluations, activeStudent]);

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
      session_date: sessionDate,
      content: content,
      evaluation_type: subTab === 'general' ? 'general' : 'session',
      created_by: currentUser.full_name,
    });
  };

  const handleInsertTag = (prefix: string, suffix: string = '') => {
    setContent((prev) => `${prev} ${prefix}nội dung${suffix} `);
  };

  // NẾU LÀ HỌC VIÊN: Xem đánh giá cá nhân (Read-only)
  if (isStudent) {
    const myStudent = students.find(
      (s) =>
        (currentUser.student_code && s.student_code === currentUser.student_code) ||
        s.profile_id === currentUser.id ||
        (currentUser.phone && s.phone === currentUser.phone) ||
        s.student_code === currentUser.username
    );
    const myEvals = evaluations.filter(
      (e) =>
        (myStudent?.id && e.student_id === myStudent.id) ||
        (myStudent?.full_name && e.student_name === myStudent.full_name)
    );

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-brand-dark to-brand-500 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Hồ sơ Đánh giá & Nhận xét</h1>
            <p className="text-xs text-red-100 mt-1">
              Xem nhận xét trực tiếp từ giáo viên phụ trách qua từng buổi học
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold border border-white/30">
            Học viên: {myStudent?.full_name}
          </span>
        </div>

        <div className="space-y-4">
          {myEvals.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center text-xs text-gray-500">
              Bạn chưa có nhận xét đánh giá nào từ giáo viên.
            </div>
          ) : (
            myEvals.map((ev) => (
              <div key={ev.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-gray-900">Buổi học ngày: {ev.session_date}</span>
                  </div>
                  <span className="text-gray-500 font-medium">Giáo viên: <strong className="text-brand-500">{ev.created_by}</strong></span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-800 leading-relaxed font-medium">
                  {ev.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // GIAO DIỆN GIÁO VIÊN & ADMIN: CHÍNH XÁC 100% NHƯ ẢNH 4
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Trái — Danh sách học viên chuẩn 100% Ảnh 4 */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-extrabold text-gray-900">
              Danh sách học viên
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-pink-100 text-brand-500 border border-pink-200">
              {displayStudents.length} học viên
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-2 w-8 text-center">#</th>
                  <th className="py-2.5 px-3">Học viên</th>
                  <th className="py-2.5 px-2">Mã lớp</th>
                  <th className="py-2.5 px-2 text-center">Trạng thái</th>
                  <th className="py-2.5 px-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {displayStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400 text-xs">
                      Chưa có học viên nào trong danh sách.
                    </td>
                  </tr>
                ) : (
                  displayStudents.map((st, idx) => {
                    const isSelected = st.id === selectedStudentId;
                    const hasSessionEval = evaluations.some(
                      (e) =>
                        (e.student_id === st.id || e.student_name === st.full_name) &&
                        e.session_date === sessionDate &&
                        e.content &&
                        e.content.trim() !== ''
                    );
                    const hasAnyEval = evaluations.some(
                      (e) => (e.student_id === st.id || e.student_name === st.full_name) && e.content && e.content.trim() !== ''
                    );
                    const isEvaluated = subTab === 'session' ? hasSessionEval : hasAnyEval;

                    return (
                      <tr
                        key={st.id}
                        onClick={() => setSelectedStudentId(st.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-red-50/60' : 'hover:bg-gray-50/60'
                        }`}
                      >
                        <td className="py-3 px-2 text-center text-gray-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-brand-500">
                          {st.full_name}
                        </td>
                        <td className="py-3 px-2 text-gray-800 font-bold">{st.class_code || 'K98'}</td>
                        <td className="py-3 px-2 text-center">
                          {isEvaluated ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] whitespace-nowrap">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Đã đánh giá</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold text-[10px] whitespace-nowrap">
                              Chưa đánh giá
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentId(st.id);
                            }}
                            className={`px-3 py-1.5 font-bold rounded-lg text-xs shadow-xs transition-colors ${
                              isEvaluated
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-brand-500 hover:bg-brand-600 text-white'
                            }`}
                          >
                            {isEvaluated ? 'Sửa' : 'Đánh giá'}
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

        {/* Panel Phải — Đánh giá chi tiết chuẩn 100% Ảnh 4 */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          {/* Header học viên & 3 Tabs */}
          <div className="pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-extrabold text-gray-900">
                  {activeStudent?.full_name || 'Chưa chọn học viên'}
                </h2>
                {activeStudent?.class_code && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    {activeStudent.class_code}
                  </span>
                )}
                {activeStudent && (
                  evaluations.some(
                    (e) =>
                      (e.student_id === activeStudent.id || e.student_name === activeStudent.full_name) &&
                      (subTab === 'general' ? e.evaluation_type === 'general' : e.session_date === sessionDate) &&
                      e.content &&
                      e.content.trim() !== ''
                  ) ? (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã đánh giá</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Chưa đánh giá
                    </span>
                  )
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Khóa đào tạo:{' '}
                <strong className="text-gray-800">{activeStudent?.course_name || '—'}</strong>
              </p>
            </div>

            <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl">
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
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="px-3.5 py-2 text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              )}

              {/* Textarea với WYSIWYG Toolbar */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Nội dung đánh giá</label>
                <div className="border border-red-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all bg-white shadow-2xs">
                  {/* Toolbar */}
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

                  <div className="px-4 py-2 bg-white text-right text-[11px] text-gray-400 font-mono border-t border-gray-50">
                    {content.length}/2000
                  </div>
                </div>
              </div>

              {/* Red container Gợi ý nội dung đánh giá chuẩn Ảnh 4 */}
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

              {/* Buttons: Hủy và Lưu đánh giá */}
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
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-200 transition-all hover:scale-102"
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
                    <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">{ev.content}</p>
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