import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatBRL, formatBRLCompact } from "@/lib/format";

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover/95 p-3 text-xs shadow-lg backdrop-blur">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-3 text-muted-foreground">
          <span className="capitalize">{p.name}</span>
          <span className="ml-auto font-medium text-foreground tabular-nums">{formatBRL(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function SimpleBarChart({
  data,
  dataKey = "value",
  color = "var(--chart-1)",
  height = 260,
  horizontal = false,
}: {
  data: Array<Record<string, string | number>>;
  dataKey?: string;
  color?: string;
  height?: number;
  horizontal?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 12, left: horizontal ? 12 : 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(v) => formatBRLCompact(v as number)}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={140}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(v) => formatBRLCompact(v as number)}
            />
          </>
        )}
        <Tooltip content={<BarTooltip />} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
        <Bar dataKey={dataKey} fill={color} radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}
