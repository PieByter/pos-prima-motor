import { cn } from "@/lib/utils";

/**
 * Glass-morphism card wrapper used across all dashboard sections.
 * Replaces the 200+ character className string that was copy-pasted everywhere.
 */
export function DashboardCard({
  className,
  children,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-md shadow-slate-200/40 backdrop-blur-lg",
        "transition-shadow duration-200 hover:shadow-lg hover:shadow-slate-200/50",
        "dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-slate-950/30 dark:hover:shadow-slate-950/40",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

/**
 * Consistent section header (label + title) used at the top of every card.
 */
export function SectionHeader({
  label,
  title,
  children,
  className,
}: {
  label: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800/60",
        className,
      )}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <h3 className="mt-0.5 text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

/**
 * Empty state placeholder for tables and lists.
 */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center dark:border-slate-800 dark:bg-slate-900/30">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {message}
      </p>
    </div>
  );
}

/**
 * Centered spinner for loading states.
 */
export function LoadingSpinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
    </div>
  );
}
