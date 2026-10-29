'use client';

import React from 'react';
import {
  Home,
  UserPlus,
  Calendar,
  CheckSquare,
  BookOpen,
  Award,
  Gift,
  FileText,
  Settings,
  X,
} from 'lucide-react';
import { useApp } from '@/lib/store';

export type TabId =
  | 'home'
  | 'intake'
  | 'schedule'
  | 'attendance'
  | 'assignments'
  | 'evaluations'
  | 'benefits'
  | 'curriculum'
  | 'settings';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeTab, onTabChange, isOpen, onClose }: SidebarProps) {
  const { currentUser } = useApp();

  // Kiểm tra quyền theo vai trò
  const isAdmin = currentUser.role === 'admin';
  const isTeacher = currentUser.role === 'teacher';
  const isStudent = currentUser.role === 'student';

  // "Riêng giáo viên Nga có thể thấy được tab chờ xếp lớp và tham gia chỉnh sửa được"
  const isTeacherNga =
    isTeacher &&
    (currentUser.username === 'khauthinga' || currentUser.full_name.includes('Nga'));

  const navItems: { id: TabId; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: 'home', label: 'TRANG CHỦ', icon: <Home className="w-5 h-5" />, show: true },
    {
      id: 'intake',
      label: 'CHỜ XẾP LỚP',
      icon: <UserPlus className="w-5 h-5" />,
      show: isAdmin || isTeacherNga, // Chỉ Admin và cô Nga
    },
    {
      id: 'schedule',
      label: 'THỜI KHÓA BIỂU',
      icon: <Calendar className="w-5 h-5" />,
      show: isAdmin || isTeacher,
    },
    {
      id: 'attendance',
      label: 'ĐIỂM DANH',
      icon: <CheckSquare className="w-5 h-5" />,
      show: true, // Học viên được xem
    },
    {
      id: 'assignments',
      label: 'BÀI TẬP',
      icon: <BookOpen className="w-5 h-5" />,
      show: true, // Học viên được nộp link
    },
    {
      id: 'evaluations',
      label: 'ĐÁNH GIÁ',
      icon: <Award className="w-5 h-5" />,
      show: true, // Học viên được xem
    },
    {
      id: 'benefits',
      label: 'QUYỀN LỢI',
      icon: <Gift className="w-5 h-5" />,
      show: true, // Học viên được xem
    },
    {
      id: 'curriculum',
      label: 'GIÁO ÁN',
      icon: <FileText className="w-5 h-5" />,
      show: isAdmin || isTeacher,
    },
    {
      id: 'settings',
      label: 'CÀI ĐẶT',
      icon: <Settings className="w-5 h-5" />,
      show: isAdmin, // Chỉ Admin
    },
  ];

  const visibleItems = navItems.filter((i) => i.show);

  return (
    <>
      {/* 1. Desktop Sidebar (Chỉ hiện trên màn hình máy tính từ md trở lên) */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-gray-200 flex-col h-screen sticky top-0 shrink-0">
        {/* Logo & Brand */}
        <div className="h-20 px-6 border-b border-gray-100 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            TA
          </div>
          <div>
            <h1 className="font-bold text-gray-900 tracking-tight text-lg leading-none">T.A ACADEMY</h1>
            <p className="text-[11px] font-medium text-gray-400 mt-1 uppercase">Học Viện Đào Tạo</p>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-red-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer in Sidebar */}
        <div className="p-4 border-t border-gray-100 text-center">
          <span className="text-[10px] text-gray-400 font-medium">Phiên bản E-Learning 2026 • T.A</span>
        </div>
      </aside>

      {/* 2. Mobile Drawer (Chỉ hiện trên điện thoại khi mở menu qua nút hamburger) */}
      {isOpen && (
        <>
          {/* Backdrop tối màn hình */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
            onClick={onClose}
          />

          {/* Drawer trượt từ bên trái ra */}
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-gray-200 flex flex-col h-full shadow-2xl md:hidden animate-slide-right">
            {/* Header có nút đóng X */}
            <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                  TA
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 tracking-tight text-base leading-none">T.A ACADEMY</h2>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5 uppercase">Học Viện Đào Tạo</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation tabs */}
            <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
              {visibleItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all ${
                      isActive
                        ? 'bg-brand-500 text-white shadow-md shadow-red-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Footer in Mobile Drawer */}
            <div className="p-4 border-t border-gray-100 text-center">
              <span className="text-[10px] text-gray-400 font-medium">Phiên bản E-Learning 2026 • T.A</span>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
