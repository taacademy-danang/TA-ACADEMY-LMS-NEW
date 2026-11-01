'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Trash2,
  Edit2,
  Clock,
  User,
  Users,
  MapPin,
  X,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { ClassSession, SessionType } from '@/types';
import { calculateClassEndTime, formatDate } from '@/lib/utils';

export default function ScheduleManager() {
  const { sessions, classes, profiles, students, addSession, editSession, deleteSession, cancelSessionOnDate, currentUser, showToast } =
    useApp();

  const [viewMode, setViewMode] = useState<'week' | 'day' | 'list'>('week');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>(
    currentUser.role === 'teacher' ? currentUser.full_name : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (currentUser.role === 'teacher') {
      setSelectedTeacher(currentUser.full_name);
    } else {
      setSelectedTeacher('all');
    }
  }, [currentUser]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSessionToEdit, setSelectedSessionToEdit] = useState<ClassSession | null>(null);

  // Modal Xóa / Hủy lịch dạy
  const [deleteTarget, setDeleteTarget] = useState<{
    isOpen: boolean;
    session: ClassSession | null;
    mode: 'date_only' | 'recurring';
  }>({
    isOpen: false,
    session: null,
    mode: 'date_only',
  });

  // Chọn thứ trong chế độ xem Ngày
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  });

  // Form Thêm lịch dạy (Group vs Private)
  const [sessionType, setSessionType] = useState<SessionType>('group');
  const [addForm, setAddForm] = useState({
    class_id: classes[0]?.id || '',
    student_name: students[0]?.full_name || '',
    session_date: '2026-10-28',
    start_time: '18:30',
    end_time: '20:00', // 1h30 cho nhóm, 1h cho kèm
    teacher_id: currentUser.role === 'teacher' ? currentUser.id : profiles.find((p) => p.role === 'teacher')?.id || '',
    room: 'Phòng Studio A1',
  });

  // Form Chỉnh sửa lịch dạy (đổi giờ, đổi giáo viên dạy thay)
  const [editForm, setEditForm] = useState({
    id: '',
    session_date: '',
    start_time: '',
    end_time: '',
    teacher_id: '',
    teacher_name: '',
    room: '',
  });

  const [weekOffset, setWeekOffset] = useState(0);

  // Tính toán động 7 ngày trong tuần dựa vào weekOffset
  const daysOfWeekHeader = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday + weekOffset * 7);

    const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const fullDate = `${yyyy}-${mm}-${dd}`;
      const isToday = fullDate === today.toISOString().split('T')[0];

      return {
        name: DAY_NAMES[i],
        date: `${dd}/${mm}`,
        dayIndex: i + 1,
        fullDate,
        isToday,
      };
    });
  }, [weekOffset]);

  const timeSlots = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
  ];

  const teachers = profiles.filter((p) => p.role === 'teacher');

  const filteredSessions = sessions.filter((s) => {
    if (selectedClass !== 'all' && s.class_code !== selectedClass && s.class_id !== selectedClass) {
      return false;
    }
    if (selectedTeacher !== 'all' && s.teacher_name !== selectedTeacher && s.teacher_id !== selectedTeacher) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.class_name.toLowerCase().includes(q) ||
        (s.class_code && s.class_code.toLowerCase().includes(q)) ||
        (s.student_name && s.student_name.toLowerCase().includes(q)) ||
        s.teacher_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Tổng hợp tất cả các buổi học thực tế của 7 ngày trong tuần hiện tại
  const weekSessionsByDay = useMemo(() => {
    const map = new Map<number, ClassSession[]>();

    daysOfWeekHeader.forEach((d) => {
      // 1. Các buổi từ sessions (loại trừ các buổi bị hủy)
      const matched = filteredSessions.filter((s) => {
        if (s.status === 'cancelled') return false;
        if (s.session_date) {
          return s.session_date === d.fullDate;
        }
        return s.day_of_week === d.dayIndex;
      });

      // 2. Lịch định kỳ từ classes nếu chưa bị hủy vào ngày này
      const fallbacks = classes
        .filter((c) => {
          if (!c.days_of_week?.includes(d.dayIndex)) return false;
          if (c.start_date && c.start_date > d.fullDate) return false;
          if (selectedClass !== 'all' && c.id !== selectedClass && c.code !== selectedClass) return false;
          if (selectedTeacher !== 'all' && c.teacher_id !== selectedTeacher && c.teacher_name !== selectedTeacher) return false;

          const isCancelled = sessions.some(
            (s) =>
              (s.class_id === c.id || s.class_code === c.code) &&
              s.session_date === d.fullDate &&
              s.status === 'cancelled'
          );
          return !isCancelled;
        })
        .map((c) => ({
          id: `cls-sess-${c.id}-${d.dayIndex}`,
          class_id: c.id,
          class_code: c.code,
          class_name: c.name,
          course_name: c.course_name,
          session_type: c.class_type === 'one_on_one' ? ('private' as const) : ('group' as const),
          session_number: 1,
          session_date: d.fullDate,
          day_of_week: d.dayIndex,
          start_time: c.start_time,
          end_time: c.end_time,
          teacher_id: c.teacher_id,
          teacher_name: c.teacher_name,
          room: c.room || 'Phòng Studio A1',
          status: 'scheduled' as const,
        }));

      // Fallbacks đi trước, matched đi sau để matched ghi đè
      const uniqueMap = new Map<string, ClassSession>();
      [...fallbacks, ...matched].forEach((item) => {
        const key = `${item.class_id || item.class_code || item.class_name}-${item.start_time}`;
        uniqueMap.set(key, item);
      });

      map.set(d.dayIndex, Array.from(uniqueMap.values()));
    });

    return map;
  }, [daysOfWeekHeader, filteredSessions, classes, sessions, selectedClass, selectedTeacher]);

  // Toàn bộ danh sách buổi học trong tuần cho chế độ xem Danh sách (List mode)
  const allListSessions = useMemo(() => {
    const list: ClassSession[] = [];
    weekSessionsByDay.forEach((dayList) => {
      list.push(...dayList);
    });
    return list.sort(
      (a, b) =>
        (a.session_date || '').localeCompare(b.session_date || '') ||
        a.start_time.localeCompare(b.start_time)
    );
  }, [weekSessionsByDay]);

  const handleOpenAdd = () => {
    // Nếu giáo viên đang đăng nhập -> cố định giáo viên phụ trách
    const defaultTeacherId =
      currentUser.role === 'teacher' ? currentUser.id : teachers[0]?.id || '';

    setAddForm({
      class_id: classes[0]?.id || '',
      student_name: students[0]?.full_name || '',
      session_date: '2026-10-28',
      start_time: '18:30',
      end_time: '20:00',
      teacher_id: defaultTeacherId,
      room: 'Phòng Studio A1',
    });
    setSessionType('group');
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedTeacher = profiles.find((p) => p.id === addForm.teacher_id);
    const teacherName = assignedTeacher ? assignedTeacher.full_name : currentUser.full_name;

    const d = new Date(addForm.session_date);
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();

    if (sessionType === 'group') {
      const targetClass = classes.find((c) => c.id === addForm.class_id);
      addSession({
        class_id: targetClass?.id,
        class_code: targetClass?.code || 'K98',
        class_name: targetClass?.name || 'Lớp Đào Tạo',
        course_name: targetClass?.course_name || 'Model Kids',
        session_type: 'group',
        session_number: 1,
        session_date: addForm.session_date,
        day_of_week: dayOfWeek,
        start_time: addForm.start_time,
        end_time: calculateClassEndTime(addForm.start_time, 'group'),
        teacher_id: addForm.teacher_id,
        teacher_name: teacherName,
        room: addForm.room,
      });
    } else {
      addSession({
        class_name: `KÈM 1-1: ${addForm.student_name}`,
        course_name: 'Đào tạo kèm 1-1',
        session_type: 'private',
        student_name: addForm.student_name,
        session_number: 1,
        session_date: addForm.session_date,
        day_of_week: dayOfWeek,
        start_time: addForm.start_time,
        end_time: calculateClassEndTime(addForm.start_time, 'one_on_one'),
        teacher_id: addForm.teacher_id,
        teacher_name: teacherName,
        room: addForm.room || 'Phòng VIP Studio',
      });
    }

    setShowAddModal(false);
  };

  const handleOpenEdit = (session: ClassSession) => {
    setSelectedSessionToEdit(session);
    setEditForm({
      id: session.id,
      session_date: session.session_date,
      start_time: session.start_time,
      end_time: session.end_time,
      teacher_id: session.teacher_id,
      teacher_name: session.teacher_name,
      room: session.room,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const substituteTeacher = profiles.find((p) => p.id === editForm.teacher_id);
    const teacherName = substituteTeacher ? substituteTeacher.full_name : editForm.teacher_name;

    const d = new Date(editForm.session_date);
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();

    editSession(editForm.id, {
      session_date: editForm.session_date,
      day_of_week: dayOfWeek,
      start_time: editForm.start_time,
      end_time: editForm.end_time,
      teacher_id: editForm.teacher_id,
      teacher_name: teacherName,
      room: editForm.room,
    });
    setShowEditModal(false);
  };

  const handleOpenDelete = (session: ClassSession) => {
    setDeleteTarget({
      isOpen: true,
      session,
      mode: 'date_only',
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget.session) return;
    const s = deleteTarget.session;

    if (s.class_id && deleteTarget.mode === 'recurring') {
      // Xóa vĩnh viễn lịch thứ này của lớp
      deleteSession(s.id);
    } else {
      // Nghỉ buổi học ngày này (Lớp nghỉ)
      cancelSessionOnDate(s);
    }

    setDeleteTarget({ isOpen: false, session: null, mode: 'date_only' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Thời khóa biểu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý và sắp xếp lịch dạy toàn hệ thống</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm shadow-md shadow-red-200 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm lịch dạy</span>
        </button>
      </div>

      {/* Control bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setWeekOffset((p) => p - 1)}
              className="p-1.5 hover:bg-white rounded-lg text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2 px-2.5 py-1 text-xs font-bold text-gray-800">
              <span>
                Tuần {daysOfWeekHeader[0]?.date} – {daysOfWeekHeader[6]?.date}/{daysOfWeekHeader[6]?.fullDate.split('-')[0]}
              </span>
              <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <button
              onClick={() => setWeekOffset((p) => p + 1)}
              className="p-1.5 hover:bg-white rounded-lg text-gray-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-gray-700"
          >
            <option value="all">Tất cả lớp</option>
            {classes.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code} – {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-gray-700"
          >
            <option value="all">Tất cả giáo viên</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.full_name}>
                {t.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm lớp, học viên, GV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'week' ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ngày
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Danh sách
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar View: Week Mode */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-center text-xs">
                  <th className="py-3 px-4 font-bold text-gray-400 w-24 text-left border-r border-gray-200">
                    Thời gian
                  </th>
                  {daysOfWeekHeader.map((d) => (
                    <th
                      key={d.dayIndex}
                      className={`py-3 px-3 font-bold border-r border-gray-200 last:border-r-0 ${
                        d.isToday ? 'text-brand-500 bg-red-50/30' : 'text-gray-700'
                      }`}
                    >
                      <div className="font-extrabold">{d.name}</div>
                      <div className={`text-[11px] font-semibold ${d.isToday ? 'text-brand-500' : 'text-gray-400'}`}>
                        {d.date}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time) => {
                  const hour = parseInt(time.split(':')[0], 10);
                  return (
                    <tr key={time} className="border-b border-gray-100 hover:bg-gray-50/40 transition-colors">
                      <td className="py-4 px-4 text-xs font-semibold text-gray-400 border-r border-gray-100 bg-gray-50/20">
                        {time}
                      </td>
                      {daysOfWeekHeader.map((d) => {
                        const sessionsInHour = (weekSessionsByDay.get(d.dayIndex) || []).filter((s) => {
                          const sHour = parseInt(s.start_time.split(':')[0], 10);
                          return sHour === hour;
                        });

                        return (
                          <td
                            key={d.dayIndex}
                            className={`p-2 border-r border-gray-100 last:border-r-0 align-top ${
                              d.isToday ? 'bg-red-50/10' : ''
                            }`}
                          >
                            <div className="space-y-2">
                              {sessionsInHour.map((session) => (
                                <div
                                  key={session.id}
                                  className={`p-3 rounded-xl border hover:shadow-md transition-all group relative ${
                                    session.session_type === 'private'
                                      ? 'bg-amber-50/70 border-amber-200'
                                      : 'bg-red-50/60 border-red-100/90'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span
                                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                        session.session_type === 'private'
                                          ? 'bg-amber-200 text-amber-900'
                                          : 'bg-red-100 text-brand-500'
                                      }`}
                                    >
                                      {session.session_type === 'private' ? 'KÈM 1-1' : session.class_code}
                                    </span>

                                    {/* Action buttons: Sửa & Xóa lịch dạy */}
                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleOpenEdit(session)}
                                        className="text-gray-500 hover:text-blue-600 p-0.5 cursor-pointer"
                                        title="Chỉnh sửa giờ hoặc đổi giáo viên"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleOpenDelete(session)}
                                        className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer"
                                        title="Xóa lịch dạy / Lớp nghỉ"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <h4 className="text-xs font-bold text-gray-900 leading-tight">
                                    {session.class_name}
                                  </h4>

                                  <div className="mt-1 text-[11px] font-semibold text-brand-500">
                                    GV: {session.teacher_name}
                                  </div>

                                  <div className="mt-1 flex items-center space-x-1 text-[10px] text-gray-500">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span>
                                      {session.start_time} - {session.end_time}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Day Mode */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          {/* Day Selector Buttons */}
          <div className="flex flex-wrap gap-2">
            {daysOfWeekHeader.map((d) => {
              const isSelected = d.dayIndex === selectedDayIndex;
              const daySessionsCount = (weekSessionsByDay.get(d.dayIndex) || []).length;
              return (
                <button
                  key={d.dayIndex}
                  onClick={() => setSelectedDayIndex(d.dayIndex)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer ${
                    isSelected
                      ? 'bg-brand-500 text-white shadow-md shadow-red-200 scale-[1.02]'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>
                    {d.name} ({d.date})
                  </span>
                  {daySessionsCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-red-50 text-brand-500'
                      }`}
                    >
                      {daySessionsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Schedule for selected day */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900">
                  Lịch dạy {daysOfWeekHeader.find((d) => d.dayIndex === selectedDayIndex)?.name} – Ngày {daysOfWeekHeader.find((d) => d.dayIndex === selectedDayIndex)?.date}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(weekSessionsByDay.get(selectedDayIndex) || []).length} buổi học đã được sắp xếp
                </p>
              </div>
            </div>

            {(weekSessionsByDay.get(selectedDayIndex) || []).length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 space-y-2">
                <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="font-bold text-gray-700">Không có lịch học nào trong ngày này</p>
                <p className="text-[11px] text-gray-400">Các giáo viên và học viên được nghỉ theo lịch</p>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(weekSessionsByDay.get(selectedDayIndex) || []).map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 rounded-2xl border hover:shadow-md transition-all relative ${
                      session.session_type === 'private'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-red-50/50 border-red-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                          session.session_type === 'private'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-red-100 text-brand-500'
                        }`}
                      >
                        {session.session_type === 'private' ? 'KÈM 1-1' : session.class_code}
                      </span>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(session)}
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa giờ hoặc đổi giáo viên"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(session)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors cursor-pointer"
                          title="Xóa lịch dạy / Lớp nghỉ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-extrabold text-sm text-gray-900 mb-2">
                      {session.class_name}
                    </h4>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center space-x-1.5 font-bold text-brand-500">
                        <User className="w-3.5 h-3.5" />
                        <span>GV: {session.teacher_name}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-gray-600">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {session.start_time} - {session.end_time}
                        </span>
                      </div>
                      {session.room && (
                        <div className="flex items-center space-x-1.5 text-gray-500 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{session.room}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* List Mode */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Ngày học</th>
                <th className="py-3 px-4">Giờ học</th>
                <th className="py-3 px-4">Loại hình</th>
                <th className="py-3 px-4">Mã / Tên lớp</th>
                <th className="py-3 px-4">Giáo viên phụ trách</th>
                <th className="py-3 px-4">Phòng học</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {allListSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Không có lịch dạy nào trong tuần này.
                  </td>
                </tr>
              ) : (
                allListSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{s.session_date ? formatDate(s.session_date) : '-'}</td>
                    <td className="py-3.5 px-4 text-brand-500 font-bold">
                      {s.start_time} - {s.end_time}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.session_type === 'private'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {s.session_type === 'private' ? 'Kèm 1-1' : 'Lớp nhóm'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-800">{s.class_name}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{s.teacher_name}</td>
                    <td className="py-3.5 px-4 text-gray-500">{s.room}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Sửa lịch học hoặc đổi giáo viên"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(s)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa lịch dạy / Lớp nghỉ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Thêm lịch dạy: Chia 2 phương án GROUP & PRIVATE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">Thêm lịch dạy mới</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chọn hình thức GROUP vs PRIVATE */}
            <div className="flex border-b border-gray-100 mt-4 pb-3 space-x-4">
              <button
                type="button"
                onClick={() => {
                  setSessionType('group');
                  setAddForm((p) => ({ ...p, end_time: calculateClassEndTime(p.start_time, 'group') }));
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  sessionType === 'group'
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                GROUP (Lớp Nhóm - 1h30)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSessionType('private');
                  setAddForm((p) => ({ ...p, end_time: calculateClassEndTime(p.start_time, 'one_on_one') }));
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  sessionType === 'private'
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                PRIVATE (Lớp Kèm 1-1 - 1h)
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              {sessionType === 'group' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Chọn Mã Lớp học <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addForm.class_id}
                    onChange={(e) => setAddForm({ ...addForm, class_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.code} – {cls.name} (Khóa: {cls.course_name})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Tên học viên kèm 1-1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Lê Hoàng Thu Thảo"
                    value={addForm.student_name}
                    onChange={(e) => setAddForm({ ...addForm, student_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ngày học</label>
                  <input
                    type="date"
                    required
                    value={addForm.session_date}
                    onChange={(e) => setAddForm({ ...addForm, session_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={addForm.start_time}
                    onChange={(e) => {
                      const startTime = e.target.value;
                      const calculatedEnd = calculateClassEndTime(
                        startTime,
                        sessionType === 'group' ? 'group' : 'one_on_one'
                      );
                      setAddForm({ ...addForm, start_time: startTime, end_time: calculatedEnd });
                    }}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Giáo viên phụ trách{' '}
                  {currentUser.role === 'teacher' && (
                    <span className="text-[11px] text-brand-500 font-normal">
                      (Cố định theo tài khoản đang đăng nhập: {currentUser.full_name})
                    </span>
                  )}
                </label>
                {currentUser.role === 'teacher' ? (
                  <div className="p-2.5 bg-gray-100 rounded-xl text-xs font-semibold text-gray-700">
                    {currentUser.full_name} ({currentUser.phone})
                  </div>
                ) : (
                  <select
                    value={addForm.teacher_id}
                    onChange={(e) => setAddForm({ ...addForm, teacher_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200"
                >
                  Lưu lịch dạy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa buổi học (có thể điều chỉnh giờ và giáo viên dạy thay) */}
      {showEditModal && selectedSessionToEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Chỉnh sửa lịch dạy</h3>
                <p className="text-xs text-gray-500">{selectedSessionToEdit.class_name}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ngày học</label>
                <input
                  type="date"
                  required
                  value={editForm.session_date}
                  onChange={(e) => setEditForm({ ...editForm, session_date: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={editForm.start_time}
                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={editForm.end_time}
                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Giáo viên giảng dạy (Đổi cô giáo khác nếu cô nghỉ/dạy thay)
                </label>
                <select
                  value={editForm.teacher_id}
                  onChange={(e) => setEditForm({ ...editForm, teacher_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phòng học</label>
                <input
                  type="text"
                  value={editForm.room}
                  onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200"
                >
                  Cập nhật lịch dạy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xóa / Hủy lịch dạy */}
      {deleteTarget.isOpen && deleteTarget.session && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Xóa lịch dạy / Buổi học</h3>
                <p className="text-xs text-gray-500">Chọn phương thức xóa phù hợp</p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 mb-4 text-xs space-y-1.5">
              <div className="font-bold text-gray-900 text-sm">
                {deleteTarget.session.class_name} {deleteTarget.session.class_code ? `(${deleteTarget.session.class_code})` : ''}
              </div>
              <div className="text-gray-600">
                Buổi học: <strong className="text-brand-500">{deleteTarget.session.session_date ? formatDate(deleteTarget.session.session_date) : ''}</strong>{' '}
                ({deleteTarget.session.day_of_week === 7 ? 'Chủ nhật' : `Thứ ${deleteTarget.session.day_of_week + 1}`})
              </div>
              <div className="text-gray-600">
                Khung giờ: <strong>{deleteTarget.session.start_time} - {deleteTarget.session.end_time}</strong> &bull; GV:{' '}
                <strong>{deleteTarget.session.teacher_name}</strong>
              </div>
            </div>

            {/* Options nếu là lịch học của lớp */}
            {deleteTarget.session.class_id ? (
              <div className="space-y-3 mb-5">
                <label
                  onClick={() => setDeleteTarget((p) => ({ ...p, mode: 'date_only' }))}
                  className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                    deleteTarget.mode === 'date_only'
                      ? 'border-brand-500 bg-red-50/40 ring-1 ring-brand-500'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={deleteTarget.mode === 'date_only'}
                    onChange={() => setDeleteTarget((p) => ({ ...p, mode: 'date_only' }))}
                    className="mt-0.5 text-brand-500 focus:ring-brand-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900">
                      1. Nghỉ buổi học ngày này (Lớp nghỉ)
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      Chỉ hủy buổi học ngày {deleteTarget.session.session_date ? formatDate(deleteTarget.session.session_date) : ''}. Các tuần khác lớp vẫn học bình thường.
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setDeleteTarget((p) => ({ ...p, mode: 'recurring' }))}
                  className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition-all ${
                    deleteTarget.mode === 'recurring'
                      ? 'border-brand-500 bg-red-50/40 ring-1 ring-brand-500'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={deleteTarget.mode === 'recurring'}
                    onChange={() => setDeleteTarget((p) => ({ ...p, mode: 'recurring' }))}
                    className="mt-0.5 text-brand-500 focus:ring-brand-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-red-600">
                      2. Xóa vĩnh viễn lịch {deleteTarget.session.day_of_week === 7 ? 'Chủ nhật' : `Thứ ${deleteTarget.session.day_of_week + 1}`} của lớp này
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      Xóa hẳn khung giờ này khỏi thời khóa biểu của lớp cho tất cả các tuần.
                    </div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="mb-5 text-xs text-gray-600 p-3 bg-red-50/50 rounded-xl border border-red-100">
                Bạn có chắc chắn muốn xóa lịch dạy kèm 1-1 này khỏi thời khóa biểu?
              </div>
            )}

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeleteTarget({ isOpen: false, session: null, mode: 'date_only' })}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-200 transition-all hover:scale-102 cursor-pointer"
              >
                {deleteTarget.session.class_id && deleteTarget.mode === 'recurring'
                  ? 'Xác nhận xóa vĩnh viễn'
                  : 'Xác nhận cho nghỉ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
