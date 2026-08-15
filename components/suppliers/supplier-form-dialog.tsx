"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Building2, Loader, Plus, Trash2, Star } from "lucide-react";
import type { Supplier } from "@/lib/types/database";
import { supplierSchema, type SupplierFormData, type SupplierContactFormData } from "@/lib/validations";
import { useLocale } from "@/lib/locales";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSave: (data: Omit<Supplier, "id" | "created_at" | "updated_at"> & { contacts?: SupplierContactFormData[] }) => void;
};

export function SupplierFormDialog({ open, onOpenChange, supplier, onSave }: Props) {
  const { t } = useLocale();
  const isEdit = !!supplier;
  const [contacts, setContacts] = useState<SupplierContactFormData[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      email: "",
      is_active: true,
      bank_name: "",
      bank_account: "",
      bank_account_holder: "",
      npwp: "",
      notes: "",
      contacts: [],
    },
  });

  // Reset kontak saat dialog dibuka — pola "adjust state during render" (resmi React),
  // menghindari setState sinkron di dalam effect
  const [lastSyncKey, setLastSyncKey] = useState("");
  const syncKey = `${open ? "open" : "closed"}-${supplier?.id ?? "new"}`;
  if (open && syncKey !== lastSyncKey) {
    setLastSyncKey(syncKey);
    const supplierContacts = (supplier as Supplier & { contacts?: SupplierContactFormData[] })?.contacts ?? [];
    setContacts(
      supplierContacts.length > 0
        ? supplierContacts
        : [{ name: "", phone: "", position: "", email: "", is_primary: true, notes: "" }],
    );
  }

  // Reset RHF form ketika dialog dibuka dengan data baru
  useEffect(() => {
    if (open) {
      reset({
        name: supplier?.name ?? "",
        phone: supplier?.phone ?? "",
        address: supplier?.address ?? "",
        email: (supplier as Supplier & { email?: string | null })?.email ?? "",
        is_active: (supplier as Supplier & { is_active?: boolean })?.is_active ?? true,
        bank_name: (supplier as Supplier & { bank_name?: string | null })?.bank_name ?? "",
        bank_account: (supplier as Supplier & { bank_account?: string | null })?.bank_account ?? "",
        bank_account_holder: (supplier as Supplier & { bank_account_holder?: string | null })?.bank_account_holder ?? "",
        npwp: (supplier as Supplier & { npwp?: string | null })?.npwp ?? "",
        notes: (supplier as Supplier & { notes?: string | null })?.notes ?? "",
      });
    }
  }, [open, supplier, reset]);

  function handleAddContact() {
    setContacts((prev) => [...prev, { name: "", phone: "", position: "", email: "", is_primary: prev.length === 0, notes: "" }]);
  }

  function handleRemoveContact(index: number) {
    setContacts((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // Pastikan selalu ada minimal 1 kontak, dan tetap ada primary
      if (next.length > 0 && !next.some((c) => c.is_primary)) {
        next[0].is_primary = true;
      }
      return next;
    });
  }

  function handleContactChange(index: number, field: keyof SupplierContactFormData, value: string | boolean) {
    setContacts((prev) => {
      const next = prev.map((c, i) => (i === index ? { ...c, [field]: value } : c));
      // Jika menandai primary, hapus primary dari kontak lain
      if (field === "is_primary" && value === true) {
        return next.map((c, i) => (i === index ? c : { ...c, is_primary: false }));
      }
      return next;
    });
  }

  async function onSubmit(data: SupplierFormData) {
    const cleanedContacts = contacts
      .filter((c) => c.name.trim() !== "")
      .map((c) => ({
        name: c.name.trim(),
        phone: c.phone?.trim() || undefined,
        position: c.position?.trim() || undefined,
        email: c.email?.trim() || undefined,
        is_primary: c.is_primary ?? false,
        notes: c.notes?.trim() || undefined,
      }));

    await onSave({
      name: data.name,
      phone: data.phone || null,
      address: data.address || null,
      email: data.email || null,
      is_active: data.is_active ?? true,
      bank_name: data.bank_name || null,
      bank_account: data.bank_account || null,
      bank_account_holder: data.bank_account_holder || null,
      npwp: data.npwp || null,
      notes: data.notes || null,
      contacts: cleanedContacts,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {isEdit ? t("masterData.editSupplier") : t("masterData.addSupplierNew")}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                {isEdit
                  ? t("masterData.editSupplierDescription")
                  : t("masterData.addSupplierDescription")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Nama */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier-name" className="text-sm font-medium">
              {t("masterData.supplierName")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="supplier-name"
              {...register("name")}
              placeholder={t("masterData.supplierNamePlaceholder")}
              className={`bg-slate-50 dark:bg-slate-800 ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* No. Telepon */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier-phone" className="text-sm font-medium">
              {t("masterData.supplierPhone")}
            </Label>
            <Input
              id="supplier-phone"
              type="tel"
              {...register("phone")}
              placeholder={t("masterData.supplierPhonePlaceholder")}
              className={`bg-slate-50 dark:bg-slate-800 ${errors.phone ? "border-red-500" : ""}`}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Alamat */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier-address" className="text-sm font-medium">
              {t("masterData.address")}
            </Label>
            <Textarea
              id="supplier-address"
              {...register("address")}
              placeholder={t("masterData.supplierAddressPlaceholder")}
              rows={3}
              className={`bg-slate-50 dark:bg-slate-800 resize-none ${errors.address ? "border-red-500" : ""}`}
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier-email" className="text-sm font-medium">
              {t("masterData.email")}
            </Label>
            <Input
              id="supplier-email"
              type="email"
              {...register("email")}
              placeholder={t("masterData.supplierEmailPlaceholder")}
              className={`bg-slate-50 dark:bg-slate-800 ${errors.email ? "border-red-500" : ""}`}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Status aktif */}
          <div className="flex items-center gap-2">
            <input
              id="supplier-active"
              type="checkbox"
              {...register("is_active")}
              className="h-4 w-4 rounded border-slate-300"
            />
            <Label htmlFor="supplier-active" className="text-sm font-medium">
              {t("masterData.supplierActive")}
            </Label>
          </div>

          {/* Informasi Bank */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {t("masterData.bankInfo")}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="supplier-bank-name" className="text-sm font-medium">
                {t("masterData.bankName")}
              </Label>
              <Input
                id="supplier-bank-name"
                {...register("bank_name")}
                placeholder={t("masterData.bankNamePlaceholder")}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier-bank-account" className="text-sm font-medium">
                {t("masterData.bankAccount")}
              </Label>
              <Input
                id="supplier-bank-account"
                {...register("bank_account")}
                placeholder={t("masterData.bankAccountPlaceholder")}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier-bank-holder" className="text-sm font-medium">
                {t("masterData.bankHolder")}
              </Label>
              <Input
                id="supplier-bank-holder"
                {...register("bank_account_holder")}
                placeholder={t("masterData.bankHolderPlaceholder")}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* NPWP + Catatan */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier-npwp" className="text-sm font-medium">
              {t("masterData.npwp")}
            </Label>
            <Input
              id="supplier-npwp"
              {...register("npwp")}
              placeholder={t("masterData.npwpPlaceholder")}
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="supplier-notes" className="text-sm font-medium">
              {t("masterData.notes")}
            </Label>
            <Textarea
              id="supplier-notes"
              {...register("notes")}
              placeholder={t("masterData.notesPlaceholder")}
              rows={2}
              className="bg-slate-50 dark:bg-slate-800 resize-none"
            />
          </div>

          {/* Kontak Person (1 supplier bisa punya banyak kontak) */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {t("masterData.contactPerson")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddContact}
                className="gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> {t("common.add")}
              </Button>
            </div>

            {contacts.map((contact, idx) => (
              <div key={idx} className="space-y-2 rounded-md bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Input
                    value={contact.name}
                    onChange={(e) => handleContactChange(idx, "name", e.target.value)}
                    placeholder={t("masterData.contactNamePlaceholder")}
                    className="h-8 text-sm bg-white dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleContactChange(idx, "is_primary", !contact.is_primary)}
                    className={`shrink-0 p-1.5 rounded-md transition-colors ${contact.is_primary ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" : "text-slate-400 hover:text-amber-500"}`}
                    title={contact.is_primary ? t("masterData.contactPrimary") : t("masterData.makeContactPrimary")}
                  >
                    <Star className={`h-4 w-4 ${contact.is_primary ? "fill-amber-400 text-amber-500" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveContact(idx)}
                    className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title={t("masterData.deleteContact")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={contact.position ?? ""}
                    onChange={(e) => handleContactChange(idx, "position", e.target.value)}
                    placeholder={t("masterData.contactPositionPlaceholder")}
                    className="h-8 text-sm bg-white dark:bg-slate-900"
                  />
                  <Input
                    value={contact.phone ?? ""}
                    onChange={(e) => handleContactChange(idx, "phone", e.target.value)}
                    placeholder={t("masterData.contactPhonePlaceholder")}
                    className="h-8 text-sm bg-white dark:bg-slate-900"
                  />
                </div>
                <Input
                  value={contact.email ?? ""}
                  onChange={(e) => handleContactChange(idx, "email", e.target.value)}
                  placeholder={t("masterData.contactEmailPlaceholder")}
                  className="h-8 text-sm bg-white dark:bg-slate-900"
                />
              </div>
            ))}
            {contacts.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-1">{t("masterData.noContacts")}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-violet-500 hover:bg-violet-600 text-white gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
              {isEdit ? t("common.saveChanges") : t("masterData.addSupplier")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
