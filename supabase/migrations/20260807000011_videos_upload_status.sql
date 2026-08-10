-- =============================================================================
-- 11_videos_upload_status.sql
-- Adiciona o status 'uploading' ao enum de processamento de vídeo e
-- políticas de storage para atualizar e remover arquivos de vídeo.
-- =============================================================================

alter type public.video_processing_status
  add value if not exists 'uploading';

create policy "videos_update_owner"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "videos_delete_owner"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
