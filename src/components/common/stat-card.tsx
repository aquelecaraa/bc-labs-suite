import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  hint,
  loading,
  invertChange = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  change?: number;
  hint?: string;
  loading?: boolean;
  invertChange?: boolean;
}) {
  const positive = (change ?? 0) > 0;
  const negative = (change ?? 0) < 0;
  const good = invertChange ? negative : positive;

  return (
    <div className="surface group animate-rise p-4 transition-all duration-200 hover:border-primary/40 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
          <Icon className="size-4" />
        </span>
      </div>

      {loading ? (
        <Skeleton className="mt-4 h-8 w-32" />
      ) : (
        <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      )}

      <div className="mt-2 flex items-center gap-2 text-xs">
        {change !== undefined && !loading && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium",
              change === 0
                ? "bg-muted text-muted-foreground"
                : good
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive",
            )}
          >
            {change === 0 ? (
              <Minus className="size-3" />
            ) : positive ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {formatPercent(Math.abs(change))}
          </span>
        )}
        <span className="text-muted-foreground">{hint ?? "vs. período anterior"}</span>
      </div>
    </div>
  );
}
