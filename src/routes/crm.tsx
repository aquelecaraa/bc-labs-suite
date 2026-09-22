import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, List, Plus, Radar } from "lucide-react";
import { useState } from "react";

import { LeadDialog } from "@/components/crm/lead-dialog";
import { ProspectDialog } from "@/components/crm/prospect-dialog";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crm")({
  component: CrmLayout,
});

const TABS = [
  { to: "/crm", label: "Lista", icon: List },
  { to: "/crm/kanban", label: "Kanban", icon: LayoutGrid },
] as const;

function CrmLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isProspectOpen, setIsProspectOpen] = useState(false);

  return (
    <AppShell>
      <PageHeader
        title="CRM de Prospecção"
        description="Leads em prospecção, do primeiro contato até virar cliente."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsProspectOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Radar className="size-4" /> Buscar leads
            </Button>
            <Button onClick={() => setIsNewOpen(true)} className="flex items-center gap-1.5">
              <Plus className="size-4" /> Novo lead
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </div>

      <Outlet />

      <LeadDialog open={isNewOpen} onOpenChange={setIsNewOpen} />
    </AppShell>
  );
}
