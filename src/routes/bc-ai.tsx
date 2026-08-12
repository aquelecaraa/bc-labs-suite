import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Bot, Send, Sparkles, User } from "lucide-react";
import OpenAI from "openai";
import { useState } from "react";

import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { averageTicket, filterByRange, netProfit, resolvePeriod, revenue, totalExpenses } from "@/lib/finance";
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
  "Qual foi nosso lucro líquido?",
  "Qual cliente mais gerou receita?",
  "Quanto gastamos com despesas?",
  "Qual é o nosso ticket médio?",
  "Qual é a nossa margem de lucro?",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function BcAiPage() {
  const { sales, expenses, clients } = useData();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const apiKey = import.meta.env['VITE_GROQ_API_KEY'];

  const month = resolvePeriod("month");
  const curSales = filterByRange(sales, month);
  const curExp = filterByRange(expenses, month);

  const totalFat = revenue(curSales);
  const totalLucro = netProfit(curSales, curExp);
  const totalDesp = totalExpenses(curExp);
  const ticket = averageTicket(curSales);
  const margem = totalFat ? (totalLucro / totalFat) * 100 : 0;

  const context = [
    { label: "Faturamento do mês", value: formatBRL(totalFat) },
    { label: "Lucro líquido", value: formatBRL(totalLucro) },
    { label: "Despesas", value: formatBRL(totalDesp) },
    { label: "Ticket médio", value: formatBRL(ticket) },
    { label: "Margem", value: formatPercent(margem) },
  ];

  const handleSend = async (textToSend?: string) => {
    const question = (textToSend || input).trim();
    if (!question || loading) return;

    if (!apiKey) {
      setErrorMsg("Chave VITE_GROQ_API_KEY não encontrada nas variáveis de ambiente.");
      return;
    }

    setErrorMsg(null);
    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const client = new OpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1",
        dangerouslyAllowBrowser: true,
      });

      const systemPrompt = `
Você é o BC AI, copiloto inteligente de inteligência artificial da BC Labs.
Responda de forma clara, direta e objetiva no formato Markdown em Português do Brasil.

DADOS ATUAIS DA BC LABS:
- Faturamento do mês: ${formatBRL(totalFat)}
- Lucro Líquido: ${formatBRL(totalLucro)}
- Despesas do mês: ${formatBRL(totalDesp)}
- Ticket Médio: ${formatBRL(ticket)}
- Margem de Lucro: ${formatPercent(margem)}
- Total de Clientes: ${clients.length}

VENDAS RECENTES:
${JSON.stringify(sales.slice(0, 10).map((s) => ({ produto: s.product, valor: s.gross, data: s.date })), null, 2)}

CLIENTES:
${JSON.stringify(clients.map((c) => ({ nome: c.name, email: c.email })), null, 2)}
      `;

      const response = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user", content: question },
        ],
        temperature: 0.2,
      });

      const replyText = response.choices[0]?.message?.content || "Sem resposta.";
      setMessages((prev) => [...prev, { role: "assistant", content: replyText }]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Erro ao consultar o Groq AI: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="BC AI" description="Seu copiloto de negócios." />

      <SectionCard bodyClassName="p-0">
        <div className="border-b border-border p-6 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary glow-ring">
            <Sparkles className="size-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">BC AI Copilot</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pergunte qualquer coisa sobre os dados financeiros e operacionais da sua empresa.
          </p>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {messages.length > 0 && (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 rounded-xl p-3 text-sm ${
                    m.role === "user"
                      ? "bg-primary/10 ml-auto max-w-[80%]"
                      : "bg-muted/50 border border-border max-w-[90%]"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <Bot className="size-4 text-primary shrink-0 mt-0.5" />
                  ) : (
                    <User className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <div className="whitespace-pre-line leading-relaxed">{m.content}</div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                  <Sparkles className="size-3 animate-spin text-primary" />
                  <span>Analisando dados da BC Labs...</span>
                </div>
              )}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">Perguntas de exemplo</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((q) => (
                <button
                  key={q}
                  disabled={loading}
                  onClick={() => handleSend(q)}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <Input
              value={input}
              maxLength={300}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre faturamento, clientes, despesas…"
              disabled={loading}
            />
            <Button type="submit" disabled={!input.trim() || loading}>
              <Send className="size-4" /> Enviar
            </Button>
          </form>
        </div>
      </SectionCard>

      <SectionCard
        className="mt-4"
        title="Contexto disponível para a IA"
        description="Dados em tempo real enviados ao modelo em cada pergunta"
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