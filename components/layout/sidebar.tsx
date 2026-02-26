"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="bg-sky-500 text-white p-1.5 rounded-lg">
            <Bike className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Prima<span className="text-sky-500">Motor</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {sidebarNav.map((item, idx) => {
          if ("href" in item) {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                  isActive(item.href)
                    ? "bg-sky-500/10 text-sky-500"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          }

          return (
            <div key={idx}>
              <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {item.group}
              </div>
              {item.items.map((subItem) => {
                const SubIcon = subItem.icon;
                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                      isActive(subItem.href)
                        ? "bg-sky-500/10 text-sky-500"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                  >
                    <SubIcon className={cn(
                      "h-5 w-5 transition-colors",
                      !isActive(subItem.href) && "group-hover:text-sky-500"
                    )} />
                    <span className="font-medium">{subItem.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-sky-500 text-white text-sm font-medium">
              A
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              Administrator
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              admin@primamotor.com
            </p>
          </div>
          <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 cursor-pointer">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
