'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { AttendanceStatus } from '@/types';

export default function AttendancePortal() {
  const { classes, students, sessions, attendance, saveAttendance, showToast } = useApp();

  const [selectedDate, setSelectedDate] = useState('2026-10-28');
  const [selectedClassId, setSelectedClassId] = useState<string>('cls-k98');

  // Học viên của lớp đang chọn
  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter(
    (s) => s.class_id === activeClass?.id || s.class_code === activeClass?.code
  );

  // Buổi học tương ứng của lớp trong ngày
  const currentSession = sessions.find(
    (s) => s.class_id === activeClass?.id && (s.session_date === selectedDate || s.day_of_week === 3)
  );

  // Trạng thái điểm danh tạm thời trước khi bấm "Lưu điểm danh"
  const [tempStatus, setTempStatus] = useState<Record<string, AttendanceStatus>>({
    'std-01': 'unmarked',
  });
  const [notes, setNotes] = useState<Record<string, string>>({});

  const handleSelectStatus = (studentId: string, status: AttendanceStatus) => {
    setTempStatus((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleNoteChange = (studentId: string, text: string) => {
    setNotes((prev) => ({ ...prev, [studentId]: text }));
  };

  // Tính số lượng thống kê
  const studentList = classStudents.length > 0 ? classStudents : [];
  const presentCount = studentList.filter((s) => (tempStatus[s.id] || 'unmarked') === 'present').length;
  const absentCount = studentList.filter((s) => tempStatus[s.id] === 'absent').length;
  const unmarkedCount = studentList.filter(
    (s) => !tempStatus[s.id] || tempStatus[s.id] === 'unmarked'
  ).length;

  const handleSave = () => {
    const sessionId = currentSession?.id || `sess-${activeClass?.id}-default`;
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
    setTempStatus({});
    setNotes({});
    showToast('Đã khôi phục trạng thái điểm danh', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center border border-red-100 shadow-sm">
            <CheckCircle className="w-6 h-6 text-brand-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Điểm danh</h1>
            <p className="text-sm text-gray-500 mt-0.5">Chọn lớp học trong ngày để điểm danh học viên</p>
          </div>
        </div>

        {/* Date Selector Top Right */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
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
            onClick={() => setSelectedDate('2026-10-28')}
            className="px-4 py-2 bg-red-50 text-brand-500 hover:bg-red-100 text-xs font-bold rounded-xl transition-colors"
          >
            Hôm nay
          </button>
        </div>
      </div>

      {/* 2-Column Split: Left = Danh sách lớp, Right = Bảng điểm danh */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Danh sách lớp học trong ngày */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-800">
              <BookOpen className="w-4 h-4 text-brand-500" />
              <span>Danh sách lớp học trong ngày</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-500 text-white">
              {classes.length} lớp
            </span>
          </div>

          <div className="space-y-2.5">
            {classes.map((cls) => {
              const isSelected = cls.id === selectedClassId;
              return (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
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
                        {cls.start_time} - {cls.end_time}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-brand-500">
                      {cls.course_name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">{cls.name}</h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1 font-medium">
                        <span>GV: {cls.teacher_name}</span>
                        <span>•</span>
                        <span>Sĩ số: {cls.student_count}</span>
                      </div>
                    </div>

                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Bảng chi tiết điểm danh */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          {/* Header lớp đang chọn */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-100 gap-3">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-extrabold text-gray-900">{activeClass?.name}</h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-red-100 text-brand-500">
                  {activeClass?.course_name}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2 font-medium">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    Thời gian: {activeClass?.start_time} - {activeClass?.end_time}
                  </span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>Giáo viên: {activeClass?.teacher_name}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span>Sĩ số: {studentList.length} học viên</span>
                </span>
              </div>
            </div>

            <button className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors self-start sm:self-auto">
              <span>Xem chi tiết lớp</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Bảng danh sách học viên */}
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
                              onClick={() => handleSelectStatus(st.id, 'present')}
                              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                                currentVal === 'present'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              ✓ Có mặt
                            </button>
                            <button
                              onClick={() => handleSelectStatus(st.id, 'absent')}
                              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                                currentVal === 'absent'
                                  ? 'bg-red-600 text-white shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              ✕ Vắng
                            </button>
                            <button
                              onClick={() => handleSelectStatus(st.id, 'unmarked')}
                              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                                currentVal === 'unmarked'
                                  ? 'bg-gray-800 text-white shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              - Không điểm danh
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <input
                            type="text"
                            placeholder="Nhập ghi chú..."
                            value={notes[st.id] || ''}
                            onChange={(e) => handleNoteChange(st.id, e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary bar and Save button */}
          <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
              <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Có mặt</span>
                <div className="text-xl font-extrabold text-emerald-800">{presentCount}</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-red-50 border border-red-200/80 text-center">
                <span className="text-[10px] font-bold text-brand-500 uppercase">Vắng</span>
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
              <button
                onClick={handleReset}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-200 transition-all hover:scale-[1.02]"
              >
                <Save className="w-4 h-4" />
                <span>Lưu điểm danh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
