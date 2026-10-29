'use client';

import React, { useState } from 'react';
import { Home, CheckSquare, BookOpen, Award, Menu } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Sidebar, { TabId } from '@/components/layout/Sidebar';
import HomeDashboard from '@/components/home/HomeDashboard';
import IntakePipeline from '@/components/intake/IntakePipeline';
import ScheduleManager from '@/components/schedule/ScheduleManager';
import AttendancePortal from '@/components/attendance/AttendancePortal';
import StudentEvaluationManager from '@/components/evaluations/StudentEvaluationManager';
import AdminSettings from '@/components/settings/AdminSettings';
import StudentPortal from '@/components/student/StudentPortal';
import TeacherHomeworkManager from '@/components/assignments/TeacherHomeworkManager';
import BenefitsManager from '@/components/benefits/BenefitsManager';
import CurriculumManager from '@/components/curriculum/CurriculumManager';
import LoginScreen from '@/components/auth/LoginScreen';
import { useApp } from '@/lib/store';

export default function AppMainPage() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, isAuthenticated } = useApp();

  // Nếu chưa đăng nhập, hiển thị màn hình đăng nhập chuyên nghiệp
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="flex min-h-screen bg-[#F7F7F8]">
      {/* Sidebar Navigation: Tự động ẩn trên mobile, hiện slide drawer khi bấm nút menu */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        {/* Content Body */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 md:pb-8">
          {activeTab === 'home' && <HomeDashboard />}
          {activeTab === 'intake' && <IntakePipeline />}
          {activeTab === 'schedule' && <ScheduleManager />}
          {activeTab === 'attendance' && <AttendancePortal />}
          {activeTab === 'assignments' && (currentUser.role === 'student' ? <StudentPortal /> : <TeacherHomeworkManager />)}
          {activeTab === 'evaluations' && <StudentEvaluationManager />}
          {activeTab === 'benefits' && <BenefitsManager />}
          {activeTab === 'curriculum' && <CurriculumManager />}
          {activeTab === 'settings' && <AdminSettings />}
        </main>

        {/* Footer bám sát chân trang (Ẩn trên mobile để nhường chỗ cho Bottom Bar) */}
        <footer className="mt-auto py-5 px-6 sm:px-8 border-t border-gray-200/80 bg-white/50 hidden md:flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <div className="font-semibold text-gray-700">
            T.A Academy — Học viện Đào tạo Phong thái
          </div>
          <div className="text-[11px] text-gray-400">
            Đào tạo phong thái chuyên nghiệp • Catwalk • Model Kids • Hệ thống E-Learning 2026
          </div>
        </footer>

        {/* Bottom Navigation Bar cho điện thoại (Tiện lợi thao tác nhanh bằng một tay) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 z-30 flex items-center justify-around h-16 px-1 safe-area-pb shadow-lg">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'home' ? 'text-brand-500 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Trang chủ</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'attendance' ? 'text-brand-500 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Điểm danh</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'assignments' ? 'text-brand-500 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Bài tập</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluations')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'evaluations' ? 'text-brand-500 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Đánh giá</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
