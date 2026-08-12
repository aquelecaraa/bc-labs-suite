import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BadgePercent,
  Coins,
  CreditCard,
  Receipt,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";

import { CategoryDonut } from "@/components/charts/category-donut";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { EmptyState } from "@/components/common/empty-state";
import { PeriodSelector } from "@/components/common/period-selector";
import { SectionCard } from "@/components/common/section-card";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "@/hooks/use-period";
import {
  averageTicket,
  buildSeries,
  expensesByCategory,
  filterByRange,
  growth,
  netProfit,
  profitMargin,
  revenue,
  saleProfit,
  totalExpenses,
} from "@/lib/finance";
import { formatBRL, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { buildInsights } from "@/lib/insights";
import { cn } from "@/lib/utils";
import { useData } from "@/store/data-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — BC Labs" },
      {
        name: "description",
        content: "Visão geral de faturamento, lucro, vendas e despesas da BC Labs em tempo real.",
      },
      { property: "og:title", content: "Dashboard — BC Labs" },
      {
        property: "og:description",
        content: "Visão geral de faturamento, lucro, vendas e despesas da BC Labs.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { sales, expenses, clients, loading } = useData();
  const { period, setPeriod, custom, setCustom, range, previous } = usePeriod("month");

  const m = useMemo(() => {
    const cur = filterByRange(sales, range);
    const prev = filterByRange(sales, previous);
    const curExp = filterByRange(expenses, range);
    const prevExp = filterByRange(expenses, previous);
    const paidCur = cur.filter((s) => s.status === "paid").length;
    const paidPrev = prev.filter((s) => s.status === "paid").length;

    return {
      cur,
      curExp,
      revenue: revenue(cur),
      revenuePrev: revenue(prev),
      profit: netProfit(cur, curExp),
      profitPrev: netProfit(prev, prevExp),
      count: paidCur,
      countPrev: paidPrev,
      ticket: averageTicket(cur),
      ticketPrev: averageTicket(prev),
      expenses: totalExpenses(curExp),
      expensesPrev: totalExpenses(prevExp),
      margin: profitMargin(cur, curExp),
      marginPrev: profitMargin(prev, prevExp),
      series: buildSeries(cur, curExp, range),
      byCategory: expensesByCategory(curExp),
      recent: [...cur].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8),
    };
  }, [sales, expenses, range, previous]);

  const insights = useMemo(
    () => buildInsights(sales, expenses, clients, range, previous),
    [sales, expenses, clients, range, previous],
  );

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação da BC Labs no período selecionado."
        actions={
          <PeriodSelector value={period} onChange={setPeriod} custom={custom} onCustomChange={setCustom} />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Faturamento"
          value={formatBRL(m.revenue)}
          icon={Wallet}
          change={growth(m.revenue, m.revenuePrev)}
          loading={loading}
        />
        <StatCard
          label="Lucro líquido"
          value={formatBRL(m.profit)}
          icon={TrendingUp}
          change={growth(m.profit, m.profitPrev)}
          loading={loading}
        />
        <StatCard
          label="Vendas"
          value={formatNumber(m.count)}
          icon={ShoppingCart}
          change={growth(m.count, m.countPrev)}
          loading={loading}
        />
        <StatCard
          label="Ticket médio"
          value={formatBRL(m.ticket)}
          icon={CreditCard}
          change={growth(m.ticket, m.ticketPrev)}
          loading={loading}
        />
        <StatCard
          label="Despesas"
          value={formatBRL(m.expenses)}
          icon={Receipt}
          change={growth(m.expenses, m.expensesPrev)}
          invertChange
          loading={loading}
        />
        <StatCard
          label="Margem de lucro"
          value={formatPercent(m.margin)}
          icon={BadgePercent}
          change={growth(m.margin, m.marginPrev)}
          loading={loading}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Faturamento e lucro"
          description="Evolução no período selecionado"
        >
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <RevenueChart data={m.series} />
          )}
        </SectionCard>

        <SectionCard title="Despesas por categoria" description="Distribuição do gasto no período">
          {loading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : m.byCategory.length ? (
            <CategoryDonut data={m.byCategory} />
          ) : (
            <EmptyState icon={Receipt} title="Sem despesas no período" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        className="mt-4"
        title="Insights da BC AI"
        description="Leitura automática dos dados do período"
        actions={
          <Link
            to="/bc-ai"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Abrir BC AI <ArrowUpRight className="size-3" />
          </Link>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((i) => (
            <div
              key={i.id}
              className="flex gap-3 rounded-xl border border-border bg-muted/30 p-3.5 transition-colors hover:border-primary/40"
            >
              <Sparkles
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  i.tone === "positive"
                    ? "text-success"
                    : i.tone === "negative"
                      ? "text-warning"
                      : "text-primary",
                )}
              />
              <p className="text-sm leading-relaxed text-muted-foreground">{i.text}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        className="mt-4"
        title="Vendas recentes"
        description="Últimos registros do período"
        bodyClassName="p-0"
        actions={
          <Link to="/vendas" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            Ver todas <ArrowUpRight className="size-3" />
          </Link>
        }
      >
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : m.recent.length === 0 ? (
          <EmptyState icon={Coins} title="Nenhuma venda no período" description="Ajuste o período ou registre uma nova venda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-3 py-3 font-medium">Produto/Serviço</th>
                  <th className="px-3 py-3 font-medium">Data</th>
                  <th className="px-3 py-3 text-right font-medium">Valor bruto</th>
                  <th className="px-3 py-3 text-right font-medium">Taxas</th>
                  <th className="px-3 py-3 text-right font-medium">Custos</th>
                  <th className="px-3 py-3 text-right font-medium">Lucro</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {m.recent.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40">
                    <td className="px-5 py-3 font-medium">{clientName(s.client_id)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{s.product}</td>
                    <td className="px-3 py-3 text-muted-foreground">{formatDate(s.date)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatBRL(s.gross)}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">{formatBRL(s.fees)}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">{formatBRL(s.costs)}</td>
                    <td className="px-3 py-3 text-right font-medium text-success tabular-nums">
                      {formatBRL(saleProfit(s))}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}
