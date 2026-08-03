"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  QrCode,
  CloudUpload,
  Save,
  Tag,
} from "lucide-react";
import { type Item, CATEGORIES } from "@/lib/data/items";
import { itemSchema, type ItemFormData } from "@/lib/validations";

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  onSave: (data: Omit<Item, "id" | "createdAt">) => void;
}

function generateSKU() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "SKU-";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function ItemFormContent({
  item,
  onSave,
  onCancel,
}: {
  item: Item | null;
  onSave: (data: Omit<Item, "id" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const isEdit = !!item;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      sku: item?.sku ?? "",
      category: item?.category ?? "",
      purchasePrice: item?.purchasePrice ?? 0,
      sellingPrice: item?.sellingPrice ?? 0,
      serviceFee: item?.serviceFee ?? 0,
      stock: item?.stock ?? 0,
      warrantyMonths: item?.warrantyMonths ?? null,
      picture: item?.picture ?? null,
    },
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    item?.picture ?? null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  /* ── Suppliers (many-to-many + harga per supplier) ── */
  const [supplierOptions, setSupplierOptions] = useState<
    { id: number; name: string; phone: string | null }[]
  >([]);
  const [supplierLinks, setSupplierLinks] = useState<
    { supplier_id: number; purchase_price: string }[]
  >(
    (item?.suppliers ?? []).map((s) => ({
      supplier_id: s.id,
      purchase_price: s.purchase_price != null ? String(s.purchase_price) : "",
    }))
  );

  // Load suppliers once
  useEffect(() => {
    fetch("/api/suppliers?limit=500", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const list = json?.data ?? [];
        if (Array.isArray(list)) {
          setSupplierOptions(list as { id: number; name: string; phone: string | null }[]);
        }
      })
      .catch(() => setSupplierOptions([]));
  }, []);

  const isSupplierChecked = (id: number) => supplierLinks.some((l) => l.supplier_id === id);

  const toggleSupplier = (id: number) => {
    setSupplierLinks((prev) =>
      prev.some((l) => l.supplier_id === id)
        ? prev.filter((l) => l.supplier_id !== id)
        : [...prev, { supplier_id: id, purchase_price: "" }]
    );
  };

  const setSupplierPrice = (id: number, price: string) => {
    setSupplierLinks((prev) =>
      prev.map((l) => (l.supplier_id === id ? { ...l, purchase_price: price } : l))
    );
  };

  const categoryValue = useWatch({ control, name: "category" });

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function onSubmit(data: ItemFormData) {
    setIsUploading(true);

    let pictureUrl: string | null = previewUrl;

    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          pictureUrl = uploadData.url;
        } else {
          console.warn("Upload failed, using local preview");
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    setIsUploading(false);

    onSave({
      name: data.name,
      description: data.description ?? "",
      sku: data.sku,
      category: data.category,
      purchasePrice: Number(data.purchasePrice),
      sellingPrice: Number(data.sellingPrice),
      serviceFee: Number(data.serviceFee || 0),
      stock: Number(data.stock || 0),
      warrantyMonths: data.warrantyMonths ? Number(data.warrantyMonths) : null,
      picture: pictureUrl,
      suppliers: supplierLinks.map((l) => ({
        id: l.supplier_id,
        name: supplierOptions.find((s) => s.id === l.supplier_id)?.name ?? "",
        purchase_price: l.purchase_price ? Number(l.purchase_price) : null,
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 py-2">
      {/* Row 1: Nama Barang & SKU */}
      <div className="grid grid-cols-2 gap-6">
        {/* Nama Barang */}
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="item-name"
            className="text-slate-900 dark:text-slate-200 text-sm font-medium"
          >
            Nama Barang
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Package className="h-5 w-5" />
            </span>
            <input
              id="item-name"
              type="text"
              placeholder="Contoh: Oli Yamalube Sport"
              {...register("name")}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.name ? "border-red-500" : "border-slate-200 dark:border-slate-600"} bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-shadow text-sm`}
            />
          </div>
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* SKU */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Label
              htmlFor="item-sku"
              className="text-slate-900 dark:text-slate-200 text-sm font-medium"
            >
              SKU
            </Label>
            <button
              type="button"
              onClick={() => setValue("sku", generateSKU())}
              className="text-xs text-sky-500 font-semibold hover:underline"
            >
              Auto-Generate
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <QrCode className="h-5 w-5" />
            </span>
            <input
              id="item-sku"
              type="text"
              placeholder="SKU-XXXXX"
              {...register("sku")}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.sku ? "border-red-500" : "border-slate-200 dark:border-slate-600"} bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-shadow text-sm`}
            />
          </div>
          {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
        </div>
      </div>

      {/* Row 2: Harga Beli & Harga Jual */}
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="item-purchase"
            className="text-slate-900 dark:text-slate-200 text-sm font-medium"
          >
            Harga Beli
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
              Rp
            </span>
            <input
              id="item-purchase"
              type="number"
              placeholder="0"
              min="0"
              {...register("purchasePrice")}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.purchasePrice ? "border-red-500" : "border-slate-200 dark:border-slate-600"} bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-shadow text-sm`}
            />
          </div>
          {errors.purchasePrice && <p className="text-xs text-red-500">{errors.purchasePrice.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="item-selling"
            className="text-slate-900 dark:text-slate-200 text-sm font-medium"
          >
            Harga Jual
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
              Rp
            </span>
            <input
              id="item-selling"
              type="number"
              placeholder="0"
              min="0"
              {...register("sellingPrice")}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.sellingPrice ? "border-red-500" : "border-slate-200 dark:border-slate-600"} bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-shadow text-sm`}
            />
          </div>
          {errors.sellingPrice && <p className="text-xs text-red-500">{errors.sellingPrice.message}</p>}
        </div>
      </div>

      {/* Row 2b: Garansi */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="item-warranty"
            className="text-slate-900 dark:text-slate-200 text-sm font-medium"
          >
            Garansi{" "}
            <span className="text-slate-400 font-normal">(bulan, opsional)</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
              🛡️
            </span>
            <input
              id="item-warranty"
              type="number"
              placeholder="0"
              min="0"
              {...register("warrantyMonths")}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.warrantyMonths ? "border-red-500" : "border-slate-200 dark:border-slate-600"} bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-shadow text-sm`}
            />
          </div>
          {errors.warrantyMonths && <p className="text-xs text-red-500">{errors.warrantyMonths.message}</p>}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Garansi default untuk barang ini saat dijual (mis. 3 = 3 bulan).
          </p>
        </div>
      </div>

      {/* Row 3: Biaya Jasa Service & Kategori */}
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="item-service"
            className="text-slate-900 dark:text-slate-200 text-sm font-medium"
          >
            Biaya Jasa Service{" "}
            <span className="text-slate-400 font-normal">(Opsional)</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
              Rp
            </span>
            <input
              id="item-service"
              type="number"
              placeholder="0"
              min="0"
              {...register("serviceFee")}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.serviceFee ? "border-red-500" : "border-slate-200 dark:border-slate-600"} bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-shadow text-sm`}
            />
          </div>
          {errors.serviceFee && <p className="text-xs text-red-500">{errors.serviceFee.message}</p>}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Isi jika barang ini termasuk jasa pasang/service.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-slate-900 dark:text-slate-200 text-sm font-medium">
            Kategori
          </Label>
          <Select value={categoryValue} onValueChange={(val) => setValue("category", val, { shouldValidate: true })}>
            <SelectTrigger className={`py-3 h-auto ${errors.category ? "border-red-500" : ""}`}>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-slate-400" />
                <SelectValue placeholder="Pilih Kategori" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
        </div>
      </div>

      {/* Supplier (many-to-many + harga per supplier) */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-900 dark:text-slate-200 text-sm font-medium">
          Supplier
        </Label>
        {supplierOptions.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Belum ada supplier terdaftar. Tambahkan di menu Suppliers terlebih dahulu.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 p-2">
              {supplierOptions.map((s) => {
                const checked = isSupplierChecked(s.id);
                const price = supplierLinks.find((l) => l.supplier_id === s.id)?.purchase_price ?? "";
                return (
                  <div
                    key={s.id}
                    className={`rounded-lg border px-3 py-2 transition-colors ${
                      checked
                        ? "border-sky-400 bg-sky-50 dark:bg-sky-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSupplier(s.id)}
                        className="h-4 w-4 rounded border-slate-300 accent-sky-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {s.name}
                        </p>
                        {s.phone && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {s.phone}
                          </p>
                        )}
                      </div>
                    </label>
                    {checked && (
                      <div className="mt-2 flex items-center gap-1.5 pl-6">
                        <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                          Harga beli
                        </span>
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={price}
                          onChange={(e) => setSupplierPrice(s.id, e.target.value)}
                          className="w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {supplierLinks.length > 0
                ? `${supplierLinks.length} supplier dipilih — isi harga beli khusus per supplier (opsional, kosongkan untuk pakai harga beli utama).`
                : "Pilih satu atau lebih supplier pemasok barang ini."}
            </p>
          </>
        )}
      </div>

      {/* Foto Produk */}
      <div className="flex flex-col gap-2">
        <Label className="text-slate-900 dark:text-slate-200 text-sm font-medium">
          Foto Produk
        </Label>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer group ${
            isDragging
              ? "border-sky-400 bg-sky-50 dark:bg-sky-900/20"
              : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {previewUrl ? (
            <div className="relative">
              <Image
                src={previewUrl}
                alt="Preview"
                width={200}
                height={128}
                className="max-h-32 rounded-lg object-contain"
                unoptimized
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewUrl(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CloudUpload className="h-6 w-6 text-sky-500" />
              </div>
              <p className="text-slate-900 dark:text-white text-sm font-semibold mb-1">
                Klik untuk upload atau drag and drop
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                SVG, PNG, JPG atau GIF (Maks. 800×400px)
              </p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="px-5"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="bg-sky-500 hover:bg-sky-600 text-white px-5 gap-2 shadow-md shadow-sky-500/20"
        >
          {isUploading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Mengupload...
            </span>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEdit ? "Simpan Perubahan" : "Simpan Barang"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: ItemFormDialogProps) {
  const isEdit = !!item;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle className="text-2xl font-bold">
            {isEdit ? "Edit Barang" : "Tambah Barang Baru"}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
            {isEdit
              ? "Perbarui detail barang di bawah ini."
              : "Masukkan detail suku cadang atau layanan baru ke inventaris."}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <ItemFormContent
            key={item?.id ?? "new"}
            item={item}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
