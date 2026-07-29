"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body className="bg-slate-50 dark:bg-slate-950">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="flex max-w-md flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
              Aplikasi Mengalami Kendala
            </h1>
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              Terjadi kesalahan yang tidak terduga. Tim teknis telah diberitahu.
            </p>
            {error.digest && (
              <p className="mb-6 text-[11px] font-mono text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                Error ID: {error.digest}
              </p>
            )}
            <div className="flex gap-3">
              <Button onClick={reset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Coba Lagi
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                  <Home className="h-4 w-4" />
                  Ke Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
