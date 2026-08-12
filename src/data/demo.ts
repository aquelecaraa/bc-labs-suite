// DEMO DATA — dados de demonstração da BC Labs.
// Estrutura idêntica à esperada no banco (Supabase). Substituir por queries reais.

import type { AiVendor, Client, Expense, ExpenseCategory, Sale, SaleStatus } from "@/types";

export const IS_DEMO_DATA = true;

const iso = (d: Date) => d.toISOString();

/** PRNG determinístico para os dados de demonstração serem estáveis. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const rand = rng(20260812);
const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!;
const between = (min: number, max: number) => Math.round((min + rand() * (max - min)) * 100) / 100;

const CLIENT_NAMES = [
  "Cliente Alpha",
  "Cliente Beta",
  "Cliente Gamma",
  "Cliente Delta",
  "Cliente Epsilon",
  "Cliente Zeta",
  "Cliente Ômega",
  "Cliente Sigma",
];

export const PRODUCTS = [
  "Automação de Processos",
  "Dashboard sob medida",
  "Consultoria de IA",
  "Integração de APIs",
  "Setup de CRM",
  "Manutenção mensal",
];

const now = new Date();

export const demoClients: Client[] = CLIENT_NAMES.map((name, i) => {
  const created = new Date(now.getFullYear(), 0, 3 + i * 11);
  return {
    id: `cli_${i + 1}`,
    name,
    email: `contato@${name.toLowerCase().replace(/[^a-z]/g, "")}.com.br`,
    phone: `(11) 9${String(3000 + i * 137).padStart(4, "0")}-${String(1000 + i * 271).padStart(4, "0")}`,
    status: i % 7 === 6 ? "inactive" : "active",
    created_at: iso(created),
    updated_at: iso(created),
  };
});

function buildSales(): Sale[] {
  const sales: Sale[] = [];
  const monthsBack = 11;
  let n = 0;

  for (let m = monthsBack; m >= 0; m--) {
    const base = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const count = 6 + Math.floor(rand() * 5) + (monthsBack - m > 6 ? 2 : 0);
    for (let i = 0; i < count; i++) {
      const day = 1 + Math.floor(rand() * 27);
      const date = new Date(base.getFullYear(), base.getMonth(), day);
      if (date > now) continue;
      const gross = between(850, 9800);
      const status: SaleStatus = rand() < 0.85 ? "paid" : rand() < 0.6 ? "pending" : "canceled";
      const created = iso(date);
      n += 1;
      sales.push({
        id: `sal_${n}`,
        client_id: demoClients[Math.floor(rand() * demoClients.length)]!.id,
        product: pick(PRODUCTS),
        date: date.toISOString().slice(0, 10),
        gross,
        fees: Math.round(gross * (0.029 + rand() * 0.04) * 100) / 100,
        costs: Math.round(gross * (0.05 + rand() * 0.22) * 100) / 100,
        payment_method: pick(["Pix", "Cartão de crédito", "Boleto", "Transferência", "Stripe"]),
        status,
        notes: "",
        created_at: created,
        updated_at: created,
      });
    }
  }
  return sales.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const demoSales: Sale[] = buildSales();

const EXPENSE_TEMPLATES: Array<{
  description: string;
  category: ExpenseCategory;
  min: number;
  max: number;
  recurring: boolean;
  ai_vendor?: AiVendor;
}> = [
  {
    description: "Assinatura OpenAI",
    category: "IA",
    min: 180,
    max: 620,
    recurring: true,
    ai_vendor: "OpenAI",
  },
  {
    description: "Assinatura Claude",
    category: "IA",
    min: 120,
    max: 380,
    recurring: true,
    ai_vendor: "Claude",
  },
  {
    description: "Créditos Lovable",
    category: "IA",
    min: 150,
    max: 700,
    recurring: true,
    ai_vendor: "Lovable",
  },
  {
    description: "Hospedagem e domínio",
    category: "Site/Hospedagem",
    min: 45,
    max: 210,
    recurring: true,
  },
  {
    description: "Taxas de processamento de cartão",
    category: "Taxa de Cartão",
    min: 80,
    max: 450,
    recurring: true,
  },
];

function buildExpenses(): Expense[] {
  const out: Expense[] = [];
  let n = 0;
  for (let m = 11; m >= 0; m--) {
    const base = new Date(now.getFullYear(), now.getMonth() - m, 1);
    for (const t of EXPENSE_TEMPLATES) {
      if (!t.recurring && rand() < 0.45) continue;
      const day = 1 + Math.floor(rand() * 26);
      const date = new Date(base.getFullYear(), base.getMonth(), day);
      if (date > now) continue;
      n += 1;
      out.push({
        id: `exp_${n}`,
        description: t.description,
        category: t.category,
        amount: between(t.min, t.max),
        date: date.toISOString().slice(0, 10),
        recurring: t.recurring,
        ai_vendor: t.ai_vendor ?? null,
        notes: "",
        created_at: iso(date),
        updated_at: iso(date),
      });
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const demoExpenses: Expense[] = buildExpenses();
