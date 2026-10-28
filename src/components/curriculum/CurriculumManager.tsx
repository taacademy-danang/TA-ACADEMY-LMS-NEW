'use client';

import React, { useState } from 'react';
import { FileText, BookOpen, Edit2, X, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/lib/store';
import { LessonPlan } from '@/types';

export default function CurriculumManager() {
  const { courses, lessonPlans, addLessonPlan, editLessonPlan, deleteLessonPlan, showToast } = useApp();
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || 'c-mk');

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Lọc giáo án của khóa này và sắp xếp theo số thứ tự buổi học
  const plans = lessonPlans
    .filter((lp) => lp.course_id === selectedCourse?.id || lp.course_name === selectedCourse?.name)
    .sort((a, b) => a.session_number - b.session_number);

  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [editForm, setEditForm] = useState({
    session_number: 1,
    title: '',
    content: '',
    homework_title: '',
    homework_desc: '',
    homework_due_days: 4,
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    session_number: 1,
    title: '',
    content: '',
    homework_title: '',
    homework_desc: '',
    homework_due_days: 4,
  });

  const handleOpenAdd = () => {
    const nextSessionNum = plans.length > 0 ? Math.max(...plans.map((p) => p.session_number)) + 1 : 1;
    setAddForm({
      session_number: nextSessionNum,
      title: '',
      content: '',
      homework_title: '',
      homework_desc: '',
      homework_due_days: 4,
    });
    setShowAddModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.title.trim()) {
      showToast('Vui lòng nhập tiêu đề buổi học', 'error');
      return;
    }

    addLessonPlan({
      course_id: selectedCourse.id,
      course_name: selectedCourse.name,
      session_number: Number(addForm.session_number),
      title: addForm.title.trim(),
      content: addForm.content.trim(),
      homework_title: addForm.homework_title.trim() || `Bài tập thực hành buổi ${addForm.session_number}`,
      homework_desc: addForm.homework_desc.trim() || 'Học viên quay video thực hành và nộp qua Google Drive.',
      homework_due_days: Number(addForm.homework_due_days) || 4,
    });

    setShowAddModal(false);
  };

  const handleOpenEdit = (plan: LessonPlan) => {
    setEditingPlan(plan);
    setEditForm({
      session_number: plan.session_number,
      title: plan.title,
      content: plan.content,
      homework_title: plan.homework_title,
      homework_desc: plan.homework_desc,
      homework_due_days: plan.homework_due_days || 4,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    editLessonPlan(editingPlan.id, {
      session_number: Number(editForm.session_number),
      title: editForm.title.trim(),
      content: editForm.content.trim(),
      homework_title: editForm.homework_title.trim(),
      homework_desc: editForm.homework_desc.trim(),
      homework_due_days: Number(editForm.homework_due_days),
    });

    setEditingPlan(null);
  };

  const handleDelete = (plan: LessonPlan) => {
    if (window.confirm(`Bạn có chắc muốn xóa Buổi ${plan.session_number}: ${plan.title} khỏi giáo án?`)) {
      deleteLessonPlan(plan.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Khung Giáo Án Đào Tạo</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý nội dung học chi tiết từng buổi và bài tập về nhà đính kèm đồng bộ toàn hệ thống
          </p>
        </div>

        {/* Course switcher with + icon next to courses */}
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCourseId(c.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                c.id === selectedCourseId
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {c.name}
            </button>
          ))}
          {/* Nút + nhanh ngay trên thanh chọn môn học */}
          <button
            onClick={handleOpenAdd}
            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-brand-500 hover:text-white text-brand-500 flex items-center justify-center transition-all border border-red-200"
            title="Thêm buổi học mới cho môn học này (Không giới hạn số buổi)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        {/* Banner khóa học & Nút + Thêm buổi học */}
        <div className="pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold text-gray-900">
                Giáo trình khóa: {selectedCourse?.name}
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {plans.length} buổi đã thiết kế
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Thời lượng quy chuẩn: <strong className="text-brand-500">{selectedCourse?.total_sessions} buổi</strong> • Đối tượng: {selectedCourse?.target_audience}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-red-200 transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm buổi học mới (+)</span>
            </button>
          </div>
        </div>

        {/* Danh sách từng buổi học với 2 cột: Nội dung học & Bài tập về nhà đính kèm */}
        <div className="space-y-4">
          {plans.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-3">
              <p className="text-xs text-gray-500">Khóa học này chưa có nội dung buổi học nào.</p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Nhập buổi học đầu tiên</span>
              </button>
            </div>
          ) : (
            plans.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-brand-200 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-gray-200/70">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-red-100 text-brand-500 font-extrabold text-sm flex items-center justify-center shadow-2xs">
                      {item.session_number}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">
                        Buổi {item.session_number}: {item.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-brand-500 hover:text-white hover:bg-brand-500 border border-brand-300 rounded-xl transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa nội dung & bài tập</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Xóa buổi học này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 2 Cột: Nội dung học & Bài tập về nhà đính kèm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Cột 1: Nội dung học */}
                  <div className="p-3.5 rounded-xl bg-white border border-gray-200 space-y-1.5 shadow-2xs">
                    <span className="font-bold text-gray-800 flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                      <span>Nội dung học trên lớp:</span>
                    </span>
                    <p className="text-gray-600 leading-relaxed pl-5 whitespace-pre-line">{item.content}</p>
                  </div>

                  {/* Cột 2: Bài tập về nhà đính kèm */}
                  <div className="p-3.5 rounded-xl bg-red-50/40 border border-red-100 space-y-1.5 shadow-2xs">
                    <span className="font-bold text-brand-500 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-500" />
                      <span>Bài tập về nhà đính kèm (Hiện bên Tab Bài tập):</span>
                    </span>
                    <div className="pl-5 space-y-1">
                      <div className="font-bold text-gray-900">{item.homework_title}</div>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.homework_desc}</p>
                      <div className="text-[11px] font-semibold text-brand-600 pt-1">
                        • Hạn nộp bài: Sau {item.homework_due_days} ngày kể từ buổi học
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Nút + nhanh dạng Card đứt nét ở cuối danh sách để thêm không giới hạn buổi */}
          <button
            onClick={handleOpenAdd}
            className="w-full py-4 border-2 border-dashed border-gray-300 hover:border-brand-500 rounded-2xl bg-gray-50/50 hover:bg-red-50/30 text-gray-600 hover:text-brand-500 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-brand-500" />
            <span>Thêm buổi học tiếp theo cho khóa {selectedCourse?.name} (Không giới hạn số buổi)</span>
          </button>
        </div>
      </div>

      {/* Modal Thêm buổi học mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-lg bg-red-100 text-brand-500 flex items-center justify-center font-bold text-xs">
                  +
                </span>
                <h3 className="font-extrabold text-gray-900 text-base">
                  Thêm buổi học mới — {selectedCourse?.name}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Số buổi</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={addForm.session_number}
                    onChange={(e) => setAddForm({ ...addForm, session_number: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-bold text-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề buổi học</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Kỹ thuật giữ thăng bằng và giải phóng hình thể"
                    value={addForm.title}
                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nội dung giảng dạy chi tiết trên lớp
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập chi tiết các động tác, nội dung cô giáo sẽ hướng dẫn học viên..."
                  value={addForm.content}
                  onChange={(e) => setAddForm({ ...addForm, content: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
                  placeholder="Ví dụ: Quay video 3 phút thực hành dáng đứng thẳng"
                  value={addForm.homework_title}
                  onChange={(e) => setAddForm({ ...addForm, homework_title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Yêu cầu bài tập chi tiết</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Yêu cầu học viên quay video, thời lượng, trang phục và cách nộp..."
                  value={addForm.homework_desc}
                  onChange={(e) => setAddForm({ ...addForm, homework_desc: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hạn nộp (Số ngày sau buổi học)</label>
                <input
                  type="number"
                  min="1"
                  value={addForm.homework_due_days}
                  onChange={(e) => setAddForm({ ...addForm, homework_due_days: parseInt(e.target.value, 10) || 4 })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200 transition-all hover:scale-102"
                >
                  Lưu buổi học vào giáo án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa giáo án & bài tập */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-scale-up">
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

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Số buổi</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.session_number}
                    onChange={(e) => setEditForm({ ...editForm, session_number: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-bold text-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề buổi học</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nội dung giảng dạy chi tiết trên lớp
                </label>
                <textarea
                  rows={3}
                  required
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
                  value={editForm.homework_title}
                  onChange={(e) => setEditForm({ ...editForm, homework_title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Yêu cầu bài tập chi tiết</label>
                <textarea
                  rows={3}
                  required
                  value={editForm.homework_desc}
                  onChange={(e) => setEditForm({ ...editForm, homework_desc: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hạn nộp (Số ngày sau buổi học)</label>
                <input
                  type="number"
                  min="1"
                  value={editForm.homework_due_days}
                  onChange={(e) => setEditForm({ ...editForm, homework_due_days: parseInt(e.target.value, 10) || 4 })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200 transition-all hover:scale-102"
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