"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Loader, ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/locales";

type UserFormData = {
  name: string;
  role: "admin" | "mekanik";
  is_active: boolean;
  password?: string;
  weekly_salary?: number;
  service_commission_pct?: number;
  hire_date?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    apiId: string;
    name: string;
    role: string;
    status: string;
    weekly_salary?: number;
    service_commission_pct?: number;
    hire_date?: string;
  } | null;
  onSave: (data: UserFormData) => Promise<void>;
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function parseNumeric(val: string): number {
  const cleaned = val.replace(/[^\d]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

export function UserFormDialog({ open, onOpenChange, user, onSave }: Props) {
  const { t } = useLocale();
  const isEdit = !!user;
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("mekanik");
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Compensation fields
  const [weeklySalary, setWeeklySalary] = useState("0");
  const [commissionPct, setCommissionPct] = useState("0");
  const [hireDate, setHireDate] = useState("");
  const showCompensation = role === "mekanik";

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => {
        setName(user?.name ?? "");
        setRole(
          user?.role === "Admin"
            ? "admin"
            : user?.role === "Mekanik"
              ? "mekanik"
              : "mekanik",
        );
        setIsActive(user?.status === "Aktif");
        setPassword("");
        setWeeklySalary(user?.weekly_salary ? user.weekly_salary.toString() : "0");
        setCommissionPct(user?.service_commission_pct ? user.service_commission_pct.toString() : "0");
        setHireDate(user?.hire_date ?? "");
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [open, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data: UserFormData = {
        name: name.trim(),
        role: role as "admin" | "mekanik",
        is_active: isActive,
        weekly_salary: parseNumeric(weeklySalary),
        service_commission_pct: parseFloat(commissionPct) || 0,
        hire_date: hireDate || undefined,
      };
      if (password.trim()) {
        data.password = password.trim();
      }
      await onSave(data);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/30">
              <ShieldCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {isEdit ? t("settings.editUser") : t("settings.addUserTitle")}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                {isEdit
                  ? t("settings.editUserDesc")
                  : t("settings.addUserDesc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Nama */}
          <div className="space-y-1.5">
            <Label htmlFor="user-name" className="text-sm font-medium">
              {t("auth.fullName")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("auth.namePlaceholder")}
              required
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="user-role" className="text-sm font-medium">
              {t("settings.roleLabel")} <span className="text-red-500">*</span>
            </Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger
                id="user-role"
                className="bg-slate-50 dark:bg-slate-800"
              >
                <SelectValue placeholder={t("settings.selectRolePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t("settings.admin")}</SelectItem>
                <SelectItem value="mekanik">{t("settings.mekanik")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t("settings.accountStatus")}</Label>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {t("settings.activeMark")}
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                  !isActive
                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {t("settings.inactiveMark")}
              </button>
            </div>
          </div>

          {/* Password (optional — only shown when editing) */}
          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="user-password" className="text-sm font-medium">
                {t("settings.resetPassword")} <span className="text-xs text-slate-400">{t("settings.optionalLabel")}</span>
              </Label>
              <div className="relative">
                <Input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("settings.leaveBlankPassword")}
                  minLength={6}
                  className="bg-slate-50 dark:bg-slate-800 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? t("common.hide") : t("common.show")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400">{t("settings.passwordHint")}</p>
            </div>
          )}

          {/* Compensation (only for Mekanik) */}
          {showCompensation && (
            <div className="space-y-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("settings.salaryCommissionTitle")}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="user-salary" className="text-sm font-medium">
                  {t("settings.weeklySalaryLabel")}
                </Label>
                <Input
                  id="user-salary"
                  value={formatRupiah(parseNumeric(weeklySalary))}
                  onChange={(e) => {
                    const num = parseNumeric(e.target.value);
                    setWeeklySalary(num.toString());
                  }}
                  placeholder="Rp 0"
                  inputMode="numeric"
                  className="bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-commission" className="text-sm font-medium">
                  {t("settings.commissionServicePct")}
                </Label>
                <div className="relative">
                  <Input
                    id="user-commission"
                    type="number"
                    value={commissionPct}
                    onChange={(e) => setCommissionPct(e.target.value)}
                    placeholder="0"
                    min={0}
                    max={100}
                    step={0.5}
                    className="bg-white dark:bg-slate-900 pr-8 font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                </div>
                <p className="text-xs text-slate-400">{t("settings.commissionHint")}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-hire-date" className="text-sm font-medium">
                  {t("settings.hireDateLabel")}
                </Label>
                <Input
                  id="user-hire-date"
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                  className="bg-white dark:bg-slate-900"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 text-white gap-2"
              disabled={isSaving || !name.trim()}
            >
              {isSaving && <Loader className="h-4 w-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Pengguna"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
