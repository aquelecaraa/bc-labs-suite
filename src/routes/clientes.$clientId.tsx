import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, ShoppingCart, Users, Wallet } from "lucide-react";
import { useMemo } from "react";

import { SimpleBarChart } from "@/components/charts/bar-chart";
import { EmptyState } from "@/components/common/empty-state";
import { SectionCard } from "@/components/common/section-card";
import { StatCard } from "@/components/common/stat-card";
import { ClientStatusBadge, StatusBadge } from "@/components/common/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { isPaid, saleProfit } from "@/lib/finance";
import { formatBRL, formatDate } from "@/lib/format";
import { useData } from "@/store/data-store";

export const Route = createFileRoute("/clientes/$clientId")({
  head: () => ({
    meta: [
      { title: "Detalhes do cliente — BC Labs" },
      { name: "description", content: "Histórico de compras, receita e evolução de um cliente da BC Labs." },
      { property: "og:title", content: "Detalhes do cliente — BC Labs" },
      { property: "og:description", content: "Histórico e evolução de receita do cliente." },
    ],
  }),
  component: ClientDetailPage,
});

function ClientDetailPage() {
  const { clientId } = Route.useParams();
  const { clients, sales } = useData();
  const client = clients.find((c) => c.id === clientId);

  const clientSales = useMemo(
    () => sales.filter((s) => s.client_id === clientId).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [sales, clientId],
  );

  const paid = clientSales.filter(isPaid);
  const total = paid.reduce((a, s) => a + s.gross, 0);
  const ticket = paid.length ? total / paid.length : 0;
  const last = paid.map((s) => s.date).sort().at(-1);

  const series = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of paid) {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + s.gross);
    }
    return [...map.entries()]
      .sort()
      .map(([key, value]) => {
        const parts = key.split("-");
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
        return { label: d.toLocaleDateString("pt-BR", { month: "short" }), value };
      });
  }, [paid]);

  if (!client) {
    return (
      <AppShell>
        <EmptyState
          icon={Users}
          title="Cliente não encontrado"
          description="O registro pode ter sido removido."
          action={
            <Button asChild variant="secondary">
              <Link to="/clientes">Voltar para clientes</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        to="/clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Clientes
      </Link>

      <PageHeader
        title={client.name}
        description={`${client.email} · ${client.phone} · cadastrado em ${formatDate(client.created_at)}`}
        actions={<ClientStatusBadge status={client.status} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total gasto" value={formatBRL(total)} icon={Wallet} hint="vendas pagas" />
        <StatCard label="Compras" value={String(paid.length)} icon={ShoppingCart} hint="pedidos pagos" />
        <StatCard label="Ticket médio" value={formatBRL(ticket)} icon={CreditCard} hint="por compra" />
        <StatCard label="Última compra" value={last ? formatDate(last) : "—"} icon={Users} hint="registro mais recente" />
      </div>

      <SectionCard className="mt-4" title="Evolução do faturamento" description="Receita mensal deste cliente">
        {series.length ? (
          <SimpleBarChart data={series} />
        ) : (
          <EmptyState icon={Wallet} title="Sem vendas pagas registradas" />
        )}
      </SectionCard>

      <SectionCard className="mt-4" title="Histórico de compras" bodyClassName="p-0">
        {clientSales.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Nenhuma compra registrada" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Produto/Serviço</th>
                  <th className="px-3 py-3 font-medium">Data</th>
                  <th className="px-3 py-3 text-right font-medium">Bruto</th>
                  <th className="px-3 py-3 text-right font-medium">Lucro</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {clientSales.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                    <td className="px-5 py-3 font-medium">{s.product}</td>
                    <td className="px-3 py-3 text-muted-foreground">{formatDate(s.date)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatBRL(s.gross)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatBRL(saleProfit(s))}</td>
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
