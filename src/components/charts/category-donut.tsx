import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatBRL, formatPercent } from "@/lib/format";

export interface CategorySlice {
  name: string;
  value: number;
  percent: number;
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as CategorySlice;
  return (
    <div className="rounded-xl border border-border bg-popover/95 p-3 text-xs shadow-lg backdrop-blur">
      <p className="font-medium">{d.name}</p>
      <p className="mt-1 text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">{formatBRL(d.value)}</span>{" "}
        · {formatPercent(d.percent)}
      </p>
    </div>
  );
}

export function CategoryDonut({ data }: { data: CategorySlice[] }) {
  return (
    <div className="flex flex-col items-center gap-4 lg:flex-row">
      <div className="h-[220px] w-full max-w-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={92}
              paddingAngle={2}
              stroke="var(--background)"
              strokeWidth={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="ml-auto tabular-nums">{formatBRL(d.value)}</span>
            <span className="w-14 text-right text-xs text-muted-foreground tabular-nums">
              {formatPercent(d.percent)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
