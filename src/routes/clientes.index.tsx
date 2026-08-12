import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Search, UserPlus, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { ClientStatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { SectionCard } from "@/components/common/section-card";
import { StatCard } from "@/components/common/stat-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { isPaid } from "@/lib/finance";
import { formatBRL, formatDate, formatNumber } from "@/lib/format";
import { useData } from "@/store/data-store";

export const Route = createFileRoute("/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes — BC Labs" },
      { name: "description", content: "Base de clientes da BC Labs com receita, compras e histórico." },
      { property: "og:title", content: "Clientes — BC Labs" },
      { property: "og:description", content: "Base de clientes e receita por cliente da BC Labs." },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const { clients, sales, loading } = useData();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients
      .map((c) => {
        const cs = sales.filter((s) => s.client_id === c.id && isPaid(s));
        const total = cs.reduce((a, s) => a + s.gross, 0);
        const last = cs.map((s) => s.date).sort().at(-1);
        return { client: c, total, purchases: cs.length, last };
      })
      .filter(({ client }) =>
        q ? `${client.name} ${client.email} ${client.phone}`.toLowerCase().includes(q) : true,
      )
      .sort((a, b) => b.total - a.total);
  }, [clients, sales, query]);

  const now = new Date();
  const newThisMonth = clients.filter((c) => {
    const d = new Date(c.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const active = clients.filter((c) => c.status === "active").length;
  const totalRevenue = rows.reduce((a, r) => a + r.total, 0);
  const totalPurchases = rows.reduce((a, r) => a + r.purchases, 0);

  return (
    <AppShell>
      <PageHeader title="Clientes" description="Quem gera receita para a BC Labs e como cada conta evolui." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clientes ativos" value={formatNumber(active)} icon={Users} hint="base atual" loading={loading} />
        <StatCard label="Novos clientes" value={formatNumber(newThisMonth)} icon={UserPlus} hint="neste mês" loading={loading} />
        <StatCard
          label="Receita por cliente"
          value={formatBRL(clients.length ? totalRevenue / clients.length : 0)}
          icon={Wallet}
          hint="média histórica"
          loading={loading}
        />
        <StatCard
          label="Ticket médio"
          value={formatBRL(totalPurchases ? totalRevenue / totalPurchases : 0)}
          icon={Wallet}
          hint="por compra"
          loading={loading}
        />
      </div>

      <SectionCard className="mt-4" bodyClassName="p-0">
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente…"
              value={query}
              maxLength={80}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Users} title="Nenhum cliente encontrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-3 py-3 font-medium">Contato</th>
                  <th className="px-3 py-3 text-right font-medium">Total gasto</th>
                  <th className="px-3 py-3 text-right font-medium">Compras</th>
                  <th className="px-3 py-3 font-medium">Última compra</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ client, total, purchases, last }) => (
                  <tr key={client.id} className="group border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40">
                    <td className="px-5 py-3">
                      <Link
                        to="/clientes/$clientId"
                        params={{ clientId: client.id }}
                        className="font-medium hover:text-primary"
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <div>{client.email}</div>
                      <div className="text-xs">{client.phone}</div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatBRL(total)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(purchases)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{last ? formatDate(last) : "—"}</td>
                    <td className="px-3 py-3">
                      <ClientStatusBadge status={client.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to="/clientes/$clientId"
                        params={{ clientId: client.id }}
                        aria-label={`Abrir ${client.name}`}
                        className="inline-flex text-muted-foreground transition-colors group-hover:text-primary"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
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
