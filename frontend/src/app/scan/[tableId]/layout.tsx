import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quét Mã Bàn | Bún Bò Chung Cư',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
