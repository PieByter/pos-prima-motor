"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Package2,
  Download,
  Trash,
  Barcode,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRupiah, getStockStatus, type Item } from "@/lib/data/items";
import { Loader } from "lucide-react";
import { useToast } from "@/lib/toast-provider";
import { useLocale } from "@/lib/locales";
import { ItemFormDialog } from "./item-form-dialog";
import { BarcodeLabelPrint, type BarcodeLabelItem } from "@/components/inventory/barcode-label-print";

const ITEMS_PER_PAGE = 10;

type ApiItem = {
  id: number;
  name: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  category_id?: number | null;
  brand_id?: number | null;
  purchase_price: number;
  selling_price: number;
  service_fee?: number | null;
  stock?: number | null;
  current_stock?: number | null;
  warranty_months?: number | null;
  picture?: string | null;
  created_at?: string;
  supplier_ids?: number[];
  suppliers?: { id: number; name: string; purchase_price: number | null }[];
};

function mapApiItem(row: ApiItem): Item {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    sku: row.sku ?? "-",
    category: row.category ?? "Uncategorized",
    categoryId: row.category_id ?? null,
    brandId: row.brand_id ?? null,
    purchasePrice: Number(row.purchase_price ?? 0),
    sellingPrice: Number(row.selling_price ?? 0),
    serviceFee: Number(row.service_fee ?? 0),
    stock: Number(row.stock ?? row.current_stock ?? 0),
    warrantyMonths: row.warranty_months != null ? Number(row.warranty_months) : null,
    picture: row.picture ?? null,
    createdAt: row.created_at ?? new Date().toISOString().slice(0, 10),
    supplierIds: row.supplier_ids ?? [],
    supplierNames: (row.suppliers ?? []).map((s) => s.name),
    suppliers: row.suppliers ?? [],
  };
}

export function ItemsTable() {
  const { showToast } = useToast();
  const { t } = useLocale();
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categoryOptions, setCategoryOptions] = useState<{ id: number; name: string }[]>([]);
  const [stockFilter, setStockFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch("/api/categories", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .then((list) => setCategoryOptions(Array.isArray(list) ? list : []))
        .catch(() => {});
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (categoryFilter !== "all") params.append("category_id", categoryFilter);
        params.append("page", currentPage.toString());
        params.append("limit", ITEMS_PER_PAGE.toString());

        const response = await fetch(`/api/items?${params}`);
        if (!response.ok) {
          let errorMessage = `Failed to fetch items (${response.status})`;
          try {
            const errorText = await response.text();
            const parsed = errorText ? JSON.parse(errorText) : null;
            if (parsed?.error) errorMessage += `: ${parsed.error}`;
          } catch {
            // Fall back to status-only error message
          }
          if (response.status === 500) {
            setItems([]);
            return;
          }
          throw new Error(errorMessage);
        }
        const result = await response.json();
        const rows: ApiItem[] = result.data || result || [];
        const mapped: Item[] = rows.map(mapApiItem);
        setItems(mapped);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [search, categoryFilter, currentPage]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [labelPrintOpen, setLabelPrintOpen] = useState(false);
  const [labelItems, setLabelItems] = useState<BarcodeLabelItem[]>([]);

  const filteredItems = items.filter((item) => {
    if (stockFilter === "all") return true;
    if (stockFilter === "critical") return item.stock <= 5;
    if (stockFilter === "warning") return item.stock > 5 && item.stock <= 20;
    if (stockFilter === "safe") return item.stock > 20;
    return true;
  });

  const paginatedItems = filteredItems;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length);
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  function handleAddItem() {
    setEditingItem(null);
    setDialogOpen(true);
  }

  function handleEditItem(item: Item) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  async function handleDeleteItem(id: number) {
    if (!confirm(t("common.confirmDelete"))) return;
    try {
      const response = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete item");
      showToast(t("common.successfullyDeleted"), "success");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
      showToast(t("common.failedToDelete"), "error");
    }
  }

  /* ── Bulk Actions ─────────────────────────────────────────────── */
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedItems.map((i) => i.id)));
    }
  }, [paginatedItems, selectedIds.size]);

  const handleSelectOne = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(t("common.confirmBulkDelete", { count: selectedIds.size }))) return;
    try {
      const results = await Promise.allSettled(
        [...selectedIds].map((id) =>
          fetch(`/api/items/${id}`, { method: "DELETE" }),
        ),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed === 0) {
        showToast(t("common.bulkDeleted", { count: selectedIds.size }), "success");
      } else {
        showToast(t("common.bulkDeletedPartial", { ok: selectedIds.size - failed, failed }), "error");
      }
      setSelectedIds(new Set());
      setCurrentPage(1);
      const refresh = await fetch(`/api/items?page=1&limit=${ITEMS_PER_PAGE}`, { cache: "no-store" });
      if (refresh.ok) {
        const result = await refresh.json();
        const rows: ApiItem[] = result.data || [];
        setItems(rows.map(mapApiItem));
      }
    } catch {
      showToast(t("common.failedToDelete"), "error");
    }
  }, [selectedIds, showToast, t]);

  const handleBulkExport = useCallback(() => {
    if (selectedIds.size === 0) {
      // Export all items
      window.open("/api/export?type=items", "_blank");
      return;
    }
    // Export selected via API with IDs
    const ids = [...selectedIds].join(",");
    window.open(`/api/export?type=items&ids=${ids}`, "_blank");
  }, [selectedIds]);

  const openLabelPrint = useCallback(() => {
    const targets = selectedIds.size > 0 ? items.filter((i) => selectedIds.has(i.id)) : items;
    setLabelItems(
      targets.map((i) => ({
        id: i.id,
        name: i.name,
        sku: i.sku,
        selling_price: i.sellingPrice,
      })),
    );
    setLabelPrintOpen(true);
  }, [items, selectedIds]);

  async function handleSaveItem(data: Omit<Item, "id" | "createdAt">) {
    const payload = {
      name: data.name,
      description: data.description,
      sku: data.sku,
      category: data.category,
      category_id: data.categoryId ?? null,
      brand_id: data.brandId ?? null,
      purchase_price: data.purchasePrice,
      selling_price: data.sellingPrice,
      service_fee: data.serviceFee,
      warranty_months: data.warrantyMonths ?? null,
      picture: data.picture,
      supplier_links: (data.suppliers ?? []).map((s) => ({
        supplier_id: s.id,
        purchase_price: s.purchase_price,
      })),
    };

    try {
      if (editingItem) {
        const response = await fetch(`/api/items/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to update item");
        showToast(t("common.successfullyUpdated"), "success");
      } else {
        const response = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to create item");
        showToast(t("common.successfullySaved"), "success");
      }

      setDialogOpen(false);
      setEditingItem(null);
      setCurrentPage(1);

      const refresh = await fetch(`/api/items?page=1&limit=${ITEMS_PER_PAGE}`, {
        cache: "no-store",
      });
      if (refresh.ok) {
        const result = await refresh.json();
        const rows: ApiItem[] = result.data || result || [];
        const mapped: Item[] = rows.map(mapApiItem);
        setItems(mapped);
      }
    } catch (error) {
      console.error("Error saving item:", error);
    }
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500 rounded-xl">
            <Package2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("masterData.itemList")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isLoading ? t("common.loading") : `${filteredItems.length} ${t("masterData.itemFound")}`}
            </p>
          </div>
        </div>
        <Button
          onClick={handleAddItem}
          className="bg-sky-500 hover:bg-sky-600 text-white gap-2 self-start sm:self-auto shadow-sm shadow-sky-500/30"
        >
          <Plus className="h-4 w-4" />
          {t("masterData.addItem")}
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t("masterData.searchItem")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>

          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onValueChange={(val) => {
              setCategoryFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder={t("masterData.allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("masterData.allCategories")}</SelectItem>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Stock Filter */}
          <Select
            value={stockFilter}
            onValueChange={(val) => {
              setStockFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder={t("masterData.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("masterData.allStatuses")}</SelectItem>
              <SelectItem value="safe">{t("dashboard.stockAmple")}</SelectItem>
              <SelectItem value="warning">{t("dashboard.stockLow")}</SelectItem>
              <SelectItem value="critical">{t("dashboard.stockCritical")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/20 px-4 py-2.5">
          <span className="text-sm font-medium text-sky-700 dark:text-sky-300">
            {t("masterData.itemsSelected", { count: selectedIds.size })}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs h-8"
              onClick={handleBulkExport}
            >
              <Download className="h-3.5 w-3.5" />
              {t("common.export")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs h-8"
              onClick={openLabelPrint}
            >
              <Barcode className="h-3.5 w-3.5" />
              {t("inventory.printBarcode")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2 text-xs h-8"
              onClick={handleBulkDelete}
            >
              <Trash className="h-3.5 w-3.5" />
              {t("masterData.deleteAll")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={() => setSelectedIds(new Set())}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
                <TableHead className="w-10 px-2">
                  <input
                    type="checkbox"
                    checked={paginatedItems.length > 0 && selectedIds.size === paginatedItems.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-14">
                  {t("masterData.photo")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("masterData.itemName")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("masterData.sku")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("masterData.category")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("masterData.supplier")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                  {t("masterData.purchasePrice")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                  {t("masterData.sellingPrice")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                  {t("masterData.serviceFee")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                  {t("masterData.warranty")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
                  {t("masterData.stock")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center w-24">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Loader className="h-7 w-7 animate-spin text-sky-500" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {t("common.loading")}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <Package2 className="h-6 w-6 text-slate-400" />
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {t("masterData.noItems")}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => {
                  const stockStatus = getStockStatus(item.stock);
                  const stockBadgeClass =
                    stockStatus.variant === "critical"
                      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : stockStatus.variant === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";

                  return (
                    <TableRow
                      key={item.id}
                      className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Checkbox */}
                      <TableCell className="w-10 px-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => handleSelectOne(item.id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </TableCell>
                      {/* Thumbnail */}
                      <TableCell>
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                          {item.picture ? (
                            <Image
                              src={item.picture}
                              alt={item.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </TableCell>

                      {/* Name & Description */}
                      <TableCell>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-48 truncate">
                            {item.description}
                          </p>
                        )}
                      </TableCell>

                      {/* SKU */}
                      <TableCell>
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {item.sku}
                        </span>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800"
                        >
                          {item.category}
                        </Badge>
                      </TableCell>

                      {/* Suppliers */}
                      <TableCell>
                        {item.suppliers && item.suppliers.length > 0 ? (
                          <div className="flex flex-col gap-1 max-w-52">
                            {item.suppliers.slice(0, 2).map((s) => (
                              <span
                                key={s.id}
                                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 px-2 py-0.5 text-[11px] font-medium truncate"
                              >
                                <span className="truncate">{s.name}</span>
                                {s.purchase_price != null && (
                                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-300 shrink-0">
                                    {formatRupiah(s.purchase_price)}
                                  </span>
                                )}
                              </span>
                            ))}
                            {item.suppliers.length > 2 && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 text-[11px] font-medium">
                                {t("masterData.extraSuppliers", { n: item.suppliers.length - 2 })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </TableCell>

                      {/* Purchase Price */}
                      <TableCell className="text-right text-sm text-slate-600 dark:text-slate-400 font-mono">
                        {formatRupiah(item.purchasePrice)}
                      </TableCell>

                      {/* Selling Price */}
                      <TableCell className="text-right text-sm font-semibold text-slate-900 dark:text-white font-mono">
                        {formatRupiah(item.sellingPrice)}
                      </TableCell>

                      {/* Service Fee */}
                      <TableCell className="text-right text-sm text-slate-600 dark:text-slate-400 font-mono">
                        {item.serviceFee > 0 ? formatRupiah(item.serviceFee) : "—"}
                      </TableCell>

                      {/* Warranty */}
                      <TableCell className="text-center">
                        {item.warrantyMonths != null && item.warrantyMonths > 0 ? (
                          <Badge
                            variant="secondary"
                            className="text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800"
                          >
                            {t("masterData.monthsShort", { n: item.warrantyMonths })}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </TableCell>

                      {/* Stock */}
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${stockBadgeClass}`}
                        >
                          {stockStatus.label}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                            onClick={() => handleEditItem(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("common.showing")}{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {startIndex}
              </span>{" "}
              –{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {endIndex}
              </span>{" "}
              {t("common.from")}{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {filteredItems.length}
              </span>{" "}
              {t("masterData.itemsWord")}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-slate-200 dark:border-slate-700"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    className={`h-8 w-8 ${
                      currentPage === page
                        ? "bg-sky-500 hover:bg-sky-600 text-white border-sky-500"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-slate-200 dark:border-slate-700"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <ItemFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        onSave={handleSaveItem}
      />
      <BarcodeLabelPrint
        open={labelPrintOpen}
        onOpenChange={setLabelPrintOpen}
        items={labelItems}
      />
    </div>
  );
}
