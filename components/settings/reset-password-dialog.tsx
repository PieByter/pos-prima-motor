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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, KeyRound, Loader } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { apiId: string; name: string } | null;
  onReset: (userId: string, newPassword: string) => Promise<void>;
};

export function ResetPasswordDialog({ open, onOpenChange, user, onReset }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (password.length < 6) {
      alert("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Password dan konfirmasi tidak sama.");
      return;
    }

    setIsSaving(true);
    try {
      await onReset(user.apiId, password);
      setPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">Reset Password</DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                {user ? `Ubah password untuk ${user.name}` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="rp-password" className="text-sm font-medium">
              Password Baru <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="rp-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
                className="bg-slate-50 dark:bg-slate-800 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rp-confirm" className="text-sm font-medium">
              Konfirmasi Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="rp-confirm"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                required
                minLength={6}
                className="bg-slate-50 dark:bg-slate-800 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
              disabled={isSaving || !password.trim() || password.length < 6}
            >
              {isSaving && <Loader className="h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
