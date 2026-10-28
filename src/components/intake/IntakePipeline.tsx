'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  CheckCircle,
  Sparkles,
  Key,
  Calendar,
  Clock,
  Phone,
  BookOpen,
  Copy,
  Check,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { IntakeRecord } from '@/types';
import { calculateWaitingTime } from '@/lib/utils';

export default function IntakePipeline() {
  const {
    intakeRecords,
    courses,
    classes,
    addIntakeRecord,
    editIntakeRecord,
    assignClassToIntake,
    generateAccountForIntake,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState<IntakeRecord | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('');

  // Credentials popup after account creation
  const [credentialsModal, setCredentialsModal] = useState<{
    isOpen: boolean;
    studentName: string;
    studentCode: string;
    username: string;
    tempPass: string;
    className: string;
  }>({
    isOpen: false,
    studentName: '',
    studentCode: '',
    username: '',
    tempPass: '',
    className: '',
  });

  const [copied, setCopied] = useState(false);

  // Form state tạo mới
  const [newForm, setNewForm] = useState({
    full_name: '',
    phone: '',
    course_id: courses[0]?.id || '',
    total_sessions: courses[0]?.total_sessions || 16,
  });

  // Form state chỉnh sửa
  const [editForm, setEditForm] = useState({
    id: '',
    full_name: '',
    phone: '',
    course_id: '',
    total_sessions: 16,
  });

  const filteredRecords = intakeRecords.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.full_name.toLowerCase().includes(term) ||
      r.phone.includes(term) ||
      r.course_name.toLowerCase().includes(term) ||
      (r.student_code && r.student_code.toLowerCase().includes(term))
    );
  });

  const pendingList = filteredRecords.filter((r) => r.status === 'pending_class');
  // Học viên nào đã cấp tài khoản rồi thì không hiện thông tin trong tab chờ xếp lớp nữa
  const assignedList = filteredRecords.filter((r) => r.status === 'assigned_class');

  const handleCreateIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.full_name || !newForm.phone) return;
    addIntakeRecord(newForm);
    setNewForm({
      full_name: '',
      phone: '',
      course_id: courses[0]?.id || '',
      total_sessions: courses[0]?.total_sessions || 16,
    });
    setShowAddModal(false);
  };

  const handleOpenEdit = (item: IntakeRecord) => {
    setEditForm({
      id: item.id,
      full_name: item.full_name,
      phone: item.phone,
      course_id: item.course_id,
      total_sessions: item.total_sessions,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.full_name || !editForm.phone) return;
    editIntakeRecord(editForm.id, {
      full_name: editForm.full_name,
      phone: editForm.phone,
      course_id: editForm.course_id,
      total_sessions: editForm.total_sessions,
    });
    setShowEditModal(false);
  };

  const handleOpenAssignModal = (intake: IntakeRecord) => {
    setSelectedIntake(intake);
    setSelectedClassId(classes[0]?.id || '');
    setShowAssignModal(true);
  };

  const handleConfirmAssign = () => {
    if (selectedIntake && selectedClassId) {
      assignClassToIntake(selectedIntake.id, selectedClassId);
      setShowAssignModal(false);
      setSelectedIntake(null);
    }
  };

  const handleGenerateAccount = (intake: IntakeRecord) => {
    const creds = generateAccountForIntake(intake.id);
    setCredentialsModal({
      isOpen: true,
      studentName: intake.full_name,
      studentCode: creds.studentCode,
      username: creds.username,
      tempPass: creds.tempPass,
      className: intake.assigned_class_name || 'Lớp đào tạo T.A',
    });
  };

  const handleCopyCredentials = () => {
    const text = `🎉 CHÀO MỪNG BẠN ĐẾN VỚI T.A ACADEMY\n\nHọc viên: ${credentialsModal.studentName}\nMã học viên: ${credentialsModal.studentCode}\nLớp học: ${credentialsModal.className}\nTài khoản đăng nhập (Mã HV): ${credentialsModal.studentCode}\nMật khẩu: ${credentialsModal.tempPass}\n\nĐăng nhập hệ thống học tập tại: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-brand-500 flex items-center justify-center border border-red-100 shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Chờ xếp lớp</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Tiếp nhận học viên mới và quản lý trạng thái xếp lớp & cấp tài khoản
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setNewForm({
              full_name: '',
              phone: '',
              course_id: courses[0]?.id || '',
              total_sessions: courses[0]?.total_sessions || 16,
            });
            setShowAddModal(true);
          }}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm shadow-md shadow-red-200 transition-all hover:scale-[1.02]"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tiếp Nhận Học Viên Mới</span>
        </button>
      </div>

      {/* Filter and stats row */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/70">
            Chờ xếp lớp: <span className="font-extrabold text-amber-900">{pendingList.length}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
            Đã xếp lớp: <span className="font-extrabold text-blue-800">{assignedList.length}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
            Tổng tiếp nhận: <span className="font-extrabold text-gray-900">{filteredRecords.length}</span>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, khóa học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* 3-Column Workflow layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT 1: Chờ xếp lớp */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col h-full shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="font-bold text-gray-900 text-sm">Chờ Xếp Lớp</h2>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {pendingList.length} hồ sơ
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2.5 mb-4">
            Học viên mới đăng ký chưa có lịch học. Bạn có thể chọn xếp lớp hoặc chỉnh sửa thông tin.
          </p>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {pendingList.length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400">
                Hiện không có học viên nào đang chờ xếp lớp.
              </div>
            ) : (
              pendingList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{item.full_name}</h3>
                      <p className="text-xs text-gray-500 font-medium">{item.phone}</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      Chờ {calculateWaitingTime(item.created_at)}
                    </span>
                  </div>

                  <div className="mt-3 py-2 px-3 bg-white rounded-lg border border-gray-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Khóa học:</span>
                      <span className="font-semibold text-gray-800">{item.course_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Số buổi đăng ký:</span>
                      <span className="font-bold text-brand-500">{item.total_sessions} buổi</span>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between">
                    {/* Nút chỉnh sửa theo yêu cầu */}
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-gray-600 hover:text-brand-500 p-1 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Sửa thông tin</span>
                    </button>

                    <button
                      onClick={() => handleOpenAssignModal(item)}
                      className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                    >
                      Xếp lớp
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CỘT 2: Đã xếp lớp (Chờ cấp TK) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col h-full shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="font-bold text-gray-900 text-sm">Đã Xếp Lớp (Chờ Cấp TK)</h2>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {assignedList.length} hồ sơ
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2.5 mb-4">
            Đã có mã lớp trong hệ thống. Nhấn &ldquo;Cấp tài khoản & Hoàn tất&rdquo; để nhận thông tin đăng nhập và gửi cho học viên.
          </p>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {assignedList.length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400">
                Chưa có hồ sơ nào đã xếp lớp.
              </div>
            ) : (
              assignedList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-gray-300 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{item.full_name}</h3>
                      <p className="text-xs text-gray-500">{item.phone}</p>
                    </div>
                    {item.status === 'account_created' ? (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Đã cấp TK
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Chờ cấp TK
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Mã lớp xếp vào:</span>
                      <span className="font-bold px-2 py-0.5 bg-blue-200/80 text-blue-900 rounded text-xs">
                        {item.assigned_class_code}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Tên lớp:</span>
                      <span className="font-bold text-gray-900">{item.assigned_class_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Giảng viên dạy:</span>
                      <span className="font-semibold text-gray-800">{item.assigned_teacher_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Số buổi đăng ký:</span>
                      <span className="font-bold text-brand-500">{item.total_sessions} buổi</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleOpenAssignModal(item)}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-900 underline underline-offset-2"
                    >
                      Đổi mã lớp khác
                    </button>

                    {item.status === 'account_created' ? (
                      <button
                        onClick={() =>
                          setCredentialsModal({
                            isOpen: true,
                            studentName: item.full_name,
                            studentCode: item.student_code || 'TA-STD-998',
                            username: item.account_username || item.phone,
                            tempPass: '123456',
                            className: item.assigned_class_name || 'Lớp đào tạo T.A',
                          })
                        }
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold rounded-lg transition-colors"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Xem tài khoản</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerateAccount(item)}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Cấp tài khoản & Hoàn tất</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CỘT 3: Cấp tài khoản & Bàn giao (Khối xanh ngọc chuẩn ảnh mẫu 1) */}
        <div className="bg-emerald-50/40 rounded-2xl border border-emerald-200 p-5 flex flex-col h-full shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-200/70">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h2 className="font-bold text-emerald-950 text-sm">Cấp Tài Khoản & Bàn Giao</h2>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-300/60">
              Quy tắc hệ thống
            </span>
          </div>

          <div className="space-y-4 mt-4 flex-1">
            <div className="p-4 bg-white rounded-xl border border-emerald-200/80 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cơ Chế Tự Động Hóa Đồng Bộ Toàn Bộ Tab:</span>
              </div>
              <p className="text-[11px] text-gray-600 font-medium">Khi bạn bấm &ldquo;Cấp tài khoản&rdquo;:</p>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4 font-normal">
                <li>Tự động tạo mã học viên chuẩn (ví dụ: <code className="text-brand-500 font-bold bg-red-50 px-1 py-0.5 rounded">TA-STD-005</code>).</li>
                <li>Tự động cấp tên đăng nhập và mật khẩu khởi tạo ngẫu nhiên.</li>
                <li>Tự động nhảy vào danh sách lớp để xuất hiện tức thì trong các tab: <strong>Thời khóa biểu, Điểm danh, Bài tập, Đánh giá, Quyền lợi học viên</strong>.</li>
                <li>Hiện popup thông báo kèm chức năng <strong>sao chép tài khoản & mật khẩu</strong> gửi cho học viên qua Zalo / SMS.</li>
                <li>Tự động hoàn tất và xóa học viên khỏi phễu chờ xếp lớp.</li>
              </ul>
            </div>

            <div className="p-4 bg-emerald-100/50 rounded-xl border border-emerald-200 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-emerald-900">Sẵn sàng gửi thông tin cho Học Viên qua Zalo / SMS</h4>
              <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                Sau khi bấm cấp tài khoản, bảng thông tin đăng nhập sẽ hiện ra với nút 1-chạm sao chép gửi cho học viên.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Tiếp nhận học viên mới (Lấy dữ liệu động từ khóa học đã cài) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">Tiếp nhận học viên mới</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIntake} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Họ và tên học viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Gia Hân"
                  value={newForm.full_name}
                  onChange={(e) => setNewForm({ ...newForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Số điện thoại phụ huynh/học viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0912345678"
                  value={newForm.phone}
                  onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Khóa học đăng ký (Lấy từ Khóa học đã cài) <span className="text-red-500">*</span>
                </label>
                <select
                  value={newForm.course_id}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const found = courses.find((c) => c.id === cId);
                    setNewForm({
                      ...newForm,
                      course_id: cId,
                      total_sessions: found ? found.total_sessions : 16,
                    });
                  }}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.total_sessions} buổi - Mã: {c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tổng số buổi đăng ký</label>
                <input
                  type="number"
                  min="1"
                  value={newForm.total_sessions}
                  onChange={(e) =>
                    setNewForm({ ...newForm, total_sessions: parseInt(e.target.value, 10) || 16 })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200 transition-colors"
                >
                  Lưu vào danh sách chờ xếp lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chỉnh sửa thông tin học viên */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">Chỉnh sửa thông tin học viên</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Họ và tên học viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Khóa học đăng ký</label>
                <select
                  value={editForm.course_id}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const found = courses.find((c) => c.id === cId);
                    setEditForm({
                      ...editForm,
                      course_id: cId,
                      total_sessions: found ? found.total_sessions : editForm.total_sessions,
                    });
                  }}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.total_sessions} buổi)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tổng số buổi đăng ký</label>
                <input
                  type="number"
                  min="1"
                  value={editForm.total_sessions}
                  onChange={(e) =>
                    setEditForm({ ...editForm, total_sessions: parseInt(e.target.value, 10) || 16 })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200 transition-colors"
                >
                  Cập nhật thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chọn lớp xếp */}
      {showAssignModal && selectedIntake && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">
                Xếp lớp cho: {selectedIntake.full_name}
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Chọn lớp học phù hợp trong hệ thống
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.code} – {cls.name} (GV: {cls.teacher_name} • {cls.start_time} - {cls.end_time})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1">
                <p>Khóa học: <strong className="text-gray-900">{selectedIntake.course_name}</strong></p>
                <p>Số buổi đăng ký: <strong className="text-brand-500">{selectedIntake.total_sessions} buổi</strong></p>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssign}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200 transition-colors"
                >
                  Xác nhận xếp lớp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bàn giao thông tin tài khoản (1-Click Copy Zalo/SMS) */}
      {credentialsModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-slide-down">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Thông tin tài khoản học viên</h3>
                <p className="text-xs text-gray-500">Đã kích hoạt đồng bộ vào toàn bộ hệ thống đào tạo</p>
              </div>
            </div>

            <div className="my-5 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500 font-sans font-medium">Họ và tên:</span>
                <span className="font-bold text-gray-900 font-sans">{credentialsModal.studentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500 font-sans font-medium">Mã học viên:</span>
                <span className="font-bold text-brand-500">{credentialsModal.studentCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500 font-sans font-medium">Lớp đào tạo:</span>
                <span className="font-semibold text-gray-800 font-sans">{credentialsModal.className}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500 font-sans font-medium">Tài khoản đăng nhập (Mã HV):</span>
                <span className="font-bold text-blue-700">{credentialsModal.studentCode || credentialsModal.username}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 font-sans font-medium">Mật khẩu khởi tạo:</span>
                <span className="font-bold text-emerald-700">{credentialsModal.tempPass}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCredentialsModal({ ...credentialsModal, isOpen: false })}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 transition-all hover:scale-[1.02]"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                <span>{copied ? 'Đã sao chép vào bộ nhớ!' : 'Sao chép gửi Zalo / SMS'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
