"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  ShoppingCart,
  Truck,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Bike,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { LucideIcon } from "lucide-react";

type NavLink = { label: string; href: string; icon: LucideIcon };
type NavGroup = { group: string; items: NavLink[] };
type NavItem = NavLink | NavGroup;

const sidebarNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    group: "Management",
    items: [
      { label: "Master Data", href: "/dashboard/master-data", icon: Database },
      { label: "Penjualan", href: "/dashboard/transactions/sales", icon: ShoppingCart },
      { label: "Pembelian", href: "/dashboard/transactions/purchases", icon: Truck },
      { label: "Inventory", href: "/dashboard/inventory", icon: Package },
    ],
  },
  {
    group: "Analytics & Tools",
    items: [
      { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // Always redirect to login even if network request fails.
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200/80 bg-white/85 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 lg:flex">
      <div className="border-b border-slate-200/80 px-5 py-5 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/25">
            <Bike className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Prima<span className="text-sky-500">Motor</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              POS dashboard
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {sidebarNav.map((item, idx) => {
          if ("href" in item) {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all",
                  isActive(item.href)
                    ? "bg-sky-500/10 text-sky-700 ring-1 ring-inset ring-sky-500/10 dark:text-sky-300"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive(item.href)
                      ? "text-sky-600 dark:text-sky-300"
                      : "text-slate-400 group-hover:text-sky-500"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <div key={idx}>
              <div className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                {item.group}
              </div>
              {item.items.map((subItem) => {
                const SubIcon = subItem.icon;
                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all",
                      isActive(subItem.href)
                        ? "bg-sky-500/10 text-sky-700 ring-1 ring-inset ring-sky-500/10 dark:text-sky-300"
                        : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
                    )}
                  >
                    <SubIcon className={cn(
                      "h-5 w-5 transition-colors",
                      !isActive(subItem.href) && "group-hover:text-sky-500"
                    )} />
                    <span>{subItem.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/80 p-4 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/60">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-linear-to-br from-sky-500 to-cyan-400 text-sm font-semibold text-white">
              A
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              Administrator
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              admin@primamotor.com
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
