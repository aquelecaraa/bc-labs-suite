import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Search, Target, Trash2, Users, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useMemo, useState } from "react";

import { ConfirmDelete } from "@/components/common/confirm-delete";
import { EmptyState } from "@/components/common/empty-state";
import { LeadPriorityBadge, LeadStatusBadge } from "@/components/common/status-badge";
import { SectionCard } from "@/components/common/section-card";
import { StatCard } from "@/components/common/stat-card";
import { LeadDialog } from "@/components/crm/lead-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate, formatNumber } from "@/lib/format";
import { compareLeadPriority } from "@/lib/lead-priority";
import { useLeads } from "@/store/leads-store";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type Lead, type LeadStatus } from "@/types";

export const Route = createFileRoute("/crm/")({
  head: () => ({
    meta: [
      { title: "CRM — Lista de leads — BC Labs" },
      { name: "description", content: "Lista de leads em prospecção da BC Labs." },
      { property: "og:title", content: "CRM — Lista de leads — BC Labs" },
      { property: "og:description", content: "Lista de leads em prospecção da BC Labs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CrmListPage,
});

type SortKey = "company_name" | "score" | "priority" | "created_at";

function CrmListPage() {
  const { leads, deleteLead, loading } = useLeads();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [editing, setEditing] = useState<Lead | null>(null);
  const [toDelete, setToDelete] = useState<Lead | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null);

  const handleSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "desc"; // Padrão: do maior para o menor
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = leads
      .filter((l) => (statusFilter === "all" ? true : l.status === statusFilter))
      .filter((l) =>
        q ? `${l.company_name} ${l.phone ?? ""} ${l.source ?? ""}`.toLowerCase().includes(q) : true,
      );

    if (sortConfig) {
      filtered.sort((a, b) => {
        const { key, direction } = sortConfig;
        const modifier = direction === "asc" ? 1 : -1;

        if (key === "score") return ((a.score || 0) - (b.score || 0)) * modifier;
        if (key === "company_name") return a.company_name.localeCompare(b.company_name) * modifier;
        if (key === "created_at") {
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * modifier;
        }
        if (key === "priority") {
          // Utiliza a lógica de prioridade existente (Alta > Média > Baixa)
          return direction === "desc" ? compareLeadPriority(a, b) : compareLeadPriority(b, a);
        }
        return 0;
      });
    } else {
      // Ordenação padrão se não houver clique nos cabeçalhos
      filtered.sort(compareLeadPriority);
    }

    return filtered;
  }, [leads, query, statusFilter, sortConfig]);

  const active = leads.filter((l) => l.status !== "cliente" && l.status !== "perdido").length;
  const converted = leads.filter((l) => l.status === "cliente").length;
  const avgScore = leads.length
    ? Math.round(leads.reduce((a, l) => a + (l.score || 0), 0) / leads.length)
    : 0;

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-1 size-3 opacity-30" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 size-3 text-primary" />
    ) : (
      <ArrowDown className="ml-1 size-3 text-primary" />
    );
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Leads em prospecção"
          value={formatNumber(active)}
          icon={Target}
          loading={loading}
          hint="ativos no funil"
        />
        <StatCard
          label="Convertidos em clientes"
          value={formatNumber(converted)}
          icon={Users}
          loading={loading}
          hint="total"
        />
        <StatCard
          label="Score médio"
          value={String(avgScore)}
          icon={Target}
          loading={loading}
          hint="de 0 a 100"
        />
      </div>

      <SectionCard className="mt-4" bodyClassName="p-0">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar lead…"
              value={query}
              maxLength={80}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as LeadStatus | "all")}
          >
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Target} title="Nenhum lead encontrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th 
                    className="cursor-pointer px-5 py-3 font-medium transition-colors hover:bg-accent/50 select-none"
                    onClick={() => handleSort("company_name")}
                  >
                    <div className="flex items-center">Empresa <SortIcon columnKey="company_name" /></div>
                  </th>
                  <th className="px-3 py-3 font-medium">Contato</th>
                  <th className="px-3 py-3 font-medium">Origem</th>
                  <th 
                    className="cursor-pointer px-3 py-3 font-medium transition-colors hover:bg-accent/50 select-none"
                    onClick={() => handleSort("score")}
                  >
                    <div className="flex items-center justify-end">Score <SortIcon columnKey="score" /></div>
                  </th>
                  <th 
                    className="cursor-pointer px-3 py-3 font-medium transition-colors hover:bg-accent/50 select-none"
                    onClick={() => handleSort("priority")}
                  >
                    <div className="flex items-center">Prioridade <SortIcon columnKey="priority" /></div>
                  </th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th 
                    className="cursor-pointer px-3 py-3 font-medium transition-colors hover:bg-accent/50 select-none"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center">Criado em <SortIcon columnKey="created_at" /></div>
                  </th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((lead) => (
                  <tr
                    key={lead.id}
                    className="group border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40"
                  >
                    <td className="px-5 py-3 font-medium">
                      <Link
                        to="/crm/$leadId"
                        params={{ leadId: lead.id }}
                        className="hover:text-primary"
                      >
                        {lead.company_name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <div>{lead.phone || "—"}</div>
                      <div className="text-xs truncate max-w-[160px]">{lead.website || ""}</div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{lead.source || "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{lead.score}</td>
                    <td className="px-3 py-3">
                      <LeadPriorityBadge priority={lead.priority} />
                    </td>
                    <td className="px-3 py-3">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setToDelete(lead)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="size-8 text-muted-foreground hover:text-foreground"
                            >
                              <Link to="/crm/$leadId" params={{ leadId: lead.id }}>
                                <ChevronRight className="size-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Detalhes</TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <LeadDialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)} lead={editing} />

      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Excluir lead?"
        description={`O lead ${toDelete?.company_name || ""} e seu histórico serão removidos.`}
        onConfirm={() => {
          if (toDelete) deleteLead(toDelete.id);
          setToDelete(null);
        }}
      />
    </>
  );
}