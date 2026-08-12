// Domain types for BC Labs. These mirror the future Supabase schema
// (users, clients, sales, expenses, products, categories, ai_usage, settings).

export type SaleStatus = "paid" | "pending" | "canceled";
export type ClientStatus = "active" | "inactive";

export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Client extends BaseRecord {
  name: string;
  email: string;
  phone: string;
  status: ClientStatus;
  notes?: string | undefined;
}

export interface Sale extends BaseRecord {
  client_id: string;
  product: string;
  date: string; // ISO date
  gross: number;
  fees: number;
  costs: number;
  payment_method: string;
  status: SaleStatus;
  notes?: string | undefined;
}

export type ExpenseCategory =
  | "Ferramentas"
  | "IA"
  | "Site/Hospedagem"
  | "Marketing"
  | "Publicidade"
  | "Operacional"
  | "Equipamentos"
  | "Serviços"
  | "Outros";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Ferramentas",
  "IA",
  "Site/Hospedagem",
  "Marketing",
  "Publicidade",
  "Operacional",
  "Equipamentos",
  "Serviços",
  "Outros",
];

export interface Expense extends BaseRecord {
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  recurring: boolean;
  ai_vendor?: AiVendor | null | undefined;
  notes?: string | undefined;
}

export type AiVendor = "OpenAI" | "Claude" | "Lovable" | "Gemini" | "APIs" | "Outras IAs";

export const AI_VENDORS: AiVendor[] = ["OpenAI", "Claude", "Lovable", "Gemini", "APIs", "Outras IAs"];

export const PAYMENT_METHODS = [
  "Pix",
  "Cartão de crédito",
  "Boleto",
  "Transferência",
  "Stripe",
] as const;

export type PeriodKey = "today" | "7d" | "month" | "lastMonth" | "year" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}
