-- =============================================================================
-- 15_capture_devices.sql
-- Dispositivos de captura (celular/câmera) vinculados a uma quadra.
-- Nova entidade do domínio: Court 1:N Capture Devices.
--
-- Rollback:
--   drop policy if exists "capture_devices_delete_authenticated" on public.capture_devices;
--   drop policy if exists "capture_devices_update_authenticated" on public.capture_devices;
--   drop policy if exists "capture_devices_insert_authenticated" on public.capture_devices;
--   drop policy if exists "capture_devices_select_public" on public.capture_devices;
--   drop trigger if exists capture_devices_set_updated_at on public.capture_devices;
--   drop index if exists capture_devices_court_id_idx;
--   drop table if exists public.capture_devices;
-- =============================================================================

create table if not exists public.capture_devices (
  id          uuid primary key default gen_random_uuid(),
  court_id    uuid not null references public.courts (id) on delete cascade,
  name        text not null,
  qr_code     text not null unique,
  position    text,
  height      numeric,
  angle       numeric,
  status      text not null default 'offline',
  last_seen   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint capture_devices_name_not_empty check (char_length(btrim(name)) > 0),
  constraint capture_devices_qr_code_not_empty check (char_length(btrim(qr_code)) > 0),
  constraint capture_devices_status_check
    check (status in ('offline', 'ready', 'recording', 'error'))
);

alter table public.capture_devices enable row level security;

-- -----------------------------------------------------------------------------
-- RLS: espelha o padrão de `arenas` (leitura pública, escrita por autenticado).
-- -----------------------------------------------------------------------------
create policy "capture_devices_select_public"
  on public.capture_devices
  for select
  using (true);

create policy "capture_devices_insert_authenticated"
  on public.capture_devices
  for insert
  to authenticated
  with check (true);

create policy "capture_devices_update_authenticated"
  on public.capture_devices
  for update
  to authenticated
  using (true)
  with check (true);

create policy "capture_devices_delete_authenticated"
  on public.capture_devices
  for delete
  to authenticated
  using (true);

create index if not exists capture_devices_court_id_idx
  on public.capture_devices (court_id);

create trigger capture_devices_set_updated_at
  before update on public.capture_devices
  for each row execute procedure public.set_updated_at();
