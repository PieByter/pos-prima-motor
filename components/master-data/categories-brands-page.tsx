"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/toast-provider";
import { Plus, Trash2, Tag, Factory, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/locales";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Category = { id: number; name: string; description: string | null };
type Brand = { id: number; name: string };

export function CategoriesBrandsPage() {
  const { showToast } = useToast();
  const { t } = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [catName, setCatName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);
  const [deleteBrandTarget, setDeleteBrandTarget] = useState<Brand | null>(null);

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
    const timer = window.setTimeout(() => {
      void fetchAll();
    }, 0);
    return () => window.clearTimeout(timer);
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
      if (!res.ok) throw new Error("Failed");
      showToast(t("masterData.categoryAdded"), "success");
      setCatName("");
      await fetchAll();
    } catch {
      showToast(t("masterData.categoryAddFailed"), "error");
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
      if (!res.ok) throw new Error("Failed");
      showToast(t("masterData.brandAdded"), "success");
      setBrandName("");
      await fetchAll();
    } catch {
      showToast(t("masterData.brandAddFailed"), "error");
    } finally {
      setSavingBrand(false);
    }
  };

  const performDeleteCategory = async (id: number) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast(t("masterData.categoryDeleted"), "success");
      await fetchAll();
    } catch {
      showToast(t("masterData.categoryDeleteFailed"), "error");
      throw new Error("Delete category failed");
    }
  };

  const performDeleteBrand = async (id: number) => {
    try {
      const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast(t("masterData.brandDeleted"), "success");
      await fetchAll();
    } catch {
      showToast(t("masterData.brandDeleteFailed"), "error");
      throw new Error("Delete brand failed");
    }
  };

  return (
    <>
      <Navbar
        title={t("nav.categoriesBrands")}
        subtitle={t("masterData.categoriesBrandsSubtitle")}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kategori */}
        <div className="rounded-xl border bg-white dark:bg-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30">
              <Tag className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{t("masterData.categoriesCount", { n: categories.length })}</h3>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={t("masterData.newCategoryPlaceholder")}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void addCategory(); }}
              className="bg-slate-50 dark:bg-slate-900"
            />
            <Button size="sm" className="shrink-0 gap-1 bg-sky-500 hover:bg-sky-600" onClick={addCategory} disabled={savingCat}>
              {savingCat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} {t("common.add")}
            </Button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">{t("masterData.noCategories")}</p>
            ) : (
              categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.description && <p className="text-xs text-slate-400">{c.description}</p>}
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => setDeleteCategoryTarget(c)}>
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
            <h3 className="font-semibold text-slate-900 dark:text-white">{t("masterData.brandsCount", { n: brands.length })}</h3>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={t("masterData.newBrandPlaceholder")}
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void addBrand(); }}
              className="bg-slate-50 dark:bg-slate-900"
            />
            <Button size="sm" className="shrink-0 gap-1 bg-violet-500 hover:bg-violet-600" onClick={addBrand} disabled={savingBrand}>
              {savingBrand ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} {t("common.add")}
            </Button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
            ) : brands.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">{t("masterData.noBrands")}</p>
            ) : (
              brands.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                  <p className="text-sm font-medium">{b.name}</p>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => setDeleteBrandTarget(b)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={deleteCategoryTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteCategoryTarget(null);
        }}
        title={t("masterData.categoryDeleteConfirm")}
        description={deleteCategoryTarget ? deleteCategoryTarget.name : undefined}
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          if (deleteCategoryTarget) return performDeleteCategory(deleteCategoryTarget.id);
        }}
      />
      <ConfirmDialog
        open={deleteBrandTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteBrandTarget(null);
        }}
        title={t("masterData.brandDeleteConfirm")}
        description={deleteBrandTarget ? deleteBrandTarget.name : undefined}
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          if (deleteBrandTarget) return performDeleteBrand(deleteBrandTarget.id);
        }}
      />
    </>
  );
}
