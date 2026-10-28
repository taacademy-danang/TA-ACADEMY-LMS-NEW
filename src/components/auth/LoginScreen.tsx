'use client';

import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function LoginScreen() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, password, rememberMe);
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
                placeholder="Username, Số điện thoại hoặc Mã học viên"
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
                placeholder="Nhập mật khẩu"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </div>
          </div>

          {/* Checkbox: Lưu phiên đăng nhập */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 border-gray-300 accent-brand-500 cursor-pointer"
              />
              <span className="text-xs text-gray-700 font-medium">Lưu phiên đăng nhập</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-200 transition-all hover:scale-[1.01] flex items-center justify-center space-x-2 mt-2"
          >
            <span>Đăng Nhập Vào Hệ Thống</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Note footer */}
        <div className="pt-3 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-500 font-medium">
            Học viên đăng nhập bằng <span className="font-semibold text-gray-700">Số điện thoại</span> hoặc <span className="font-semibold text-gray-700">Mã học viên</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            Mật khẩu mặc định khởi tạo: <span className="font-bold text-brand-500">123456</span>
          </p>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">
        T.A Academy • Đào tạo phong thái chuyên nghiệp • Hệ thống E-Learning 2026
      </div>
    </div>
  );
}
