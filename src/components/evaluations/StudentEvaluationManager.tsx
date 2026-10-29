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
  Filter,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Student } from '@/types';
import { formatDate } from '@/lib/utils';

export default function StudentEvaluationManager() {
  const { students, intakeRecords, evaluations, classes, sessions, attendance, saveEvaluation, currentUser, showToast } =
    useApp();

  const isStudent = currentUser.role === 'student';
  const isTeacher = currentUser.role === 'teacher';

  // Thời gian thực tế hôm nay (YYYY-MM-DD)
  const [sessionDate, setSessionDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Lọc chỉ học viên có lịch học vào ngày sessionDate (mặc định bật)
  const [onlyTodayFilter, setOnlyTodayFilter] = useState(true);

  const [subTab, setSubTab] = useState<'session' | 'general' | 'history'>('session');
  const [content, setContent] = useState('');

  // Lấy thứ trong tuần của ngày được chọn (1: Thứ 2, 2: Thứ 3, ..., 7: Chủ nhật)
  const selectedDayOfWeek = useMemo(() => {
    const parts = sessionDate.split('-');
    if (parts.length !== 3) return 1;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const jsDay = d.getDay();
    return jsDay === 0 ? 7 : jsDay;
  }, [sessionDate]);

  const dayName = useMemo(() => {
    const DAY_NAMES = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return selectedDayOfWeek === 7 ? 'Chủ nhật' : DAY_NAMES[selectedDayOfWeek];
  }, [selectedDayOfWeek]);

  // Các lớp học thuộc quyền phụ trách của giáo viên / admin
  const teacherClasses = useMemo(() => {
    return classes.filter(
      (c) =>
        !isTeacher ||
        c.teacher_id === currentUser.id ||
        c.teacher_name === currentUser.full_name ||
        c.teacher_name?.includes(currentUser.full_name)
    );
  }, [classes, isTeacher, currentUser]);

  const teacherClassCodes = useMemo(() => {
    return teacherClasses.map((c) => c.code);
  }, [teacherClasses]);

  // Các lớp học có lịch học vào đúng ngày sessionDate đã chọn
  const activeClassesOnDate = useMemo(() => {
    return teacherClasses.filter((c) => {
      // 1. Có buổi học trùng ngày trong sessions
      const hasDirectSession = sessions.some((s) => s.class_id === c.id && s.session_date === sessionDate);
      if (hasDirectSession) return true;

      // 2. Khớp theo thứ trong tuần và khoảng thời gian lớp diễn ra
      const matchesDay = c.days_of_week?.includes(selectedDayOfWeek);
      const matchesDateRange = (!c.start_date || c.start_date <= sessionDate) && (!c.end_date || c.end_date >= sessionDate);
      return matchesDay && matchesDateRange;
    });
  }, [teacherClasses, sessions, sessionDate, selectedDayOfWeek]);

  const activeClassIds = useMemo(() => new Set(activeClassesOnDate.map((c) => c.id)), [activeClassesOnDate]);
  const activeClassCodes = useMemo(() => new Set(activeClassesOnDate.map((c) => c.code)), [activeClassesOnDate]);

  // Tổng hợp danh sách toàn bộ học viên hợp lệ (bao gồm cả học viên vừa được xếp lớp)
  const allEligibleStudents = useMemo(() => {
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

  // Danh sách học viên hiển thị: Tự động lọc theo đúng ngày học đã chọn
  const displayStudents = useMemo(() => {
    if (!onlyTodayFilter) {
      return allEligibleStudents;
    }

    return allEligibleStudents.filter((st) => {
      // 1. Học viên thuộc lớp có lịch học vào ngày này
      const inActiveClass =
        (st.class_id && activeClassIds.has(st.class_id)) ||
        (st.class_code && activeClassCodes.has(st.class_code));

      // 2. Hoặc học viên đã có đánh giá hoặc điểm danh vào đúng ngày này
      const hasEvalOnDate = evaluations.some(
        (e) => (e.student_id === st.id || e.student_name === st.full_name) && e.session_date === sessionDate
      );
      const hasAttOnDate = attendance.some(
        (a) =>
          (a.student_id === st.id || (st.student_code && a.student_code === st.student_code) || a.student_name === st.full_name) &&
          (sessions.find((s) => s.id === a.session_id)?.session_date === sessionDate || a.marked_at?.startsWith(sessionDate))
      );

      return inActiveClass || hasEvalOnDate || hasAttOnDate;
    });
  }, [allEligibleStudents, onlyTodayFilter, activeClassIds, activeClassCodes, evaluations, attendance, sessions, sessionDate]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  useEffect(() => {
    if (displayStudents.length > 0) {
      if (!displayStudents.some((s) => s.id === selectedStudentId)) {
        setSelectedStudentId(displayStudents[0].id);
      }
    } else {
      setSelectedStudentId('');
    }
  }, [displayStudents, selectedStudentId]);

  const activeStudent =
    displayStudents.find((s) => s.id === selectedStudentId) || displayStudents[0] || null;

  const studentEvaluations = evaluations.filter((e) => e.student_id === activeStudent?.id);

  // Nạp nội dung đánh giá của học viên đang chọn vào editor
  useEffect(() => {
    if (activeStudent) {
      if (subTab === 'session') {
        const existing = evaluations.find(
          (e) =>
            (e.student_id === activeStudent.id || e.student_name === activeStudent.full_name) &&
            e.session_date === sessionDate
        );
        setContent(existing?.content || '');
      } else if (subTab === 'general') {
        const existing = evaluations.find(
          (e) =>
            (e.student_id === activeStudent.id || e.student_name === activeStudent.full_name) &&
            e.evaluation_type === 'general'
        );
        setContent(existing?.content || '');
      }
    }
  }, [selectedStudentId, sessionDate, subTab, evaluations, activeStudent]);

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
      content: content.trim(),
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
                    <span className="font-bold text-gray-900">Buổi học ngày: {formatDate(ev.session_date)}</span>
                  </div>
                  <span className="text-gray-500 font-medium">
                    Giáo viên: <strong className="text-brand-500">{ev.created_by}</strong>
                  </span>
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

  // Trạng thái của học viên đang chọn trên panel phải
  const activeStudentHasEval = activeStudent
    ? evaluations.some(
        (e) =>
          (e.student_id === activeStudent.id || e.student_name === activeStudent.full_name) &&
          (subTab === 'general' ? e.evaluation_type === 'general' : e.session_date === sessionDate) &&
          e.content &&
          e.content.trim() !== ''
      )
    : false;

  const activeStudentHasAtt = activeStudent
    ? attendance.some(
        (a) =>
          (a.student_id === activeStudent.id ||
            (activeStudent.student_code && a.student_code === activeStudent.student_code) ||
            a.student_name === activeStudent.full_name) &&
          (sessions.find((s) => s.id === a.session_id)?.session_date === sessionDate || a.marked_at?.startsWith(sessionDate)) &&
          a.status === 'present'
      )
    : false;

  return (
    <div className="space-y-6">
      {/* 1. THANH ĐIỀU KHIỂN & BỘ LỌC THỜI GIAN CHUNG (Dùng thời gian thực tế, lọc ngày nào ra đúng học viên ngày đó) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-500 border border-red-100">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">Đánh Giá & Nhận Xét Học Viên</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Thời gian chung cho toàn bộ buổi học &bull; Tự động đồng bộ điểm danh khi lưu đánh giá
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Bộ lọc ngày thực tế */}
          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <label className="text-xs font-bold text-gray-600 whitespace-nowrap">Buổi học ngày:</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-brand-500 focus:outline-none cursor-pointer"
            />
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700 shadow-2xs">
              {dayName} ({formatDate(sessionDate)})
            </span>
          </div>

          {/* Nút lọc: Chỉ hiện học viên ngày này / Hiện tất cả */}
          <button
            type="button"
            onClick={() => setOnlyTodayFilter(!onlyTodayFilter)}
            className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              onlyTodayFilter
                ? 'bg-red-50 text-brand-500 border-red-200 shadow-2xs'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
            title="Bật/Tắt lọc theo lịch học ngày đã chọn"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{onlyTodayFilter ? 'Đang lọc theo ngày' : 'Hiện tất cả học viên'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Trái — Danh sách học viên */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-extrabold text-gray-900">Danh sách học viên</h2>
              <p className="text-[11px] text-gray-400 font-medium">
                {onlyTodayFilter ? `Có lịch học ngày ${formatDate(sessionDate)}` : 'Tất cả lớp phụ trách'}
              </p>
            </div>
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
                    <td colSpan={5} className="py-8 text-center text-gray-400 text-xs space-y-2">
                      <p>Không có học viên nào có lịch học vào ngày {formatDate(sessionDate)}.</p>
                      <button
                        onClick={() => setOnlyTodayFilter(false)}
                        className="text-xs text-brand-500 font-bold hover:underline"
                      >
                        Bấm vào đây để xem tất cả học viên
                      </button>
                    </td>
                  </tr>
                ) : (
                  displayStudents.map((st, idx) => {
                    const isSelected = st.id === selectedStudentId;

                    // 1. Kiểm tra trạng thái đánh giá cho ngày sessionDate
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

                    // 2. Kiểm tra trạng thái điểm danh cho ngày sessionDate
                    const isAttended = attendance.some(
                      (a) =>
                        (a.student_id === st.id || (st.student_code && a.student_code === st.student_code) || a.student_name === st.full_name) &&
                        (sessions.find((s) => s.id === a.session_id)?.session_date === sessionDate || a.marked_at?.startsWith(sessionDate)) &&
                        a.status === 'present'
                    );

                    return (
                      <tr
                        key={st.id}
                        onClick={() => setSelectedStudentId(st.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-red-50/60' : 'hover:bg-gray-50/60'
                        }`}
                      >
                        <td className="py-3 px-2 text-center text-gray-400 font-bold">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900">{st.full_name}</div>
                          <div className="text-[10px] text-gray-400">{st.student_code || ''}</div>
                        </td>
                        <td className="py-3 px-2 text-gray-800 font-bold">{st.class_code || 'K98'}</td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {/* Trạng thái đánh giá */}
                            {isEvaluated ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] whitespace-nowrap">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Đã đánh giá</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] whitespace-nowrap">
                                Chưa đánh giá
                              </span>
                            )}

                            {/* Trạng thái điểm danh */}
                            {isAttended ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] whitespace-nowrap">
                                <span>✓ Đã điểm danh</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium text-[10px] whitespace-nowrap">
                                Chưa điểm danh
                              </span>
                            )}
                          </div>
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

        {/* Panel Phải — Đánh giá chi tiết */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          {/* Header học viên & 3 Tabs */}
          <div className="pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-gray-900">
                  {activeStudent?.full_name || 'Chưa chọn học viên'}
                </h2>
                {activeStudent?.class_code && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    {activeStudent.class_code}
                  </span>
                )}

                {/* Trạng thái đánh giá */}
                {activeStudent && (
                  activeStudentHasEval ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ✓ Đã đánh giá
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Chưa đánh giá
                    </span>
                  )
                )}

                {/* Trạng thái điểm danh */}
                {activeStudent && (
                  activeStudentHasAtt ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      ✓ Đã điểm danh
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      Chưa điểm danh
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
                <div className="flex items-center space-x-3 bg-red-50/40 p-3 rounded-xl border border-red-100">
                  <label className="text-xs font-bold text-gray-700">Buổi học ngày:</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="px-3 py-1.5 text-xs font-extrabold text-brand-500 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-2xs cursor-pointer"
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-600">
                    {dayName} ({formatDate(sessionDate)})
                  </span>
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
                      title="Xóa trắng nội dung"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Nhập nhận xét, đánh giá chi tiết về buổi học của học viên... Ví dụ: thái độ, tiến bộ, điểm mạnh, điểm cần cải thiện, định hướng cho buổi học tiếp theo,..."
                    className="w-full p-4 text-xs text-gray-900 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Gợi ý tiêu chí đánh giá */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
                <span className="font-bold text-gray-800">Gợi ý nội dung đánh giá chất lượng cao:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-gray-500 pl-1">
                  <li>Nhận xét tổng thể về thái độ, tinh thần học tập</li>
                  <li>Những tiến bộ nổi bật trong buổi học</li>
                  <li>Điểm cần cải thiện và hướng dẫn thêm</li>
                  <li>Định hướng cho buổi học tiếp theo (nếu có)</li>
                </ul>
              </div>

              {/* Buttons: Hủy và Lưu đánh giá */}
              <div className="pt-2 flex items-center justify-between">
                <p className="text-[11px] text-emerald-700 font-medium">
                  * Khi lưu đánh giá, hệ thống sẽ tự động cập nhật trạng thái <strong>&ldquo;Đã điểm danh (Có mặt)&rdquo;</strong> cho học viên.
                </p>
                <div className="flex items-center space-x-3">
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
                      <span className="font-bold text-brand-500">Buổi học ngày: {formatDate(ev.session_date)}</span>
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
