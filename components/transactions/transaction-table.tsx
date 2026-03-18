"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  SlidersHorizontal,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type TransactionType,
  STATUSES,
  STATUS_STYLES,
  formatRupiah,
} from "@/lib/data/transactions";

const ITEMS_PER_PAGE = 5;

type UiTransaction = {
  id: number;
  invoiceNumber: string;
  date: string;
  customerOrSupplier: string;
  customerInitials: string;
  avatarColor: string;
  mechanic: string;
  status: keyof typeof STATUS_STYLES;
  totalAmount: number;
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-indigo-100 text-indigo-700",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function normalizeStatus(status: string): keyof typeof STATUS_STYLES {
  if (status === "completed") return "Completed";
  if (status === "pending") return "Pending";
  if (status === "in_progress") return "In Progress";
  if (status === "cancelled") return "Cancelled";
  return "Pending";
}

function avatarColorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface TransactionTableProps {
  type: TransactionType;
  entityLabel: string; // "Customer" or "Supplier"
  showMechanic?: boolean;
}

export function TransactionTable({
  type,
  entityLabel,
  showMechanic = true,
}: TransactionTableProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<UiTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const detailBasePath =
    type === "sale"
      ? "/dashboard/transactions/sales"
      : "/dashboard/transactions/purchases";

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      try {
        const endpoint = type === "sale" ? "/api/sales" : "/api/purchases";
        const response = await fetch(`${endpoint}?page=1&limit=200`, {
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Failed to fetch transactions");

        const json = await response.json();
        const rows = (json?.data ?? []) as Array<Record<string, unknown>>;

        const mapped: UiTransaction[] = rows.map((row) => {
          const name =
            type === "sale"
              ? ((row.customer as { name?: string } | null)?.name ?? "Walk-in Customer")
              : ((row.supplier as { name?: string } | null)?.name ?? "Unknown Supplier");

          const date =
            type === "sale"
              ? String(row.sale_date ?? row.created_at ?? "")
              : String(row.purchase_date ?? row.created_at ?? "");

          const mechanicName =
            type === "sale"
              ? ((row.mechanic as { name?: string } | null)?.name ?? "-")
              : "-";

          return {
            id: Number(row.id),
            invoiceNumber: String(row.invoice_number ?? `TRX-${row.id}`),
            date,
            customerOrSupplier: name,
            customerInitials: getInitials(name),
            avatarColor: avatarColorForName(name),
            mechanic: mechanicName,
            status: normalizeStatus(String(row.status ?? "pending")),
            totalAmount: Number(row.total_amount ?? 0),
          };
        });

        setTransactions(mapped);
      } catch (error) {
        console.error("Failed to load transactions:", error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [type]);

  // Filter
  const filtered = useMemo(() => transactions.filter((t) => {
    const matchSearch =
      t.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.customerOrSupplier.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  }), [transactions, search, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-4">
      {/* Header Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {type === "sale" ? "Riwayat Penjualan" : "Riwayat Pembelian"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {type === "sale"
              ? "Kelola dan lihat semua catatan penjualan."
              : "Kelola dan lihat semua catatan pembelian."}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            className="bg-sky-500 hover:bg-sky-600 text-white gap-2"
            onClick={() =>
              router.push(`${detailBasePath}/create`)
            }
          >
            <Plus className="h-4 w-4" />
            {type === "sale" ? "Buat Penjualan" : "Buat Pembelian"}
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari invoice, customer..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>

          {/* Date Range (placeholder) */}
          <Button variant="outline" className="gap-2 text-gray-600 dark:text-gray-300">
            <Calendar className="h-4 w-4" />
            Rentang Tanggal
          </Button>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                <SelectValue placeholder="Filter" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Invoice #
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell"
                >
                  Tanggal
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  {entityLabel}
                </th>
                {showMechanic && (
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell"
                  >
                    Mekanik
                  </th>
                )}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Total
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={showMechanic ? 7 : 6}
                    className="text-center py-12 text-gray-500 dark:text-gray-400"
                  >
                    <div className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading transactions...
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={showMechanic ? 7 : 6}
                    className="text-center py-12 text-gray-500 dark:text-gray-400"
                  >
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                paginated.map((t) => {
                  const style = STATUS_STYLES[t.status];
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`${detailBasePath}/${t.id}`)
                      }
                    >
                      {/* Invoice */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-sky-600 dark:text-sky-400">
                          {t.invoiceNumber}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        {formatDate(t.date)}
                      </td>

                      {/* Customer / Supplier */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${t.avatarColor}`}
                          >
                            {t.customerInitials}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {t.customerOrSupplier}
                          </span>
                        </div>
                      </td>

                      {/* Mechanic */}
                      {showMechanic && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">
                          {t.mechanic}
                        </td>
                      )}

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                          />
                          {t.status}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900 dark:text-white">
                        {formatRupiah(t.totalAmount)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-sky-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`${detailBasePath}/${t.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-amber-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`${detailBasePath}/${t.id}/edit`);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-medium text-slate-900 dark:text-white">
                {startIdx}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-900 dark:text-white">
                {endIdx}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-900 dark:text-white">
                {filtered.length}
              </span>{" "}
              results
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
