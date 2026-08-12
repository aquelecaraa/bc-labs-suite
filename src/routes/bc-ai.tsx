import { createFileRoute } from "@tanstack/react-router";
import { PlugZap, Send, Sparkles } from "lucide-react";
import { useState } from "react";

import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolvePeriod, filterByRange, revenue, netProfit, totalExpenses, averageTicket } from "@/lib/finance";
import { formatBRL, formatPercent } from "@/lib/format";
import { useData } from "@/store/data-store";

export const Route = createFileRoute("/bc-ai")({
  head: () => ({
    meta: [
      { title: "BC AI — Seu copiloto de negócios" },
      { name: "description", content: "Copiloto de negócios da BC Labs para consultar dados financeiros." },
      { property: "og:title", content: "BC AI — Seu copiloto de negócios" },
      { property: "og:description", content: "Pergunte qualquer coisa sobre os dados da BC Labs." },
    ],
  }),
  component: BcAiPage,
});

const EXAMPLES = [
  "Quanto faturamos este mês?",
  "Qual foi nossa venda mais lucrativa?",
  "Qual cliente mais gerou receita?",
  "Quanto gastamos com inteligência artificial?",
  "Quais foram nossas maiores despesas?",
  "Nosso lucro aumentou ou diminuiu?",
  "Qual foi nosso ticket médio?",
  "Compare este mês com o mês passado.",
  "Quanto precisamos vender para faturar R$ 20.000?",
];

/** Não há provedor de IA conectado ainda: o envio fica desabilitado até a configuração. */
const AI_PROVIDER_CONNECTED = false;

function BcAiPage() {
  const { sales, expenses } = useData();
  const [input, setInput] = useState("");

  const month = resolvePeriod("month");
  const cur = filterByRange(sales, month);
  const curExp = filterByRange(expenses, month);
  const context = [
    { label: "Faturamento do mês", value: formatBRL(revenue(cur)) },
    { label: "Lucro líquido", value: formatBRL(netProfit(cur, curExp)) },
    { label: "Despesas", value: formatBRL(totalExpenses(curExp)) },
    { label: "Ticket médio", value: formatBRL(averageTicket(cur)) },
    {
      label: "Margem",
      value: formatPercent(revenue(cur) ? (netProfit(cur, curExp) / revenue(cur)) * 100 : 0),
    },
  ];

  return (
    <AppShell>
      <PageHeader title="BC AI" description="Seu copiloto de negócios." />

      <SectionCard bodyClassName="p-0">
        <div className="border-b border-border p-6 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary glow-ring">
            <Sparkles className="size-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">BC AI</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pergunte qualquer coisa sobre os dados da sua empresa.
          </p>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
            <PlugZap className="mt-0.5 size-4 shrink-0 text-warning" />
            <div className="text-sm">
              <p className="font-medium">Nenhum provedor de IA conectado</p>
              <p className="mt-1 text-muted-foreground">
                A interface e a arquitetura estão prontas. Quando uma chave de IA for configurada no
                backend, o BC AI consultará os dados reais (vendas, clientes, despesas) antes de
                responder. Nenhuma resposta é simulada aqui.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">Perguntas de exemplo</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={input}
              maxLength={300}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre faturamento, clientes, despesas…"
              disabled={!AI_PROVIDER_CONNECTED}
            />
            <Button disabled={!AI_PROVIDER_CONNECTED || !input.trim()}>
              <Send className="size-4" /> Enviar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Envio desabilitado até a conexão com um provedor de IA em Configurações → Integrações.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        className="mt-4"
        title="Contexto disponível para a IA"
        description="Dados do mês atual que serão enviados como contexto quando a IA estiver conectada"
      >
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {context.map((c) => (
            <div key={c.label} className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-[11px] text-muted-foreground uppercase">{c.label}</p>
              <p className="mt-1 text-base font-semibold tabular-nums">{c.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
