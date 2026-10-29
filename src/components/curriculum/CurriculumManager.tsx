'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileText,
  BookOpen,
  Edit2,
  X,
  Plus,
  Trash2,
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { LessonPlan } from '@/types';

interface ParsedLessonRow {
  session_number: number;
  content: string;
  homework: string;
}

export default function CurriculumManager() {
  const {
    courses,
    lessonPlans,
    addLessonPlan,
    editLessonPlan,
    deleteLessonPlan,
    batchImportLessonPlans,
    showToast,
  } = useApp();

  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || 'c-mk');
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Lọc giáo án của khóa này và sắp xếp theo số thứ tự buổi học
  const plans = lessonPlans
    .filter((lp) => lp.course_id === selectedCourse?.id || lp.course_name === selectedCourse?.name)
    .sort((a, b) => a.session_number - b.session_number);

  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [editForm, setEditForm] = useState({
    session_number: 1,
    title: '',
    content: '',
    homework_title: '',
    homework_desc: '',
    homework_due_days: 4,
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    session_number: 1,
    title: '',
    content: '',
    homework_title: '',
    homework_desc: '',
    homework_due_days: 4,
  });

  // Modal tải file giáo án
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedLessonRow[]>([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [overwriteMode, setOverwriteMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenAdd = () => {
    const nextSessionNum =
      plans.length > 0 ? Math.max(...plans.map((p) => p.session_number)) + 1 : 1;
    setAddForm({
      session_number: nextSessionNum,
      title: '',
      content: '',
      homework_title: '',
      homework_desc: '',
      homework_due_days: 4,
    });
    setShowAddModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.title.trim()) {
      showToast('Vui lòng nhập tiêu đề buổi học', 'error');
      return;
    }

    addLessonPlan({
      course_id: selectedCourse.id,
      course_name: selectedCourse.name,
      session_number: Number(addForm.session_number),
      title: addForm.title.trim(),
      content: addForm.content.trim(),
      homework_title:
        addForm.homework_title.trim() || `Bài tập thực hành buổi ${addForm.session_number}`,
      homework_desc:
        addForm.homework_desc.trim() || 'Học viên quay video thực hành và nộp qua Google Drive.',
      homework_due_days: Number(addForm.homework_due_days) || 4,
    });

    setShowAddModal(false);
  };

  const handleOpenEdit = (plan: LessonPlan) => {
    setEditingPlan(plan);
    setEditForm({
      session_number: plan.session_number,
      title: plan.title,
      content: plan.content,
      homework_title: plan.homework_title,
      homework_desc: plan.homework_desc,
      homework_due_days: plan.homework_due_days || 4,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    editLessonPlan(editingPlan.id, {
      session_number: Number(editForm.session_number),
      title: editForm.title.trim(),
      content: editForm.content.trim(),
      homework_title: editForm.homework_title.trim(),
      homework_desc: editForm.homework_desc.trim(),
      homework_due_days: Number(editForm.homework_due_days),
    });

    setEditingPlan(null);
  };

  const handleDelete = (plan: LessonPlan) => {
    if (
      window.confirm(
        `Bạn có chắc muốn xóa Buổi ${plan.session_number}: ${plan.title} khỏi giáo án?`
      )
    ) {
      deleteLessonPlan(plan.id);
    }
  };

  // Tải file mẫu CSV
  const handleDownloadSample = () => {
    const csvContent =
      'BUỔI,NỘI DUNG HỌC,BÀI TẬP\n' +
      '1,"Dáng đứng thẳng tựa tường định vị trục sống lưng, mắt nhìn thẳng, thả lỏng bờ vai","Quay video 3 phút đứng tự thế chuẩn và nộp qua link Google Drive"\n' +
      '2,"Luyện bước đi Runway theo nhịp nhạc sôi động, giữ thăng bằng và đánh tay tự nhiên","Quay video sải bước 15 nhịp đúng phách nhạc tại nhà"\n' +
      '3,"Giải phóng hình thể, tự tin tương tác ánh mắt và nụ cười rạng rỡ","Quay video 1 phút thể hiện 3 sắc thái biểu cảm gương mặt"\n' +
      '4,"Kỹ thuật xoay người (Half Turn & Full Turn) dừng tạo dáng cuối thảm đỏ","Quay video thực hành xoay 180 độ và dừng tạo dáng 3 giây"\n';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `giao-an-mau-${selectedCourse?.name || 'ta-academy'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã tải xuống file giáo án mẫu!');
  };

  // Đọc và phân tích file giáo án người dùng tải lên (Hỗ trợ Excel .xlsx, .xls, CSV, TXT, Word)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    const fileName = file.name.toLowerCase();

    try {
      // 1. XỬ LÝ FILE EXCEL (.xlsx, .xls) BẰNG THƯ VIỆN XLSX
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rows || rows.length <= 1) {
          showToast('File Excel không có dữ liệu buổi học', 'error');
          return;
        }

        // Tự động quét tìm dòng tiêu đề thật (bỏ qua dòng tên giáo án hoặc dòng trống ở trên)
        let headerRowIndex = -1;
        let sessionCol = 0;
        let contentCol = 1;
        let homeworkCol = 2;

        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          const row = rows[r] || [];
          const normalized = row.map((cell: any) =>
            String(cell || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
          );

          // Cột buổi: chứa 'buoi', 'session', 'stt' và KHÔNG chứa 'giao an', 'khoa'
          const sIdx = normalized.findIndex(
            (c: string) => /^(buoi|session|stt)$/.test(c) || (c.includes('buoi') && !c.includes('giao an') && !c.includes('khoa'))
          );
          // Cột nội dung: chứa 'noi dung', 'dao tao', 'bai hoc', 'chu de'
          const cIdx = normalized.findIndex(
            (c: string) => c.includes('noi dung') || c.includes('dao tao') || c.includes('bai hoc') || c.includes('chu de')
          );
          // Cột bài tập: chứa 'bai tap', 've nha', 'homework'
          const hIdx = normalized.findIndex(
            (c: string) => c.includes('bai tap') || c.includes('ve nha') || c.includes('homework')
          );

          if (sIdx !== -1 && cIdx !== -1) {
            headerRowIndex = r;
            sessionCol = sIdx;
            contentCol = cIdx;
            homeworkCol = hIdx !== -1 ? hIdx : (cIdx === 1 ? 2 : 1);
          }
        }

        // Nếu không tìm thấy bằng từ khóa, mặc định lấy dòng đầu tiên có ít nhất 2 cột
        if (headerRowIndex === -1) {
          headerRowIndex = rows.findIndex((r: any[]) => r && r.length >= 2) || 0;
          sessionCol = 0;
          contentCol = 1;
          homeworkCol = 2;
        }

        const results: ParsedLessonRow[] = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const rawSession = String(row[sessionCol] || '').trim();
          const rawContent = String(row[contentCol] || '').trim();
          const rawHomework = String(row[homeworkCol] || '').trim();

          // Bỏ qua dòng tiêu đề lặp lại hoặc dòng chứa chữ BUỔI, NỘI DUNG, GIÁO ÁN
          const normSession = rawSession.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const normContent = rawContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (
            normSession.includes('buoi') ||
            normContent.includes('noi dung') ||
            normSession.includes('giao an') ||
            normContent.includes('giao an')
          ) {
            continue;
          }

          const numMatch = rawSession.match(/\d+/);
          const sessionVal = numMatch ? parseInt(numMatch[0], 10) : results.length + 1;

          let finalContent = rawContent;
          // Trường hợp nội dung chỉ là số hoặc trống, tìm cột có chữ dài nhất làm nội dung
          if (!finalContent || /^\d+$/.test(finalContent)) {
            const candidate = row.find(
              (c: any, idx: number) => idx !== sessionCol && String(c || '').trim().length > 10
            );
            if (candidate) finalContent = String(candidate).trim();
          }

          if (!finalContent) continue;

          results.push({
            session_number: sessionVal,
            content: finalContent,
            homework: rawHomework || 'Học viên luyện tập theo nội dung đã học trên lớp.',
          });
        }

        if (results.length === 0) {
          showToast('Không nhận diện được nội dung giáo án từ file Excel', 'error');
          return;
        }

        setParsedRows(results.sort((a, b) => a.session_number - b.session_number));
        showToast(`Đã nhận diện thành công ${results.length} buổi học từ file Excel!`);
        return;
      }

      // 2. XỬ LÝ FILE CSV / TXT / DOC
      const text = await file.text();
      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);

      if (lines.length <= 1) {
        showToast('File không có dữ liệu nội dung', 'error');
        return;
      }

      // Tách dòng header
      const headerLine = lines[0];
      const isComma = headerLine.includes(',');
      const separator = isComma ? ',' : '\t';

      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === separator && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim().replace(/^"|"$/g, ''));
        return result;
      };

      const headers = parseCsvLine(headerLine).map((h) =>
        h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      );

      let sessionIdx = headers.findIndex((h) => h.includes('buoi') || h.includes('session'));
      let contentIdx = headers.findIndex((h) => h.includes('noi dung') || h.includes('content') || h.includes('hoc'));
      let homeworkIdx = headers.findIndex((h) => h.includes('bai tap') || h.includes('homework') || h.includes('tap'));

      if (sessionIdx === -1) sessionIdx = 0;
      if (contentIdx === -1) contentIdx = 1;
      if (homeworkIdx === -1) homeworkIdx = 2;

      const results: ParsedLessonRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length >= 2) {
          const sessionNum = parseInt(cols[sessionIdx], 10) || i;
          const content = cols[contentIdx] || '';
          const homework = cols[homeworkIdx] || '';

          if (content.trim()) {
            results.push({
              session_number: sessionNum,
              content: content.trim(),
              homework: homework.trim() || 'Học viên luyện tập theo nội dung đã học trên lớp.',
            });
          }
        }
      }

      if (results.length === 0) {
        showToast('Không đọc được dòng giáo án hợp lệ nào từ file', 'error');
        return;
      }

      setParsedRows(results.sort((a, b) => a.session_number - b.session_number));
      showToast(`Đã nhận diện thành công ${results.length} buổi học từ file!`);
    } catch (err) {
      console.error('Lỗi khi đọc file:', err);
      showToast('Lỗi khi đọc file. Vui lòng kiểm tra định dạng Excel / CSV', 'error');
    }
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) {
      showToast('Chưa có nội dung buổi học nào để lưu', 'error');
      return;
    }

    const payload = parsedRows.map((r) => ({
      session_number: r.session_number,
      title: `Buổi ${r.session_number}: ${r.content.slice(0, 35)}...`,
      content: r.content,
      homework_title: `Bài tập buổi ${r.session_number}`,
      homework_desc: r.homework,
      homework_due_days: 4,
    }));

    batchImportLessonPlans(selectedCourse.id, selectedCourse.name, payload, overwriteMode);
    setShowUploadModal(false);
    setParsedRows([]);
    setUploadFileName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Khung Giáo Án Đào Tạo</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý nội dung học chi tiết từng buổi và bài tập về nhà đính kèm đồng bộ toàn hệ thống
          </p>
        </div>

        {/* Course switcher */}
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCourseId(c.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                c.id === selectedCourseId
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {c.code || c.name}
            </button>
          ))}
          {/* Nút + nhanh */}
          <button
            onClick={handleOpenAdd}
            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-brand-500 hover:text-white text-brand-500 flex items-center justify-center transition-all border border-red-200"
            title="Thêm buổi học mới cho môn học này"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        {/* Banner khóa học & Nút thao tác */}
        <div className="pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-extrabold text-gray-900">
                Giáo trình khóa: {selectedCourse?.code ? `${selectedCourse.code} – ${selectedCourse.name}` : selectedCourse?.name}
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {plans.length} buổi đã thiết kế
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Thời lượng quy chuẩn: <strong className="text-brand-500">{selectedCourse?.total_sessions} buổi</strong> • Đối tượng: {selectedCourse?.target_audience}
            </p>
          </div>

          {/* Nhóm nút Tải file giáo án lên & Thêm buổi học */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadSample}
              className="inline-flex items-center space-x-1.5 px-3 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-xl transition-colors"
              title="Tải file mẫu CSV gồm 3 cột: BUỔI - NỘI DUNG HỌC - BÀI TẬP"
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span>Tải file mẫu</span>
            </button>

            <button
              onClick={() => {
                setParsedRows([]);
                setUploadFileName('');
                setShowUploadModal(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-200 transition-all hover:scale-102"
              title="Tải lên file giáo án (Excel / CSV) cho khóa này"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tải file giáo án lên</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-red-200 transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm buổi học (+)</span>
            </button>
          </div>
        </div>

        {/* Danh sách từng buổi học với 2 cột: Nội dung học & Bài tập về nhà đính kèm */}
        <div className="space-y-4">
          {plans.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-3">
              <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-700">Khóa học này chưa có nội dung giáo án</p>
                <p className="text-xs text-gray-500">
                  Bạn có thể tải file giáo án lên (gồm các cột BUỔI - NỘI DUNG HỌC - BÀI TẬP) hoặc nhấn Thêm buổi học để nhập thủ công.
                </p>
              </div>
              <div className="pt-2 flex justify-center space-x-3">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Tải file giáo án lên</span>
                </button>
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nhập buổi học đầu tiên</span>
                </button>
              </div>
            </div>
          ) : (
            plans.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-brand-200 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-gray-200/70">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-red-100 text-brand-500 font-extrabold text-sm flex items-center justify-center shadow-2xs">
                      {item.session_number}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">
                        Buổi {item.session_number}: {item.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-brand-500 hover:text-white hover:bg-brand-500 border border-brand-300 rounded-xl transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Xóa buổi học này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 2 Cột: Nội dung học & Bài tập về nhà đính kèm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Cột 1: Nội dung học */}
                  <div className="p-3.5 rounded-xl bg-white border border-gray-200 space-y-1.5 shadow-2xs">
                    <span className="font-bold text-gray-800 flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                      <span>Nội dung học trên lớp:</span>
                    </span>
                    <p className="text-gray-600 leading-relaxed pl-5 whitespace-pre-line">{item.content}</p>
                  </div>

                  {/* Cột 2: Bài tập về nhà đính kèm */}
                  <div className="p-3.5 rounded-xl bg-red-50/40 border border-red-100 space-y-1.5 shadow-2xs">
                    <span className="font-bold text-brand-500 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-500" />
                      <span>Bài tập về nhà đính kèm (Hiện bên Tab Bài tập):</span>
                    </span>
                    <div className="pl-5 space-y-1">
                      <div className="font-bold text-gray-900">{item.homework_title}</div>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.homework_desc}</p>
                      <div className="text-[11px] font-semibold text-brand-600 pt-1">
                        • Hạn nộp bài: Sau {item.homework_due_days} ngày kể từ buổi học
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Nút + nhanh dạng Card đứt nét ở cuối danh sách */}
          <button
            onClick={handleOpenAdd}
            className="w-full py-4 border-2 border-dashed border-gray-300 hover:border-brand-500 rounded-2xl bg-gray-50/50 hover:bg-red-50/30 text-gray-600 hover:text-brand-500 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-brand-500" />
            <span>Thêm buổi học tiếp theo cho khóa {selectedCourse?.name} (Không giới hạn số buổi)</span>
          </button>
        </div>
      </div>

      {/* Modal Tải file giáo án lên (Excel / CSV) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">
                    Tải file giáo án lên — Khóa {selectedCourse?.code ? `${selectedCourse.code} – ${selectedCourse.name}` : selectedCourse?.name}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    File cần có các cột: <strong>BUỔI</strong>, <strong>NỘI DUNG HỌC</strong>, <strong>BÀI TẬP</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Vùng chọn file */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
              >
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    {uploadFileName ? `Đã chọn: ${uploadFileName}` : 'Nhấn để chọn file giáo án từ máy tính (.xlsx, .xls, .doc, .docx, .csv)'}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Hỗ trợ trực tiếp file Excel (.xlsx, .xls), Word (.doc, .docx) và CSV
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.doc,.docx,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Tùy chọn Ghi đè hoặc Thêm tiếp */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700">Chế độ nhập:</span>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={overwriteMode}
                      onChange={() => setOverwriteMode(true)}
                      className="text-brand-500"
                    />
                    <span className="font-semibold text-gray-800">Thay thế toàn bộ</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={!overwriteMode}
                      onChange={() => setOverwriteMode(false)}
                      className="text-brand-500"
                    />
                    <span className="font-semibold text-gray-800">Thêm tiếp</span>
                  </label>
                </div>
              </div>

              {/* Xem trước danh sách đã nhận diện từ file */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span>Xem trước dữ liệu ({parsedRows.length} buổi học nhận diện được):</span>
                    <span className="text-emerald-600 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Hợp lệ</span>
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100/80 sticky top-0 text-[11px] uppercase font-bold text-gray-600">
                        <tr>
                          <th className="py-2 px-3 w-16 text-center">Buổi</th>
                          <th className="py-2 px-3">Nội dung học</th>
                          <th className="py-2 px-3">Bài tập về nhà</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 text-center font-bold text-brand-500">
                              {row.session_number}
                            </td>
                            <td className="py-2.5 px-3 text-gray-800">{row.content}</td>
                            <td className="py-2.5 px-3 text-gray-600">{row.homework}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={parsedRows.length === 0}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-emerald-200 transition-all hover:scale-102"
                >
                  Lưu {parsedRows.length > 0 ? `(${parsedRows.length} buổi)` : ''} vào giáo án
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm buổi học mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-lg bg-red-100 text-brand-500 flex items-center justify-center font-bold text-xs">
                  +
                </span>
                <h3 className="font-extrabold text-gray-900 text-base">
                  Thêm buổi học mới — {selectedCourse?.name}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Số buổi</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={addForm.session_number}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        session_number: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-bold text-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề buổi học</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Kỹ thuật giữ thăng bằng và giải phóng hình thể"
                    value={addForm.title}
                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nội dung giảng dạy chi tiết trên lớp
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập chi tiết các động tác, nội dung cô giáo sẽ hướng dẫn học viên..."
                  value={addForm.content}
                  onChange={(e) => setAddForm({ ...addForm, content: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs font-extrabold text-brand-500 uppercase">
                  Bài tập về nhà đính kèm (Hiển thị cho học viên)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề bài tập</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Quay video 3 phút thực hành dáng đứng thẳng"
                  value={addForm.homework_title}
                  onChange={(e) => setAddForm({ ...addForm, homework_title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Yêu cầu bài tập chi tiết</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Yêu cầu học viên quay video, thời lượng, trang phục và cách nộp..."
                  value={addForm.homework_desc}
                  onChange={(e) => setAddForm({ ...addForm, homework_desc: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hạn nộp (Số ngày sau buổi học)</label>
                <input
                  type="number"
                  min="1"
                  value={addForm.homework_due_days}
                  onChange={(e) =>
                    setAddForm({
                      ...addForm,
                      homework_due_days: parseInt(e.target.value, 10) || 4,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200 transition-all hover:scale-102"
                >
                  Lưu buổi học vào giáo án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa giáo án & bài tập */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">
                Chỉnh sửa Buổi {editingPlan.session_number}: {editingPlan.title}
              </h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Số buổi</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.session_number}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        session_number: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-bold text-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề buổi học</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nội dung giảng dạy chi tiết trên lớp
                </label>
                <textarea
                  rows={3}
                  required
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs font-extrabold text-brand-500 uppercase">
                  Bài tập về nhà đính kèm (Hiển thị cho học viên)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề bài tập</label>
                <input
                  type="text"
                  required
                  value={editForm.homework_title}
                  onChange={(e) => setEditForm({ ...editForm, homework_title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Yêu cầu bài tập chi tiết</label>
                <textarea
                  rows={3}
                  required
                  value={editForm.homework_desc}
                  onChange={(e) => setEditForm({ ...editForm, homework_desc: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Hạn nộp (Số ngày sau buổi học)</label>
                <input
                  type="number"
                  min="1"
                  value={editForm.homework_due_days}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      homework_due_days: parseInt(e.target.value, 10) || 4,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-red-200 transition-all hover:scale-102"
                >
                  Lưu thay đổi giáo án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}