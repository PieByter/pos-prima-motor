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
import { Textarea } from "@/components/ui/textarea";
import { Building2, Loader } from "lucide-react";
import type { Supplier } from "@/lib/types/database";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSave: (data: Omit<Supplier, "id" | "created_at" | "updated_at">) => void;
};

export function SupplierFormDialog({ open, onOpenChange, supplier, onSave }: Props) {
  const isEdit = !!supplier;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setName(supplier?.name ?? "");
      setPhone(supplier?.phone ?? "");
      setAddress(supplier?.address ?? "");
    }
  }, [open, supplier]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      });
    } finally {
      setIsSaving(false);
    }
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
                {isEdit ? "Edit Supplier" : "Tambah Supplier Baru"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                {isEdit
                  ? "Perbarui informasi supplier/pemasok."
                  : "Isi data supplier baru di bawah ini."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Nama */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier-name" className="text-sm font-medium">
              Nama Supplier / Perusahaan <span className="text-red-500">*</span>
            </Label>
            <Input
              id="supplier-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: CV Sumber Motor Jaya"
              required
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>

          {/* No. Telepon */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier-phone" className="text-sm font-medium">
              No. Telepon
            </Label>
            <Input
              id="supplier-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 021-1234567"
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>

          {/* Alamat */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier-address" className="text-sm font-medium">
              Alamat
            </Label>
            <Textarea
              id="supplier-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jl. Industri No. 45, Kota..."
              rows={3}
              className="bg-slate-50 dark:bg-slate-800 resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-violet-500 hover:bg-violet-600 text-white gap-2"
              disabled={isSaving || !name.trim()}
            >
              {isSaving && <Loader className="h-4 w-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
