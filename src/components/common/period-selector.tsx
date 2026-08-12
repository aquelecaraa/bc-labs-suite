import { CalendarRange } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toISODate } from "@/lib/format";
import type { DateRange, PeriodKey } from "@/types";

const OPTIONS: Array<{ key: PeriodKey; label: string }> = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "month", label: "Este mês" },
  { key: "lastMonth", label: "Mês passado" },
  { key: "year", label: "Este ano" },
  { key: "custom", label: "Personalizado" },
];

export function PeriodSelector({
  value,
  onChange,
  custom,
  onCustomChange,
}: {
  value: PeriodKey;
  onChange: (k: PeriodKey) => void;
  custom: DateRange;
  onCustomChange: (r: DateRange) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card/60 p-1 backdrop-blur">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
              value === o.key
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {value === "custom" && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-2 py-1">
          <CalendarRange className="size-4 text-muted-foreground" />
          <Input
            type="date"
            className="h-8 w-[9.5rem] border-0 bg-transparent px-1 text-xs"
            value={toISODate(custom.from)}
            onChange={(e) =>
              onCustomChange({ ...custom, from: new Date(`${e.target.value}T00:00:00`) })
            }
          />
          <span className="text-xs text-muted-foreground">até</span>
          <Input
            type="date"
            className="h-8 w-[9.5rem] border-0 bg-transparent px-1 text-xs"
            value={toISODate(custom.to)}
            onChange={(e) => onCustomChange({ ...custom, to: new Date(`${e.target.value}T23:59:59`) })}
          />
        </div>
      )}
    </div>
  );
}
