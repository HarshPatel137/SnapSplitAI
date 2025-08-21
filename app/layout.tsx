import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import ScrollToTop from "@/components/scroll-to-top";

export const metadata: Metadata = {
  title: "SnapSplitAI",
  description: "Modern bill splitting powered by OpenAI Vision",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh min-w-full">
         {/* Global background behind the fixed navbar */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-red-50" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,154,0,0.10),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,69,0,0.08),transparent_70%)]" />
        </div>
        <ScrollToTop />
        <Navbar />
        <main className="page-container">
          {children}
        </main>
      </body>
    </html>
  );
}