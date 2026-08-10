-- =============================================================================
-- 02_arenas.sql
-- Arenas são locais onde as partidas acontecem. São de leitura pública.
-- =============================================================================

create table if not exists public.arenas (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text,
  address     text,
  cover_url   text,
  created_at  timestamptz not null default now()
);

alter table public.arenas enable row level security;

-- -----------------------------------------------------------------------------
-- RLS: leitura pública; criação por usuário autenticado.
-- -----------------------------------------------------------------------------
create policy "arenas_select_public"
  on public.arenas
  for select
  using (true);

create policy "arenas_insert_authenticated"
  on public.arenas
  for insert
  to authenticated
  with check (true);
