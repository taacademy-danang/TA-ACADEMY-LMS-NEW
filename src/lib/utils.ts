import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ClassSession, ClassType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function calculateWaitingTime(createdAt: string): string {
  if (!createdAt) return 'Vừa tiếp nhận';
  const created = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const diffMs = Math.max(0, now - created);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 60) {
    return `${Math.max(1, diffMinutes)} phút`;
  }
  if (diffHours < 24) {
    return `${diffHours} giờ`;
  }
  const remainingHours = diffHours % 24;
  if (remainingHours > 0) {
    return `${diffDays} ngày ${remainingHours} giờ`;
  }
  return `${diffDays} ngày`;
}

export function generateStudentCode(existingCount: number = 1): string {
  const nextNum = existingCount + 1;
  return `TA-STD-${String(nextNum).padStart(3, '0')}`;
}

// Giờ kết thúc: Lớp nhóm 1 tiếng rưỡi (90 phút), lớp kèm 1 tiếng (60 phút)
export function calculateClassEndTime(startTime: string, classType: ClassType = 'group'): string {
  if (!startTime) return '10:00';
  const [hoursStr, minsStr] = startTime.split(':');
  let hours = parseInt(hoursStr, 10);
  let mins = parseInt(minsStr, 10);

  const durationMinutes = classType === 'one_on_one' ? 60 : 90;
  mins += durationMinutes;
  hours += Math.floor(mins / 60);
  mins = mins % 60;
  hours = hours % 24;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function generateSessionsForClass(
  classId: string,
  classCode: string,
  className: string,
  courseName: string,
  startDateStr: string,
  daysOfWeek: number[], // 1: Thứ 2 ... 7: CN
  startTime: string,
  endTime: string,
  totalSessions: number,
  teacherId: string,
  teacherName: string,
  room: string = 'Phòng Studio A'
): ClassSession[] {
  const sessions: ClassSession[] = [];
  if (!startDateStr || daysOfWeek.length === 0 || totalSessions <= 0) return sessions;

  let currentDate = new Date(startDateStr);
  let sessionCount = 0;

  // Map JS getDay() (0 is Sun, 1 is Mon... 6 is Sat) to 1..7 (1 is Mon, 7 is Sun)
  const getAppDayOfWeek = (d: Date) => {
    const day = d.getDay();
    return day === 0 ? 7 : day;
  };

  let maxIterations = 365;
  while (sessionCount < totalSessions && maxIterations > 0) {
    maxIterations--;
    const currentDayOfWeek = getAppDayOfWeek(currentDate);

    if (daysOfWeek.includes(currentDayOfWeek)) {
      sessionCount++;
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      const sessionDate = `${yyyy}-${mm}-${dd}`;

      sessions.push({
        id: `sess-${classId}-${sessionCount}`,
        class_id: classId,
        class_code: classCode,
        class_name: className,
        course_name: courseName,
        session_number: sessionCount,
        session_date: sessionDate,
        day_of_week: currentDayOfWeek,
        start_time: startTime,
        end_time: endTime,
        teacher_id: teacherId,
        teacher_name: teacherName,
        room: room,
        status: 'scheduled',
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return sessions;
}
