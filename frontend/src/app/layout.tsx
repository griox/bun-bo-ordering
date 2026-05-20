import type { Metadata } from "next";
import { Roboto_Mono, Roboto, Plus_Jakarta_Sans } from "next/font/google"; 
import { Toaster } from "react-hot-toast";
import { Providers } from "./Providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const robotoMono = Roboto_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-roboto-mono",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Bún Bò Chung Cư & Cà Phê - Hương Vị Truyền Thống",
  description: "Trải nghiệm bún bò đậm đà và cà phê sữa đá Nha Trang chuẩn vị trong không gian Retro giữa lòng thành phố.",
  keywords: ["bún bò", "cà phê", "nha trang", "ẩm thực việt", "đặt món online"],
  openGraph: {
    title: "Bún Bò Chung Cư & Cà Phê - Hương Vị Truyền Thống",
    description: "Trải nghiệm bún bò đậm đà và cà phê sữa đá Nha Trang chuẩn vị trong không gian Retro giữa lòng thành phố.",
    url: "https://bunbo.vn",
    siteName: "Bún Bò Chung Cư & Cà Phê",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Bún Bò Chung Cư & Cà Phê",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bún Bò Chung Cư & Cà Phê",
    description: "Trải nghiệm bún bò đậm đà và cà phê sữa đá Nha Trang chuẩn vị trong không gian Retro giữa lòng thành phố.",
    images: ["/images/og-image.jpg"],
  },
  alternates: {
    canonical: "https://bunbo.vn",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={cn("font-sans", robotoMono.variable, roboto.variable, jakarta.variable)} suppressHydrationWarning>
      <body
        className={cn(
          robotoMono.variable,
          roboto.variable,
          jakarta.variable,
          "antialiased font-main bg-cover bg-fixed bg-center text-text"
        )}
        style={{ backgroundImage: "url('/images/retro-paper-texture.png')" }}
      >
        <Providers>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: "var(--font-roboto-mono)",
                border: "2px solid #2D2D2D",
                borderRadius: "8px",
                boxShadow: "4px 4px 0px #2D2D2D",
                padding: "12px 16px",
              },
              success: {
                iconTheme: { primary: "#D4A853", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#dc2626", secondary: "#fff" },
              },
            }}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}

