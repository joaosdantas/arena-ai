-- =============================================================================
-- 12_video_processing.sql
-- Campos gerados pelo video worker: preview e metadados do vídeo, índice da
-- fila de processamento e leitura pública dos previews.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- videos: colunas produzidas durante o processamento.
-- -----------------------------------------------------------------------------
alter table public.videos
  add column if not exists preview_url    text,
  add column if not exists width          integer,
  add column if not exists height         integer,
  add column if not exists fps            numeric,
  add column if not exists codec          text;

-- Índice para o polling do worker (fila 'pending').
create index if not exists videos_processing_status_idx
  on public.videos (processing_status)
  where processing_status in ('pending', 'processing');

-- -----------------------------------------------------------------------------
-- Storage: previews de vídeo são de leitura pública (apresentação compartilhada).
-- Convenção de caminho: videos/previews/{owner_id}/{match_id}/preview.mp4
-- -----------------------------------------------------------------------------
create policy "videos_previews_select_public"
  on storage.objects
  for select
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = 'previews'
  );

create policy "videos_previews_insert_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = 'previews'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
