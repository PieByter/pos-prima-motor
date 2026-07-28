"use client";

import { useState, useRef, useEffect, type JSX } from "react";
import { Search, Loader2, Package, Users, ShoppingCart, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { useRouter } from "next/navigation";

interface NavbarProps {
  title: string;
  subtitle?: string;
}

type SearchResult = {
  type: "item" | "customer" | "sale";
  id: number;
  label: string;
  subLabel: string;
  href: string;
};

export function Navbar({ title, subtitle }: NavbarProps): JSX.Element {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // Global keyboard shortcut: Ctrl+K / ⌘K
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
    document.addEventListener("keydown", handleGlobalKey);
    return () => document.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const q = searchQuery.trim();
        const [itemsRes, customersRes, salesRes] = await Promise.all([
          fetch(`/api/items?search=${encodeURIComponent(q)}&limit=5`),
          fetch(`/api/customers?search=${encodeURIComponent(q)}&limit=3`),
          fetch(`/api/sales?search=${encodeURIComponent(q)}&limit=3`),
        ]);

        const itemsData = itemsRes.ok ? await itemsRes.json() : null;
        const customersData = customersRes.ok ? await customersRes.json() : null;
        const salesData = salesRes.ok ? await salesRes.json() : null;
        const items = itemsData?.data ?? [];
        const customers = customersData?.data ?? [];
        const sales = salesData?.data ?? [];

        const allResults: SearchResult[] = [
          ...sales.map((s: any) => ({
            type: "sale" as const,
            id: s.id,
            label: `${s.invoice_number ?? "#" + s.id}`,
            subLabel: `${new Date(s.sale_date).toLocaleDateString("id-ID")} | Rp ${Number(s.total_amount).toLocaleString("id-ID")}`,
            href: `/dashboard/transactions/sales/${s.id}`,
          })),
          ...items.map((i: any) => ({
            type: "item" as const,
            id: i.id,
            label: i.name,
            subLabel: `SKU: ${i.sku ?? "-"} | Rp ${Number(i.selling_price).toLocaleString("id-ID")}`,
            href: `/dashboard/master-data`,
          })),
          ...customers.map((c: any) => ({
            type: "customer" as const,
            id: c.id,
            label: c.name,
            subLabel: c.phone ?? "-",
            href: `/dashboard/customers`,
          })),
        ];

        setResults(allResults);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelect = (result: SearchResult) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(result.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchOpen(false);
    } else if (e.key === "Enter" && results.length > 0) {
      handleSelect(results[0]);
    }
  };

  return (
    <header className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
      {/* Page title */}
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right-side controls (desktop only) */}
      <div className="hidden md:flex items-center gap-3 shrink-0">
        {/* Search */}
        <div ref={searchRef} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-500">
            <span className="text-[9px]">⌘</span>K
          </kbd>
          <Input
            ref={inputRef}
            placeholder="Cari invoice, barang, customer..."
            className="w-56 pl-10 pr-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => searchQuery && setSearchOpen(true)}
            onKeyDown={handleKeyDown}
          />

          {/* Dropdown */}
          {searchOpen && searchQuery && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
              {isSearching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : results.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  Tidak ditemukan untuk &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <div>
                  {results.map((r, i) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => handleSelect(r)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        i < results.length - 1 ? "border-b border-slate-100 dark:border-slate-700/50" : ""
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 shrink-0">
                        {r.type === "item" ? (
                          <Package className="h-4 w-4" />
                        ) : r.type === "customer" ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          <ShoppingCart className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {r.label}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {r.subLabel}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification */}
        <NotificationDropdown />
      </div>
    </header>
  );
}
