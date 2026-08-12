import { createFileRoute } from "@tanstack/react-router";
import { Eye, Pencil, Plus, Search, ShoppingCart, Trash2, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/common/confirm-delete";
import { EmptyState } from "@/components/common/empty-state";
import { PeriodSelector } from "@/components/common/period-selector";
import { SectionCard } from "@/components/common/section-card";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SaleDialog } from "@/components/sales/sale-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PRODUCTS } from "@/data/demo";
import { usePeriod } from "@/hooks/use-period";
import {
  averageTicket,
  filterByRange,
  revenue,
  saleMargin,
  saleNet,
  saleProfit,
} from "@/lib/finance";
import { formatBRL, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { useData } from "@/store/data-store";
import type { Sale } from "@/types";

export const Route = createFileRoute("/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas — BC Labs" },
      { name: "description", content: "Gerencie vendas, taxas, custos e lucro por operação na BC Labs." },
      { property: "og:title", content: "Vendas — BC Labs" },
      { property: "og:description", content: "Gestão completa de vendas da BC Labs." },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const { sales, clients, deleteSale, loading } = useData();
  const { period, setPeriod, custom, setCustom, range } = usePeriod("year");

  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  const [editing, setEditing] = useState<Sale | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detail, setDetail] = useState<Sale | null>(null);
  const [toDelete, setToDelete] = useState<Sale | null>(null);

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return filterByRange(sales, range)
      .filter((s) => (clientFilter === "all" ? true : s.client_id === clientFilter))
      .filter((s) => (statusFilter === "all" ? true : s.status === statusFilter))
      .filter((s) => (productFilter === "all" ? true : s.product === productFilter))
      .filter((s) =>
        q ? `${clientName(s.client_id)} ${s.product} ${s.payment_method}`.toLowerCase().includes(q) : true,
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, range, query, clientFilter, statusFilter, productFilter, clients]);

  const products = useMemo(
    () => Array.from(new Set([...PRODUCTS, ...sales.map((s) => s.product)])),
    [sales],
  );

  return (
    <AppShell>
      <PageHeader
        title="Vendas"
        description="Registre, acompanhe e analise cada venda da BC Labs."
        actions={
          <>
            <PeriodSelector value={period} onChange={setPeriod} custom={custom} onCustomChange={setCustom} />
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" /> Nova venda
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de vendas"
          value={formatNumber(filtered.filter((s) => s.status === "paid").length)}
          icon={ShoppingCart}
          hint="vendas pagas no filtro"
          loading={loading}
        />
        <StatCard
          label="Faturamento"
          value={formatBRL(revenue(filtered))}
          icon={Wallet}
          hint="soma das vendas pagas"
          loading={loading}
        />
        <StatCard
          label="Lucro"
          value={formatBRL(filtered.filter((s) => s.status === "paid").reduce((a, s) => a + saleProfit(s), 0))}
          icon={TrendingUp}
          hint="bruto - taxas - custos"
          loading={loading}
        />
        <StatCard
          label="Ticket médio"
          value={formatBRL(averageTicket(filtered))}
          icon={Wallet}
          hint="faturamento / vendas"
          loading={loading}
        />
      </div>

      <SectionCard className="mt-4" bodyClassName="p-0">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, produto ou pagamento…"
              value={query}
              maxLength={80}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-full sm:w-[190px]">
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Nenhuma venda encontrada"
            description="Ajuste os filtros ou registre uma nova venda."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="size-4" /> Nova venda
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-3 py-3 font-medium">Produto/Serviço</th>
                  <th className="px-3 py-3 font-medium">Data</th>
                  <th className="px-3 py-3 text-right font-medium">Bruto</th>
                  <th className="px-3 py-3 text-right font-medium">Taxas</th>
                  <th className="px-3 py-3 text-right font-medium">Custos</th>
                  <th className="px-3 py-3 text-right font-medium">Lucro</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40">
                    <td className="px-5 py-3 font-medium">{clientName(s.client_id)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{s.product}</td>
                    <td className="px-3 py-3 text-muted-foreground">{formatDate(s.date)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatBRL(s.gross)}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">{formatBRL(s.fees)}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">{formatBRL(s.costs)}</td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">{formatBRL(saleProfit(s))}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <IconAction label="Detalhes" onClick={() => setDetail(s)}>
                          <Eye className="size-4" />
                        </IconAction>
                        <IconAction
                          label="Editar"
                          onClick={() => {
                            setEditing(s);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </IconAction>
                        <IconAction label="Excluir" destructive onClick={() => setToDelete(s)}>
                          <Trash2 className="size-4" />
                        </IconAction>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SaleDialog open={dialogOpen} onOpenChange={setDialogOpen} sale={editing} />

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da venda</DialogTitle>
            <DialogDescription>{detail ? clientName(detail.client_id) : ""}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              <Row label="Produto/Serviço" value={detail.product} />
              <Row label="Data" value={formatDate(detail.date)} />
              <Row label="Pagamento" value={detail.payment_method} />
              <Row label="Valor bruto" value={formatBRL(detail.gross)} />
              <Row label="Taxas" value={formatBRL(detail.fees)} />
              <Row label="Custos" value={formatBRL(detail.costs)} />
              <Row label="Valor líquido" value={formatBRL(saleNet(detail))} />
              <Row label="Lucro" value={formatBRL(saleProfit(detail))} />
              <Row label="Margem" value={formatPercent(saleMargin(detail))} />
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={detail.status} />
              </div>
              {detail.notes && (
                <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  {detail.notes}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Excluir venda?"
        description="O registro será removido permanentemente dos relatórios."
        onConfirm={() => {
          if (toDelete) {
            deleteSale(toDelete.id);
            toast.success("Venda excluída");
          }
          setToDelete(null);
        }}
      />
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function IconAction({
  label,
  children,
  onClick,
  destructive,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          onClick={onClick}
          className={destructive ? "size-8 text-muted-foreground hover:text-destructive" : "size-8 text-muted-foreground hover:text-foreground"}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
