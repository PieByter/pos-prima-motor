"use client";

import { cn } from "@/lib/utils";

/**
 * Skeleton loading component for consistent loading states.
 * Usage: <Skeleton className="h-4 w-24" />
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200 dark:bg-slate-700",
        className,
      )}
    />
  );
}

/** Full-page content skeleton with header, cards, and table */
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-5">
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="h-7 w-32" />
          </div>
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}

/** Table row skeleton */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Data page skeleton: header + search bar + table */
export function DataPageSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Search bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <Skeleton className="h-9 w-64" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-5 space-y-3">
          {/* Table header */}
          <div className="flex gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 flex-1" />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-5 flex-1" />
              ))}
            </div>
          ))}
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800">
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Card grid skeleton for dashboards */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Form skeleton for create/edit pages */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-6 w-40" />
      </div>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}
