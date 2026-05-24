import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bắt Đầu Gọi Món | Bún Bò Chung Cư',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
