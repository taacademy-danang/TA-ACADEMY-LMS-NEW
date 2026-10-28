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
} from 'lucide-react';

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
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'TRANG CHỦ', icon: <Home className="w-5 h-5" /> },
    { id: 'intake', label: 'CHỜ XẾP LỚP', icon: <UserPlus className="w-5 h-5" /> },
    { id: 'schedule', label: 'THỜI KHÓA BIỂU', icon: <Calendar className="w-5 h-5" /> },
    { id: 'attendance', label: 'ĐIỂM DANH', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'assignments', label: 'BÀI TẬP', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'evaluations', label: 'ĐÁNH GIÁ', icon: <Award className="w-5 h-5" /> },
    { id: 'benefits', label: 'QUYỀN LỢI', icon: <Gift className="w-5 h-5" /> },
    { id: 'curriculum', label: 'GIÁO ÁN', icon: <FileText className="w-5 h-5" /> },
    { id: 'settings', label: 'CÀI ĐẶT', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 shrink-0">
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
        {navItems.map((item) => {
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
  );
}
