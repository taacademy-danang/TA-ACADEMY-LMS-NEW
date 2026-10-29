'use client';

import React, { useState } from 'react';
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
  const { currentUser, isAuthenticated } = useApp();

  // Nếu chưa đăng nhập, hiển thị màn hình đăng nhập chuyên nghiệp
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="flex min-h-screen bg-[#F7F7F8] min-w-[1200px]">
      {/* Sidebar Navigation: Luôn hiển thị đầy đủ bên trái chuẩn như máy tính */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar />

        {/* Content Body: Giữ nguyên bố cục máy tính, tự động thu nhỏ trên điện thoại */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
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

        {/* Footer bám sát chân trang */}
        <footer className="mt-auto py-5 px-8 border-t border-gray-200/80 bg-white/50 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <div className="font-semibold text-gray-700">
            T.A Academy — Học viện Đào tạo Phong thái
          </div>
          <div className="text-[11px] text-gray-400">
            Đào tạo phong thái chuyên nghiệp • Catwalk • Model Kids • Hệ thống E-Learning 2026
          </div>
        </footer>
      </div>
    </div>
  );
}
