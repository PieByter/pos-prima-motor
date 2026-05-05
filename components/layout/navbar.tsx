"use client";

import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NavbarProps {
  title: string;
  subtitle?: string;
}

export function Navbar({ title, subtitle }: NavbarProps) {
  return (
    <header className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
      {/* Page title */}
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right-side controls (desktop only) */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Cari..."
            className="w-52 pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm"
          />
        </div>

        {/* Notification */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-950" />
        </button>
      </div>
    </header>
  );
}
