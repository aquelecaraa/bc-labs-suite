import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SimpleBarChart } from "@/components/charts/bar-chart";
import { CategoryDonut } from "@/components/charts/category-donut";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { EmptyState } from "@/components/common/empty-state";
import { PeriodSelector } from "@/components/common/period-selector";
import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { usePeriod } from "@/hooks/use-period";
import {
  averageTicket,
  buildSeries,
  expensesByCategory,
  filterByRange,
  isPaid,
  netProfit,
  profitMargin,
  revenue,
  totalExpenses,
} from "@/lib/finance";
import { formatBRL, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { useData } from "@/store/data-store";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — BC Labs" },
      { name: "description", content: "Relatórios financeiros por período, cliente e produto da BC Labs." },
      { property: "og:title", content: "Relatórios — BC Labs" },
      { property: "og:description", content: "Relatórios financeiros consolidados da BC Labs." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { sales, expenses, clients } = useData();
  const { period, setPeriod, custom, setCustom, range } = usePeriod("month");
  const [generated, setGenerated] = useState(false);

  const data = useMemo(() => {
    const cur = filterByRange(sales, range);
    const curExp = filterByRange(expenses, range);
    const paid = cur.filter(isPaid);

    const byClient = new Map<string, number>();
    const byProduct = new Map<string, number>();
    for (const s of paid) {
      byClient.set(s.client_id, (byClient.get(s.client_id) ?? 0) + s.gross);
      byProduct.set(s.product, (byProduct.get(s.product) ?? 0) + s.gross);
    }

    return {
      revenue: revenue(cur),
      expenses: totalExpenses(curExp),
      profit: netProfit(cur, curExp),
      margin: profitMargin(cur, curExp),
      count: paid.length,
      ticket: averageTicket(cur),
      series: buildSeries(cur, curExp, range),
      byCategory: expensesByCategory(curExp),
      byClient: [...byClient.entries()]
        .map(([id, value]) => ({ label: clients.find((c) => c.id === id)?.name ?? "—", value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
      byProduct: [...byProduct.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value),
    };
  }, [sales, expenses, clients, range]);

  return (
    <AppShell>
      <PageHeader
        title="Relatórios"
        description="Consolidação financeira por período, cliente e produto."
        actions={
          <>
            <PeriodSelector value={period} onChange={setPeriod} custom={custom} onCustomChange={setCustom} />
            <Button
              onClick={() => {
                setGenerated(true);
                toast.success("Relatório gerado", {
                  description: "Exportação em PDF será habilitada na próxima etapa.",
                });
              }}
            >
              <FileText className="size-4" /> Gerar relatório
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Faturamento" value={formatBRL(data.revenue)} />
        <Metric label="Despesas" value={formatBRL(data.expenses)} />
        <Metric label="Lucro" value={formatBRL(data.profit)} />
        <Metric label="Margem" value={formatPercent(data.margin)} />
        <Metric label="Número de vendas" value={formatNumber(data.count)} />
        <Metric label="Ticket médio" value={formatBRL(data.ticket)} />
      </div>

      {generated && (
        <SectionCard
          className="mt-4"
          title="Preview do relatório"
          description={`Período de ${formatDate(range.from)} a ${formatDate(range.to)}`}
        >
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Faturamento de <strong className="text-foreground">{formatBRL(data.revenue)}</strong> com{" "}
              {formatNumber(data.count)} vendas pagas e ticket médio de {formatBRL(data.ticket)}.
            </p>
            <p>
              Despesas de {formatBRL(data.expenses)} resultando em lucro líquido de{" "}
              <strong className="text-foreground">{formatBRL(data.profit)}</strong> e margem de{" "}
              {formatPercent(data.margin)}.
            </p>
          </div>
        </SectionCard>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <SectionCard className="xl:col-span-2" title="Faturamento e lucro por período">
          <RevenueChart data={data.series} />
        </SectionCard>
        <SectionCard title="Despesas por categoria">
          {data.byCategory.length ? (
            <CategoryDonut data={data.byCategory} />
          ) : (
            <EmptyState icon={FileText} title="Sem despesas no período" />
          )}
        </SectionCard>
        <SectionCard title="Receita por cliente">
          {data.byClient.length ? (
            <SimpleBarChart data={data.byClient} horizontal height={280} color="var(--chart-2)" />
          ) : (
            <EmptyState icon={FileText} title="Sem receita no período" />
          )}
        </SectionCard>
        <SectionCard className="xl:col-span-2" title="Receita por produto/serviço">
          {data.byProduct.length ? (
            <SimpleBarChart data={data.byProduct} horizontal height={280} color="var(--chart-6)" />
          ) : (
            <EmptyState icon={FileText} title="Sem receita no período" />
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface animate-rise p-4">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
