import { cn } from "@/lib/utils";
import {
  LEAD_PRIORITY_LABELS,
  LEAD_STATUS_LABELS,
  type LeadPriority,
  type LeadStatus,
  type SaleStatus,
} from "@/types";

const MAP: Record<SaleStatus, { label: string; className: string }> = {
  paid: { label: "Pago", className: "bg-success/10 text-success border-success/25" },
  pending: { label: "Pendente", className: "bg-warning/10 text-warning border-warning/25" },
  canceled: {
    label: "Cancelado",
    className: "bg-destructive/10 text-destructive border-destructive/25",
  },
};

export function StatusBadge({ status }: { status: SaleStatus }) {
  const s = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        s.className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

export function ClientStatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        status === "active"
          ? "bg-success/10 text-success border-success/25"
          : "bg-muted text-muted-foreground border-border",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status === "active" ? "Ativo" : "Inativo"}
    </span>
  );
}

const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  novo: "bg-muted text-muted-foreground border-border",
  qualificado: "bg-primary/10 text-primary border-primary/25",
  mensagem_pronta: "bg-warning/10 text-warning border-warning/25",
  mensagem_enviada: "bg-warning/10 text-warning border-warning/25",
  respondeu: "bg-primary/10 text-primary border-primary/25",
  negociacao: "bg-warning/10 text-warning border-warning/25",
  proposta_enviada: "bg-primary/10 text-primary border-primary/25",
  cliente: "bg-success/10 text-success border-success/25",
  perdido: "bg-destructive/10 text-destructive border-destructive/25",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        LEAD_STATUS_STYLES[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}

const LEAD_PRIORITY_STYLES: Record<LeadPriority, string> = {
  baixa: "bg-muted text-muted-foreground border-border",
  media: "bg-warning/10 text-warning border-warning/25",
  alta: "bg-destructive/10 text-destructive border-destructive/25",
};

export function LeadPriorityBadge({ priority }: { priority: LeadPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        LEAD_PRIORITY_STYLES[priority],
      )}
    >
      {LEAD_PRIORITY_LABELS[priority]}
    </span>
  );
}
