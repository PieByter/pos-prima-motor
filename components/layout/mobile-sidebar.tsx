"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bike,
  LayoutDashboard,
  Database,
  ShoppingCart,
  Truck,
  Package,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 text-white p-1.5 rounded-lg">
              <Bike className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Prima<span className="text-sky-500">Motor</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {sidebarNav.map((item, idx) => {
            if ("href" in item) {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive(item.href)
                      ? "bg-sky-500/10 text-sky-500"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
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
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                        isActive(subItem.href)
                          ? "bg-sky-500/10 text-sky-500"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      )}
                    >
                      <SubIcon className="h-5 w-5" />
                      <span className="font-medium">{subItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User */}
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
            <button className="text-gray-400 hover:text-gray-500 cursor-pointer">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
