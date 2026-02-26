import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const transactions = [
  {
    id: "#ORD-7829",
    customer: "John Doe",
    amount: "Rp 120.500",
    status: "completed" as const,
  },
  {
    id: "#ORD-7830",
    customer: "Sarah Smith",
    amount: "Rp 45.000",
    status: "completed" as const,
  },
  {
    id: "#ORD-7831",
    customer: "Mike Ross",
    amount: "Rp 210.000",
    status: "processing" as const,
  },
];

export function RecentTransactions() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
        <a
          href="#"
          className="text-sm text-sky-500 hover:underline font-medium"
        >
          View All
        </a>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800/50">
            <TableHead className="text-xs uppercase">Order ID</TableHead>
            <TableHead className="text-xs uppercase">Customer</TableHead>
            <TableHead className="text-xs uppercase">Amount</TableHead>
            <TableHead className="text-xs uppercase">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <TableCell className="font-medium text-sky-500">
                {tx.id}
              </TableCell>
              <TableCell className="text-gray-900 dark:text-white">
                {tx.customer}
              </TableCell>
              <TableCell className="text-gray-900 dark:text-white">
                {tx.amount}
              </TableCell>
              <TableCell>
                {tx.status === "completed" ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100">
                    Completed
                  </Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100">
                    Processing
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
