'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle,
  Calendar,
  Clock,
  User,
  Users,
  ChevronRight,
  ExternalLink,
  Save,
  RotateCcw,
  BookOpen,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { AttendanceStatus, ClassSession } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AttendancePortal() {
  const { classes, students, intakeRecords, sessions, attendance, saveAttendance, currentUser, showToast } =
    useApp();

  const isStudent = currentUser.role === 'student';
  const isTeacher = currentUser.role === 'teacher';

  // Mặc định ngày được chọn là ngày hôm nay (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Lấy thứ trong tuần của ngày được chọn (1: Thứ 2, 2: Thứ 3, ..., 7: Chủ nhật)
  const selectedDayOfWeek = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return 1;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const jsDay = d.getDay();
    return jsDay === 0 ? 7 : jsDay;
  }, [selectedDate]);

  // Lọc các buổi học có lịch diễn ra vào đúng ngày selectedDate từ Thời khóa biểu (sessions)
  const dateSessions = useMemo(() => {
    // 1. Tìm các buổi học có ngày trùng khớp chính xác trong sessions
    const directMatched = sessions.filter((s) => {
      const matchesDate = s.session_date === selectedDate;
      if (!matchesDate) return false;
      if (isTeacher) {
        return (
          s.teacher_id === currentUser.id ||
          s.teacher_name === currentUser.full_name ||
          s.teacher_name?.includes(currentUser.full_name)
        );
      }
      return true; // Admin thấy tất cả các lớp trong ngày
    });

    // 2. Dự phòng: Nếu sessions chưa kịp nạp nhưng lớp học trong classes có lịch học vào thứ này
    const classFallbacks = classes
      .filter((c) => {
        if (!c.days_of_week?.includes(selectedDayOfWeek)) return false;
        if (c.start_date && c.start_date > selectedDate) return false;
        if (isTeacher) {
          return (
            c.teacher_id === currentUser.id ||
            c.teacher_name === currentUser.full_name ||
            c.teacher_name?.includes(currentUser.full_name)
          );
        }
        return true;
      })
      .map((c) => ({
        id: `sess-${c.id}-${selectedDate}`,
        class_id: c.id,
        class_code: c.code,
        class_name: c.name,
        course_name: c.course_name,
        session_type: c.class_type === 'one_on_one' ? ('private' as const) : ('group' as const),
        session_number: 1,
        session_date: selectedDate,
        day_of_week: selectedDayOfWeek,
        start_time: c.start_time,
        end_time: c.end_time,
        teacher_id: c.teacher_id,
        teacher_name: c.teacher_name,
        room: c.room || 'Phòng Studio A1',
        status: 'scheduled' as const,
      }));

    // Gộp và loại trừ trùng lặp theo class_id
    const combinedMap = new Map<string, ClassSession>();
    directMatched.forEach((s) => combinedMap.set(s.class_id || s.id, s));
    classFallbacks.forEach((s) => {
      if (!combinedMap.has(s.class_id)) {
        combinedMap.set(s.class_id, s);
      }
    });

    return Array.from(combinedMap.values());
  }, [sessions, classes, selectedDate, selectedDayOfWeek, isTeacher, currentUser]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  useEffect(() => {
    if (dateSessions.length > 0) {
      if (!dateSessions.some((s) => s.id === selectedSessionId)) {
        setSelectedSessionId(dateSessions[0].id);
      }
    } else {
      setSelectedSessionId('');
    }
  }, [dateSessions, selectedSessionId]);

  const activeSession = dateSessions.find((s) => s.id === selectedSessionId) || dateSessions[0] || null;
  const activeClass = activeSession
    ? classes.find((c) => c.id === activeSession.class_id) || {
        id: activeSession.class_id,
        code: activeSession.class_code,
        name: activeSession.class_name,
        course_name: activeSession.course_name,
        teacher_name: activeSession.teacher_name,
        start_time: activeSession.start_time,
        end_time: activeSession.end_time,
      }
    : null;

  // Kiểm tra xem buổi học này đã được điểm danh chưa
  const isSessionAttended = useMemo(() => {
    if (!activeSession) return false;
    return (
      activeSession.status === 'completed' ||
      attendance.some((a) => a.session_id === activeSession.id && a.status && a.status !== 'unmarked')
    );
  }, [activeSession, attendance]);

  // Danh sách học viên chính thức của lớp
  const studentList = useMemo(() => {
    if (!activeClass) return [];
    return students.filter(
      (s) => s.class_id === activeClass.id || (activeClass.code && s.class_code === activeClass.code)
    );
  }, [students, activeClass]);

  const [tempStatus, setTempStatus] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Tự động nạp dữ liệu điểm danh đã lưu từ trước (nếu có)
  useEffect(() => {
    if (activeSession) {
      const existingRecords = attendance.filter((a) => a.session_id === activeSession.id);
      if (existingRecords.length > 0) {
        const statusMap: Record<string, AttendanceStatus> = {};
        const noteMap: Record<string, string> = {};
        existingRecords.forEach((r) => {
          statusMap[r.student_id] = r.status;
          if (r.notes) noteMap[r.student_id] = r.notes;
        });
        setTempStatus(statusMap);
        setNotes(noteMap);
      } else {
        setTempStatus({});
        setNotes({});
      }
    } else {
      setTempStatus({});
      setNotes({});
    }
  }, [activeSession?.id, attendance]);

  const handleSelectStatus = (studentId: string, status: AttendanceStatus) => {
    if (isStudent || isSessionAttended) return; // Học viên hoặc lớp đã điểm danh không được sửa
    setTempStatus((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleNoteChange = (studentId: string, text: string) => {
    if (isStudent || isSessionAttended) return;
    setNotes((prev) => ({ ...prev, [studentId]: text }));
  };

  const presentCount = studentList.filter((s) => (tempStatus[s.id] || 'unmarked') === 'present').length;
  const absentCount = studentList.filter((s) => tempStatus[s.id] === 'absent').length;
  const unmarkedCount = studentList.filter(
    (s) => !tempStatus[s.id] || tempStatus[s.id] === 'unmarked'
  ).length;

  const handleSave = () => {
    if (isStudent) {
      showToast('Học viên chỉ có quyền xem lịch sử điểm danh', 'error');
      return;
    }
    if (isSessionAttended) {
      showToast('Buổi học này đã được điểm danh và khóa chỉnh sửa!', 'info');
      return;
    }
    if (!activeSession) {
      showToast('Không tìm thấy buổi học hợp lệ để điểm danh', 'error');
      return;
    }

    const sessionId = activeSession.id;
    const records = studentList.map((s) => ({
      student_id: s.id,
      student_name: s.full_name,
      student_code: s.student_code,
      status: tempStatus[s.id] || 'unmarked',
      notes: notes[s.id] || '',
    }));

    saveAttendance(sessionId, activeClass?.id || '', records);
  };

  const handleReset = () => {
    if (isSessionAttended) return;
    setTempStatus({});
    setNotes({});
    showToast('Đã khôi phục trạng thái điểm danh', 'info');
  };

  // NẾU LÀ HỌC VIÊN: Hiển thị giao diện xem điểm danh cá nhân (Read-only, dữ liệu thật 100%)
  if (isStudent) {
    const myStudent = students.find(
      (s) =>
        (currentUser.student_code && s.student_code === currentUser.student_code) ||
        s.profile_id === currentUser.id ||
        (currentUser.phone && s.phone === currentUser.phone) ||
        s.student_code === currentUser.username
    );

    const myAttendance = attendance.filter(
      (a) =>
        (myStudent?.id && a.student_id === myStudent.id) ||
        (myStudent?.student_code && a.student_code === myStudent.student_code) ||
        (myStudent?.full_name && a.student_name === myStudent.full_name) ||
        (currentUser.student_code && a.student_code === currentUser.student_code)
    );

    const presentRecords = myAttendance.filter((a) => a.status === 'present');
    const absentRecords = myAttendance.filter((a) => a.status === 'absent');
    const completedCount = Math.max(myStudent?.completed_sessions || 0, presentRecords.length);
    const absentCountStudent = Math.max(myStudent?.absent_sessions || 0, absentRecords.length);
    const totalRegistered = myStudent?.total_registered_sessions || 20;
    const remainingCount = Math.max(0, totalRegistered - completedCount);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Lịch Sử Điểm Danh Của Bạn</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Học viên được xem thông tin điểm danh chính xác do giáo viên phụ trách cập nhật
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Số buổi có mặt</span>
            <div className="text-2xl font-extrabold text-emerald-600">{completedCount} buổi</div>
            <p className="text-[11px] text-gray-500">Được tính vào tiến độ hoàn thành</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Số buổi vắng</span>
            <div className="text-2xl font-extrabold text-brand-500">{absentCountStudent} buổi</div>
            <p className="text-[11px] text-gray-500">Không tính vào buổi học</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase">Số buổi còn lại</span>
            <div className="text-2xl font-extrabold text-blue-700">{remainingCount} buổi</div>
            <p className="text-[11px] text-gray-500">Tổng đăng ký: {totalRegistered} buổi</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-sm text-gray-900">Chi tiết từng buổi học</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {myStudent?.class_name || myStudent?.class_code || 'Lớp đào tạo T.A'}
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Ngày học</th>
                <th className="py-3 px-4">Lớp học</th>
                <th className="py-3 px-4 text-center">Trạng thái điểm danh</th>
                <th className="py-3 px-4">Ghi chú của cô giáo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {myAttendance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 font-medium">
                    Chưa có buổi học nào được ghi nhận điểm danh.
                  </td>
                </tr>
              ) : (
                myAttendance.map((rec, idx) => {
                  const sessDate = sessions.find((s) => s.id === rec.session_id)?.session_date;
                  const dateDisplay = sessDate ? formatDate(sessDate) : (rec.marked_at ? formatDate(rec.marked_at) : '—');
                  return (
                    <tr key={rec.id || idx} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{dateDisplay}</td>
                      <td className="py-3.5 px-4 text-gray-700">{myStudent?.class_name || myStudent?.class_code || 'Lớp đào tạo T.A'}</td>
                      <td className="py-3.5 px-4 text-center">
                        {rec.status === 'present' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            ✓ Có mặt
                          </span>
                        )}
                        {rec.status === 'absent' && (
                          <span className="px-2.5 py-1 rounded-full bg-red-100 text-brand-500 font-bold text-[11px]">
                            ✕ Vắng
                          </span>
                        )}
                        {rec.status === 'unmarked' && (
                          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-bold text-[11px]">
                            Chưa điểm danh
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{rec.notes || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // GIAO DIỆN GIÁO VIÊN & ADMIN: Chỉ hiển thị các lớp học có lịch vào đúng ngày đã chọn
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center border border-red-100 shadow-sm">
            <CheckCircle className="w-6 h-6 text-brand-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Điểm danh</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isTeacher
                ? `Danh sách các lớp do cô ${currentUser.full_name} phụ trách giảng dạy theo Thời khóa biểu`
                : 'Hệ thống điểm danh học viên T.A Academy'}
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl shadow-xs">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              NGÀY ĐIỂM DANH
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-gray-800 focus:outline-none bg-transparent cursor-pointer"
            />
          </div>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-4 py-2 bg-red-50 text-brand-500 hover:bg-red-100 text-xs font-bold rounded-xl transition-colors"
          >
            Hôm nay
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Danh sách lớp học CÓ LỊCH VÀO NGÀY ĐÃ CHỌN */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-800">
              <BookOpen className="w-4 h-4 text-brand-500" />
              <span>{isTeacher ? 'Lớp có lịch dạy trong ngày' : 'Lớp học theo thời khóa biểu'}</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-500 text-white">
              {dateSessions.length} lớp
            </span>
          </div>

          <div className="space-y-2.5">
            {dateSessions.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-gray-200 text-center text-xs text-gray-400 space-y-2 shadow-xs">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="font-bold text-gray-700">Không có lớp học nào trong ngày này</p>
                <p className="text-[11px] text-gray-400">
                  Ngày {formatDate(selectedDate)} không có lịch học nào theo thời khóa biểu.
                </p>
              </div>
            ) : (
              dateSessions.map((sess) => {
                const isSelected = sess.id === selectedSessionId;
                const isAttended =
                  sess.status === 'completed' ||
                  attendance.some((a) => a.session_id === sess.id && a.status && a.status !== 'unmarked');

                return (
                  <div
                    key={sess.id}
                    onClick={() => setSelectedSessionId(sess.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-red-50/50 border-brand-300 shadow-sm'
                        : 'bg-white border-gray-200/80 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {sess.start_time} - {sess.end_time}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-brand-500">
                        {sess.course_name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-sm text-gray-900">
                            {sess.class_code} – {sess.class_name}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1 font-medium">
                          <span>GV: {sess.teacher_name}</span>
                          <span>•</span>
                          <span>Buổi {sess.session_number}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-1">
                        {isAttended ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3 text-emerald-700" />
                            <span>Đã điểm danh</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Chưa điểm danh
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Bảng chi tiết điểm danh */}
        {dateSessions.length === 0 ? (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm space-y-3">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-extrabold text-gray-900">
              Không có lớp học cần điểm danh trong ngày {formatDate(selectedDate)}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Thời khóa biểu ngày {formatDate(selectedDate)} không có buổi học nào. Vui lòng chọn ngày khác trên thanh &ldquo;Ngày điểm danh&rdquo; hoặc bấm vào &ldquo;Hôm nay&rdquo;.
            </p>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-100 gap-3">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-extrabold text-gray-900">
                    {activeClass?.name || activeSession?.class_name}
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-red-100 text-brand-500">
                    {activeClass?.course_name || activeSession?.course_name}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2 font-medium">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      Thời gian: {activeSession?.start_time} - {activeSession?.end_time}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>Giáo viên: {activeSession?.teacher_name}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span>Sĩ số: {studentList.length} học viên</span>
                  </span>
                  <span>•</span>
                  <span className="font-bold text-brand-500">Buổi {activeSession?.session_number}</span>
                </div>
              </div>

              {isSessionAttended && (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Đã điểm danh & Khóa</span>
                </div>
              )}
            </div>

            {/* Thông báo nếu buổi học đã điểm danh */}
            {isSessionAttended && (
              <div className="flex items-center space-x-2.5 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Lớp học này đã hoàn tất điểm danh vào hệ thống và đã được khóa lại để tránh chỉnh sửa nhầm lẫn.
                </span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[11px]">
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-4">Họ và tên học viên</th>
                    <th className="py-3 px-4 text-center">Trạng thái điểm danh</th>
                    <th className="py-3 px-4">Ghi chú (nếu có)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {studentList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">
                        Lớp này hiện chưa có học viên nào được xếp vào.
                      </td>
                    </tr>
                  ) : (
                    studentList.map((st, idx) => {
                      const currentVal = tempStatus[st.id] || 'unmarked';
                      return (
                        <tr key={st.id} className="hover:bg-gray-50/50">
                          <td className="py-4 px-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                          <td className="py-4 px-4 font-bold text-gray-900">
                            {st.full_name}
                            <div className="text-[11px] font-normal text-gray-400">{st.student_code}</div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="inline-flex items-center bg-gray-100 p-1 rounded-full space-x-1">
                              <button
                                type="button"
                                disabled={isSessionAttended}
                                onClick={() => handleSelectStatus(st.id, 'present')}
                                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                                  currentVal === 'present'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                } ${isSessionAttended ? 'cursor-not-allowed opacity-90' : ''}`}
                              >
                                ✓ Có mặt
                              </button>
                              <button
                                type="button"
                                disabled={isSessionAttended}
                                onClick={() => handleSelectStatus(st.id, 'absent')}
                                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                                  currentVal === 'absent'
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                } ${isSessionAttended ? 'cursor-not-allowed opacity-90' : ''}`}
                              >
                                ✕ Vắng
                              </button>
                              <button
                                type="button"
                                disabled={isSessionAttended}
                                onClick={() => handleSelectStatus(st.id, 'unmarked')}
                                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                                  currentVal === 'unmarked'
                                    ? 'bg-gray-800 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                } ${isSessionAttended ? 'cursor-not-allowed opacity-90' : ''}`}
                              >
                                - Không điểm danh
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <input
                              type="text"
                              disabled={isSessionAttended}
                              placeholder={isSessionAttended ? 'Không có ghi chú' : 'Nhập ghi chú...'}
                              value={notes[st.id] || ''}
                              onChange={(e) => handleNoteChange(st.id, e.target.value)}
                              className={`w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                                isSessionAttended ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                              }`}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
                <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Có mặt (Tính buổi)</span>
                  <div className="text-xl font-extrabold text-emerald-800">{presentCount}</div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-red-50 border border-red-200/80 text-center">
                  <span className="text-[10px] font-bold text-brand-500 uppercase">Vắng (Không tính)</span>
                  <div className="text-xl font-extrabold text-brand-500">{absentCount}</div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-gray-100 border border-gray-200 text-center">
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Không điểm danh</span>
                  <div className="text-xl font-extrabold text-gray-800">{unmarkedCount}</div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Tổng sĩ số</span>
                  <div className="text-xl font-extrabold text-gray-900">{studentList.length}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                {!isSessionAttended && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Hủy
                  </button>
                )}

                {isSessionAttended ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center space-x-2 px-6 py-2.5 bg-gray-100 border border-gray-200 text-gray-400 text-xs font-bold rounded-xl cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Lớp đã khóa điểm danh</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-200 transition-all hover:scale-[1.02]"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu điểm danh</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
