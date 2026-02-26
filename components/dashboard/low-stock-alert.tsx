import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const lowStockItems = [
  {
    name: "Yamaha Drive Belt",
    category: "Transmission",
    stock: 2,
    status: "critical" as const,
  },
  {
    name: "Honda Air Filter",
    category: "Filters",
    stock: 5,
    status: "warning" as const,
  },
  {
    name: "Rear Mirror Set",
    category: "Accessories",
    stock: 4,
    status: "warning" as const,
  },
];

export function LowStockAlert() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Low Stock Alert
        </h3>
        <Badge variant="destructive" className="text-xs font-bold">
          Critical
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800/50">
            <TableHead className="text-xs uppercase">Item Name</TableHead>
            <TableHead className="text-xs uppercase">Category</TableHead>
            <TableHead className="text-xs uppercase">Stock</TableHead>
            <TableHead className="text-xs uppercase">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lowStockItems.map((item) => (
            <TableRow key={item.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <TableCell className="font-medium text-gray-900 dark:text-white">
                {item.name}
              </TableCell>
              <TableCell className="text-gray-500 dark:text-gray-400">
                {item.category}
              </TableCell>
              <TableCell className="text-gray-900 dark:text-white">
                {item.stock}
              </TableCell>
              <TableCell>
                {item.status === "critical" ? (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-100">
                    Critical
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 hover:bg-yellow-100">
                    Warning
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
