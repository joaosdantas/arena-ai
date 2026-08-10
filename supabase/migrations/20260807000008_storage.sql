-- =============================================================================
-- 08_storage.sql
-- Buckets de armazenamento e políticas de acesso.
-- -----------------------------------------------------------------------------
-- buckets:
--   videos     -> privado  (somente o proprietário acessa seus arquivos)
--   thumbnails -> público  (miniaturas são de leitura pública)
--   avatars    -> privado  (cada usuário gerencia o próprio avatar)
--
-- Convenção de caminho:
--   videos/   : videos/{owner_id}/{match_id}/{arquivo}
--   thumbnails: thumbnails/{owner_id}/{match_id}/{arquivo}
--   avatars   : avatars/{user_id}/{arquivo}
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('videos', 'videos', false),
  ('thumbnails', 'thumbnails', true),
  ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- avatars: usuário gerencia o próprio avatar.
-- -----------------------------------------------------------------------------
create policy "avatars_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- videos: autenticado pode enviar; apenas o proprietário acessa.
-- -----------------------------------------------------------------------------
create policy "videos_insert_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "videos_select_owner"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- thumbnails: leitura pública; upload por autenticados.
-- -----------------------------------------------------------------------------
create policy "thumbnails_select_public"
  on storage.objects
  for select
  using (bucket_id = 'thumbnails');

create policy "thumbnails_insert_authenticated"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
