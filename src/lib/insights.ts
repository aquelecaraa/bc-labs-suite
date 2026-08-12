import {
  averageTicket,
  filterByRange,
  growth,
  netProfit,
  revenue,
  totalExpenses,
} from "@/lib/finance";
import { formatBRL, formatPercent } from "@/lib/format";
import type { Client, DateRange, Expense, Sale } from "@/types";

export interface Insight {
  id: string;
  text: string;
  tone: "positive" | "negative" | "neutral";
}

/**
 * Insights derivados dos dados atuais (hoje: dados de demonstração).
 * A estrutura é a mesma que a BC AI usará quando conectada a um modelo real.
 */
export function buildInsights(
  sales: Sale[],
  expenses: Expense[],
  clients: Client[],
  range: DateRange,
  previous: DateRange,
): Insight[] {
  const cur = filterByRange(sales, range);
  const prev = filterByRange(sales, previous);
  const curExp = filterByRange(expenses, range);
  const prevExp = filterByRange(expenses, previous);

  const out: Insight[] = [];

  const revGrowth = growth(revenue(cur), revenue(prev));
  const expGrowth = growth(totalExpenses(curExp), totalExpenses(prevExp));
  out.push({
    id: "rev-vs-exp",
    tone: revGrowth >= 0 ? "positive" : "negative",
    text: `O faturamento do período está ${formatPercent(Math.abs(revGrowth))} ${
      revGrowth >= 0 ? "acima" : "abaixo"
    } do período anterior, enquanto as despesas ${
      expGrowth >= 0 ? "cresceram" : "caíram"
    } ${formatPercent(Math.abs(expGrowth))}.`,
  });

  const byClient = new Map<string, number>();
  for (const s of cur.filter((s) => s.status === "paid"))
    byClient.set(s.client_id, (byClient.get(s.client_id) ?? 0) + s.gross);
  const top = [...byClient.entries()].sort((a, b) => b[1] - a[1])[0];
  const totalRev = revenue(cur);
  if (top && totalRev) {
    const name = clients.find((c) => c.id === top[0])?.name ?? "Cliente";
    out.push({
      id: "top-client",
      tone: top[1] / totalRev > 0.35 ? "negative" : "neutral",
      text: `${name} representa ${formatPercent((top[1] / totalRev) * 100)} da receita do período (${formatBRL(top[1])}).`,
    });
  }

  const ai = curExp.filter((e) => e.category === "IA");
  const aiPrev = prevExp.filter((e) => e.category === "IA");
  if (ai.length) {
    const g = growth(totalExpenses(ai), totalExpenses(aiPrev));
    out.push({
      id: "ai-spend",
      tone: g > 20 ? "negative" : "neutral",
      text: `Gasto com inteligência artificial: ${formatBRL(totalExpenses(ai))} (${
        g >= 0 ? "+" : "-"
      }${formatPercent(Math.abs(g))} vs. período anterior).`,
    });
  }

  const margin = totalRev ? (netProfit(cur, curExp) / totalRev) * 100 : 0;
  out.push({
    id: "margin",
    tone: margin >= 35 ? "positive" : margin >= 15 ? "neutral" : "negative",
    text: `Margem de lucro em ${formatPercent(margin)} com ticket médio de ${formatBRL(averageTicket(cur))}.`,
  });

  return out;
}
