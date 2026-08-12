import type { DateRange, Expense, PeriodKey, Sale } from "@/types";

/** Regras de cálculo financeiro da BC Labs. */

export const isPaid = (s: Sale) => s.status === "paid";

/** Faturamento = soma do valor bruto das vendas pagas. */
export const revenue = (sales: Sale[]) =>
  sales.filter(isPaid).reduce((acc, s) => acc + s.gross, 0);

/** Receita líquida = faturamento - taxas. */
export const netRevenue = (sales: Sale[]) =>
  sales.filter(isPaid).reduce((acc, s) => acc + s.gross - s.fees, 0);

export const totalFees = (sales: Sale[]) =>
  sales.filter(isPaid).reduce((acc, s) => acc + s.fees, 0);

export const totalCosts = (sales: Sale[]) =>
  sales.filter(isPaid).reduce((acc, s) => acc + s.costs, 0);

export const totalExpenses = (expenses: Expense[]) =>
  expenses.reduce((acc, e) => acc + e.amount, 0);

/** Lucro líquido = faturamento - taxas - custos - despesas. */
export const netProfit = (sales: Sale[], expenses: Expense[]) =>
  netRevenue(sales) - totalCosts(sales) - totalExpenses(expenses);

/** Ticket médio = faturamento / quantidade de vendas pagas. */
export const averageTicket = (sales: Sale[]) => {
  const paid = sales.filter(isPaid);
  return paid.length ? revenue(sales) / paid.length : 0;
};

/** Margem de lucro (%) = lucro líquido / faturamento × 100. */
export const profitMargin = (sales: Sale[], expenses: Expense[]) => {
  const r = revenue(sales);
  return r ? (netProfit(sales, expenses) / r) * 100 : 0;
};

/** Crescimento (%) = (atual - anterior) / anterior × 100. */
export const growth = (current: number, previous: number) => {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/** Lucro de uma venda individual. */
export const saleProfit = (s: Sale) => s.gross - s.fees - s.costs;
export const saleNet = (s: Sale) => s.gross - s.fees;
export const saleMargin = (s: Sale) => (s.gross ? (saleProfit(s) / s.gross) * 100 : 0);

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

export function resolvePeriod(key: PeriodKey, custom?: DateRange, now = new Date()): DateRange {
  switch (key) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "7d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case "month":
      return {
        from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    case "lastMonth":
      return {
        from: startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "year":
      return {
        from: startOfDay(new Date(now.getFullYear(), 0, 1)),
        to: endOfDay(new Date(now.getFullYear(), 11, 31)),
      };
    case "custom":
      return custom ?? resolvePeriod("month", undefined, now);
  }
}

/** Período imediatamente anterior, com a mesma duração. */
export function previousRange(range: DateRange): DateRange {
  const ms = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - ms - 1),
    to: new Date(range.from.getTime() - 1),
  };
}

export function inRange(dateStr: string, range: DateRange): boolean {
  const t = new Date(dateStr).getTime();
  return t >= range.from.getTime() && t <= range.to.getTime();
}

export const filterByRange = <T extends { date: string }>(items: T[], range: DateRange) =>
  items.filter((i) => inRange(i.date, range));

/** Agrupa por dia ou por mês conforme a duração do período. */
export function buildSeries(sales: Sale[], expenses: Expense[], range: DateRange) {
  const days = Math.ceil((range.to.getTime() - range.from.getTime()) / 86400000);
  const byMonth = days > 62;
  const buckets = new Map<string, { label: string; faturamento: number; lucro: number; despesas: number }>();

  const keyOf = (d: Date) =>
    byMonth
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const labelOf = (d: Date) =>
    byMonth
      ? d.toLocaleDateString("pt-BR", { month: "short" })
      : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  const cursor = new Date(range.from);
  while (cursor <= range.to) {
    buckets.set(keyOf(cursor), { label: labelOf(cursor), faturamento: 0, lucro: 0, despesas: 0 });
    if (byMonth) cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }

  for (const s of sales.filter(isPaid)) {
    const b = buckets.get(keyOf(new Date(s.date)));
    if (!b) continue;
    b.faturamento += s.gross;
    b.lucro += saleProfit(s);
  }
  for (const e of expenses) {
    const b = buckets.get(keyOf(new Date(e.date)));
    if (!b) continue;
    b.despesas += e.amount;
    b.lucro -= e.amount;
  }

  return Array.from(buckets.values());
}

export function expensesByCategory(expenses: Expense[]) {
  const map = new Map<string, number>();
  for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  const total = totalExpenses(expenses);
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value, percent: total ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}
