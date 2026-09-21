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

export type ExpenseCategory = "Taxa de Cartão" | "Site/Hospedagem" | "IA" | "Outros";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Taxa de Cartão",
  "Site/Hospedagem",
  "IA",
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

export const AI_VENDORS: AiVendor[] = [
  "OpenAI",
  "Claude",
  "Lovable",
  "Gemini",
  "APIs",
  "Outras IAs",
];

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

// ---------- CRM de prospecção (leads) ----------

export type LeadStatus =
  | "novo"
  | "qualificado"
  | "mensagem_pronta"
  | "mensagem_enviada"
  | "respondeu"
  | "negociacao"
  | "proposta_enviada"
  | "cliente"
  | "perdido";

export const LEAD_STATUSES: LeadStatus[] = [
  "novo",
  "qualificado",
  "mensagem_pronta",
  "mensagem_enviada",
  "respondeu",
  "negociacao",
  "proposta_enviada",
  "cliente",
  "perdido",
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: "Novo",
  qualificado: "Qualificado",
  mensagem_pronta: "Mensagem pronta",
  mensagem_enviada: "Mensagem enviada",
  respondeu: "Respondeu",
  negociacao: "Negociação",
  proposta_enviada: "Proposta enviada",
  cliente: "Cliente",
  perdido: "Perdido",
};

export type LeadPriority = "baixa" | "media" | "alta";

export const LEAD_PRIORITIES: LeadPriority[] = ["baixa", "media", "alta"];

export const LEAD_PRIORITY_LABELS: Record<LeadPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export interface Lead extends BaseRecord {
  company_name: string;
  phone?: string | undefined;
  website?: string | undefined;
  address?: string | undefined;
  google_maps_url?: string | undefined;
  google_rating?: number | null | undefined;
  google_reviews_count?: number | null | undefined;
  source?: string | undefined;
  score: number;
  priority: LeadPriority;
  opportunity_reason?: string | undefined;
  status: LeadStatus;
  whatsapp_message?: string | undefined;
  converted_client_id?: string | null | undefined;
  notes?: string | undefined;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: string;
  description: string;
  created_at: string;
}
