'use client';

import React, { useState } from 'react';
import { FileText, BookOpen, Layers, CheckCircle2, ChevronRight } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function CurriculumManager() {
  const { courses } = useApp();
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || 'c-mk');

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const syllabus = [
    {
      session: 1,
      title: 'Nhập môn & Khai phóng sự tự tin',
      objectives: ['Làm quen với sàn runway', 'Kỹ thuật giữ thẳng lưng, hạ vai và ánh mắt tự tin'],
      duration: '90 phút',
    },
    {
      session: 2,
      title: 'Kỹ thuật bước đi Runway cơ bản',
      objectives: ['Bước đi trên một đường thẳng', 'Cách đánh tay tự nhiên theo nhịp điệu âm nhạc'],
      duration: '90 phút',
    },
    {
      session: 3,
      title: 'Nghệ thuật Pose dáng (Dừng 3s)',
      objectives: ['3 dáng Pose thương mại và 3 dáng Pose thời trang cao cấp', 'Kỹ năng giữ thăng bằng'],
      duration: '90 phút',
    },
    {
      session: 4,
      title: 'Giải phóng hình thể & Biểu cảm gương mặt',
      objectives: ['Chuyển động linh hoạt theo âm nhạc', 'Làm chủ cơ mặt trước ống kính máy ảnh'],
      duration: '90 phút',
    },
    {
      session: 5,
      title: 'Catwalk với phụ kiện thời trang',
      objectives: ['Cách cầm túi xách, mũ, áo khoác khi di chuyển', 'Xử lý tình huống trên sân khấu'],
      duration: '90 phút',
    },
    {
      session: 6,
      title: 'Tổng duyệt & Báo cáo tiến độ tốt nghiệp',
      objectives: ['Thực hành bài diễn hoàn chỉnh', 'Nhận xét chi tiết từ Ban Giám Khảo'],
      duration: '90 phút',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Khung Giáo Án Đào Tạo</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Giáo trình chuẩn hóa quốc tế của Học Viện T.A Academy
          </p>
        </div>

        {/* Course switcher */}
        <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-gray-200">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCourseId(c.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                c.id === selectedCourseId
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="pb-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">
              Giáo trình khóa: {selectedCourse?.name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Thời lượng đào tạo: <strong className="text-brand-500">{selectedCourse?.total_sessions} buổi</strong> • Đối tượng: {selectedCourse?.target_audience}
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
            Giáo án chính thức 2026
          </span>
        </div>

        <div className="space-y-3">
          {syllabus.map((item) => (
            <div
              key={item.session}
              className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-brand-200 hover:shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-lg bg-red-100 text-brand-500 font-extrabold text-xs flex items-center justify-center">
                    {item.session}
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900">{item.title}</h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                  {item.duration}
                </span>
              </div>

              <div className="pl-10 text-xs text-gray-600 space-y-1">
                <span className="font-semibold text-gray-700">Mục tiêu đào tạo:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-gray-600">
                  {item.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
