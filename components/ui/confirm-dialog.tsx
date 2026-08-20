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
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="flex flex-col items-center gap-3 text-center sm:text-center">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-full",
              variant === "danger"
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
            )}
          >
            {variant === "danger" ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <Trash2 className="h-6 w-6" />
            )}
          </div>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-center">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel ?? t("common.cancel")}
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel ?? t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}