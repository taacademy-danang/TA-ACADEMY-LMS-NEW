import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import ToastContainer from '@/components/ui/ToastContainer';

export const metadata: Metadata = {
  title: 'T.A Academy — Hệ Thống Đào Tạo E-Learning & LMS',
  description: 'Hệ thống Quản lý Đào tạo, Xếp lớp, Điểm danh, Đánh giá và Bài tập T.A Academy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F7F7F8] text-gray-900 antialiased font-sans">
        <AppProvider>
          {children}
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}
