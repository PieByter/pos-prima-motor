"use client";

import { useState, useRef } from "react";
import Image from "next/image";
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

  const [name, setName] = useState(item?.name ?? "");
  const [sku, setSku] = useState(item?.sku ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [purchasePrice, setPurchasePrice] = useState(
    item ? String(item.purchasePrice) : ""
  );
  const [sellingPrice, setSellingPrice] = useState(
    item ? String(item.sellingPrice) : ""
  );
  const [serviceFee, setServiceFee] = useState(
    item ? String(item.serviceFee) : ""
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    item?.picture ?? null
  );
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      name,
      description: "",
      sku,
      category,
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      serviceFee: Number(serviceFee) || 0,
      stock: item?.stock ?? 0,
      picture: previewUrl,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-2">
      {/* Row 1: Nama Barang & SKU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-shadow text-sm"
            />
          </div>
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
              onClick={() => setSku(generateSKU())}
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
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-shadow text-sm"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Harga Beli & Harga Jual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-shadow text-sm"
            />
          </div>
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
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-shadow text-sm"
            />
          </div>
        </div>
      </div>

      {/* Row 3: Biaya Jasa Service & Kategori */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              value={serviceFee}
              onChange={(e) => setServiceFee(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-shadow text-sm"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Isi jika barang ini termasuk jasa pasang/service.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-slate-900 dark:text-slate-200 text-sm font-medium">
            Kategori
          </Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger className="py-3 h-auto">
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
        </div>
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
          className="bg-sky-500 hover:bg-sky-600 text-white px-5 gap-2 shadow-md shadow-sky-500/20"
        >
          <Save className="h-4 w-4" />
          {isEdit ? "Simpan Perubahan" : "Simpan Barang"}
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
