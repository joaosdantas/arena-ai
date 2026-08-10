-- =============================================================================
-- 09_auth_users_policies.sql
-- Complementos de RLS para o fluxo de autenticação e perfil.
-- -----------------------------------------------------------------------------
-- 1. Permite ao usuário criar o próprio perfil (fallback do createUserProfile
--    caso o trigger on_auth_user_created ainda não tenha executado).
-- 2. Torna o bucket de avatares público para exibição via <img>.
-- =============================================================================

create policy "users_insert_own"
  on public.users
  for insert
  with check (auth.uid() = id);

update storage.buckets
set public = true
where id = 'avatars';
