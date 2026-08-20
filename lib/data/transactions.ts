import { formatRupiah } from "@/lib/data/items";

export type TransactionStatus =
  | "Completed"
  | "Pending"
  | "In Progress"
  | "Cancelled";

export type TransactionType = "sale" | "purchase";

export const STATUS_STYLES: Record<TransactionStatus, { dot: string; bg: string }> = {
  Completed: {
    dot: "bg-green-500",
    bg: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  Pending: {
    dot: "bg-yellow-500",
    bg: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  "In Progress": {
    dot: "bg-blue-500",
    bg: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  Cancelled: {
    dot: "bg-red-500",
    bg: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export const STATUSES: TransactionStatus[] = [
  "Completed",
  "Pending",
  "In Progress",
  "Cancelled",
];

export { formatRupiah };
