-- =============================================================================
-- 06_clips.sql
-- Recortes de momentos de uma partida (start_time/end_time em segundos).
-- =============================================================================

create table if not exists public.clips (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid not null references public.matches (id) on delete cascade,
  title        text not null,
  start_time   integer not null,
  end_time     integer not null,
  video_url    text,
  created_at   timestamptz not null default now(),

  constraint clips_title_not_empty check (char_length(btrim(title)) > 0),
  constraint clips_time_range_check check (start_time >= 0 and end_time > start_time)
);

alter table public.clips enable row level security;

-- -----------------------------------------------------------------------------
-- RLS: acesso herdado da partida (dono ou partida pública).
-- -----------------------------------------------------------------------------
create policy "clips_select_owner_or_public"
  on public.clips
  for select
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and (m.owner_id = auth.uid() or m.is_public = true)
    )
  );

create policy "clips_insert_owner"
  on public.clips
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

create policy "clips_update_owner"
  on public.clips
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

create policy "clips_delete_owner"
  on public.clips
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
