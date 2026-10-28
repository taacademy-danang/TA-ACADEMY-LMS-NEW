'use client';

import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  Shield,
  Database,
  Search,
  Plus,
  RotateCcw,
  Lock,
  Unlock,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Profile, Course, ClassItem, ClassType } from '@/types';
import { calculateClassEndTime } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function AdminSettings() {
  const {
    profiles,
    courses,
    classes,
    toggleLockUser,
    resetUserPassword,
    deleteUser,
    createNewAccount,
    addCourse,
    addClass,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'accounts' | 'courses' | 'classes' | 'permissions' | 'sync'
  >('accounts');

  // Account tab filters
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'student' | 'admin'>('all');
  const [searchAccount, setSearchAccount] = useState('');
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);

  // New account form
  const [accountForm, setAccountForm] = useState({
    full_name: '',
    username: '',
    role: 'teacher' as 'admin' | 'teacher' | 'student',
    phone: '',
    email: '',
  });

  // New course form
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    description: '',
    target_audience: '',
    total_sessions: 16,
    status: 'active' as 'active' | 'inactive',
  });

  // New class form with automatic schedule calculation
  const [classForm, setClassForm] = useState({
    code: '',
    name: '',
    course_id: courses[0]?.id || '',
    course_name: courses[0]?.name || '',
    teacher_id: profiles.find((p) => p.role === 'teacher')?.id || '',
    teacher_name: profiles.find((p) => p.role === 'teacher')?.full_name || '',
    start_date: '2026-11-02',
    days_of_week: [1, 3], // T2, T4
    start_time: '18:30',
    end_time: '20:00',
    class_type: 'group' as ClassType,
    total_sessions: 16,
    room: 'Phòng Studio A1',
    status: 'ongoing' as 'ongoing',
  });

  // Password visibility map
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((p) => ({ ...p, [id]: !p[id] }));
  };

  // Filter accounts
  const filteredProfiles = profiles.filter((p) => {
    if (roleFilter !== 'all' && p.role !== roleFilter) return false;
    if (searchAccount) {
      const q = searchAccount.toLowerCase();
      return (
        p.full_name.toLowerCase().includes(q) ||
        (p.username && p.username.toLowerCase().includes(q)) ||
        p.phone.includes(q)
      );
    }
    return true;
  });

  const teacherCount = profiles.filter((p) => p.role === 'teacher').length;
  const studentCount = profiles.filter((p) => p.role === 'student').length;
  const adminCount = profiles.filter((p) => p.role === 'admin').length;

  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.full_name || !accountForm.phone) return;
    createNewAccount({
      ...accountForm,
      username: accountForm.username || accountForm.phone,
      email: accountForm.email || `${accountForm.username || accountForm.phone}@ta.edu.vn`,
    });
    setShowNewAccountModal(false);
    setAccountForm({ full_name: '', username: '', role: 'teacher', phone: '', email: '' });
  };

  const handleCreateCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.code || !courseForm.name) return;
    addCourse(courseForm);
    setShowAddCourseModal(false);
    setCourseForm({
      code: '',
      name: '',
      description: '',
      target_audience: '',
      total_sessions: 16,
      status: 'active',
    });
  };

  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const course = courses.find((c) => c.id === classForm.course_id);
    const teacher = profiles.find((p) => p.id === classForm.teacher_id);

    // Tính tự động giờ kết thúc chuẩn: Nhóm 1h30, Kèm 1h
    const calculatedEndTime = calculateClassEndTime(classForm.start_time, classForm.class_type);

    addClass({
      ...classForm,
      course_name: course ? course.name : 'Chưa xác định',
      teacher_name: teacher ? teacher.full_name : 'Chưa phân công',
      end_time: calculatedEndTime,
    });
    setShowAddClassModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Cài Đặt Hệ Thống & Phân Quyền
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Quản lý tài khoản, tạo khóa học, quản lý lớp học, phân quyền và đồng bộ dữ liệu.
        </p>
      </div>

      {/* 5 Horizontal Tabs */}
      <div className="flex border-b border-gray-200 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'accounts'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quản lý tài khoản ({profiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'courses'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Tạo Khóa học ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'classes'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Tạo Lớp học ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'permissions'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Phân quyền</span>
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'sync'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Đồng bộ dữ liệu</span>
        </button>
      </div>

      {/* TAB 1: QUẢN LÝ TÀI KHOẢN (Bám sát ảnh tham chiếu số 5) */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo họ tên, username, số điện thoại..."
                value={searchAccount}
                onChange={(e) => setSearchAccount(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all ${
                  roleFilter === 'all'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tất Cả ({profiles.length})
              </button>
              <button
                onClick={() => setRoleFilter('teacher')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all ${
                  roleFilter === 'teacher'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Giáo Viên ({teacherCount})
              </button>
              <button
                onClick={() => setRoleFilter('student')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all ${
                  roleFilter === 'student'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Học Viên ({studentCount})
              </button>
              <button
                onClick={() => setRoleFilter('admin')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all ${
                  roleFilter === 'admin'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Admin ({adminCount})
              </button>

              <button
                onClick={() => setShowNewAccountModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-full shadow-md shadow-red-200 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Cấp Tài Khoản Mới</span>
              </button>
            </div>
          </div>

          {/* Table Quản lý tài khoản */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-400 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Người dùng</th>
                  <th className="py-3 px-4">Tài khoản & Mật khẩu</th>
                  <th className="py-3 px-4">Vai trò</th>
                  <th className="py-3 px-4">Số điện thoại</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredProfiles.map((p) => {
                  const initials = p.full_name
                    .split(' ')
                    .slice(-2)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase();

                  const isPassVisible = visiblePasswords[p.id];

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      {/* Cột 1: Người dùng & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-red-100 text-brand-500 font-extrabold flex items-center justify-center text-xs shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-xs">{p.full_name}</div>
                            {p.student_code && (
                              <div className="text-[10px] text-gray-400 font-mono font-medium">
                                {p.student_code}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Tài khoản & Mật khẩu */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-800">{p.username || p.phone}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-500 font-mono">
                            {isPassVisible ? '123456' : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(p.id)}
                            className="text-gray-400 hover:text-gray-600 p-0.5"
                            title="Ẩn/Hiện mật khẩu"
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Cột 3: Vai trò & Trạng thái */}
                      <td className="py-3.5 px-4">
                        <div>
                          {p.role === 'teacher' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                              GIÁO VIÊN
                            </span>
                          )}
                          {p.role === 'student' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                              HỌC VIÊN
                            </span>
                          )}
                          {p.role === 'admin' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-brand-500 uppercase">
                              ADMIN
                            </span>
                          )}
                          <div
                            className={`text-[11px] font-semibold mt-0.5 ${
                              p.status === 'locked' ? 'text-red-500' : 'text-emerald-600'
                            }`}
                          >
                            {p.status === 'locked' ? 'Bị khóa' : 'Hoạt động'}
                          </div>
                        </div>
                      </td>

                      {/* Cột 4: Số điện thoại */}
                      <td className="py-3.5 px-4 text-gray-700 font-mono">{p.phone}</td>

                      {/* Cột 5: Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            onClick={() => resetUserPassword(p.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Đặt lại MK</span>
                          </button>

                          <button
                            onClick={() => toggleLockUser(p.id)}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                              p.status === 'locked'
                                ? 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                                : 'text-amber-700 hover:bg-amber-50 border-amber-200'
                            }`}
                          >
                            {p.status === 'locked' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            <span>{p.status === 'locked' ? 'Mở khóa' : 'Khóa'}</span>
                          </button>

                          <button
                            onClick={() => deleteUser(p.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TẠO KHÓA HỌC */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
            <h3 className="font-bold text-sm text-gray-900">Danh mục các khóa học đào tạo</h3>
            <button
              onClick={() => setShowAddCourseModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo Khóa học mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <div key={c.id} className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-red-100 text-brand-500">
                    {c.code}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Đang tuyển sinh
                  </span>
                </div>
                <h4 className="font-extrabold text-base text-gray-900">{c.name}</h4>
                <p className="text-xs text-gray-600 line-clamp-2">{c.description}</p>
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100 space-y-1">
                  <div>Đối tượng: <strong>{c.target_audience}</strong></div>
                  <div>Thời lượng: <strong className="text-brand-500">{c.total_sessions} buổi</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TẠO LỚP HỌC (Có tự động sinh lịch) */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Quản lý lớp học & Lịch trình</h3>
              <p className="text-xs text-gray-500">
                Lớp nhóm mặc định 1h30, lớp kèm 1h. Hệ thống tự động sinh các buổi học trên Thời khóa biểu.
              </p>
            </div>
            <button
              onClick={() => setShowAddClassModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo Lớp học mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div key={cls.id} className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                    {cls.code}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    Sĩ số: {cls.student_count}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-gray-900">{cls.name}</h4>
                <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p>Khóa học: <strong>{cls.course_name}</strong></p>
                  <p>Giáo viên: <strong>{cls.teacher_name}</strong></p>
                  <p>Thời gian: <strong>{cls.start_time} - {cls.end_time}</strong></p>
                  <p>Phòng học: {cls.room}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PHÂN QUYỀN */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900">Ma trận phân quyền hệ thống (RLS & UI)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Chức năng hệ thống</th>
                  <th className="py-3 px-4 text-center">Ban Giám Đốc (Admin)</th>
                  <th className="py-3 px-4 text-center">Giáo Viên (Teacher)</th>
                  <th className="py-3 px-4 text-center">Học Viên (Student)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Tiếp nhận học viên & Xếp lớp</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Toàn quyền</td>
                  <td className="py-3 px-4 text-center text-gray-400">✕ Không truy cập</td>
                  <td className="py-3 px-4 text-center text-gray-400">✕ Không truy cập</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Thời khóa biểu</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Xem & Quản lý toàn bộ</td>
                  <td className="py-3 px-4 text-center text-blue-600 font-semibold">✓ Xem lớp được phân công</td>
                  <td className="py-3 px-4 text-center text-blue-600 font-semibold">✓ Xem lớp đang học</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Điểm danh học viên</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Toàn quyền sửa/xóa</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Điểm danh lớp mình dạy</td>
                  <td className="py-3 px-4 text-center text-blue-600 font-semibold">✓ Chỉ xem lịch sử cá nhân</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Đánh giá & Nhận xét</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Toàn quyền duyệt/sửa</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Nhập nhận xét buổi học</td>
                  <td className="py-3 px-4 text-center text-blue-600 font-semibold">✓ Chỉ xem nhận xét của mình</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Bài tập về nhà & Nộp bài</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Giao bài & Khóa/Mở</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Giao bài & Chấm bài</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Nộp link Google Drive</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Cài đặt tài khoản & Phân quyền</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Toàn quyền</td>
                  <td className="py-3 px-4 text-center text-gray-400">✕ Không truy cập</td>
                  <td className="py-3 px-4 text-center text-gray-400">✕ Không truy cập</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ĐỒNG BỘ DỮ LIỆU */}
      {activeTab === 'sync' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900">Tình trạng kết nối Cơ sở dữ liệu</h3>
              <p className="text-xs text-gray-500">Đồng bộ trực tiếp với Supabase PostgreSQL & Row Level Security</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-600">Trạng thái kết nối Supabase:</span>
                {isSupabaseConfigured ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Đã kết nối</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Chế độ Seed & Local State (Sẵn sàng)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Khi cần kích hoạt kết nối live Supabase, chỉ cần khai báo <code>NEXT_PUBLIC_SUPABASE_URL</code> và <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> trong file <code>.env.local</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
              <div className="text-xs font-bold text-gray-800">Thống kê bản ghi hệ thống:</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>• Tài khoản: <strong>{profiles.length}</strong></div>
                <div>• Khóa học: <strong>{courses.length}</strong></div>
                <div>• Lớp học: <strong>{classes.length}</strong></div>
                <div>• Điểm danh: <strong>{classes.length} buổi</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tạo tài khoản mới */}
      {showNewAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">Cấp tài khoản mới</h3>
              <button
                onClick={() => setShowNewAccountModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccountSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Minh Châu"
                  value={accountForm.full_name}
                  onChange={(e) => setAccountForm({ ...accountForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0988123456"
                  value={accountForm.phone}
                  onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Vai trò</label>
                <select
                  value={accountForm.role}
                  onChange={(e) =>
                    setAccountForm({
                      ...accountForm,
                      role: e.target.value as 'admin' | 'teacher' | 'student',
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="teacher">Giáo viên</option>
                  <option value="student">Học viên</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewAccountModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tạo lớp học mới (Tự sinh lịch) */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">Tạo lớp học mới</h3>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClassSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mã lớp</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: K99"
                    value={classForm.code}
                    onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tên lớp học</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: K99 – MODEL KIDS"
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Khóa học</label>
                  <select
                    value={classForm.course_id}
                    onChange={(e) => setClassForm({ ...classForm, course_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Giáo viên phụ trách</label>
                  <select
                    value={classForm.teacher_id}
                    onChange={(e) => setClassForm({ ...classForm, teacher_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    {profiles
                      .filter((p) => p.role === 'teacher')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.full_name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Loại hình</label>
                  <select
                    value={classForm.class_type}
                    onChange={(e) =>
                      setClassForm({ ...classForm, class_type: e.target.value as ClassType })
                    }
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    <option value="group">Lớp nhóm (1h30)</option>
                    <option value="one_on_one">Lớp kèm (1h)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={classForm.start_time}
                    onChange={(e) => setClassForm({ ...classForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tổng số buổi</label>
                  <input
                    type="number"
                    min="1"
                    value={classForm.total_sessions}
                    onChange={(e) =>
                      setClassForm({ ...classForm, total_sessions: parseInt(e.target.value, 10) || 16 })
                    }
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ngày bắt đầu</label>
                <input
                  type="date"
                  required
                  value={classForm.start_date}
                  onChange={(e) => setClassForm({ ...classForm, start_date: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-brand-700">
                ⚡ <strong>Tự động sinh lịch:</strong> Hệ thống sẽ tạo đúng {classForm.total_sessions} buổi học từ ngày {classForm.start_date} (khung giờ {classForm.start_time} đến {calculateClassEndTime(classForm.start_time, classForm.class_type)}) trên Thời khóa biểu.
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200"
                >
                  Lưu lớp & Tạo lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
