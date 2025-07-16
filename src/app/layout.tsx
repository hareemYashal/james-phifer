import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthCheck from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PDF Data Extractor - Phifer Consulting",
  description:
    "Professional PDF document processing and data extraction platform",
  // icons: {
  //   icon: "/logo1.jpg",
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthCheck>{children}</AuthCheck>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
