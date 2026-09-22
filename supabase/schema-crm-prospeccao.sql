-- BC Labs — Prospecção automática (Google Maps via Apify)
-- Rode no SQL Editor do Supabase DEPOIS de schema-crm.sql.
-- Não recria a tabela leads: apenas adiciona os campos que faltam.

alter table public.leads add column if not exists place_id text;
alter table public.leads add column if not exists city text;
alter table public.leads add column if not exists state text;
alter table public.leads add column if not exists postal_code text;
alter table public.leads add column if not exists category text;
alter table public.leads add column if not exists instagram text;

-- Evita duplicidade por place_id (ignora leads manuais, que ficam com NULL)
create unique index if not exists leads_place_id_key
  on public.leads (place_id)
  where place_id is not null;

create index if not exists leads_city_idx on public.leads (city);
