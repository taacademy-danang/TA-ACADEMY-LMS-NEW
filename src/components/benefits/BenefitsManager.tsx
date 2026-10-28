'use client';

import React, { useState } from 'react';
import {
  Gift,
  Award,
  CheckCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Edit2,
  X,
  Link as LinkIcon,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { StudentBenefit } from '@/types';

export default function BenefitsManager() {
  const { benefits, classes, students, updateBenefit, currentUser, showToast } = useApp();

  const isStudent = currentUser.role === 'student';
  const isTeacher = currentUser.role === 'teacher';

  // Lọc quyền lợi theo vai trò:
  // - Nếu là học viên: chỉ thấy quyền lợi của chính mình
  // - Nếu là giáo viên: chỉ thấy quyền lợi của học sinh lớp mình dạy
  // - Nếu là admin: thấy toàn bộ
  const teacherClasses = classes.filter(
    (c) =>
      !isTeacher ||
      c.teacher_id === currentUser.id ||
      c.teacher_name === currentUser.full_name ||
      c.teacher_name.includes(currentUser.full_name)
  );
  const teacherClassCodes = teacherClasses.map((c) => c.code);

  const visibleBenefits = benefits.filter((b) => {
    if (isStudent) {
      return (
        b.student_name === currentUser.full_name ||
        b.student_code === currentUser.student_code ||
        b.student_name.includes(currentUser.full_name)
      );
    }
    if (isTeacher) {
      return teacherClassCodes.includes(b.class_code);
    }
    return true;
  });

  const [editingBenefit, setEditingBenefit] = useState<StudentBenefit | null>(null);
  const [driveLinkInput, setDriveLinkInput] = useState('');
  const [statusInput, setStatusInput] = useState<'completed' | 'in_progress' | 'overdue'>('in_progress');
  const [completedDateInput, setCompletedDateInput] = useState('');

  const handleOpenEdit = (b: StudentBenefit) => {
    if (isStudent) return; // Học viên không được chỉnh sửa
    setEditingBenefit(b);
    setDriveLinkInput(b.drive_link || '');
    setStatusInput(b.status || 'in_progress');
    setCompletedDateInput(b.completed_date || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBenefit || isStudent) return;

    updateBenefit(editingBenefit.id, {
      drive_link: driveLinkInput.trim(),
      status: statusInput,
      completed_date: statusInput === 'completed' ? completedDateInput || new Date().toLocaleDateString('vi-VN') : '',
    });

    setEditingBenefit(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Quyền Lợi Học Viên</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isStudent
            ? 'Theo dõi video quyền lợi đào tạo và chứng nhận của bạn'
            : isTeacher
            ? `Quản lý quyền lợi video các lớp do cô ${currentUser.full_name} phụ trách`
            : 'Quản lý quyền lợi video tốt nghiệp, link Google Drive và tiến độ hoàn thành đào tạo'}
        </p>
      </div>

      {/* Thông báo quy tắc mốc buổi 17 */}
      <div className="p-4 bg-red-50/60 rounded-2xl border border-red-200 text-xs text-brand-900 space-y-1">
        <div className="flex items-center space-x-2 font-bold text-brand-500">
          <AlertCircle className="w-4 h-4 text-brand-500" />
          <span>QUY TẮC BẮT BUỘC VỀ VIDEO QUYỀN LỢI T.A ACADEMY:</span>
        </div>
        <p className="leading-relaxed">
          Đối với hai khóa học <strong>Model Kids</strong> và <strong>Catwalk</strong>, học viên phải được ghi hình và gắn link Google Drive video quyền lợi vào <strong>buổi học thứ 17</strong> (lấy mốc buổi 17 làm chuẩn bàn giao).
        </p>
      </div>

      {/* Bảng quyền lợi */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-sm text-gray-900">
            {isStudent ? 'Quyền lợi video của bạn' : `Danh sách quyền lợi học viên (${visibleBenefits.length} hồ sơ)`}
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-brand-500">
            Chuẩn bàn giao 2026
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-400 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Mã học viên</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Khóa đào tạo</th>
                <th className="py-3 px-4">Mã lớp</th>
                <th className="py-3 px-4">Link Drive Video</th>
                <th className="py-3 px-4 text-center">Tình trạng</th>
                <th className="py-3 px-4 text-center">Ngày hoàn thành</th>
                {!isStudent && <th className="py-3 px-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {visibleBenefits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 text-xs">
                    Không có hồ sơ quyền lợi nào trong phạm vi quản lý.
                  </td>
                </tr>
              ) : (
                visibleBenefits.map((b) => {
                  const isMilestoneCourse =
                    b.course_name.includes('Model Kids') || b.course_name.includes('Catwalk');

                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-500">
                        {b.student_code}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {b.student_name}
                        {isMilestoneCourse && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                            ★ Mốc video: Buổi 17
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-gray-800">{b.course_name}</td>
                      <td className="py-3.5 px-4 font-extrabold text-blue-700">{b.class_code}</td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {b.drive_link ? (
                          <a
                            href={b.drive_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 text-blue-600 hover:text-blue-800 font-semibold truncate hover:underline"
                          >
                            <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Mở thư mục video Drive</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">Chưa gắn link video</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {b.status === 'completed' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Hoàn thành</span>
                          </span>
                        )}
                        {b.status === 'in_progress' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-blue-700" />
                            <span>Đang thực hiện</span>
                          </span>
                        )}
                        {b.status === 'overdue' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-100 text-brand-500 font-bold text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-brand-500" />
                            <span>Trễ hạn {b.overdue_days || 1} ngày</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-medium text-gray-700">
                        {b.completed_date || '—'}
                      </td>

                      {!isStudent && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenEdit(b)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-brand-500 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Gắn Link Drive</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Giáo viên gắn Link Drive */}
      {editingBenefit && !isStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">
                  Cập nhật quyền lợi video học viên
                </h3>
                <p className="text-xs text-gray-500">
                  {editingBenefit.student_name} ({editingBenefit.student_code})
                </p>
              </div>
              <button
                onClick={() => setEditingBenefit(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Đường dẫn Google Drive video quyền lợi <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={driveLinkInput}
                  onChange={(e) => setDriveLinkInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tình trạng bàn giao</label>
                <select
                  value={statusInput}
                  onChange={(e) =>
                    setStatusInput(e.target.value as 'completed' | 'in_progress' | 'overdue')
                  }
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                >
                  <option value="in_progress">Đang thực hiện (Chưa hoàn thành)</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="overdue">Trễ hạn bàn giao</option>
                </select>
              </div>

              {statusInput === 'completed' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ngày hoàn thành</label>
                  <input
                    type="date"
                    value={completedDateInput}
                    onChange={(e) => setCompletedDateInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
              )}

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingBenefit(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200"
                >
                  Lưu quyền lợi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
