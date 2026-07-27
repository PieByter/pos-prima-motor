"use client";

import { useLocale } from "@/lib/locales";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === "id" ? "en" : "id")}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
      title={locale === "id" ? "Switch to English" : "Ganti ke Indonesia"}
      aria-label={locale === "id" ? "Switch to English" : "Ganti ke Indonesia"}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{locale === "id" ? "EN" : "ID"}</span>
    </button>
  );
}
