import { Link, createFileRoute } from "@tanstack/react-router";

import { LeadPriorityBadge } from "@/components/common/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { useLeads } from "@/store/leads-store";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/types";

export const Route = createFileRoute("/crm/kanban")({
  head: () => ({
    meta: [
      { title: "CRM — Kanban — BC Labs" },
      { name: "description", content: "Funil de leads em Kanban da BC Labs." },
    ],
  }),
  component: CrmKanbanPage,
});

function CrmKanbanPage() {
  const { leads, updateLead, addActivity } = useLeads();

  async function moveTo(leadId: string, from: LeadStatus, to: LeadStatus) {
    if (from === to) return;
    await updateLead(leadId, { status: to });
    await addActivity(
      leadId,
      "status_change",
      `Status alterado de "${LEAD_STATUS_LABELS[from]}" para "${LEAD_STATUS_LABELS[to]}"`,
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {LEAD_STATUSES.map((status) => {
        const items = leads.filter((l) => l.status === status);
        return (
          <div
            key={status}
            className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/20"
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <p className="text-sm font-medium">{LEAD_STATUS_LABELS[status]}</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {items.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-2">
              {items.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Nenhum lead aqui
                </p>
              ) : (
                items.map((lead) => (
                  <div
                    key={lead.id}
                    className="surface animate-rise space-y-2 p-3 text-sm transition-colors hover:border-primary/40"
                  >
                    <Link
                      to="/crm/$leadId"
                      params={{ leadId: lead.id }}
                      className="font-medium hover:text-primary"
                    >
                      {lead.company_name}
                    </Link>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Score {lead.score}</span>
                      <LeadPriorityBadge priority={lead.priority} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(lead.created_at)}
                    </p>
                    <Select
                      value={lead.status}
                      onValueChange={(v) => moveTo(lead.id, lead.status, v as LeadStatus)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {LEAD_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
