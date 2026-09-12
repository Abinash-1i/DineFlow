import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DineFlow - AI-Powered Restaurant Order Management & Sales Intelligence Platform",
  description:
    "DineFlow is an enterprise restaurant POS, real-time Kitchen Display System (KDS), Indian GST-compliant billing, and Google Gemini-powered sales intelligence platform.",
  keywords: [
    "DineFlow",
    "Restaurant POS",
    "Kerala Cuisine Restaurant Management",
    "Kitchen Display System",
    "Gemini AI Restaurant Intelligence",
    "GST Billing Invoicing",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF9F6] text-slate-800 selection:bg-amber-500 selection:text-white">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
