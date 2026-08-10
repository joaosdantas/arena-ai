-- =============================================================================
-- 03_matches.sql
-- Partidas esportivas. O proprietário (owner_id) controla o registro.
-- -----------------------------------------------------------------------------
-- Status: created, recording, uploading, processing, ready, failed
-- =============================================================================

create type public.match_status as enum (
  'created',
  'recording',
  'uploading',
  'processing',
  'ready',
  'failed'
);

create table if not exists public.matches (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.users (id) on delete cascade,
  arena_id       uuid references public.arenas (id) on delete set null,
  title          text not null,
  sport          text not null,
  status         public.match_status not null default 'created',
  is_public      boolean not null default false,
  started_at     timestamptz,
  finished_at    timestamptz,
  video_url      text,
  thumbnail_url  text,
  preview_url    text,
  created_at     timestamptz not null default now(),

  constraint matches_title_not_empty check (char_length(btrim(title)) > 0)
);

alter table public.matches enable row level security;

-- -----------------------------------------------------------------------------
-- RLS:
--  - Proprietário: ler, criar, editar e deletar as próprias partidas.
--  - Público (anon): ler partidas marcadas como is_public = true.
-- -----------------------------------------------------------------------------
create policy "matches_select_owner"
  on public.matches
  for select
  using (auth.uid() = owner_id);

create policy "matches_select_public"
  on public.matches
  for select
  using (is_public = true);

create policy "matches_insert_owner"
  on public.matches
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "matches_update_owner"
  on public.matches
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "matches_delete_owner"
  on public.matches
  for delete
  to authenticated
  using (auth.uid() = owner_id);
