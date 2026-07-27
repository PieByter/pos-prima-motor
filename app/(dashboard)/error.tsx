"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
          Terjadi Kesalahan
        </h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Gagal memuat halaman. Silakan coba lagi atau hubungi admin jika masalah berlanjut.
        </p>
        {error.digest && (
          <p className="mb-4 text-[10px] font-mono text-slate-400 dark:text-slate-600">
            Error ID: {error.digest}
          </p>
        )}
        <Button
          onClick={reset}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    </div>
  );
}
