"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast-provider";
import { Plus, Trash2, Tag, Factory, Loader2 } from "lucide-react";

type Category = { id: number; name: string; description: string | null };
type Brand = { id: number; name: string };

export function CategoriesBrandsPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [catName, setCatName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [c, b] = await Promise.all([
        fetch("/api/categories", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
        fetch("/api/brands", { cache: "no-store" }).then((r) => (r.ok ? r.json() : [])),
      ]);
      setCategories(Array.isArray(c) ? c : []);
      setBrands(Array.isArray(b) ? b : []);
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchAll();
    }, 0);
    return () => window.clearTimeout(t);
  }, [fetchAll]);

  const addCategory = async () => {
    if (!catName.trim()) return;
    setSavingCat(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName.trim() }),
      });
      if (!res.ok) throw new Error("Gagal");
      showToast("Kategori ditambahkan", "success");
      setCatName("");
      await fetchAll();
    } catch {
      showToast("Gagal menambah kategori", "error");
    } finally {
      setSavingCat(false);
    }
  };

  const addBrand = async () => {
    if (!brandName.trim()) return;
    setSavingBrand(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: brandName.trim() }),
      });
      if (!res.ok) throw new Error("Gagal");
      showToast("Brand ditambahkan", "success");
      setBrandName("");
      await fetchAll();
    } catch {
      showToast("Gagal menambah brand", "error");
    } finally {
      setSavingBrand(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Hapus kategori ini? Item dengan kategori ini akan kehilangan relasinya.")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal");
      showToast("Kategori dihapus", "success");
      await fetchAll();
    } catch {
      showToast("Gagal menghapus kategori", "error");
    }
  };

  const deleteBrand = async (id: number) => {
    if (!confirm("Hapus brand ini?")) return;
    try {
      const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal");
      showToast("Brand dihapus", "success");
      await fetchAll();
    } catch {
      showToast("Gagal menghapus brand", "error");
    }
  };

  return (
    <>
      <Navbar
        title="Kategori & Brand"
        subtitle="Kelola master kategori dan brand barang."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kategori */}
        <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30">
              <Tag className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Kategori ({categories.length})</h3>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nama kategori baru..."
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void addCategory(); }}
              className="bg-slate-50 dark:bg-slate-900"
            />
            <Button size="sm" className="shrink-0 gap-1 bg-sky-500 hover:bg-sky-600" onClick={addCategory} disabled={savingCat}>
              {savingCat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Tambah
            </Button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Belum ada kategori. Tambahkan di atas.</p>
            ) : (
              categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.description && <p className="text-xs text-slate-400">{c.description}</p>}
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => deleteCategory(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Brand */}
        <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Factory className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Brand / Merek ({brands.length})</h3>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nama brand baru..."
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void addBrand(); }}
              className="bg-slate-50 dark:bg-slate-900"
            />
            <Button size="sm" className="shrink-0 gap-1 bg-violet-500 hover:bg-violet-600" onClick={addBrand} disabled={savingBrand}>
              {savingBrand ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Tambah
            </Button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
            ) : brands.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Belum ada brand. Tambahkan di atas.</p>
            ) : (
              brands.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                  <p className="text-sm font-medium">{b.name}</p>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => deleteBrand(b.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
