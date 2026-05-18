import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đơn Hàng Của Bàn | Bún Bò Chung Cư',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
