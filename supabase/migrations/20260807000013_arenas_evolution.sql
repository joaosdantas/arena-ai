-- =============================================================================
-- 13_arenas_evolution.sql
-- Evolução incremental do domínio: arenas ganham dono, slug, estado e status.
-- -----------------------------------------------------------------------------
-- Apenas adições de colunas/índices. As colunas legadas (name, city, address,
-- cover_url) e as policies de RLS atuais são mantidas intactas para não
-- quebrar o fluxo existente de partidas.
--
-- Rollback:
--   drop trigger if exists arenas_set_updated_at on public.arenas;
--   drop function if exists public.set_updated_at();
--   drop index if exists arenas_owner_id_idx;
--   drop index if exists arenas_slug_unique_idx;
--   alter table public.arenas drop constraint if exists arenas_status_check;
--   alter table public.arenas
--     drop column if exists owner_id,
--     drop column if exists slug,
--     drop column if exists state,
--     drop column if exists status,
--     drop column if exists updated_at;
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Novas colunas (todas opcionais exceto status, que tem default).
-- owner_id: referência ao usuário responsável pela arena (nullable = arenas
-- legadas sem dono continuam válidas).
-- -----------------------------------------------------------------------------
alter table public.arenas
  add column if not exists owner_id uuid references public.users (id) on delete set null,
  add column if not exists slug text,
  add column if not exists state text,
  add column if not exists status text not null default 'active',
  add column if not exists updated_at timestamptz not null default now();

alter table public.arenas
  add constraint arenas_status_check check (status in ('active', 'inactive'));

-- slug é identificador público: único quando presente.
create unique index if not exists arenas_slug_unique_idx
  on public.arenas (slug) where slug is not null;

create index if not exists arenas_owner_id_idx
  on public.arenas (owner_id);

-- -----------------------------------------------------------------------------
-- Função compartilhada de updated_at (usada por arenas, courts,
-- capture_devices e sessions).
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger arenas_set_updated_at
  before update on public.arenas
  for each row execute procedure public.set_updated_at();
