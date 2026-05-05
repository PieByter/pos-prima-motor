import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-hidden bg-linear-to-b from-slate-50 to-blue-50/50 text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Sidebar />
        <main className="relative min-w-0 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b from-sky-100/30 to-transparent dark:from-sky-950/20" />
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
