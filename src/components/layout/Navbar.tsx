'use client';

import React, { useState } from 'react';
import { Bell, ChevronDown, Shield, Users, User, Check, Key } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function Navbar() {
  const { currentUser, setCurrentUser, profiles, showToast } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 3 tài khoản mẫu chính theo yêu cầu
  const adminUser = profiles.find((p) => p.role === 'admin') || profiles[0];
  const teacherUser = profiles.find((p) => p.role === 'teacher') || profiles[1];
  const studentUser = profiles.find((p) => p.role === 'student') || profiles[5];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-red-100 text-brand-500 text-xs px-2.5 py-0.5 rounded-full font-bold">👑 Admin</span>;
      case 'teacher':
        return <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold">👩‍🏫 Giáo Viên</span>;
      case 'student':
        return <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-bold">🎒 Học Viên</span>;
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

  const handleSwitchRole = (user: typeof adminUser) => {
    setCurrentUser(user);
    showToast(`Đã chuyển đổi sang giao diện: ${user.full_name} (${user.role.toUpperCase()})`, 'info');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Title */}
      <div className="flex items-center space-x-3">
        <span className="text-xs font-bold tracking-wider text-gray-500 uppercase hidden md:inline">
          T.A ACADEMY - HỆ THỐNG ĐÀO TẠO ELEARNING
        </span>
      </div>

      {/* THANH CHUYỂN ĐỔI VAI TRÒ NHANH TRỰC QUAN THEO YÊU CẦU */}
      <div className="flex items-center bg-gray-100/90 p-1 rounded-2xl border border-gray-200 text-xs font-bold">
        <span className="px-2 text-[10px] text-gray-400 uppercase font-extrabold hidden lg:inline">
          Chuyển xem vai trò:
        </span>

        {/* 1. Admin */}
        <button
          onClick={() => handleSwitchRole(adminUser)}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
            currentUser.role === 'admin'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title="Tài khoản: admin / Mật khẩu: 123456"
        >
          <span>👑 Admin</span>
        </button>

        {/* 2. Giáo viên */}
        <button
          onClick={() => handleSwitchRole(teacherUser)}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
            currentUser.role === 'teacher'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title="Tài khoản: vongocnhuy / Mật khẩu: 123456"
        >
          <span>👩‍🏫 Giáo Viên</span>
        </button>

        {/* 3. Học viên */}
        <button
          onClick={() => handleSwitchRole(studentUser)}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
            currentUser.role === 'student'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title="Tài khoản: 0933889900 / Mật khẩu: 123456"
        >
          <span>🎒 Học Viên</span>
        </button>
      </div>

      {/* User Info & Menu */}
      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full"></span>
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
          >
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-gray-800 leading-none">{currentUser.full_name}</div>
              <div className="mt-1 flex justify-end">{getRoleBadge(currentUser.role)}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {getInitials(currentUser.full_name)}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2.5 z-50 animate-slide-down">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Đang đăng nhập với vai trò</p>
                <p className="text-sm font-extrabold text-gray-900">{currentUser.full_name}</p>
                <p className="text-xs text-gray-500 font-mono">
                  {currentUser.username || currentUser.phone} (Mật khẩu: 123456)
                </p>
              </div>

              <div className="px-4 py-2 text-[11px] text-gray-400 uppercase font-bold">
                Chọn tài khoản demo:
              </div>

              <div className="space-y-0.5 px-1.5">
                {profiles.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentUser(p);
                      setDropdownOpen(false);
                      showToast(`Đã chuyển sang ${p.full_name}`, 'info');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      p.id === currentUser.id
                        ? 'bg-red-50 text-brand-500 font-bold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold text-gray-900 truncate">{p.full_name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{p.phone}</div>
                    </div>
                    {getRoleBadge(p.role)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
