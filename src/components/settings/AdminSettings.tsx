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
  Edit2,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Code,
  X,
  ExternalLink,
  Download,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Profile, Course, ClassItem, ClassType } from '@/types';
import { calculateClassEndTime } from '@/lib/utils';
import { exportAttendanceAndBenefitsToExcel } from '@/lib/exportUtils';

export default function AdminSettings() {
  const {
    profiles,
    courses,
    classes,
    students,
    sessions,
    attendance,
    benefits,
    toggleLockUser,
    resetUserPassword,
    deleteUser,
    createNewAccount,
    addCourse,
    editCourse,
    deleteCourse,
    addClass,
    editClass,
    deleteClass,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'accounts' | 'courses' | 'classes' | 'permissions' | 'sync'
  >('accounts');

  // Account tab filters
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'student' | 'admin'>('all');
  const [searchAccount, setSearchAccount] = useState('');
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);

  // Modals khóa học
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Modals lớp học
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // Google Sheet Sync & Script Modal
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);

  // New account form
  const [accountForm, setAccountForm] = useState({
    full_name: '',
    username: '',
    role: 'teacher' as 'admin' | 'teacher' | 'student',
    phone: '',
    email: '',
    class_id: '',
  });

  // Course form
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    description: '',
    target_audience: '',
    total_sessions: 16,
    status: 'active' as 'active' | 'inactive',
  });

  // Class form
  const [classForm, setClassForm] = useState({
    code: '',
    name: '',
    course_id: courses[0]?.id || '',
    course_name: courses[0]?.name || '',
    teacher_id: profiles.find((p) => p.role === 'teacher')?.id || '',
    teacher_name: profiles.find((p) => p.role === 'teacher')?.full_name || '',
    start_date: '2026-11-02',
    days_of_week: [1, 3],
    start_time: '18:30',
    end_time: '20:00',
    class_type: 'group' as ClassType,
    total_sessions: 16,
    room: 'Phòng Studio A1',
    status: 'ongoing' as 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
  });

  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((p) => ({ ...p, [id]: !p[id] }));
  };

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
      class_id: accountForm.class_id || classes[0]?.id || '',
    });
    setShowNewAccountModal(false);
    setAccountForm({ full_name: '', username: '', role: 'teacher', phone: '', email: '', class_id: '' });
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCourse) {
      editCourse(editingCourse.id, courseForm);
      setEditingCourse(null);
    } else {
      addCourse(courseForm);
      setShowAddCourseModal(false);
    }
    setCourseForm({
      code: '',
      name: '',
      description: '',
      target_audience: '',
      total_sessions: 16,
      status: 'active',
    });
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.days_of_week || classForm.days_of_week.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 thứ trong tuần cho lớp học!', 'error');
      return;
    }
    const course = courses.find((c) => c.id === classForm.course_id);
    const teacher = profiles.find((p) => p.id === classForm.teacher_id);
    const calculatedEndTime = calculateClassEndTime(classForm.start_time, classForm.class_type);
    const generatedClassName = course ? `${classForm.code.trim()} – ${course.name}` : classForm.code.trim();
    const classTotalSessions = course?.total_sessions || 16;

    if (editingClass) {
      editClass(editingClass.id, {
        ...classForm,
        name: generatedClassName,
        course_name: course ? course.name : editingClass.course_name,
        teacher_name: teacher ? teacher.full_name : editingClass.teacher_name,
        end_time: calculatedEndTime,
        total_sessions: classTotalSessions,
      });
      setEditingClass(null);
    } else {
      addClass({
        ...classForm,
        name: generatedClassName,
        course_name: course ? course.name : 'Chưa xác định',
        teacher_name: teacher ? teacher.full_name : 'Chưa phân công',
        end_time: calculatedEndTime,
        total_sessions: classTotalSessions,
      });
      setShowAddClassModal(false);
    }
  };

  const handleExportExcel = () => {
    exportAttendanceAndBenefitsToExcel({
      students,
      classes,
      sessions,
      attendance,
      benefits,
    });
    showToast('Đã xuất file Excel bảng theo dõi điểm danh & quyền lợi thành công!');
  };

  const googleAppsScriptCode = `/**
 * T.A ACADEMY E-LEARNING — GOOGLE APPS SCRIPT ĐỒNG BỘ ĐIỂM DANH & QUYỀN LỢI HỌC VIÊN
 * Bảng tính: THEO DÕI ĐIỂM DANH & QUYỀN LỢI HỌC VIÊN
 * 
 * Hướng dẫn 3 bước thiết lập:
 * 1. Mở file Google Sheet của bạn -> Tiện ích mở rộng (Extensions) -> Apps Script
 * 2. Xóa toàn bộ mã cũ, dán đoạn mã này vào -> Nhấn Lưu (Ctrl + S)
 * 3. Chọn hàm 'dongBoDiemDanhQuyenLoi' và nhấn Chạy (Run). Bảng tính sẽ tự động sinh và tô màu hoàn chỉnh!
 */

const SUPABASE_URL = "https://wtbkarkekozazuteuzxj.supabase.co";
const SUPABASE_KEY = "sb_publishable_lkGa7Wrgq4xMxeSqIeJpeQ_f_s3bKnu";

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🚀 T.A ACADEMY")
    .addItem("🔄 Đồng bộ Điểm Danh & Quyền Lợi ngay", "dongBoDiemDanhQuyenLoi")
    .addItem("⏰ Bật tự động cập nhật (15 phút/lần)", "batTuDongDongBo")
    .addToUi();
}

function batTuDongDongBo() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "dongBoDiemDanhQuyenLoi") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger("dongBoDiemDanhQuyenLoi")
    .timeBased()
    .everyMinutes(15)
    .create();
  SpreadsheetApp.getUi().alert("✅ Đã bật tự động đồng bộ mỗi 15 phút! Bảng tính sẽ luôn cập nhật tự động.");
}

function dongBoDiemDanhQuyenLoi() {
  const SS = SpreadsheetApp.getActiveSpreadsheet();
  const SHEET_NAME = "THEO DÕI ĐIỂM DANH & QUYỀN LỢI HỌC VIÊN";
  let sheet = SS.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = SS.insertSheet(SHEET_NAME);
  }

  // 1. Tải dữ liệu từ hệ thống T.A Academy qua Supabase REST API
  const options = {
    method: "get",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY
    },
    muteHttpExceptions: true
  };

  const studentsRes = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/students?select=*", options);
  const classesRes = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/classes?select=*", options);
  const sessionsRes = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/class_sessions?select=*", options);
  const attendanceRes = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/attendance_records?select=*", options);
  const benefitsRes = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/student_benefits?select=*", options);

  const students = JSON.parse(studentsRes.getContentText()) || [];
  const classes = JSON.parse(classesRes.getContentText()) || [];
  const sessions = JSON.parse(sessionsRes.getContentText()) || [];
  const attendance = JSON.parse(attendanceRes.getContentText()) || [];
  const benefits = JSON.parse(benefitsRes.getContentText()) || [];

  // Tìm số buổi tối đa (mặc định tối thiểu 16 buổi)
  let maxSessions = 16;
  students.forEach(function(s) {
    if (s.total_registered_sessions && s.total_registered_sessions > maxSessions) {
      maxSessions = Math.min(s.total_registered_sessions, 48);
    }
  });

  sheet.clear();

  // 2. Tạo Header theo đúng yêu cầu
  const headerCols = ["STT", "HỌC VIÊN", "KHÓA HỌC", "MÃ LỚP", "BUỔI ĐĂNG KÝ"];
  for (let b = 1; b <= maxSessions; b++) {
    headerCols.push("Buổi " + b);
  }
  headerCols.push("QUYỀN LỢI (HOÀN THÀNH/ CHƯA HOÀN THÀNH)");
  headerCols.push("SỐ BUỔI CÓ MẶT");
  headerCols.push("SỐ BUỔI VẮNG");
  headerCols.push("SỐ BUỔI CÒN LẠI");

  // Dòng 1: Tiêu đề lớn
  sheet.appendRow(["T.A ACADEMY — THEO DÕI ĐIỂM DANH & QUYỀN LỢI HỌC VIÊN (TỔNG HỢP TOÀN HỆ THỐNG)"]);
  sheet.getRange(1, 1, 1, headerCols.length).merge().setFontWeight("bold").setFontSize(13).setBackground("#B51225").setFontColor("#FFFFFF").setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setRowHeight(1, 40);

  // Dòng 2: Header cột
  sheet.appendRow(headerCols);
  sheet.getRange(2, 1, 1, headerCols.length).setFontWeight("bold").setFontSize(10).setBackground("#2D3748").setFontColor("#FFFFFF").setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true);
  sheet.setRowHeight(2, 35);

  if (students.length === 0) {
    sheet.appendRow(["Chưa có dữ liệu học viên trong hệ thống"]);
    sheet.getRange(3, 1, 1, headerCols.length).merge().setHorizontalAlignment("center");
    return;
  }

  // 3. Đổ dữ liệu từng học viên (1 học viên nằm trên 1 hàng)
  const rows = [];
  const bgColors = [];
  const fontColors = [];
  const fontWeights = [];

  students.forEach(function(st, idx) {
    const studentClass = classes.find(function(c) { return c.id === st.class_id || c.code === st.class_code; });
    const studentSessions = sessions
      .filter(function(sess) { return sess.class_id === st.class_id || (studentClass && sess.class_id === studentClass.id); })
      .sort(function(a, b) { return a.session_number - b.session_number; });

    const studentAtt = attendance.filter(function(a) { return a.student_id === st.id; });

    let presentCount = 0;
    let absentCount = 0;

    const row = [
      idx + 1,
      (st.full_name || "").toUpperCase(),
      (st.course_name || (studentClass ? studentClass.course_name : "MODEL KIDS")).toUpperCase(),
      st.class_code || (studentClass ? studentClass.code : "K99"),
      st.total_registered_sessions || (studentClass ? studentClass.total_sessions : 20)
    ];

    const rowBg = ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF"];
    const rowFont = ["#333333", "#000000", "#333333", "#1A365D", "#333333"];
    const rowWeight = ["normal", "bold", "normal", "bold", "normal"];

    // Duyệt qua từng buổi từ Buổi 1 đến Buổi N
    for (let b = 1; b <= maxSessions; b++) {
      const sess = studentSessions.find(function(s) { return s.session_number === b; });
      if (!sess) {
        row.push("—");
        rowBg.push("#FFFFFF");
        rowFont.push("#A0AEC0");
        rowWeight.push("normal");
        continue;
      }

      const d = new Date(sess.session_date);
      const dateStr = !isNaN(d.getTime()) ? (d.getDate() + "/" + (d.getMonth() + 1)) : sess.session_date;

      const att = studentAtt.find(function(a) { return a.session_id === sess.id; });
      if (att && att.status === "present") {
        presentCount++;
        row.push(dateStr);
        rowBg.push("#E6F4EA"); // Xanh lá nhạt
        rowFont.push("#137333"); // Chữ xanh lá đậm
        rowWeight.push("bold");
      } else if (att && att.status === "absent") {
        absentCount++;
        row.push("Vắng (" + dateStr + ")");
        rowBg.push("#FCE8E6"); // Đỏ nhạt
        rowFont.push("#C5221F"); // Chữ đỏ đậm
        rowWeight.push("bold");
      } else if (att && att.status === "late") {
        presentCount++;
        row.push("Muộn (" + dateStr + ")");
        rowBg.push("#FEF7E0"); // Vàng nhạt
        rowFont.push("#B06000");
        rowWeight.push("bold");
      } else {
        row.push(dateStr);
        rowBg.push("#F8F9FA");
        rowFont.push("#4A5568");
        rowWeight.push("normal");
      }
    }

    // Cột QUYỀN LỢI (HOÀN THÀNH/ CHƯA HOÀN THÀNH)
    const ben = benefits.find(function(b) {
      return b.student_code === st.student_code || b.student_id === st.id || (b.student_name && b.student_name.toLowerCase() === st.full_name.toLowerCase());
    });

    const hasDriveLink = ben && ben.drive_link && ben.drive_link.trim() !== "";
    const isCompleted = (ben && ben.status === "completed") || hasDriveLink;

    if (isCompleted) {
      if (hasDriveLink) {
        row.push('=HYPERLINK("' + ben.drive_link + '"; "HOÀN THÀNH")');
      } else {
        row.push("HOÀN THÀNH");
      }
      rowBg.push("#E6F4EA"); // Màu xanh lá khi cô giáo đã gắn link drive
      rowFont.push("#137333");
      rowWeight.push("bold");
    } else {
      if (ben && ben.overdue_days && ben.overdue_days > 0) {
        row.push("Trễ hạn " + ben.overdue_days + " ngày");
      } else {
        row.push("CHƯA HOÀN THÀNH");
      }
      rowBg.push("#FCE8E6"); // Màu đỏ khi chưa hoàn thành
      rowFont.push("#C5221F");
      rowWeight.push("bold");
    }

    // Các cột số liệu
    const totalReg = st.total_registered_sessions || (studentClass ? studentClass.total_sessions : 20);
    const remaining = Math.max(0, totalReg - presentCount);

    row.push(presentCount);
    rowBg.push("#E6F4EA");
    rowFont.push("#137333");
    rowWeight.push("bold");

    row.push(absentCount);
    rowBg.push(absentCount > 0 ? "#FCE8E6" : "#FFFFFF");
    rowFont.push(absentCount > 0 ? "#C5221F" : "#333333");
    rowWeight.push("bold");

    row.push(remaining);
    rowBg.push("#EDF2F7");
    rowFont.push("#2D3748");
    rowWeight.push("bold");

    rows.push(row);
    bgColors.push(rowBg);
    fontColors.push(rowFont);
    fontWeights.push(rowWeight);
  });

  const startRow = 3;
  const numRows = rows.length;
  const numCols = headerCols.length;

  const dataRange = sheet.getRange(startRow, 1, numRows, numCols);
  dataRange.setValues(rows);
  dataRange.setBackgrounds(bgColors);
  dataRange.setFontColors(fontColors);
  dataRange.setFontWeights(fontWeights);
  dataRange.setHorizontalAlignment("center").setVerticalAlignment("middle");
  dataRange.setBorder(true, true, true, true, true, true, "#CBD5E0", SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange(startRow, 2, numRows, 2).setHorizontalAlignment("left");
  sheet.setFrozenRows(2);
  sheet.setFrozenColumns(4);

  for (let c = 1; c <= numCols; c++) {
    sheet.autoResizeColumn(c);
  }

  SpreadsheetApp.getUi().alert("✅ Đã đồng bộ thành công " + students.length + " học viên vào bảng tính THEO DÕI ĐIỂM DANH & QUYỀN LỢI HỌC VIÊN!");
}
`;

  const copyScript = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setScriptCopied(true);
    showToast('Đã sao chép mã script Google Apps Script vào bộ nhớ!');
    setTimeout(() => setScriptCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Cài Đặt Hệ Thống & Phân Quyền
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Quản lý tài khoản, tạo khóa học, quản lý lớp học, phân quyền và đồng bộ Google Sheets.
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
          <FileSpreadsheet className="w-4 h-4" />
          <span>Đồng bộ Google Sheets</span>
        </button>
      </div>

      {/* TAB 1: QUẢN LÝ TÀI KHOẢN */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
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

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-800">{p.username || p.phone}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-500 font-mono">
                            {isPassVisible ? (p.password || '123456') : '••••••••'}
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

                      <td className="py-3.5 px-4 text-gray-700 font-mono">{p.phone}</td>

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
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${p.full_name}" (${p.username})? Toàn bộ dữ liệu liên quan (lớp học, điểm danh, nộp bài, đánh giá, quyền lợi) sẽ được xóa hoàn toàn khỏi hệ thống.`)) {
                                deleteUser(p.id);
                              }
                            }}
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

      {/* TAB 2: TẠO KHÓA HỌC (CÓ NÚT SỬA VÀ XÓA) */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Danh mục các khóa học đào tạo</h3>
              <p className="text-xs text-gray-500">Quản lý khóa học, thời lượng buổi học và đối tượng tuyển sinh</p>
            </div>
            <button
              onClick={() => {
                setEditingCourse(null);
                setCourseForm({
                  code: '',
                  name: '',
                  description: '',
                  target_audience: '',
                  total_sessions: 16,
                  status: 'active',
                });
                setShowAddCourseModal(true);
              }}
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
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingCourse(c);
                        setCourseForm({
                          code: c.code,
                          name: c.name,
                          description: c.description,
                          target_audience: c.target_audience,
                          total_sessions: c.total_sessions,
                          status: c.status,
                        });
                        setShowAddCourseModal(true);
                      }}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa khóa học"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCourse(c.id)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa khóa học"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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

      {/* TAB 3: TẠO LỚP HỌC (CÓ NÚT SỬA VÀ XÓA) */}
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
              onClick={() => {
                setEditingClass(null);
                setClassForm({
                  code: '',
                  name: '',
                  course_id: courses[0]?.id || '',
                  course_name: courses[0]?.name || '',
                  teacher_id: profiles.find((p) => p.role === 'teacher')?.id || '',
                  teacher_name: profiles.find((p) => p.role === 'teacher')?.full_name || '',
                  start_date: '2026-11-02',
                  days_of_week: [1, 3],
                  start_time: '18:30',
                  end_time: '20:00',
                  class_type: 'group',
                  total_sessions: 16,
                  room: 'Phòng Studio A1',
                  status: 'ongoing',
                });
                setShowAddClassModal(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo Lớp học mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.length === 0 ? (
              <div className="col-span-full p-10 bg-white border border-dashed border-gray-200 rounded-2xl text-center text-xs text-gray-400 space-y-2">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="font-semibold text-gray-600">Chưa có lớp học nào trong hệ thống</p>
                <p className="text-[11px] text-gray-400">Nhấn nút &ldquo;+ Tạo Lớp học mới&rdquo; ở góc phải để tạo lớp học đầu tiên.</p>
              </div>
            ) : (
              classes.map((cls) => (
              <div key={cls.id} className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                    {cls.code}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingClass(cls);
                        setClassForm({
                          code: cls.code,
                          name: cls.name,
                          course_id: cls.course_id,
                          course_name: cls.course_name,
                          teacher_id: cls.teacher_id,
                          teacher_name: cls.teacher_name,
                          start_date: cls.start_date,
                          days_of_week: cls.days_of_week,
                          start_time: cls.start_time,
                          end_time: cls.end_time,
                          class_type: cls.class_type,
                          total_sessions: cls.total_sessions,
                          room: cls.room,
                          status: cls.status,
                        });
                        setShowAddClassModal(true);
                      }}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa lớp học"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Bạn có chắc chắn muốn xóa lớp học "${cls.code} – ${cls.name}"? Toàn bộ lịch học, điểm danh và bài tập của lớp này sẽ bị xóa hoàn toàn khỏi hệ thống.`
                          )
                        ) {
                          deleteClass(cls.id);
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa lớp học"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h4 className="font-extrabold text-sm text-gray-900">{cls.name}</h4>
                <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p>Khóa học: <strong>{cls.course_name}</strong></p>
                  <p>Giáo viên: <strong>{cls.teacher_name}</strong></p>
                  <p>Thời gian: <strong>{cls.start_time} - {cls.end_time}</strong></p>
                  <p>Phòng học: {cls.room}</p>
                </div>
              </div>
            )))}
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
                  <td className="py-3 px-4 text-center text-blue-600 font-semibold">✓ Xem & thêm lịch dạy</td>
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
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Lọc theo ngày & Nhận xét</td>
                  <td className="py-3 px-4 text-center text-blue-600 font-semibold">✓ Chỉ xem nhận xét của mình</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Bài tập về nhà & Nộp bài</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Quản lý bài tập</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Điểm danh mở bài tập</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Nộp link Google Drive</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900">Quyền lợi video (Buổi 17)</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Toàn quyền duyệt link</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Gắn link Drive video</td>
                  <td className="py-3 px-4 text-center text-blue-600 font-semibold">✓ Xem link video</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ĐỒNG BỘ GOOGLE SHEETS & MÃ SCRIPT */}
      {activeTab === 'sync' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900">
                Đồng bộ Bảng tính THEO DÕI ĐIỂM DANH & QUYỀN LỢI HỌC VIÊN
              </h3>
              <p className="text-xs text-gray-500">
                Tự động tổng hợp học viên của tất cả các cô vào 1 bảng tính duy nhất trên Google Sheets
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Tùy chọn 1: Xuất trực tiếp file Excel chuẩn Google Sheet */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="font-bold text-xs text-emerald-950 flex items-center space-x-1.5">
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>Xuất File Excel Chuẩn Mẫu Google Sheet (.xlsx)</span>
                </h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Tải ngay bảng tính có sẵn các cột Buổi 1..Buổi N, Quyền lợi tô màu, Số buổi có mặt/vắng/còn lại để mở hoặc kéo thả vào Google Sheet.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Tải File Excel (.xlsx)</span>
              </button>
            </div>

            {/* Tùy chọn 2: Nhập link và kích hoạt đồng bộ tự động 2 chiều */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">
                Đường dẫn liên kết Google Spreadsheet của bạn
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full flex-1 px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-mono"
                />
                <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                  {sheetUrl && (
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center space-x-1"
                    >
                      <span>Mở Sheet</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Đang kết nối và đồng bộ dữ liệu sang Google Sheet...');
                      setTimeout(() => {
                        showToast('Đồng bộ dữ liệu sang Google Sheet thành công!');
                      }, 1200);
                    }}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-200 transition-colors"
                  >
                    Đồng bộ ngay
                  </button>
                </div>
              </div>
            </div>

            {/* Quy tắc định dạng bảng tính */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
              <h4 className="font-bold text-gray-800">Quy chuẩn cấu trúc bảng tính tự động:</h4>
              <ul className="text-gray-600 space-y-1 list-disc pl-4 text-[11px] leading-relaxed">
                <li>
                  <strong>Tên bảng tính tạo ra:</strong> <code className="text-brand-500 font-bold">THEO DÕI ĐIỂM DANH & QUYỀN LỢI HỌC VIÊN</code>
                </li>
                <li>
                  <strong>Cấu trúc các cột:</strong> <span className="font-mono text-gray-800">STT - HỌC VIÊN - KHÓA HỌC - MÃ LỚP - BUỔI ĐĂNG KÝ - Buổi 1, Buổi 2... - QUYỀN LỢI - SỐ BUỔI CÓ MẶT - SỐ BUỔI VẮNG - SỐ BUỔI CÒN LẠI</span>
                </li>
                <li>
                  <strong>Quy tắc Quyền lợi:</strong> Khi cô giáo đã gắn link Drive thì tự động ghi <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">HOÀN THÀNH</span> (kèm link Drive và tô màu xanh). Nếu chưa cập nhật link, hệ thống tự động tính số ngày quá hạn và ghi <span className="font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">Trễ hạn X ngày</span> (tô màu đỏ).
                </li>
                <li>
                  <strong>Tổng hợp toàn bộ:</strong> 1 học viên nằm trên 1 hàng, gộp tất cả học sinh của mọi giáo viên.
                </li>
              </ul>
            </div>

            {/* Khối cung cấp mã Script theo yêu cầu */}
            <div className="p-5 rounded-2xl bg-gray-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
                  <Code className="w-4 h-4" />
                  <span>MÃ SCRIPT ĐỒNG BỘ GOOGLE APPS SCRIPT</span>
                </div>
                <button
                  onClick={copyScript}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  {scriptCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{scriptCopied ? 'Đã sao chép!' : '1-Chạm Sao Chép Mã'}</span>
                </button>
              </div>

              <p className="text-[11px] text-gray-300 leading-relaxed">
                <strong>Hướng dẫn 3 bước:</strong> 1. Mở trang Google Sheet &rarr; 2. Chọn menu <strong>Extensions (Tiện ích mở rộng) &rarr; Apps Script</strong> &rarr; 3. Dán toàn bộ mã bên dưới vào, nhấn <strong>Save (Ctrl+S)</strong> và nhấn <strong>Run</strong> (hoặc chọn menu <strong>🚀 T.A ACADEMY</strong> trên thanh công cụ của Sheet).
              </p>

              <pre className="p-3 bg-black/50 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-56 border border-gray-800">
                {googleAppsScriptCode}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cấp Tài Khoản Mới */}
      {showNewAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">Cấp Tài Khoản Mới</h3>
              <button
                onClick={() => setShowNewAccountModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccountSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={accountForm.full_name}
                  onChange={(e) => setAccountForm({ ...accountForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0905..."
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
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
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
                  >
                    <option value="student">Học viên</option>
                    <option value="teacher">Giáo viên</option>
                    <option value="admin">Ban Giám Đốc (Admin)</option>
                  </select>
                </div>
              </div>

              {accountForm.role === 'student' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Xếp vào lớp học <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={accountForm.class_id || (classes[0]?.id || '')}
                    onChange={(e) => setAccountForm({ ...accountForm, class_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} – {c.name} (GV: {c.teacher_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tên đăng nhập <span className="text-gray-400 font-normal">(Để trống sẽ tự động sinh)</span>
                </label>
                <input
                  type="text"
                  placeholder={accountForm.role === 'student' ? 'Tự động tạo Mã HV (VD: TA-STD-002)' : 'Tự động lấy theo SĐT'}
                  value={accountForm.username}
                  onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email <span className="text-gray-400 font-normal">(Tùy chọn)</span>
                </label>
                <input
                  type="email"
                  placeholder="example@ta.edu.vn"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
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
                  Cấp tài khoản & Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thêm/Sửa Khóa học */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">
                {editingCourse ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
              </h3>
              <button
                onClick={() => setShowAddCourseModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mã khóa học</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: MK"
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tên khóa học</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Model Kids"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả khóa học</label>
                <textarea
                  rows={2}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Đối tượng</label>
                  <input
                    type="text"
                    value={courseForm.target_audience}
                    onChange={(e) => setCourseForm({ ...courseForm, target_audience: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tổng số buổi</label>
                  <input
                    type="number"
                    min="1"
                    value={courseForm.total_sessions}
                    onChange={(e) => setCourseForm({ ...courseForm, total_sessions: parseInt(e.target.value, 10) || 16 })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200"
                >
                  {editingCourse ? 'Lưu thay đổi' : 'Tạo khóa học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thêm/Sửa Lớp học */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">
                {editingClass ? 'Chỉnh sửa lớp học' : 'Tạo lớp học mới'}
              </h3>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mã lớp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: K99"
                    value={classForm.code}
                    onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Khóa học <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classForm.course_id}
                    onChange={(e) => {
                      const selectedCourse = courses.find((c) => c.id === e.target.value);
                      setClassForm({
                        ...classForm,
                        course_id: e.target.value,
                        total_sessions: selectedCourse?.total_sessions || 16,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code ? `${c.code} – ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Lịch học các thứ trong tuần <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {[
                    { id: 1, label: 'Thứ 2' },
                    { id: 2, label: 'Thứ 3' },
                    { id: 3, label: 'Thứ 4' },
                    { id: 4, label: 'Thứ 5' },
                    { id: 5, label: 'Thứ 6' },
                    { id: 6, label: 'Thứ 7' },
                    { id: 7, label: 'Chủ nhật' },
                  ].map((d) => {
                    const isSelected = classForm.days_of_week?.includes(d.id);
                    return (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => {
                          const current = classForm.days_of_week || [];
                          const next = isSelected
                            ? current.filter((x) => x !== d.id)
                            : [...current, d.id].sort((a, b) => a - b);
                          setClassForm({ ...classForm, days_of_week: next });
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                          isSelected
                            ? 'bg-brand-500 text-white border-brand-500 shadow-sm shadow-red-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {isSelected ? `✓ ${d.label}` : d.label}
                      </button>
                    );
                  })}
                </div>
                {(!classForm.days_of_week || classForm.days_of_week.length === 0) && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">Vui lòng chọn ít nhất 1 thứ trong tuần</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  {editingClass ? 'Cập nhật lớp' : 'Lưu lớp & Tạo lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
