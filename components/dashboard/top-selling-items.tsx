import { Droplets, Settings, Bike, Wrench } from "lucide-react";

const topItems = [
  {
    name: "Motul 5100 10W-40",
    category: "Oil & Lubricants",
    amount: "Rp 1.240.000",
    icon: Droplets,
  },
  {
    name: "NGK Spark Plug",
    category: "Engine Parts",
    amount: "Rp 890.000",
    icon: Settings,
  },
  {
    name: "Michelin Pilot Street",
    category: "Tires",
    amount: "Rp 2.100.000",
    icon: Bike,
  },
  {
    name: "Brake Pads Kit",
    category: "Braking System",
    amount: "Rp 650.000",
    icon: Wrench,
  },
];

export function TopSellingItems() {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
        Top Selling Items
      </h3>

      <div className="space-y-5">
        {topItems.map((item) => (
          <div key={item.name} className="flex items-center gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
              <item.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {item.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.category}
              </p>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
              {item.amount}
            </span>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-2 text-sm text-sky-500 font-medium hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors cursor-pointer">
        View All Items
      </button>
    </div>
  );
}
