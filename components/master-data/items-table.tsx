"use client";

import { useState } from "react";
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
import {
  type Item,
  dummyItems,
  CATEGORIES,
  formatRupiah,
  getStockStatus,
} from "@/lib/data/items";
import { ItemFormDialog } from "./item-form-dialog";

const ITEMS_PER_PAGE = 5;

export function ItemsTable() {
  const [items, setItems] = useState<Item[]>(dummyItems);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    const matchStock =
      stockFilter === "all" ||
      (stockFilter === "critical" && item.stock <= 5) ||
      (stockFilter === "warning" && item.stock > 5 && item.stock <= 20) ||
      (stockFilter === "safe" && item.stock > 20);
    return matchSearch && matchCategory && matchStock;
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length);

  function handleAddItem() {
    setEditingItem(null);
    setDialogOpen(true);
  }

  function handleEditItem(item: Item) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  function handleDeleteItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function handleSaveItem(data: Omit<Item, "id" | "createdAt">) {
    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id ? { ...i, ...data } : i
        )
      );
    } else {
      const newItem: Item = {
        ...data,
        id: Math.max(0, ...items.map((i) => i.id)) + 1,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setItems((prev) => [...prev, newItem]);
    }
    setDialogOpen(false);
    setEditingItem(null);
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
                <TableHead className="hidden md:table-cell">
                  SKU / Code
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Category
                </TableHead>
                <TableHead className="hidden md:table-cell text-right">
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
                    className="text-center py-12 text-gray-500 dark:text-gray-400"
                  >
                    No items found.
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
                          <p className="text-xs text-gray-400 mt-0.5 md:hidden">
                            {item.sku}
                          </p>
                        </div>
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="hidden md:table-cell font-mono text-sm text-gray-600 dark:text-gray-300">
                        {item.sku}
                      </TableCell>

                      {/* Category */}
                      <TableCell className="hidden lg:table-cell">
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {item.category}
                        </Badge>
                      </TableCell>

                      {/* Purchase Price */}
                      <TableCell className="hidden md:table-cell text-right text-sm text-gray-600 dark:text-gray-300">
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
