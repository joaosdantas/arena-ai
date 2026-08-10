-- =============================================================================
-- 16_sessions.sql
-- Sessões de gravação acontecendo em uma quadra.
-- Nova entidade do domínio: Court 1:N Sessions.
--
-- Rollback:
--   drop policy if exists "sessions_delete_authenticated" on public.sessions;
--   drop policy if exists "sessions_update_authenticated" on public.sessions;
--   drop policy if exists "sessions_insert_authenticated" on public.sessions;
--   drop policy if exists "sessions_select_public" on public.sessions;
--   drop trigger if exists sessions_set_updated_at on public.sessions;
--   drop index if exists sessions_court_id_idx;
--   drop table if exists public.sessions;
-- =============================================================================

create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  court_id    uuid not null references public.courts (id) on delete cascade,
  started_at  timestamptz,
  ended_at    timestamptz,
  status      text not null default 'scheduled',
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint sessions_status_check
    check (status in ('scheduled', 'active', 'finished', 'processing')),
  constraint sessions_time_range_check
    check (ended_at is null or started_at is null or ended_at > started_at)
);

alter table public.sessions enable row level security;

-- -----------------------------------------------------------------------------
-- RLS: espelha o padrão de `arenas` (leitura pública, escrita por autenticado).
-- -----------------------------------------------------------------------------
create policy "sessions_select_public"
  on public.sessions
  for select
  using (true);

create policy "sessions_insert_authenticated"
  on public.sessions
  for insert
  to authenticated
  with check (true);

create policy "sessions_update_authenticated"
  on public.sessions
  for update
  to authenticated
  using (true)
  with check (true);

create policy "sessions_delete_authenticated"
  on public.sessions
  for delete
  to authenticated
  using (true);

create index if not exists sessions_court_id_idx
  on public.sessions (court_id);

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute procedure public.set_updated_at();
