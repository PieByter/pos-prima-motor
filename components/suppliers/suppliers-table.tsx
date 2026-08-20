"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/lib/toast-provider";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  Loader,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Supplier, SupplierWithContacts, PaginatedResponse } from "@/lib/types/database";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form-dialog";
import { useLocale } from "@/lib/locales";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const ITEMS_PER_PAGE = 10;

export function SuppliersTable() {
  const { showToast } = useToast();
  const { t } = useLocale();
  const [suppliers, setSuppliers] = useState<SupplierWithContacts[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierWithContacts | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<SupplierWithContacts | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const allSelected = suppliers.length > 0 && suppliers.every(s => selectedIds.has(s.id));

  const pageInfo = useMemo(
    () => ({
      start: total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1,
      end: Math.min(currentPage * ITEMS_PER_PAGE, total),
    }),
    [currentPage, total]
  );

  const fetchSuppliers = useCallback(
    async (page = currentPage) => {
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.append("search", search.trim());
        params.append("page", String(page));
        params.append("limit", String(ITEMS_PER_PAGE));

        const res = await fetch(`/api/suppliers?${params}`, { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 500) {
            setSuppliers([]);
            setTotal(0);
            setTotalPages(1);
            return;
          }
          throw new Error(`Gagal memuat data (${res.status})`);
        }

        const result = (await res.json()) as PaginatedResponse<SupplierWithContacts>;
        setError(null);
        setSuppliers(result.data ?? []);
        setTotal(result.total ?? 0);
        setTotalPages(result.totalPages ?? 1);
      } catch (err) {
        console.error(err);
        setError(t("masterData.supplierLoadFailed"));
      } finally {
        setIsLoading(false);
      }
    },
    [search, currentPage, t]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSuppliers();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchSuppliers]);

  function handleAdd() {
    setEditingSupplier(null);
    setDialogOpen(true);
  }

  function handleEdit(supplier: SupplierWithContacts) {
    setEditingSupplier(supplier);
    setDialogOpen(true);
  }

  async function performDelete(id: number) {
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast(t("common.successfullyDeleted"), "success");
      setCurrentPage(1);
      await fetchSuppliers(1);
    } catch (err) {
      console.error(err);
      showToast(t("masterData.supplierDeleteFailed"), "error");
      throw err;
    }
  }

  async function performBulkDelete() {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch("/api/suppliers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds] }),
      });
      if (!res.ok) throw new Error("Failed");
      const { deleted } = await res.json();
      showToast(t("masterData.supplierBulkDeleted", { deleted }), "success");
      setSelectedIds(new Set());
      setCurrentPage(1);
      await fetchSuppliers(1);
    } catch {
      showToast(t("masterData.supplierDeleteFailed"), "error");
      throw new Error("Bulk delete failed");
    }
  }

  async function handleSave(data: Omit<Supplier, "id" | "created_at" | "updated_at"> & { contacts?: { name: string; phone?: string | null; position?: string | null; email?: string | null; is_primary: boolean; notes?: string | null }[] }) {
    try {
      if (editingSupplier) {
        const res = await fetch(`/api/suppliers/${editingSupplier.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed");
        showToast(t("common.successfullyUpdated"), "success");
      } else {
        const res = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed");
        showToast(t("common.successfullySaved"), "success");
      }
      setDialogOpen(false);
      setEditingSupplier(null);
      setCurrentPage(1);
      await fetchSuppliers(1);
    } catch (err) {
      console.error(err);
      showToast(t("masterData.supplierSaveFailed"), "error");
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500 rounded-xl">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("masterData.supplierList")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isLoading ? t("common.loading") : t("masterData.supplierRegistered", { count: total })}
            </p>
          </div>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-violet-500 hover:bg-violet-600 text-white gap-2 self-start sm:self-auto shadow-sm shadow-violet-500/30"
        >
          <Plus className="h-4 w-4" />
          {t("masterData.addSupplier")}
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <span className="text-sm text-red-700 dark:text-red-400">{t("masterData.selectedCount", { count: selectedIds.size })}</span>
          <Button size="sm" variant="destructive" className="h-8 gap-1" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> {t("masterData.deleteSelected")}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setSelectedIds(new Set())}>
            {t("common.cancel")}
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t("masterData.searchSupplier")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
                <TableHead className="w-10 px-3">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 cursor-pointer accent-violet-500" checked={allSelected} onChange={(e) => {
                    if (e.target.checked) setSelectedIds(new Set(suppliers.map(x => x.id)));
                    else setSelectedIds(new Set());
                  }} />
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-5">
                  {t("masterData.supplierNameCol")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-5">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    {t("masterData.supplierPhone")}
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-5">
                  {t("masterData.email")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {t("masterData.address")}
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {t("masterData.registered")}
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-5 text-center w-24">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader className="h-7 w-7 animate-spin text-violet-500" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {t("common.loading")}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <Building2 className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {search ? t("masterData.supplierNotFound") : t("masterData.noSupplierData")}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {search ? t("common.tryDifferentKeyword") : t("masterData.clickAddToStart")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow
                    key={supplier.id}
                    className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <TableCell className="px-3">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 cursor-pointer accent-violet-500" checked={selectedIds.has(supplier.id)} onChange={(e) => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) next.add(supplier.id); else next.delete(supplier.id);
                        setSelectedIds(next);
                      }} />
                    </TableCell>
                    {/* Nama */}
                    <TableCell className="px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-violet-700 dark:text-violet-400">
                            {supplier.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {supplier.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800"
                            >
                              Supplier
                            </Badge>
                            {supplier.is_active === false && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                              >
                                Nonaktif
                              </Badge>
                            )}
                            {supplier.contacts && supplier.contacts.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                              >
                                {supplier.contacts.length} kontak
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="px-5">
                      {supplier.phone ? (
                        <a
                          href={`tel:${supplier.phone}`}
                          className="text-sm text-slate-600 dark:text-slate-300 hover:text-violet-500 dark:hover:text-violet-400 transition-colors font-mono"
                        >
                          {supplier.phone}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400 dark:text-slate-600 italic">—</span>
                      )}
                    </TableCell>

                    {/* Email */}
                    <TableCell className="px-5">
                      {supplier.email ? (
                        <span className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-40 block">
                          {supplier.email}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400 dark:text-slate-600 italic">—</span>
                      )}
                    </TableCell>

                    {/* Address */}
                    <TableCell className="px-5">
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-48 truncate">
                        {supplier.address ?? <span className="italic text-slate-400">—</span>}
                      </p>
                    </TableCell>

                    {/* Created At */}
                    <TableCell className="px-5">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(supplier.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => setDeleteTarget(supplier)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Menampilkan{" "}
              <span className="font-semibold text-slate-900 dark:text-white">{pageInfo.start}</span>
              {" – "}
              <span className="font-semibold text-slate-900 dark:text-white">{pageInfo.end}</span>
              {" dari "}
              <span className="font-semibold text-slate-900 dark:text-white">{total}</span> supplier
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-slate-200 dark:border-slate-700"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className={`h-8 w-8 ${
                    currentPage === page
                      ? "bg-violet-500 hover:bg-violet-600 text-white border-violet-500"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-slate-200 dark:border-slate-700"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <SupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editingSupplier}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("masterData.supplierDeleteConfirm")}
        description={deleteTarget ? deleteTarget.name : undefined}
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          if (deleteTarget) return performDelete(deleteTarget.id);
        }}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t("masterData.supplierBulkDeleteConfirm", { count: selectedIds.size })}
        confirmLabel={t("masterData.deleteSelected")}
        onConfirm={performBulkDelete}
      />
    </div>
  );
}
