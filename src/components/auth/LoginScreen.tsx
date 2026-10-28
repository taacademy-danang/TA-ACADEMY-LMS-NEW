'use client';

import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function LoginScreen() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, password);
  };

  const handleQuickLogin = (u: string, p: string = '123456') => {
    setUsername(u);
    setPassword(p);
    login(u, p);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-200 p-8 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-extrabold text-2xl mx-auto shadow-lg shadow-red-200">
            TA
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">T.A ACADEMY</h1>
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
            Hệ Thống Quản Lý Đào Tạo E-Learning
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tài khoản đăng nhập</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username hoặc Số điện thoại"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-200 transition-all hover:scale-[1.01] flex items-center justify-center space-x-2"
          >
            <span>Đăng Nhập Vào Hệ Thống</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Login Shortcut Boxes for Demo */}
        <div className="pt-4 border-t border-gray-100 space-y-2.5">
          <div className="text-[11px] font-bold text-gray-400 uppercase text-center">
            Đăng nhập nhanh theo vai trò:
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', '123456')}
              className="p-2.5 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-left transition-colors"
            >
              <div className="font-extrabold text-brand-500">Admin</div>
              <div className="text-[10px] text-gray-500">Toàn quyền hệ thống</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('khauthinga', '123456')}
              className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-left transition-colors"
            >
              <div className="font-extrabold text-blue-800">Cô Nga (GV)</div>
              <div className="text-[10px] text-gray-500">Quyền chờ xếp lớp</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('vongocnhuy', '123456')}
              className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-left transition-colors"
            >
              <div className="font-extrabold text-purple-800">Cô Như Ý (GV)</div>
              <div className="text-[10px] text-gray-500">Giáo viên đào tạo</div>
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Học viên đăng nhập bằng Số điện thoại và mật khẩu được cấp từ hệ thống
          </p>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">
        T.A Academy • Đào tạo phong thái chuyên nghiệp • Hệ thống E-Learning 2026
      </div>
    </div>
  );
}
