'use client';

import React from 'react';
import {
  Sparkles,
  Calendar,
  Award,
  Users,
  Compass,
  Heart,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Star,
} from 'lucide-react';
import { useApp } from '@/lib/store';

export default function HomeDashboard() {
  const { currentUser } = useApp();

  const todayStr = 'Thứ Tư, ngày 28 tháng 10 năm 2026';

  const introCards = [
    {
      title: 'Phong thái',
      desc: 'Rèn luyện cốt cách, dáng đứng, dáng ngồi và sự thanh lịch chuẩn mực của phụ nữ hiện đại.',
      badge: 'Thanh lịch',
      gradient: 'from-rose-900/90 via-red-950/80 to-black/80',
    },
    {
      title: 'Model Kids',
      desc: 'Đào tạo người mẫu nhí, giải phóng hình thể, biểu cảm và tự tin tỏa sáng trên sàn diễn.',
      badge: 'Tự tin',
      gradient: 'from-amber-900/90 via-red-950/80 to-black/80',
    },
    {
      title: 'Catwalk',
      desc: 'Kỹ thuật trình diễn thời trang cao cấp, nhịp bước âm nhạc và làm chủ sàn runway chuyên nghiệp.',
      badge: 'Chuyên nghiệp',
      gradient: 'from-red-900/90 via-rose-950/80 to-black/80',
    },
    {
      title: 'Chương trình đào tạo',
      desc: 'Lộ trình cá nhân hóa, đào tạo bài bản từ cơ bản đến chuyên sâu cùng đội ngũ chuyên gia hàng đầu.',
      badge: 'Toàn diện',
      gradient: 'from-stone-900/90 via-red-950/80 to-black/80',
    },
  ];

  const highlights = [
    {
      title: 'Lịch khai giảng khóa Model Kids K99',
      date: '05/11/2026',
      desc: 'Chiêu sinh lớp mẫu nhí nâng cao cùng HLV Võ Ngọc Như Ý.',
      tag: 'Khai giảng',
    },
    {
      title: 'Fashion Show Gala Mùa Đông 2026',
      date: '15/11/2026',
      desc: 'Sân khấu thời trang tốt nghiệp dành riêng cho học viên T.A Academy.',
      tag: 'Sự kiện',
    },
    {
      title: 'Quy chuẩn đánh giá và cấp chứng chỉ đào tạo',
      date: '20/10/2026',
      desc: 'Cập nhật hệ thống chấm điểm phong thái chuẩn quốc tế.',
      tag: 'Thông báo',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-dark via-brand-500 to-red-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Hệ thống Quản lý Đào tạo E-Learning 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {currentUser.full_name}
          </h1>
          <p className="mt-1 text-sm text-red-100 font-medium">
            Chúc bạn một ngày làm việc tràn đầy năng lượng và hiệu quả tại T.A Academy!
          </p>
          <div className="mt-4 flex items-center space-x-2 text-xs text-red-200">
            <Calendar className="w-4 h-4" />
            <span>{todayStr}</span>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-4 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* 4 Introduction Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {introCards.map((card, i) => (
          <div
            key={i}
            className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-gray-900 border border-gray-200 h-64 flex flex-col justify-end p-5"
          >
            {/* Background texture gradient */}
            <div className={`absolute inset-0 bg-gradient-to-t ${card.gradient} transition-opacity`}></div>

            <div className="relative z-10 text-white space-y-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 inline-block">
                {card.badge}
              </span>
              <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-amber-200 transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-gray-200 leading-relaxed line-clamp-3">
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 2 Panels Below */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel Trái — Giới thiệu T.A Academy */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Về T.A Academy</h2>
              <p className="text-xs text-gray-500 mt-0.5">Học viện Đào tạo Phong thái & Nghệ thuật biểu diễn</p>
            </div>
            <button className="inline-flex items-center space-x-1 text-xs font-bold text-brand-500 hover:text-brand-600">
              <span>Xem chi tiết</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            T.A Academy là học viện tiên phong chuẩn hóa chương trình đào tạo phong thái, catwalk và nghệ thuật sân khấu tại Việt Nam. Chúng tôi cam kết đồng hành cùng từng học viên để xây dựng sự tự tin, cốt cách thanh lịch và bản lĩnh tỏa sáng trước đám đông.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-xs text-gray-900">Sứ mệnh</h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Kiến tạo thế hệ học viên tự tin, chuẩn phong thái và giao tiếp thanh lịch.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-xs text-gray-900">Giá trị cốt lõi</h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Tận tâm, đồng hành, chuẩn mực chuyên môn và không ngừng đổi mới.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-xs text-gray-900">Đối tượng</h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Trẻ em Model Kids, nữ giới, thanh thiếu niên và người yêu nghệ thuật.
              </p>
            </div>
          </div>
        </div>

        {/* Panel Phải — Thông tin & Hoạt động nổi bật */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-lg font-extrabold text-gray-900">Thông tin & Hoạt động</h2>
            <span className="text-xs font-bold text-gray-400">Tháng 10/2026</span>
          </div>

          <div className="space-y-3">
            {highlights.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-all space-y-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-brand-500">
                    {item.tag}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">{item.date}</span>
                </div>
                <h4 className="font-bold text-xs text-gray-900 leading-tight">{item.title}</h4>
                <p className="text-[11px] text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
