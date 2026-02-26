import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
} from "lucide-react";

const stats = [
  {
    label: "Total Sales",
    value: "Rp 24.500.000",
    change: "12.5%",
    trend: "up" as const,
    sub: "vs last month",
    icon: DollarSign,
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Total Purchases",
    value: "Rp 10.240.000",
    change: "2.3%",
    trend: "down" as const,
    sub: "vs last month",
    icon: ShoppingBag,
    iconBg: "bg-orange-50 dark:bg-orange-900/20",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    label: "Inventory Items",
    value: "1.452",
    change: "84",
    trend: "add" as const,
    sub: "new items added",
    icon: Package,
    iconBg: "bg-purple-50 dark:bg-purple-900/20",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    label: "Active Customers",
    value: "892",
    change: "5.4%",
    trend: "up" as const,
    sub: "vs last month",
    icon: Users,
    iconBg: "bg-teal-50 dark:bg-teal-900/20",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
];

export function SummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {stat.label}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stat.value}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${stat.iconBg}`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
          </div>

          <div className="mt-4 flex items-center text-sm">
            <span
              className={`flex items-center font-medium ${
                stat.trend === "down"
                  ? "text-red-500"
                  : "text-emerald-500"
              }`}
            >
              {stat.trend === "up" && <TrendingUp className="h-4 w-4 mr-0.5" />}
              {stat.trend === "down" && <TrendingDown className="h-4 w-4 mr-0.5" />}
              {stat.trend === "add" && <Plus className="h-4 w-4 mr-0.5" />}
              {stat.change}
            </span>
            <span className="text-gray-400 ml-2">{stat.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
