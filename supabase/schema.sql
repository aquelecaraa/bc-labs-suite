-- BC Labs — schema do Supabase
-- Rode isto no SQL Editor do seu projeto Supabase (Project → SQL Editor → New query).
--
-- Modelo de acesso: qualquer usuário autenticado (os 3 sócios convidados manualmente,
-- com cadastro público desligado) enxerga e edita os mesmos dados — é um dashboard
-- de EMPRESA compartilhado, não dados isolados por usuário.

create extension if not exists "pgcrypto";

-- ---------- clients ----------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- sales ----------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  product text not null,
  date date not null,
  gross numeric(12, 2) not null default 0,
  fees numeric(12, 2) not null default 0,
  costs numeric(12, 2) not null default 0,
  payment_method text not null,
  status text not null default 'pending' check (status in ('paid', 'pending', 'canceled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- expenses ----------
-- categorias reais da empresa: Taxa de Cartão, Site/Hospedagem, IA, Outros
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  category text not null check (category in ('Taxa de Cartão', 'Site/Hospedagem', 'IA', 'Outros')),
  amount numeric(12, 2) not null default 0,
  date date not null,
  recurring boolean not null default false,
  ai_vendor text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_client_id_idx on public.sales (client_id);
create index if not exists sales_date_idx on public.sales (date);
create index if not exists expenses_date_idx on public.expenses (date);
create index if not exists expenses_category_idx on public.expenses (category);

-- ---------- updated_at automático ----------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.clients;
create trigger set_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.sales;
create trigger set_updated_at before update on public.sales
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.expenses;
create trigger set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------
-- Só usuários autenticados (os 3 sócios convidados) podem ler/escrever.
-- Não há cadastro público habilitado no projeto (ver instruções de Auth),
-- então "autenticado" já equivale a "um dos 3 sócios".

alter table public.clients enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;

create policy "authenticated_full_access_clients" on public.clients
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_full_access_sales" on public.sales
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_full_access_expenses" on public.expenses
  for all
  to authenticated
  using (true)
  with check (true);
