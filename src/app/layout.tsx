import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Lucky Wheel | Vòng quay may mắn",
  description:
    "Vòng quay may mắn dành cho sự kiện với danh sách lên đến 400 người.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
