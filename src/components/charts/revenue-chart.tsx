import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatBRL, formatBRLCompact } from "@/lib/format";

export interface SeriesPoint {
  label: string;
  faturamento: number;
  lucro: number;
  despesas: number;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover/95 p-3 text-xs shadow-lg backdrop-blur">
      <p className="mb-2 font-medium text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.dataKey}</span>
          <span className="ml-auto font-medium text-foreground tabular-nums">{formatBRL(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          minTickGap={16}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickFormatter={(v) => formatBRLCompact(v as number)}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
        <Area
          type="monotone"
          dataKey="faturamento"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#gradRev)"
        />
        <Area type="monotone" dataKey="lucro" stroke="var(--chart-2)" strokeWidth={2} fill="url(#gradProfit)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
