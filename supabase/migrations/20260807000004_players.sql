-- =============================================================================
-- 04_players.sql
-- Jogadores participantes de uma partida. Pertencem à partida (cascade).
-- =============================================================================

create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches (id) on delete cascade,
  name        text not null,
  team        text,
  created_at  timestamptz not null default now(),

  constraint players_name_not_empty check (char_length(btrim(name)) > 0)
);

alter table public.players enable row level security;

-- -----------------------------------------------------------------------------
-- RLS: acesso herdado da partida (dono ou partida pública).
-- -----------------------------------------------------------------------------
create policy "players_select_owner_or_public"
  on public.players
  for select
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and (m.owner_id = auth.uid() or m.is_public = true)
    )
  );

create policy "players_insert_owner"
  on public.players
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and m.owner_id = auth.uid()
    )
  );

create policy "players_update_owner"
  on public.players
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and m.owner_id = auth.uid()
    )
  );

create policy "players_delete_owner"
  on public.players
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and m.owner_id = auth.uid()
    )
  );
