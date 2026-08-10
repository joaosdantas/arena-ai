-- =============================================================================
-- 01_users.sql
-- Tabela de perfil do usuário, vinculada ao auth.users do Supabase Auth.
-- =============================================================================

create extension if not exists pgcrypto;

create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

-- -----------------------------------------------------------------------------
-- RLS: o usuário só pode ler e editar o próprio perfil.
-- -----------------------------------------------------------------------------
create policy "users_select_own"
  on public.users
  for select
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users
  for update
  using (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- Cria automaticamente o perfil quando um novo usuário se cadastra.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email, ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
