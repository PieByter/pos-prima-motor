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
import { Loader, Users, Bike, Plus, Trash2, History } from "lucide-react";
import type { Customer, Vehicle } from "@/lib/types/database";
import { customerSchema, type CustomerFormData } from "@/lib/validations";
import { VehicleHistoryDialog } from "./vehicle-history-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSave: (data: Omit<Customer, "id" | "created_at" | "updated_at">) => void;
};

const emptyVehicleForm = { plate_number: "", brand: "", model: "", year: "" };

function CustomerFormContent({
  customer,
  onSave,
  onCancel,
  onOpenHistory,
}: {
  customer: Customer | null;
  onSave: Props["onSave"];
  onCancel: () => void;
  onOpenHistory: (v: Vehicle) => void;
}) {
  const isEdit = !!customer;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [savingVehicles, setSavingVehicles] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      address: customer?.address ?? "",
      nik: customer?.nik ?? "",
      email: customer?.email ?? "",
      birth_date: customer?.birth_date ?? "",
      customer_type: customer?.customer_type ?? "retail",
      notes: customer?.notes ?? "",
    },
  });

  // Muat motor saat komponen mount (edit mode) — setState dipanggil di callback async
  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    fetch(`/api/vehicles?customer_id=${customer.id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (!cancelled) setVehicles(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setVehicles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [customer]);

  function updateVehicleForm(patch: Partial<typeof emptyVehicleForm>) {
    setVehicleForm((prev) => ({ ...prev, ...patch }));
  }

  async function addVehicle() {
    if (!customer) return;
    setVehicleError(null);

    const plate = vehicleForm.plate_number.trim();
    if (!plate) {
      setVehicleError("Nomor plat wajib diisi.");
      return;
    }

    setSavingVehicles(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          plate_number: plate,
          brand: vehicleForm.brand.trim() || null,
          model: vehicleForm.model.trim() || null,
          year: vehicleForm.year ? Number(vehicleForm.year) : null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "Gagal menambah motor");
      }

      const created = (await res.json()) as Vehicle;
      setVehicles((prev) => [created, ...prev]);
      setVehicleForm(emptyVehicleForm);
    } catch (err) {
      setVehicleError(err instanceof Error ? err.message : "Gagal menambah motor");
    } finally {
      setSavingVehicles(false);
    }
  }

  async function removeVehicle(id: number) {
    setVehicleError(null);
    try {
      const res = await fetch(`/api/vehicles?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus motor");
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      setVehicleError(err instanceof Error ? err.message : "Gagal menghapus motor");
    }
  }

  async function onSubmit(data: CustomerFormData) {
    await onSave({
      name: data.name,
      phone: data.phone || null,
      address: data.address || null,
      nik: data.nik || null,
      email: data.email || null,
      birth_date: data.birth_date || null,
      customer_type: data.customer_type ?? "retail",
      notes: data.notes || null,
    });
  }

  return (
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

          {/* Tipe Customer */}
          <div className="space-y-1.5">
            <Label htmlFor="customer-type" className="text-sm font-medium">
              Tipe Customer
            </Label>
            <select
              id="customer-type"
              {...register("customer_type")}
              className="w-full h-10 rounded-md border border-input bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm"
            >
              <option value="retail">Retail (perorangan)</option>
              <option value="garage">Garage / Bengkel rekanan</option>
            </select>
          </div>

          {/* NIK */}
          <div className="space-y-1.5">
            <Label htmlFor="customer-nik" className="text-sm font-medium">
              NIK
            </Label>
            <Input
              id="customer-nik"
              {...register("nik")}
              placeholder="Nomor Induk Kependudukan"
              className={`bg-slate-50 dark:bg-slate-800 ${errors.nik ? "border-red-500" : ""}`}
            />
            {errors.nik && (
              <p className="text-xs text-red-500 mt-1">{errors.nik.message}</p>
            )}
          </div>

          {/* Email + Tanggal Lahir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="customer-email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="customer-email"
                type="email"
                {...register("email")}
                placeholder="email@contoh.com"
                className={`bg-slate-50 dark:bg-slate-800 ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-birth" className="text-sm font-medium">
                Tanggal Lahir
              </Label>
              <Input
                id="customer-birth"
                type="date"
                {...register("birth_date")}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <Label htmlFor="customer-notes" className="text-sm font-medium">
              Catatan
            </Label>
            <Textarea
              id="customer-notes"
              {...register("notes")}
              placeholder="Catatan tambahan (preferensi, riwayat khusus, dll.)"
              rows={2}
              className="bg-slate-50 dark:bg-slate-800 resize-none"
            />
          </div>

          {/* Kendaraan / Motor (edit mode) */}
          {isEdit && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bike className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Kendaraan / Motor ({vehicles.length})
                </h4>
              </div>

              {/* List motor */}
              {vehicles.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {v.plate_number}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {[v.brand, v.model, v.year ? `(${v.year})` : null]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenHistory(v)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-600 transition-colors"
                          aria-label={`Riwayat ${v.plate_number}`}
                          title="Riwayat service"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeVehicle(v.id)}
                          className="rounded-md p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                          aria-label={`Hapus ${v.plate_number}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form tambah motor */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="vehicle-plate" className="text-xs font-medium">
                    Plat Nomor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vehicle-plate"
                    placeholder="B 1234 ABC"
                    value={vehicleForm.plate_number}
                    onChange={(e) => updateVehicleForm({ plate_number: e.target.value.toUpperCase() })}
                    className="bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vehicle-brand" className="text-xs font-medium">
                    Merk
                  </Label>
                  <Input
                    id="vehicle-brand"
                    placeholder="Honda / Yamaha..."
                    value={vehicleForm.brand}
                    onChange={(e) => updateVehicleForm({ brand: e.target.value })}
                    className="bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vehicle-model" className="text-xs font-medium">
                    Tipe
                  </Label>
                  <Input
                    id="vehicle-model"
                    placeholder="Vario 125, NMAX..."
                    value={vehicleForm.model}
                    onChange={(e) => updateVehicleForm({ model: e.target.value })}
                    className="bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vehicle-year" className="text-xs font-medium">
                    Tahun
                  </Label>
                  <Input
                    id="vehicle-year"
                    type="number"
                    min={1980}
                    max={2100}
                    placeholder="2023"
                    value={vehicleForm.year}
                    onChange={(e) => updateVehicleForm({ year: e.target.value })}
                    className="bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {vehicleError && (
                <p className="text-xs text-red-500">{vehicleError}</p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVehicle}
                disabled={savingVehicles}
                className="gap-1.5 border-dashed text-emerald-600 dark:text-emerald-400"
              >
                {savingVehicles ? (
                  <Loader className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Tambah Motor
              </Button>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
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
  );
}

export function CustomerFormDialog({ open, onOpenChange, customer, onSave }: Props) {
  const isEdit = !!customer;
  const [historyVehicle, setHistoryVehicle] = useState<Vehicle | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
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

          {/* key memaksa remount setiap dialog dibuka → state reset otomatis (React Compiler friendly) */}
          <CustomerFormContent
            key={open ? (customer?.id ?? "new") : "closed"}
            customer={customer}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
            onOpenHistory={setHistoryVehicle}
          />
        </DialogContent>
      </Dialog>

      {/* Riwayat service motor — dialog terpisah (tidak nested di atas) */}
      <VehicleHistoryDialog
        open={!!historyVehicle}
        onOpenChange={(open) => {
          if (!open) setHistoryVehicle(null);
        }}
        vehicle={historyVehicle}
      />
    </>
  );
}
