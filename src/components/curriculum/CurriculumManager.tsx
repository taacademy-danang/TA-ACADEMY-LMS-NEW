'use client';

import React, { useState } from 'react';
import { FileText, BookOpen, Layers, CheckCircle2, ChevronRight, Edit2, X, UploadCloud } from 'lucide-react';
import { useApp } from '@/lib/store';
import { LessonPlan } from '@/types';

export default function CurriculumManager() {
  const { courses, lessonPlans, editLessonPlan, showToast } = useApp();
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || 'c-mk');

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Lọc giáo án của khóa này
  const plans = lessonPlans.filter(
    (lp) => lp.course_id === selectedCourse?.id || lp.course_name === selectedCourse?.name
  );

  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    homework_title: '',
    homework_desc: '',
    homework_due_days: 4,
  });

  const handleOpenEdit = (plan: LessonPlan) => {
    setEditingPlan(plan);
    setForm({
      title: plan.title,
      content: plan.content,
      homework_title: plan.homework_title,
      homework_desc: plan.homework_desc,
      homework_due_days: plan.homework_due_days || 4,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    editLessonPlan(editingPlan.id, {
      title: form.title,
      content: form.content,
      homework_title: form.homework_title,
      homework_desc: form.homework_desc,
      homework_due_days: form.homework_due_days,
    });

    setEditingPlan(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Khung Giáo Án Đào Tạo</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý nội dung học chi tiết từng buổi và bài tập về nhà đính kèm đồng bộ toàn hệ thống
          </p>
        </div>

        {/* Course switcher */}
        <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-gray-200">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCourseId(c.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                c.id === selectedCourseId
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="pb-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">
              Giáo trình khóa: {selectedCourse?.name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Thời lượng đào tạo: <strong className="text-brand-500">{selectedCourse?.total_sessions} buổi</strong> • Đối tượng: {selectedCourse?.target_audience}
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
            Giáo án chính thức 2026
          </span>
        </div>

        {/* Danh sách từng buổi học với 2 cột: Nội dung học & Bài tập về nhà đính kèm */}
        <div className="space-y-4">
          {plans.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-brand-200 hover:shadow-md transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-gray-200/70">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-xl bg-red-100 text-brand-500 font-extrabold text-sm flex items-center justify-center shadow-xs">
                    {item.session_number}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">
                      Buổi {item.session_number}: {item.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(item)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-brand-500 hover:text-white hover:bg-brand-500 border border-brand-300 rounded-xl transition-all self-start sm:self-auto"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa nội dung & bài tập</span>
                </button>
              </div>

              {/* 2 Cột: Nội dung học & Bài tập về nhà đính kèm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Cột 1: Nội dung học */}
                <div className="p-3.5 rounded-xl bg-white border border-gray-200 space-y-1.5">
                  <span className="font-bold text-gray-800 flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                    <span>Nội dung học trên lớp:</span>
                  </span>
                  <p className="text-gray-600 leading-relaxed pl-5">{item.content}</p>
                </div>

                {/* Cột 2: Bài tập về nhà đính kèm */}
                <div className="p-3.5 rounded-xl bg-red-50/40 border border-red-100 space-y-1.5">
                  <span className="font-bold text-brand-500 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-brand-500" />
                    <span>Bài tập về nhà đính kèm (Hiện bên Tab Bài tập):</span>
                  </span>
                  <div className="pl-5 space-y-1">
                    <div className="font-bold text-gray-900">{item.homework_title}</div>
                    <p className="text-gray-600 leading-relaxed">{item.homework_desc}</p>
                    <div className="text-[11px] font-semibold text-brand-600 pt-1">
                      • Hạn nộp bài: Sau {item.homework_due_days} ngày kể từ buổi học
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal chỉnh sửa giáo án & bài tập */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">
                Chỉnh sửa Buổi {editingPlan.session_number}: {editingPlan.title}
              </h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề buổi học</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nội dung giảng dạy chi tiết trên lớp
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs font-extrabold text-brand-500 uppercase">
                  Bài tập về nhà đính kèm (Hiển thị cho học viên)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề bài tập</label>
                <input
                  type="text"
                  required
                  value={form.homework_title}
                  onChange={(e) => setForm({ ...form, homework_title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Yêu cầu bài tập chi tiết</label>
                <textarea
                  rows={3}
                  required
                  value={form.homework_desc}
                  onChange={(e) => setForm({ ...form, homework_desc: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hạn nộp (Số ngày sau buổi học)</label>
                <input
                  type="number"
                  min="1"
                  value={form.homework_due_days}
                  onChange={(e) => setForm({ ...form, homework_due_days: parseInt(e.target.value, 10) || 4 })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200"
                >
                  Lưu thay đổi giáo án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
