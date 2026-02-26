"use client";

import { Camera, Pencil, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileSection() {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          {/* Avatar */}
          <div className="relative group">
            <div className="size-32 rounded-full bg-slate-200 dark:bg-slate-700 ring-4 ring-slate-50 dark:ring-slate-700 flex items-center justify-center">
              <span className="text-4xl font-bold text-slate-500 dark:text-slate-400">
                AP
              </span>
            </div>
            <button
              aria-label="Ganti foto"
              className="absolute bottom-0 right-0 p-2 bg-sky-500 text-white rounded-full shadow-lg hover:bg-sky-600 transition-colors border-4 border-white dark:border-slate-800"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Admin Prima Motor
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                admin@primamotor.com
              </p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                Super Admin
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button className="bg-sky-500 hover:bg-sky-600 text-white gap-2">
                <Pencil className="h-4 w-4" />
                Edit Profil
              </Button>
              <Button variant="outline" className="gap-2">
                <KeyRound className="h-4 w-4" />
                Ganti Password
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
