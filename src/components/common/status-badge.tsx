import { cn } from "@/lib/utils";
import type { SaleStatus } from "@/types";

const MAP: Record<SaleStatus, { label: string; className: string }> = {
  paid: { label: "Pago", className: "bg-success/10 text-success border-success/25" },
  pending: { label: "Pendente", className: "bg-warning/10 text-warning border-warning/25" },
  canceled: { label: "Cancelado", className: "bg-destructive/10 text-destructive border-destructive/25" },
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
