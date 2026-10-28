'use client';

import React from 'react';
import { Gift, Award, CheckCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function BenefitsManager() {
  const { benefits, students } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Quyền Lợi Học Viên</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Quản lý số buổi đăng ký, số buổi đã tham gia, bảo lưu và thời hạn đào tạo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase">Tổng số học viên có quyền lợi</span>
          <div className="text-2xl font-extrabold text-gray-900">{benefits.length} học viên</div>
          <p className="text-xs text-emerald-600 font-medium">100% hồ sơ đã được đồng bộ tự động</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase">Chính sách bảo lưu</span>
          <div className="text-2xl font-extrabold text-brand-500">Tối đa 60 ngày</div>
          <p className="text-xs text-gray-500">Áp dụng cho học viên có lý do chính đáng</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase">Học bù & Luyện tập thêm</span>
          <div className="text-2xl font-extrabold text-blue-700">Miễn phí 2 buổi</div>
          <p className="text-xs text-gray-500">Hỗ trợ học viên theo kịp tiến độ cả lớp</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-sm text-gray-900">Chi tiết quyền lợi từng học viên</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-brand-500">
            Dữ liệu trực tiếp từ hệ thống
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-400 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Mã HV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Khóa đào tạo</th>
                <th className="py-3 px-4 text-center">Tổng buổi đăng ký</th>
                <th className="py-3 px-4 text-center">Đã hoàn thành</th>
                <th className="py-3 px-4 text-center">Số buổi còn lại</th>
                <th className="py-3 px-4 text-center">Hạn đào tạo</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {benefits.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-500">{b.student_code}</td>
                  <td className="py-3.5 px-4 font-bold text-gray-900">{b.student_name}</td>
                  <td className="py-3.5 px-4 text-gray-700">{b.course_name} ({b.class_code})</td>
                  <td className="py-3.5 px-4 text-center font-bold text-gray-900">
                    {b.total_registered_sessions} buổi
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-blue-600">
                    {b.completed_sessions} buổi
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-emerald-600">
                    {b.remaining_sessions} buổi
                  </td>
                  <td className="py-3.5 px-4 text-center text-gray-500">{b.expiry_date || '30/04/2027'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Hiệu lực
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
