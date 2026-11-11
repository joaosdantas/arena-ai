-- =============================================================================
-- 18_capture_pairing.sql
-- Pareamento real de Capture Devices via QR Code.
--
-- Novas colunas em capture_devices:
--   - pairing_token: token aleatório e único usado na URL pública de pareamento
--     (/capture/:pairingToken). Nunca é o UUID interno nem expõe dados do dono.
--   - paired: flag booleana indicando se o dispositivo já está pareado.
--   - capture_installation_id: identificador persistente do celular (browser)
--     que está pareado ao dispositivo.
--
-- RPCs públicas (SECURITY DEFINER) usadas pelo fluxo de pareamento sem
-- autenticação (o celular que escaneia o QR não está logado):
--   - get_capture_device_by_token(p_token, p_installation_id)
--   - get_capture_device_by_id(p_device_id, p_installation_id)
--   - pair_capture_device(p_token, p_installation_id)
--   - send_capture_device_heartbeat(p_device_id, p_installation_id)
--
-- As RPCs devolvem apenas informações mínimas (id, nome, posição, quadra,
-- arena, estado de pareamento) e nunca expõem owner_id, e-mails ou o próprio
-- capture_installation_id. Heartbeat e pareamento exigem o token/installation
-- id correto. RLS por proprietário fica para etapa futura.
--
-- Rollback:
--   drop function if exists public.send_capture_device_heartbeat(uuid, text);
--   drop function if exists public.pair_capture_device(text, text);
--   drop function if exists public.get_capture_device_by_id(uuid, text);
--   drop function if exists public.get_capture_device_by_token(text, text);
--   drop index if exists capture_devices_pairing_token_idx;
--   alter table public.capture_devices drop constraint if exists capture_devices_pairing_token_unique;
--   alter table public.capture_devices drop column if exists capture_installation_id;
--   alter table public.capture_devices drop column if exists paired;
--   alter table public.capture_devices drop column if exists pairing_token;
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Colunas novas (aditivas).
-- -----------------------------------------------------------------------------
alter table public.capture_devices
  add column if not exists pairing_token text,
  add column if not exists paired boolean not null default false,
  add column if not exists capture_installation_id text;

-- Backfill: registros existentes ganham um token aleatório (64 hex, URL-safe).
update public.capture_devices
set pairing_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
where pairing_token is null;

alter table public.capture_devices
  alter column pairing_token set not null,
  add constraint capture_devices_pairing_token_unique unique (pairing_token);

create index if not exists capture_devices_pairing_token_idx
  on public.capture_devices (pairing_token);

-- -----------------------------------------------------------------------------
-- RPC: dados públicos do dispositivo a partir do token de pareamento.
-- -----------------------------------------------------------------------------
create or replace function public.get_capture_device_by_token(
  p_token text,
  p_installation_id text default null
)
returns table (
  id uuid,
  name text,
  "position" text,
  court_name text,
  arena_name text,
  paired boolean,
  is_mine boolean
)
language sql
security definer
set search_path = public
as $$
  select
    cd.id,
    cd.name,
    cd.position,
    c.name,
    a.name,
    cd.paired,
    (cd.paired and cd.capture_installation_id = p_installation_id)
  from public.capture_devices cd
  join public.courts c on c.id = cd.court_id
  join public.arenas a on a.id = c.arena_id
  where cd.pairing_token = p_token
  limit 1;
$$;

-- -----------------------------------------------------------------------------
-- RPC: dados públicos do dispositivo a partir do id (modo captura).
-- -----------------------------------------------------------------------------
create or replace function public.get_capture_device_by_id(
  p_device_id uuid,
  p_installation_id text default null
)
returns table (
  id uuid,
  name text,
  "position" text,
  court_name text,
  arena_name text,
  paired boolean,
  is_mine boolean
)
language sql
security definer
set search_path = public
as $$
  select
    cd.id,
    cd.name,
    cd.position,
    c.name,
    a.name,
    cd.paired,
    (cd.paired and cd.capture_installation_id = p_installation_id)
  from public.capture_devices cd
  join public.courts c on c.id = cd.court_id
  join public.arenas a on a.id = c.arena_id
  where cd.id = p_device_id
  limit 1;
$$;

-- -----------------------------------------------------------------------------
-- RPC: parear o dispositivo com o celular (installation id).
-- Idempotente para o mesmo installation id; rejeita quando já pareado com outro.
-- -----------------------------------------------------------------------------
create or replace function public.pair_capture_device(
  p_token text,
  p_installation_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device public.capture_devices%rowtype;
begin
  if p_installation_id is null or char_length(btrim(p_installation_id)) = 0 then
    return false;
  end if;

  select * into v_device
  from public.capture_devices
  where pairing_token = p_token;

  if not found then
    return false;
  end if;

  if v_device.paired and v_device.capture_installation_id is distinct from p_installation_id then
    return false;
  end if;

  update public.capture_devices
  set paired = true,
      capture_installation_id = p_installation_id,
      status = 'ready',
      last_seen = now(),
      updated_at = now()
  where id = v_device.id;

  return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: heartbeat do celular pareado.
-- Só atualiza last_seen/status quando o installation id confere com o pareado.
-- -----------------------------------------------------------------------------
create or replace function public.send_capture_device_heartbeat(
  p_device_id uuid,
  p_installation_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device public.capture_devices%rowtype;
begin
  if p_installation_id is null or char_length(btrim(p_installation_id)) = 0 then
    return false;
  end if;

  select * into v_device
  from public.capture_devices
  where id = p_device_id;

  if not found then
    return false;
  end if;

  if not v_device.paired or v_device.capture_installation_id is distinct from p_installation_id then
    return false;
  end if;

  update public.capture_devices
  set last_seen = now(),
      status = 'ready',
      updated_at = now()
  where id = v_device.id;

  return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- Grants explícitos (padrão do Supabase: execução pública para anon).
-- -----------------------------------------------------------------------------
grant execute on function public.get_capture_device_by_token(text, text) to anon, authenticated;
grant execute on function public.get_capture_device_by_id(uuid, text) to anon, authenticated;
grant execute on function public.pair_capture_device(text, text) to anon, authenticated;
grant execute on function public.send_capture_device_heartbeat(uuid, text) to anon, authenticated;
