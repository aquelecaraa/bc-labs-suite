import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vendas", label: "Vendas", icon: ShoppingCart },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/despesas", label: "Despesas", icon: Receipt },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/bc-ai", label: "BC AI", icon: Sparkles },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary glow-ring">
        <span className="text-sm font-bold tracking-tight">BC</span>
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight">BC Labs</p>
        <p className="text-[11px] text-muted-foreground">Business Intelligence &amp; Automation</p>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="mt-6 flex flex-1 flex-col gap-1 px-2">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
              active
                ? "bg-sidebar-accent text-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "absolute left-0 h-5 w-0.5 rounded-full bg-primary transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon className={cn("size-4 shrink-0 transition-colors", active && "text-primary")} />
            {label}
          </Link>
        );
      })}

      <div className="my-3 h-px bg-sidebar-border" />

      <Link
        to="/configuracoes"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
          pathname.startsWith("/configuracoes")
            ? "bg-sidebar-accent text-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
        )}
      >
        <Settings className="size-4" />
        Configurações
      </Link>
    </nav>
  );
}

function UserBlock() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.name ?? "BC")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="m-2 flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
        {initials}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium">{user?.name ?? "Operador"}</p>
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" />
          Online
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Sair"
        className="size-8 text-muted-foreground hover:text-foreground"
        onClick={() => {
          signOut();
          void navigate({ to: "/login" });
        }}
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (ready && !user) void navigate({ to: "/login" });
  }, [ready, user, navigate]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!ready || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="animate-pulse text-sm text-muted-foreground">Carregando BC Labs…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl lg:flex">
        <div className="pt-5">
          <Brand />
        </div>
        <NavList />
        <UserBlock />
      </aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Brand />
        <Button variant="ghost" size="icon" aria-label="Abrir menu" onClick={() => setOpen(true)}>
          <Menu className="size-5" />
        </Button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="animate-rise absolute inset-y-0 left-0 flex w-72 flex-col border-r border-sidebar-border bg-sidebar">
            <div className="flex items-center justify-between pt-5 pr-3">
              <Brand />
              <Button variant="ghost" size="icon" aria-label="Fechar" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <UserBlock />
          </div>
        </div>
      )}

      <main className="grid-backdrop min-h-screen lg:pl-64">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
