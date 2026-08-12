import { createFileRoute } from "@tanstack/react-router";
import { Building2, Database, Plug, SlidersHorizontal, Tags, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/store/auth-store";
import { EXPENSE_CATEGORIES } from "@/types";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — BC Labs" },
      {
        name: "description",
        content: "Perfil, empresa, preferências, categorias e integrações da BC Labs.",
      },
      { property: "og:title", content: "Configurações — BC Labs" },
      { property: "og:description", content: "Configurações da plataforma BC Labs." },
    ],
  }),
  component: SettingsPage,
});

const INTEGRATIONS = [
  { name: "Supabase", desc: "Banco de dados, autenticação e RLS", connected: true },
  { name: "Anthropic", desc: "Modelos Claude para o BC AI", connected: false },
  { name: "Stripe", desc: "Pagamentos e conciliação de taxas", connected: false },
  { name: "Outras", desc: "APIs internas e webhooks", connected: false },
];

function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name ?? "", email: user?.email ?? "" });
  const [company, setCompany] = useState({ name: "BC Labs", doc: "", site: "bclabs.com.br" });

  return (
    <AppShell>
      <PageHeader
        title="Configurações"
        description="Perfil, empresa, preferências, categorias e integrações."
      />

      <Tabs defaultValue="perfil">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="perfil">
            <User className="size-4" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="empresa">
            <Building2 className="size-4" /> Empresa
          </TabsTrigger>
          <TabsTrigger value="prefs">
            <SlidersHorizontal className="size-4" /> Preferências
          </TabsTrigger>
          <TabsTrigger value="categorias">
            <Tags className="size-4" /> Categorias
          </TabsTrigger>
          <TabsTrigger value="integracoes">
            <Plug className="size-4" /> Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="mt-4">
          <SectionCard title="Perfil">
            <div className="grid max-w-lg gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pname">Nome</Label>
                <Input
                  id="pname"
                  value={profile.name}
                  maxLength={80}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pemail">E-mail</Label>
                <Input
                  id="pemail"
                  type="email"
                  value={profile.email}
                  maxLength={255}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div>
                <Button
                  onClick={() => {
                    updateProfile({ name: profile.name.trim(), email: profile.email.trim() });
                    toast.success("Perfil atualizado");
                  }}
                >
                  Salvar perfil
                </Button>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="empresa" className="mt-4">
          <SectionCard title="Empresa">
            <div className="grid max-w-lg gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cname">Razão social</Label>
                <Input
                  id="cname"
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cdoc">CNPJ</Label>
                <Input
                  id="cdoc"
                  value={company.doc}
                  placeholder="00.000.000/0000-00"
                  onChange={(e) => setCompany({ ...company, doc: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="csite">Site</Label>
                <Input
                  id="csite"
                  value={company.site}
                  onChange={(e) => setCompany({ ...company, site: e.target.value })}
                />
              </div>
              <div>
                <Button onClick={() => toast.success("Dados da empresa salvos")}>
                  Salvar empresa
                </Button>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="prefs" className="mt-4">
          <SectionCard title="Preferências">
            <div className="max-w-xl space-y-3">
              <Pref label="Moeda e locale" desc="Real brasileiro (R$) com formatação pt-BR" fixed />
              <Pref label="Tema escuro" desc="Interface otimizada para uso prolongado" fixed />
              <Pref label="Resumo semanal" desc="Receber um resumo por e-mail (requer backend)" />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="categorias" className="mt-4">
          <SectionCard title="Categorias de despesa" description="Usadas nos gráficos e relatórios">
            <div className="flex flex-wrap gap-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs"
                >
                  {c}
                </span>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="integracoes" className="mt-4">
          <SectionCard
            title="Integrações"
            description="Chaves de API são usadas apenas no servidor, nunca no frontend"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {INTEGRATIONS.map((i) => (
                <div
                  key={i.name}
                  className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:border-primary/40"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Database className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{i.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{i.desc}</p>
                    <span
                      className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${
                        i.connected
                          ? "border-primary/30 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${i.connected ? "bg-primary" : "bg-muted-foreground"}`}
                      />
                      {i.connected ? "Conectado" : "Não conectado"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Pref({ label, desc, fixed }: { label: string; desc: string; fixed?: boolean }) {
  const [on, setOn] = useState(!!fixed);
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={on} onCheckedChange={setOn} disabled={fixed} aria-label={label} />
    </div>
  );
}
