"use client";

import { useEffect } from "react";
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
import { Loader, Users } from "lucide-react";
import type { Customer } from "@/lib/types/database";
import { customerSchema, type CustomerFormData } from "@/lib/validations";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSave: (data: Omit<Customer, "id" | "created_at" | "updated_at">) => void;
};

export function CustomerFormDialog({ open, onOpenChange, customer, onSave }: Props) {
  const isEdit = !!customer;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
    },
  });

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      reset({
        name: customer?.name ?? "",
        phone: customer?.phone ?? "",
        address: customer?.address ?? "",
      });
    }
  }, [open, customer, reset]);

  async function onSubmit(data: CustomerFormData) {
    await onSave({
      name: data.name,
      phone: data.phone || null,
      address: data.address || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                {isEdit ? "Edit Customer" : "Tambah Customer Baru"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm">
                {isEdit
                  ? "Perbarui informasi customer."
                  : "Isi data customer baru di bawah ini."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Nama */}
          <div className="space-y-1.5">
            <Label htmlFor="customer-name" className="text-sm font-medium">
              Nama Lengkap <span className="text-red-500">*</span>
            </Label>
            <Input
              id="customer-name"
              {...register("name")}
              placeholder="Contoh: Budi Santoso"
              className={`bg-slate-50 dark:bg-slate-800 ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* No. HP */}
          <div className="space-y-1.5">
            <Label htmlFor="customer-phone" className="text-sm font-medium">
              No. HP
            </Label>
            <Input
              id="customer-phone"
              type="tel"
              {...register("phone")}
              placeholder="Contoh: 0812-3456-7890"
              className={`bg-slate-50 dark:bg-slate-800 ${errors.phone ? "border-red-500" : ""}`}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Alamat */}
          <div className="space-y-1.5">
            <Label htmlFor="customer-address" className="text-sm font-medium">
              Alamat
            </Label>
            <Textarea
              id="customer-address"
              {...register("address")}
              placeholder="Jl. Contoh No. 123, Kota..."
              rows={3}
              className={`bg-slate-50 dark:bg-slate-800 resize-none ${errors.address ? "border-red-500" : ""}`}
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
