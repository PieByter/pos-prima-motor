"use client";

import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MobileSidebar } from "./mobile-sidebar";

interface NavbarProps {
  title: string;
  subtitle?: string;
}

export function Navbar({ title, subtitle }: NavbarProps) {
  return (
    <header className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-4 shadow-md shadow-slate-200/40 backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/30 sm:px-6">
      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <MobileSidebar />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-400">
              Prima Motor / Dashboard
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-800 dark:text-white sm:text-2xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72 xl:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search parts, orders..."
              className="h-9 border-slate-200 bg-white/90 pl-9 text-sm shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300 sm:inline-flex">
              Live sync on
            </div>
            <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-sky-200 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-sky-800 dark:hover:text-sky-400">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
