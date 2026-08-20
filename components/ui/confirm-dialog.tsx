"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useLocale } from "@/lib/locales";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void | Promise<void>;
};

/**
 * Dialog konfirmasi yang reusable — pengganti `window.confirm()`.
 * Menampilkan ikon, judul, deskripsi opsional, dan tombol Batal/Konfirmasi.
 * Mengelola state loading sendiri selama `onConfirm` berjalan, dan menutup
 * dialog setelah berhasil. Jika `onConfirm` melempar error, dialog tetap
 * terbuka agar pengguna bisa mencoba lagi.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Biarkan dialog tetap terbuka; parent menampilkan error via toast.
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isLoading) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md rounded-xl" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "p-2.5 rounded-xl",
                variant === "danger"
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-sky-100 dark:bg-sky-900/30"
              )}
            >
              {variant === "danger" ? (
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <Trash2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              )}
            </div>
            <div className="min-w-0 pt-0.5">
              <DialogTitle className="text-lg">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-0.5 text-sm">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel ?? t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "gap-2 text-white",
              variant === "danger"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-sky-500 hover:bg-sky-600"
            )}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel ?? t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}