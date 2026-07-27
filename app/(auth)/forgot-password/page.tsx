"use client";

import { useState } from "react";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrimaMotorLogo } from "@/components/prima-motor-logo";
import { ToastContainer, useToasts } from "@/components/ui/toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toasts, showToast, removeToast } = useToasts();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      showToast("Silakan masukkan email Anda.", "error", 3000);
      return;
    }

    setIsLoading(true);

    // Redirect to reset-password page with email as query param
    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <>
      <div className="w-full max-w-md p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="pt-10 pb-6 px-8 text-center">
            <div className="flex justify-center items-center mb-4">
              <PrimaMotorLogo />
            </div>
            <h2 className="text-lg font-medium text-gray-500 dark:text-gray-400">
              Lupa Password
            </h2>
          </div>

          {/* Content */}
          <div className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Masukkan email Anda untuk melanjutkan ke halaman reset password.
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="employee@primamotor.com"
                    required
                    className="pl-10 py-2.5 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus-visible:ring-amber-600"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm transition-colors active:scale-[0.98] cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Lanjutkan
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>

              {/* Back to login */}
              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke login
                </Link>
              </div>
            </form>
          </div>

          {/* Bottom Gradient Bar */}
          <div className="h-1.5 w-full bg-linear-to-r from-yellow-500 via-orange-500 to-red-500" />
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
}
