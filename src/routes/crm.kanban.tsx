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
import { compareLeadPriority } from "@/lib/lead-priority";
import { useLeads } from "@/store/leads-store";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/types";

export const Route = createFileRoute("/crm/kanban")({
  head: () => ({
    meta: [
      { title: "CRM — Kanban — BC Labs" },
      { name: "description", content: "Funil de leads em Kanban da BC Labs." },
      { property: "og:title", content: "CRM — Kanban — BC Labs" },
      { property: "og:description", content: "Funil de leads em Kanban da BC Labs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
    <div className="flex h-[calc(100dvh-320px)] min-h-64 w-full min-w-0 gap-4 overflow-x-scroll overflow-y-hidden pb-2 [scrollbar-gutter:stable] lg:h-[calc(100dvh-220px)]">
      {LEAD_STATUSES.map((status) => {
        const items = leads.filter((l) => l.status === status).sort(compareLeadPriority);
        return (
          <div
            key={status}
            className="flex h-full min-h-0 w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/20"
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <p className="text-sm font-medium">{LEAD_STATUS_LABELS[status]}</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {items.length}
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2 [scrollbar-gutter:stable]">
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