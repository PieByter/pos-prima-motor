"use client";

import { useEffect, useState, useRef } from "react";
import { Camera, Pencil, KeyRound, Lock, Eye, EyeOff, CheckCircle, Loader, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToasts } from "@/components/ui/toast";

type ProfileData = {
  user?: { id?: string; email?: string | null };
  profile?: { name?: string; role?: string; profile_picture?: string | null };
};

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { showToast } = useToasts();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!currentPassword) {
      showToast("Masukkan password saat ini.", "error", 3000);
      return;
    }

    if (newPassword.length < 6) {
      showToast("Password baru minimal 6 karakter.", "error", 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Password dan konfirmasi harus sama.", "error", 3000);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result?.error || "Gagal mengubah password.", "error", 3000);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setIsSuccess(false);
        e.currentTarget.reset();
      }, 2000);
    } catch {
      showToast("Terjadi kesalahan jaringan.", "error", 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSuccess ? "Password Diubah" : "Ganti Password"}
          </DialogTitle>
          <DialogDescription>
            {isSuccess
              ? "Password berhasil diubah."
              : "Masukkan password saat ini dan password baru Anda."}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center py-6 space-y-3">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Password berhasil diubah!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    placeholder="Password saat ini"
                    required
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label={showCurrent ? "Hide" : "Show"}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNew ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label={showNew ? "Hide" : "Show"}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label={showConfirm ? "Hide" : "Show"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan Password"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditProfileDialog({
  open,
  onOpenChange,
  data,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ProfileData | null;
  onSaved: () => void;
}) {
  const { showToast } = useToasts();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(data?.profile?.name ?? "");
    }
  }, [open, data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Nama tidak boleh kosong.", "error", 3000);
      return;
    }

    setIsSaving(true);
    try {
      const userId = data?.user?.id;
      if (!userId) throw new Error("User ID not found");

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const result = await response.json();
        showToast(result?.error || "Gagal menyimpan.", "error", 3000);
        return;
      }

      showToast("Profil berhasil diperbarui.", "success", 1500);
      onSaved();
      onOpenChange(false);
    } catch {
      showToast("Terjadi kesalahan jaringan.", "error", 3000);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profil</DialogTitle>
          <DialogDescription>Perbarui nama tampilan Anda.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Lengkap</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda"
                required
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Batal
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              {isSaving && <Loader className="h-4 w-4 animate-spin mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProfileSection() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToasts();

  async function loadProfile() {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) return;
      setData(await response.json());
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  }

  async function handleAvatarUpload(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Maksimal 2MB", "error", 3000);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        showToast("Gagal upload foto", "error", 3000);
        return;
      }

      const { url } = await uploadRes.json();
      const userId = data?.user?.id;
      if (userId) {
        await fetch(`/api/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_picture: url }),
        });
      }

      showToast("Foto profil diperbarui", "success", 1500);
      loadProfile();
    } catch {
      showToast("Gagal upload foto", "error", 3000);
    } finally {
      setIsUploading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const name = data?.profile?.name ?? "Username";
  const email = data?.user?.email ?? "email@example.com";
  const role = data?.profile?.role ?? "User";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative group">
              <div className="size-32 rounded-full bg-slate-200 dark:bg-slate-700 ring-4 ring-slate-50 dark:ring-slate-700 flex items-center justify-center overflow-hidden">
                {data?.profile?.profile_picture ? (
                  <img
                    src={data.profile.profile_picture}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-slate-500 dark:text-slate-400">
                    {initials || "U"}
                  </span>
                )}
              </div>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
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
                  {name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  {email}
                </p>
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {role}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={() => setShowEditProfile(true)}
                  className="bg-sky-500 hover:bg-sky-600 text-white gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profil
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowChangePassword(true)}
                >
                  <KeyRound className="h-4 w-4" />
                  Ganti Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ChangePasswordDialog
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />

      <EditProfileDialog
        open={showEditProfile}
        onOpenChange={setShowEditProfile}
        data={data}
        onSaved={loadProfile}
      />
    </>
  );
}
