-- =============================================================================
-- 14_courts.sql
-- Quadras de uma arena. Nova entidade do domínio: Arena 1:N Courts.
--
-- Rollback:
--   drop policy if exists "courts_delete_authenticated" on public.courts;
--   drop policy if exists "courts_update_authenticated" on public.courts;
--   drop policy if exists "courts_insert_authenticated" on public.courts;
--   drop policy if exists "courts_select_public" on public.courts;
--   drop trigger if exists courts_set_updated_at on public.courts;
--   drop index if exists courts_arena_id_idx;
--   drop table if exists public.courts;
-- =============================================================================

create table if not exists public.courts (
  id          uuid primary key default gen_random_uuid(),
  arena_id    uuid not null references public.arenas (id) on delete cascade,
  name        text not null,
  sport       text,
  status      text not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint courts_name_not_empty check (char_length(btrim(name)) > 0),
  constraint courts_status_check check (status in ('active', 'inactive'))
);

alter table public.courts enable row level security;

-- -----------------------------------------------------------------------------
-- RLS: espelha o padrão de `arenas` (leitura pública, escrita por autenticado).
-- Políticas por proprietário (via arena.owner_id) virão em etapa futura.
-- -----------------------------------------------------------------------------
create policy "courts_select_public"
  on public.courts
  for select
  using (true);

create policy "courts_insert_authenticated"
  on public.courts
  for insert
  to authenticated
  with check (true);

create policy "courts_update_authenticated"
  on public.courts
  for update
  to authenticated
  using (true)
  with check (true);

create policy "courts_delete_authenticated"
  on public.courts
  for delete
  to authenticated
  using (true);

create index if not exists courts_arena_id_idx
  on public.courts (arena_id);

create trigger courts_set_updated_at
  before update on public.courts
  for each row execute procedure public.set_updated_at();
