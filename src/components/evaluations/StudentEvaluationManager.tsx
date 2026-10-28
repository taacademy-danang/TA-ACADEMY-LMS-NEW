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
  RotateCw,
  BookOpen,
  Award,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Student } from '@/types';

export default function StudentEvaluationManager() {
  const { students, evaluations, saveEvaluation, currentUser, showToast } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || 'std-01');
  const [subTab, setSubTab] = useState<'session' | 'general' | 'history'>('session');
  const [sessionDate, setSessionDate] = useState('2026-10-26');
  const [content, setContent] = useState('');

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Lấy lịch sử đánh giá của học viên này
  const studentEvaluations = evaluations.filter((e) => e.student_id === activeStudent?.id);

  // Điền sẵn nếu đã có đánh giá cho ngày này
  React.useEffect(() => {
    const existing = evaluations.find(
      (e) => e.student_id === activeStudent?.id && e.session_date === sessionDate
    );
    if (existing) {
      setContent(existing.content);
    } else {
      setContent('');
    }
  }, [selectedStudentId, sessionDate, evaluations, activeStudent]);

  const handleSave = () => {
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

  const handleInsertTag = (openTag: string, closeTag: string) => {
    setContent((prev) => `${prev} ${openTag}nội dung${closeTag} `);
  };

  return (
    <div className="space-y-6">
      {/* 2-Panel Layout: Bám sát ảnh tham chiếu số 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Trái — Danh sách học viên */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2 text-sm font-bold text-gray-900">
              <Users className="w-4 h-4 text-brand-500" />
              <span>Danh sách học viên</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-red-50 text-brand-500 border border-red-100">
              {students.length} học viên
            </span>
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
                {students.map((st, idx) => {
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
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Phải — Nội dung đánh giá */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          {/* Header học viên */}
          <div className="pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-extrabold text-gray-900">{activeStudent?.full_name}</h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  {activeStudent?.class_code || 'K98'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Khóa đào tạo: <strong className="text-gray-800">{activeStudent?.course_name || 'Model Kids'}</strong>
              </p>
            </div>

            {/* 3 Sub-tabs */}
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

          {/* Tab: Đánh giá theo buổi hoặc Nhận xét chung */}
          {subTab !== 'history' ? (
            <div className="space-y-4">
              {/* Buổi học ngày */}
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

              {/* Text Editor Toolbar */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Nội dung đánh giá</label>
                <div className="border border-red-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all bg-white">
                  {/* WYSIWYG Mock Toolbar */}
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

                  {/* Textarea */}
                  <textarea
                    rows={6}
                    maxLength={2000}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Nhập nhận xét, đánh giá chi tiết về buổi học của học viên... Ví dụ: thái độ, tiến bộ, điểm mạnh, điểm cần cải thiện, định hướng cho buổi học tiếp theo,..."
                    className="w-full p-4 text-xs text-gray-800 placeholder-gray-400 focus:outline-none resize-none leading-relaxed"
                  />

                  {/* Character Counter */}
                  <div className="px-4 py-2 bg-white text-right text-[11px] text-gray-400 font-mono">
                    {content.length}/2000
                  </div>
                </div>
              </div>

              {/* Gợi ý nội dung đánh giá */}
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

              {/* Actions */}
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
            /* Tab: Lịch sử đánh giá */
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
