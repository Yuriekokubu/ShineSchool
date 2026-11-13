import type { Metadata, Viewport } from "next";
import { Mali } from "next/font/google";
import "./globals.css";

const mali = Mali({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-mali",
});

export const metadata: Metadata = {
  title: "ShineSchool — โรงเรียนที่เติบโตไปด้วยกัน",
  description: "พื้นที่จัดการข้อมูลโรงเรียน นักเรียน ห้องเรียน และการเรียนรู้อย่างเป็นระบบ",
  applicationName: "ShineSchool",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={mali.variable}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
