import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "선비칼국수 교육 관리",
  description: "(주)GGC 선비칼국수 교육 관리 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
