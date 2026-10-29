import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wtbkarkekozazuteuzxj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_lkGa7Wrgq4xMxeSqIeJpeQ_f_s3bKnu';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [
      { data: students },
      { data: classes },
      { data: sessions },
      { data: attendance },
      { data: benefits },
    ] = await Promise.all([
      supabase.from('students').select('*'),
      supabase.from('classes').select('*'),
      supabase.from('class_sessions').select('*'),
      supabase.from('attendance_records').select('*'),
      supabase.from('student_benefits').select('*'),
    ]);

    const studentList = students || [];
    const classList = classes || [];
    const sessionList = sessions || [];
    const attendanceList = attendance || [];
    const benefitList = benefits || [];

    // Tìm số buổi đăng ký lớn nhất để sinh số cột (mặc định tối thiểu 16 buổi)
    let maxSessions = 16;
    studentList.forEach((s) => {
      if (s.total_registered_sessions && s.total_registered_sessions > maxSessions) {
        maxSessions = Math.min(s.total_registered_sessions, 48);
      }
    });
    classList.forEach((c) => {
      if (c.total_sessions && c.total_sessions > maxSessions) {
        maxSessions = Math.min(c.total_sessions, 48);
      }
    });

    // Tạo danh sách headers theo đúng yêu cầu:
    // STT - HỌC VIÊN - KHÓA HỌC - MÃ LỚP - BUỔI ĐĂNG KÝ - Buổi 1, Buổi 2... - QUYỀN LỢI - SỐ BUỔI CÓ MẶT - SỐ BUỔI VẮNG - SỐ BUỔI CÒN LẠI
    const sessionHeaders: string[] = [];
    for (let i = 1; i <= maxSessions; i++) {
      sessionHeaders.push(`Buổi ${i}`);
    }

    const headers = [
      'STT',
      'HỌC VIÊN',
      'KHÓA HỌC',
      'MÃ LỚP',
      'BUỔI ĐĂNG KÝ',
      ...sessionHeaders,
      'QUYỀN LỢI',
      'SỐ BUỔI CÓ MẶT',
      'SỐ BUỔI VẮNG',
      'SỐ BUỔI CÒN LẠI',
    ];

    // Xây dựng từng hàng học viên
    const rows = studentList.map((st, idx) => {
      const studentClass = classList.find((c) => c.id === st.class_id || c.code === st.class_code);
      const studentSessions = sessionList
        .filter((sess) => sess.class_id === st.class_id || sess.class_id === studentClass?.id)
        .sort((a, b) => a.session_number - b.session_number);

      const studentAtt = attendanceList.filter((a) => a.student_id === st.id);

      // Tính số buổi có mặt, vắng
      let presentCount = 0;
      let absentCount = 0;

      const sessionCells = sessionHeaders.map((_, sIdx) => {
        const sessionNum = sIdx + 1;
        const matchedSess = studentSessions.find((sess) => sess.session_number === sessionNum);
        if (!matchedSess) {
          return { value: '—', bg: '#FFFFFF', color: '#888888' };
        }

        // Định dạng ngày theo định dạng d/M (ví dụ: 23/9)
        const dateObj = new Date(matchedSess.session_date);
        const dayMonthStr = !isNaN(dateObj.getTime())
          ? `${dateObj.getDate()}/${dateObj.getMonth() + 1}`
          : matchedSess.session_date;

        const attRec = studentAtt.find((a) => a.session_id === matchedSess.id);
        if (attRec?.status === 'present') {
          presentCount++;
          return { value: dayMonthStr, bg: '#E6F4EA', color: '#137333', status: 'present' };
        } else if (attRec?.status === 'absent') {
          absentCount++;
          return { value: `Vắng (${dayMonthStr})`, bg: '#FCE8E6', color: '#C5221F', status: 'absent' };
        }

        return { value: dayMonthStr, bg: '#F8F9FA', color: '#333333', status: 'scheduled' };
      });

      // Kiểm tra quyền lợi
      const benefit = benefitList.find(
        (b) =>
          b.student_code === st.student_code ||
          b.student_id === st.id ||
          b.student_name?.toLowerCase() === st.full_name?.toLowerCase()
      );

      const hasDriveLink = Boolean(benefit?.drive_link && benefit.drive_link.trim() !== '');
      const isCompleted = benefit?.status === 'completed' || hasDriveLink;

      let benefitText = 'CHƯA HOÀN THÀNH';
      let benefitBg = '#FCE8E6'; // Đỏ nhạt
      let benefitColor = '#C5221F'; // Đỏ đậm

      if (isCompleted) {
        benefitText = 'HOÀN THÀNH';
        benefitBg = '#E6F4EA'; // Xanh lá nhạt
        benefitColor = '#137333'; // Xanh lá đậm
      } else if (benefit?.overdue_days && benefit.overdue_days > 0) {
        benefitText = `Trễ hạn ${benefit.overdue_days} ngày`;
        benefitBg = '#FCE8E6';
        benefitColor = '#C5221F';
      }

      const totalReg = st.total_registered_sessions || studentClass?.total_sessions || 16;
      const remaining = Math.max(0, totalReg - presentCount);

      return {
        stt: idx + 1,
        full_name: st.full_name,
        course_name: st.course_name || studentClass?.course_name || 'MODEL KIDS',
        class_code: st.class_code || studentClass?.code || 'K99',
        total_registered: totalReg,
        sessions: sessionCells,
        benefit: {
          text: benefitText,
          bg: benefitBg,
          color: benefitColor,
          drive_link: benefit?.drive_link || '',
        },
        present_count: presentCount,
        absent_count: absentCount,
        remaining_count: remaining,
      };
    });

    return NextResponse.json({
      success: true,
      sheet_name: 'THEO DÕI ĐIỂM DANH & QUYỀN LỢI HỌC VIÊN',
      updated_at: new Date().toISOString(),
      max_sessions: maxSessions,
      headers: headers,
      rows: rows,
    });
  } catch (error: any) {
    console.error('Error generating sheet sync data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
