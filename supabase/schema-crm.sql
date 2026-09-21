-- BC Labs — CRM de prospecção (módulo adicional)
-- Rode isto no SQL Editor do Supabase DEPOIS do schema.sql original.
-- Não altera nenhuma tabela existente (clients, sales, expenses).

create extension if not exists "pgcrypto";

-- ---------- leads ----------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  phone text,
  website text,
  address text,
  google_maps_url text,
  google_rating numeric(2, 1),
  google_reviews_count int,
  source text,
  score int not null default 0 check (score >= 0 and score <= 100),
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta')),
  opportunity_reason text,
  status text not null default 'novo' check (
    status in (
      'novo', 'qualificado', 'mensagem_pronta', 'mensagem_enviada',
      'respondeu', 'negociacao', 'proposta_enviada', 'cliente', 'perdido'
    )
  ),
  whatsapp_message text,
  converted_client_id uuid references public.clients (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- lead_activities (histórico) ----------
create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  type text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_priority_idx on public.leads (priority);
create index if not exists leads_created_at_idx on public.leads (created_at);
create index if not exists lead_activities_lead_id_idx on public.lead_activities (lead_id);

-- updated_at automático (reaproveita a função já criada em schema.sql)
drop trigger if exists set_updated_at on public.leads;
create trigger set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- RLS: mesmo modelo do restante do sistema (qualquer autenticado = um dos sócios)
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;

create policy "authenticated_full_access_leads" on public.leads
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access_lead_activities" on public.lead_activities
  for all to authenticated using (true) with check (true);
