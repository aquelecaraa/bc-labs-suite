-- Rode no SQL Editor somente se a tabela importada não tiver a coluna notes.
alter table public.leads add column if not exists notes text;