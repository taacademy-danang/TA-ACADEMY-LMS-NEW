import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import ToastContainer from '@/components/ui/ToastContainer';

export const metadata: Metadata = {
  title: 'T.A Academy — Hệ Thống Đào Tạo E-Learning & LMS',
  description: 'Hệ thống Quản lý Đào tạo, Xếp lớp, Điểm danh, Đánh giá và Bài tập T.A Academy',
};

export const viewport: Viewport = {
  width: 1200,
  initialScale: 0.35,
  minimumScale: 0.2,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=1200, initial-scale=0.35, minimum-scale=0.2, maximum-scale=5.0, user-scalable=yes" />
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
