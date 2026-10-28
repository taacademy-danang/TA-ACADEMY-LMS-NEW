'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Trash2,
  Clock,
  User,
  MapPin,
  X,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { ClassSession } from '@/types';

export default function ScheduleManager() {
  const { sessions, classes, profiles, deleteSession, showToast } = useApp();

  const [viewMode, setViewMode] = useState<'week' | 'day' | 'list'>('week');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Default week: 26/10/2026 - 01/11/2026 (matching reference screenshot)
  const [weekOffset, setWeekOffset] = useState(0);

  const daysOfWeekHeader = [
    { name: 'Thứ 2', date: '26/10', dayIndex: 1, fullDate: '2026-10-26' },
    { name: 'Thứ 3', date: '27/10', dayIndex: 2, fullDate: '2026-10-27', isToday: true },
    { name: 'Thứ 4', date: '28/10', dayIndex: 3, fullDate: '2026-10-28', isToday: true },
    { name: 'Thứ 5', date: '29/10', dayIndex: 4, fullDate: '2026-10-29' },
    { name: 'Thứ 6', date: '30/10', dayIndex: 5, fullDate: '2026-10-30' },
    { name: 'Thứ 7', date: '31/10', dayIndex: 6, fullDate: '2026-10-31' },
    { name: 'Chủ nhật', date: '01/11', dayIndex: 7, fullDate: '2026-11-01' },
  ];

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

  // Filtering
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
        s.class_code.toLowerCase().includes(q) ||
        s.teacher_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Thời khóa biểu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý và sắp xếp lịch dạy toàn hệ thống</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm shadow-md shadow-red-200 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm lịch dạy</span>
        </button>
      </div>

      {/* Control bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Week date navigator */}
          <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setWeekOffset((p) => p - 1)}
              className="p-1.5 hover:bg-white rounded-lg text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2 px-2.5 py-1 text-xs font-bold text-gray-800">
              <span>Tuần 26/10 – 01/11/2026</span>
              <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <button
              onClick={() => setWeekOffset((p) => p + 1)}
              className="p-1.5 hover:bg-white rounded-lg text-gray-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Class */}
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

          {/* Filter Teacher */}
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-gray-700"
          >
            <option value="all">Tất cả giáo viên</option>
            {profiles
              .filter((p) => p.role === 'teacher')
              .map((t) => (
                <option key={t.id} value={t.full_name}>
                  {t.full_name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Search */}
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

          {/* View Toggle */}
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
                        // Tìm buổi học có giờ bắt đầu nằm trong khung giờ này
                        const matchedSessions = filteredSessions.filter((s) => {
                          const sHour = parseInt(s.start_time.split(':')[0], 10);
                          return (
                            (s.session_date === d.fullDate || s.day_of_week === d.dayIndex) &&
                            sHour === hour
                          );
                        });

                        return (
                          <td
                            key={d.dayIndex}
                            className={`p-2 border-r border-gray-100 last:border-r-0 align-top ${
                              d.isToday ? 'bg-red-50/10' : ''
                            }`}
                          >
                            <div className="space-y-2">
                              {matchedSessions.map((session) => (
                                <div
                                  key={session.id}
                                  className="p-3 bg-red-50/60 rounded-xl border border-red-100/90 hover:border-red-300 hover:shadow-md transition-all group relative"
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-brand-500">
                                      {session.class_code}
                                    </span>
                                    <button
                                      onClick={() => deleteSession(session.id)}
                                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-0.5 transition-all"
                                      title="Xóa buổi học"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
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

      {/* List Mode */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Ngày học</th>
                <th className="py-3 px-4">Giờ học</th>
                <th className="py-3 px-4">Mã lớp</th>
                <th className="py-3 px-4">Tên lớp</th>
                <th className="py-3 px-4">Khóa đào tạo</th>
                <th className="py-3 px-4">Giáo viên</th>
                <th className="py-3 px-4">Phòng học</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredSessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/60">
                  <td className="py-3.5 px-4 font-bold text-gray-900">{s.session_date}</td>
                  <td className="py-3.5 px-4 text-brand-500 font-bold">
                    {s.start_time} - {s.end_time}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-blue-700">{s.class_code}</td>
                  <td className="py-3.5 px-4 font-bold text-gray-800">{s.class_name}</td>
                  <td className="py-3.5 px-4 text-gray-600">{s.course_name}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900">{s.teacher_name}</td>
                  <td className="py-3.5 px-4 text-gray-500">{s.room}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => deleteSession(s.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Day Mode */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">
            Lịch dạy trong ngày Thứ 4 (28/10/2026)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions
              .filter((s) => s.day_of_week === 3 || s.session_date === '2026-10-28')
              .map((s) => (
                <div key={s.id} className="p-4 rounded-xl border border-red-100 bg-red-50/40 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs px-2 py-0.5 rounded bg-red-100 text-brand-500">
                      {s.class_code}
                    </span>
                    <span className="text-xs font-bold text-brand-500">
                      {s.start_time} - {s.end_time}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{s.class_name}</h4>
                  <p className="text-xs text-gray-600">Giảng viên: <strong>{s.teacher_name}</strong></p>
                  <p className="text-xs text-gray-500">Địa điểm: {s.room}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
