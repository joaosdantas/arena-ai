-- =============================================================================
-- 05_videos.sql
-- Registros de vídeo vinculados a uma partida.
-- -----------------------------------------------------------------------------
-- processing_status: pending, processing, ready, failed
-- =============================================================================

create type public.video_processing_status as enum (
  'pending',
  'processing',
  'ready',
  'failed'
);

create table if not exists public.videos (
  id                 uuid primary key default gen_random_uuid(),
  match_id           uuid not null references public.matches (id) on delete cascade,
  original_url       text not null,
  thumbnail_url      text,
  duration           integer,
  processing_status  public.video_processing_status not null default 'pending',
  created_at         timestamptz not null default now()
);

alter table public.videos enable row level security;

-- -----------------------------------------------------------------------------
-- RLS: acesso herdado da partida (dono ou partida pública).
-- -----------------------------------------------------------------------------
create policy "videos_select_owner_or_public"
  on public.videos
  for select
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and (m.owner_id = auth.uid() or m.is_public = true)
    )
  );

create policy "videos_insert_owner"
  on public.videos
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

create policy "videos_update_owner"
  on public.videos
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

create policy "videos_delete_owner"
  on public.videos
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
