"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  Loader,
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
import type { Customer, PaginatedResponse } from "@/lib/types/database";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";

const ITEMS_PER_PAGE = 10;

export function CustomersTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const pageInfo = useMemo(
    () => ({
      start: total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1,
      end: Math.min(currentPage * ITEMS_PER_PAGE, total),
    }),
    [currentPage, total]
  );

  const fetchCustomers = useCallback(
    async (page = currentPage) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.append("search", search.trim());
        params.append("page", String(page));
        params.append("limit", String(ITEMS_PER_PAGE));

        const res = await fetch(`/api/customers?${params}`, { cache: "no-store" });
        if (!res.ok) {
          let errorMessage = `Gagal memuat data (${res.status})`;
          try {
            const errorText = await res.text();
            const parsed = errorText ? JSON.parse(errorText) : null;
            if (parsed?.error) errorMessage += `: ${parsed.error}`;
          } catch {
            // Fall back to status-only error message
          }
          if (res.status === 500) {
            setCustomers([]);
            setTotal(0);
            setTotalPages(1);
            return;
          }
          throw new Error(errorMessage);
        }

        const result = (await res.json()) as PaginatedResponse<Customer>;
        setCustomers(result.data ?? []);
        setTotal(result.total ?? 0);
        setTotalPages(result.totalPages ?? 1);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data customer. Coba lagi.");
      } finally {
        setIsLoading(false);
      }
    },
    [search, currentPage]
  );

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function handleAdd() {
    setEditingCustomer(null);
    setDialogOpen(true);
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setDialogOpen(true);
  }

  async function handleDelete(id: number) {
    if (!confirm("Yakin ingin menghapus customer ini?")) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      setCurrentPage(1);
      await fetchCustomers(1);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSave(data: Omit<Customer, "id" | "created_at" | "updated_at">) {
    try {
      if (editingCustomer) {
        const res = await fetch(`/api/customers/${editingCustomer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Gagal update");
      } else {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Gagal tambah");
      }
      setDialogOpen(false);
      setEditingCustomer(null);
      setCurrentPage(1);
      await fetchCustomers(1);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-xl">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Data Customer
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isLoading ? "Memuat..." : `${total} customer terdaftar`}
            </p>
          </div>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 self-start sm:self-auto shadow-sm shadow-emerald-500/30"
        >
          <Plus className="h-4 w-4" />
          Tambah Customer
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama atau nomor HP..."
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
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-5">
                  Nama Customer
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-5">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    No. HP
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    Alamat
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Bergabung
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-5 text-center w-24">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader className="h-7 w-7 animate-spin text-emerald-500" />
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Memuat data customer...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <Users className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {search ? "Tidak ada customer ditemukan" : "Belum ada data customer"}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {search ? "Coba kata kunci lain" : "Klik tombol tambah untuk mulai"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Nama */}
                    <TableCell className="px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {customer.name}
                          </p>
                          <Badge
                            variant="secondary"
                            className="mt-0.5 text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                          >
                            Customer
                          </Badge>
                        </div>
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="px-5">
                      {customer.phone ? (
                        <a
                          href={`tel:${customer.phone}`}
                          className="text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors font-mono"
                        >
                          {customer.phone}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400 dark:text-slate-600 italic">—</span>
                      )}
                    </TableCell>

                    {/* Address */}
                    <TableCell className="px-5">
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-48 truncate">
                        {customer.address ?? <span className="italic text-slate-400">—</span>}
                      </p>
                    </TableCell>

                    {/* Created At */}
                    <TableCell className="px-5">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(customer.created_at).toLocaleDateString("id-ID", {
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
                          className="h-8 w-8 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          onClick={() => handleEdit(customer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(customer.id)}
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
              <span className="font-semibold text-slate-900 dark:text-white">{total}</span> customer
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
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500"
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

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editingCustomer}
        onSave={handleSave}
      />
    </div>
  );
}
