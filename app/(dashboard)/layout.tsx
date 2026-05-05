"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Bike, Bell } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  void pathname;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Desktop sidebar (md+) ── */}
      <Sidebar />

      {/* ── Mobile drawer controlled by layout state ── */}
      <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      {/* ── Content column ── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* ── Sticky mobile top-bar (hidden on md+) ── */}
        <header className="md:hidden sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-sidebar"
          >
            {/* Animated hamburger → X */}
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-sky-500 text-white p-1 rounded-md shadow-sm shadow-sky-500/40">
              <Bike className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight">
              Prima<span className="text-sky-500">Motor</span>
            </span>
          </Link>

          {/* Bell */}
          <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </button>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
