'use client';

import React, { useState } from 'react';
import { Bell, ChevronDown, UserCheck, Shield, BookOpen, User } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function Navbar() {
  const { currentUser, setCurrentUser, profiles } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">Ban Giám Đốc</span>;
      case 'teacher':
        return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">Giáo Viên</span>;
      case 'student':
        return <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">Học Viên</span>;
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'TA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
          T.A ACADEMY - HỆ THỐNG ĐÀO TẠO ELEARNING
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
        </button>

        {/* User profile with test role switcher */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
          >
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-gray-800 leading-none">{currentUser.full_name}</div>
              <div className="mt-1 flex justify-end">{getRoleBadge(currentUser.role)}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {getInitials(currentUser.full_name)}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-slide-down">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase font-medium">Đang đăng nhập với vai trò</p>
                <p className="text-sm font-bold text-gray-800">{currentUser.full_name}</p>
                <p className="text-xs text-gray-500">{currentUser.email || currentUser.phone}</p>
              </div>

              <div className="px-4 py-1.5 text-xs text-gray-400 uppercase font-semibold">Chuyển vai trò thử nghiệm:</div>

              {profiles.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setCurrentUser(p);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    p.id === currentUser.id ? 'bg-red-50 text-brand-500 font-semibold' : 'text-gray-700'
                  }`}
                >
                  <span className="truncate">{p.full_name}</span>
                  {getRoleBadge(p.role)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
