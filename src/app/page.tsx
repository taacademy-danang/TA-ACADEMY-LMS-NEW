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
import BenefitsManager from '@/components/benefits/BenefitsManager';
import CurriculumManager from '@/components/curriculum/CurriculumManager';
import { useApp } from '@/lib/store';

export default function AppMainPage() {
  const [activeTab, setActiveTab] = useState<TabId>('intake'); // Mặc định mở Tab Chờ Xếp Lớp (Giao diện 1)
  const { currentUser } = useApp();

  return (
    <div className="flex min-h-screen bg-[#F7F7F8]">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar />

        {/* Content Body */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'home' && <HomeDashboard />}
          {activeTab === 'intake' && <IntakePipeline />}
          {activeTab === 'schedule' && <ScheduleManager />}
          {activeTab === 'attendance' && <AttendancePortal />}
          {activeTab === 'assignments' && <StudentPortal />}
          {activeTab === 'evaluations' && <StudentEvaluationManager />}
          {activeTab === 'benefits' && <BenefitsManager />}
          {activeTab === 'curriculum' && <CurriculumManager />}
          {activeTab === 'settings' && <AdminSettings />}
        </main>

        {/* Footer bám sát chân trang ở Ảnh tham chiếu 1 */}
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
