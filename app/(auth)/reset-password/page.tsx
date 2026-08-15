"use client";

import { Suspense, useState } from "react";
import { Mail, Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrimaMotorLogo } from "@/components/prima-motor-logo";
import { ToastContainer, useToasts } from "@/components/ui/toast";
import { useLocale } from "@/lib/locales";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { toasts, showToast, removeToast } = useToasts();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const email = searchParams.get("email") || "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!email) {
      showToast(t("auth.emailNotFoundToast"), "error", 3000);
      return;
    }

    if (newPassword.length < 6) {
      showToast(t("auth.minPasswordLength"), "error", 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(t("auth.passwordNotMatch"), "error", 3000);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result?.error || t("auth.resetFailed"), "error", 3000);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      showToast(t("auth.networkError"), "error", 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <Mail className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-2">
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {t("auth.emailNotFound")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("auth.startFromForgot")}
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors mt-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("auth.backToForgot")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      {isSuccess ? (
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              {t("auth.resetSuccess")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("auth.redirectingToLogin")}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("auth.newPasswordFor")} <strong>{email}</strong>
            </p>
          </div>

          {/* Email (readonly) */}
          <div className="space-y-2">
            <Label htmlFor="email_display">{t("auth.email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                id="email_display"
                value={email}
                readOnly
                className="pl-10 py-2.5 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.min6Chars")}
                required
                minLength={6}
                className="pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus-visible:ring-amber-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("auth.confirmNewPassword")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                minLength={6}
                className="pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus-visible:ring-amber-600"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
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
                  {t("auth.resetting")}
                </span>
              ) : (
                t("auth.resetPassword")
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
              {t("auth.backToLogin")}
            </Link>
          </div>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
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
              Reset Password
            </h2>
          </div>

          {/* Content */}
          <div className="px-8 pb-10">
            <Suspense fallback={
              <div className="flex items-center justify-center py-8">
                <span className="h-6 w-6 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
              </div>
            }>
              <ResetPasswordForm />
            </Suspense>
          </div>

          {/* Bottom Gradient Bar */}
          <div className="h-1.5 w-full bg-linear-to-r from-yellow-500 via-orange-500 to-red-500" />
        </div>
      </div>
    </>
  );
}
