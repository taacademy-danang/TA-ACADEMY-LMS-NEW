import * as XLSX from 'xlsx';
import { Student, ClassItem, ClassSession, AttendanceRecord, StudentBenefit } from '@/types';

export function exportAttendanceAndBenefitsToExcel({
  students,
  classes,
  sessions,
  attendance,
  benefits,
}: {
  students: Student[];
  classes: ClassItem[];
  sessions: ClassSession[];
  attendance: AttendanceRecord[];
  benefits: StudentBenefit[];
}) {
  // Tìm số buổi tối đa (mặc định tối thiểu 16 buổi)
  let maxSessions = 16;
  students.forEach((s) => {
    if (s.total_registered_sessions && s.total_registered_sessions > maxSessions) {
      maxSessions = Math.min(s.total_registered_sessions, 48);
    }
  });
  classes.forEach((c) => {
    if (c.total_sessions && c.total_sessions > maxSessions) {
      maxSessions = Math.min(c.total_sessions, 48);
    }
  });

  const sessionHeaders: string[] = [];
  for (let i = 1; i <= maxSessions; i++) {
    sessionHeaders.push(`Buổi ${i}`);
  }

  const headerRow = [
    'STT',
    'HỌC VIÊN',
    'KHÓA HỌC',
    'MÃ LỚP',
    'BUỔI ĐĂNG KÝ',
    ...sessionHeaders,
    'QUYỀN LỢI (HOÀN THÀNH/ CHƯA HOÀN THÀNH)',
    'SỐ BUỔI CÓ MẶT',
    'SỐ BUỔI VẮNG',
    'SỐ BUỔI CÒN LẠI',
  ];

  const dataRows: any[][] = [];

  students.forEach((st, idx) => {
    const studentClass = classes.find((c) => c.id === st.class_id || c.code === st.class_code);
    const studentSessions = sessions
      .filter((sess) => sess.class_id === st.class_id || (studentClass && sess.class_id === studentClass.id))
      .sort((a, b) => a.session_number - b.session_number);

    const studentAtt = attendance.filter((a) => a.student_id === st.id);

    let presentCount = 0;
    let absentCount = 0;

    const sessionValues: string[] = [];
    for (let b = 1; b <= maxSessions; b++) {
      const sess = studentSessions.find((s) => s.session_number === b);
      if (!sess) {
        sessionValues.push('—');
        continue;
      }

      const d = new Date(sess.session_date);
      const dateStr = !isNaN(d.getTime()) ? `${d.getDate()}/${d.getMonth() + 1}` : sess.session_date;

      const att = studentAtt.find((a) => a.session_id === sess.id);
      if (att?.status === 'present') {
        presentCount++;
        sessionValues.push(dateStr);
      } else if (att?.status === 'absent') {
        absentCount++;
        sessionValues.push(`Vắng (${dateStr})`);
      } else {
        sessionValues.push(dateStr);
      }
    }

    const ben = benefits.find(
      (b) =>
        b.student_code === st.student_code ||
        b.student_id === st.id ||
        (b.student_name && b.student_name.toLowerCase() === st.full_name.toLowerCase())
    );

    const hasDriveLink = Boolean(ben?.drive_link && ben.drive_link.trim() !== '');
    const isCompleted = ben?.status === 'completed' || hasDriveLink;

    let benefitText = 'CHƯA HOÀN THÀNH';
    if (isCompleted) {
      benefitText = 'HOÀN THÀNH';
    } else if (ben?.overdue_days && ben.overdue_days > 0) {
      benefitText = `Trễ hạn ${ben.overdue_days} ngày`;
    }

    const totalReg = st.total_registered_sessions || (studentClass ? studentClass.total_sessions : 20);
    const remaining = Math.max(0, totalReg - presentCount);

    dataRows.push([
      idx + 1,
      (st.full_name || '').toUpperCase(),
      (st.course_name || (studentClass ? studentClass.course_name : 'MODEL KIDS')).toUpperCase(),
      st.class_code || (studentClass ? studentClass.code : 'K99'),
      totalReg,
      ...sessionValues,
      benefitText,
      presentCount,
      absentCount,
      remaining,
    ]);
  });

  const titleRow = ['T.A ACADEMY — THEO DÕI ĐIỂM DANH & QUYỀN LỢI HỌC VIÊN (TỔNG HỢP TOÀN HỆ THỐNG)'];
  const fullSheetData = [titleRow, headerRow, ...dataRows];

  const worksheet = XLSX.utils.aoa_to_sheet(fullSheetData);

  // Thiết lập độ rộng cột
  const colWidths = [
    { wch: 6 },  // STT
    { wch: 24 }, // HỌC VIÊN
    { wch: 20 }, // KHÓA HỌC
    { wch: 10 }, // MÃ LỚP
    { wch: 14 }, // BUỔI ĐĂNG KÝ
    ...sessionHeaders.map(() => ({ wch: 12 })),
    { wch: 26 }, // QUYỀN LỢI
    { wch: 16 }, // CÓ MẶT
    { wch: 14 }, // VẮNG
    { wch: 16 }, // CÒN LẠI
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'THEO DÕI ĐIỂM DANH & QUYỀN LỢI');

  const fileName = `Bang_Theo_Doi_Diem_Danh_Va_Quyen_Loi_TA_Academy_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
