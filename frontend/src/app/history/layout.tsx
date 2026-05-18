import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lịch Sử Đơn Hàng | Bún Bò Chung Cư',
  robots: {
    index: false,
    follow: false,
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
