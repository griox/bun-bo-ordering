import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kho Quà | Bún Bò Chung Cư',
  robots: {
    index: false,
    follow: false,
  },
};

export default function VouchersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
