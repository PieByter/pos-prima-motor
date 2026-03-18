"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
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
import { formatRupiah, getStockStatus, CATEGORIES, type Item } from "@/lib/data/items";
import { Loader } from "lucide-react";
import { ItemFormDialog } from "./item-form-dialog";

const ITEMS_PER_PAGE = 5;

type ApiItem = {
  id: number;
  name: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  purchase_price: number;
  selling_price: number;
  service_fee?: number | null;
  stock?: number | null;
  current_stock?: number | null;
  picture?: string | null;
  created_at?: string;
};

export function ItemsTable() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (categoryFilter !== "all") params.append("category", categoryFilter);
        params.append("page", currentPage.toString());
        params.append("limit", ITEMS_PER_PAGE.toString());

        const response = await fetch(`/api/items?${params}`);
        if (!response.ok) throw new Error("Failed to fetch items");
        const result = await response.json();
        const rows: ApiItem[] = result.data || result || [];
        const mapped: Item[] = rows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description ?? "",
          sku: row.sku ?? "-",
          category: row.category ?? "Uncategorized",
          purchasePrice: Number(row.purchase_price ?? 0),
          sellingPrice: Number(row.selling_price ?? 0),
          serviceFee: Number(row.service_fee ?? 0),
          stock: Number(row.stock ?? row.current_stock ?? 0),
          picture: row.picture ?? null,
          createdAt: row.created_at ?? new Date().toISOString().slice(0, 10),
        }));
        setItems(mapped);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [search, categoryFilter, currentPage]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Apply stock filter on frontend (API doesn't handle this)
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
    try {
      const response = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete item");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }

  async function handleSaveItem(data: Omit<Item, "id" | "createdAt">) {
    const payload = {
      name: data.name,
      description: data.description,
      sku: data.sku,
      category: data.category,
      purchase_price: data.purchasePrice,
      selling_price: data.sellingPrice,
      service_fee: data.serviceFee,
      picture: data.picture,
    };

    try {
      if (editingItem) {
        const response = await fetch(`/api/items/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to update item");
      } else {
        const response = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to create item");
      }

      setDialogOpen(false);
      setEditingItem(null);
      setCurrentPage(1);

      // Refresh list from API to keep table consistent with DB state.
      const refresh = await fetch(`/api/items?page=1&limit=${ITEMS_PER_PAGE}`, {
        cache: "no-store",
      });
      if (refresh.ok) {
        const result = await refresh.json();
        const rows: ApiItem[] = result.data || result || [];
        const mapped: Item[] = rows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description ?? "",
          sku: row.sku ?? "-",
          category: row.category ?? "Uncategorized",
          purchasePrice: Number(row.purchase_price ?? 0),
          sellingPrice: Number(row.selling_price ?? 0),
          serviceFee: Number(row.service_fee ?? 0),
          stock: Number(row.stock ?? row.current_stock ?? 0),
          picture: row.picture ?? null,
          createdAt: row.created_at ?? new Date().toISOString().slice(0, 10),
        }));
        setItems(mapped);
      }
    } catch (error) {
      console.error("Error saving item:", error);
    }
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Master Data - Items
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your sparepart inventory items
          </p>
        </div>
        <Button
          onClick={handleAddItem}
          className="bg-sky-500 hover:bg-sky-600 text-white gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
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
            <SelectTrigger className="w-full sm:w-45">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
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
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="safe">In Stock</SelectItem>
              <SelectItem value="warning">Low Stock</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-slate-700/50">
                <TableHead className="w-15">Photo</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>
                  SKU / Code
                </TableHead>
                <TableHead>
                  Category
                </TableHead>
                <TableHead className="text-right">
                  Purchase Price
                </TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center w-25">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-gray-500 dark:text-gray-400 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <Loader className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                    ) : (
                      "No items found."
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => {
                  const stockStatus = getStockStatus(item.stock);
                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/30"
                    >
                      {/* Thumbnail */}
                      <TableCell>
                        <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                          {item.picture ? (
                            <Image
                              src={item.picture}
                              alt={item.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </TableCell>

                      {/* Name & Description */}
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {item.description}
                          </p>
                          {/* Mobile: show SKU below name */}
                          <p className="hidden">
                            {item.sku}
                          </p>
                        </div>
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="font-mono text-sm text-gray-600 dark:text-gray-300">
                        {item.sku}
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {item.category}
                        </Badge>
                      </TableCell>

                      {/* Purchase Price */}
                      <TableCell className="text-right text-sm text-gray-600 dark:text-gray-300">
                        {formatRupiah(item.purchasePrice)}
                      </TableCell>

                      {/* Selling Price */}
                      <TableCell className="text-right text-sm font-medium text-gray-900 dark:text-white">
                        {formatRupiah(item.sellingPrice)}
                      </TableCell>

                      {/* Stock */}
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            stockStatus.variant === "critical"
                              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : stockStatus.variant === "warning"
                              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                          }`}
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
                            className="h-8 w-8 text-gray-500 hover:text-sky-500"
                            onClick={() => handleEditItem(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-500"
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {startIndex}
              </span>{" "}
              to{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {endIndex}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {filteredItems.length}
              </span>{" "}
              results
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    className={`h-8 w-8 ${
                      currentPage === page
                        ? "bg-sky-500 hover:bg-sky-600 text-white"
                        : ""
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
                className="h-8 w-8"
                disabled={currentPage === totalPages}
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
    </div>
  );
}
