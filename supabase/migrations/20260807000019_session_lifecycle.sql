-- =============================================================================
-- 19_session_lifecycle.sql
-- Ciclo de vida real das Sessions, conectando o Arena Dashboard ao Capture
-- Device e ao sistema de vídeos:
--
--   scheduled -> active -> processing -> finished
--                                    -> failed
--
-- Mudanças:
--   - sessions.status passa a aceitar 'failed'.
--   - capture_devices ganha session_id (sessão corrente do dispositivo) e o
--     status passa a aceitar 'uploading'.
--   - videos ganha session_id, capture_device_id, mime_type, file_size e
--     match_id vira opcional (uma gravação pode existir antes da partida).
--   - RPCs públicas (anon) para o celular pareado:
--       get_active_capture_session(...)
--       set_capture_device_status(...)
--       create_capture_video(...)
--       update_capture_video_status(...)
--   - recalculate_session_status() + trigger: a Session acompanha o estado
--     dos vídeos associados.
--   - storage: upload anônimo de gravações em videos/capture/... (o celular
--     não está logado) e leitura pelo dono da arena.
--   - send_capture_device_heartbeat passa a preservar recording/uploading.
--
-- Rollback:
--   drop policy if exists "videos_capture_delete_anon" on storage.objects;
--   drop policy if exists "videos_capture_update_anon" on storage.objects;
--   drop policy if exists "videos_capture_select_owner" on storage.objects;
--   drop policy if exists "videos_capture_upload_anon" on storage.objects;
--   drop trigger if exists videos_recalc_session on public.videos;
--   drop function if exists public.video_updated_session_status();
--   drop function if exists public.recalculate_session_status(uuid);
--   drop function if exists public.update_capture_video_status(uuid, text, text);
--   drop function if exists public.create_capture_video(uuid, text, uuid, text, bigint, integer, uuid);
--   drop function if exists public.set_capture_device_status(uuid, text, text);
--   drop function if exists public.get_active_capture_session(uuid, text);
--   drop index if exists videos_session_id_idx;
--   drop index if exists videos_capture_device_id_idx;
--   drop index if exists capture_devices_session_id_idx;
--   alter table public.videos drop column if exists file_size;
--   alter table public.videos drop column if exists mime_type;
--   alter table public.videos drop column if exists capture_device_id;
--   alter table public.videos drop column if exists session_id;
--   alter table public.videos alter column match_id set not null;
--   alter table public.capture_devices drop column if exists session_id;
--   alter table public.capture_devices
--     drop constraint if exists capture_devices_status_check;
--   alter table public.capture_devices
--     add constraint capture_devices_status_check
--       check (status in ('offline', 'ready', 'recording', 'error'));
--   alter table public.sessions
--     drop constraint if exists sessions_status_check;
--   alter table public.sessions
--     add constraint sessions_status_check
--       check (status in ('scheduled', 'active', 'finished', 'processing'));
-- =============================================================================

-- -----------------------------------------------------------------------------
-- sessions: aceita 'failed'.
-- -----------------------------------------------------------------------------
alter table public.sessions
  drop constraint if exists sessions_status_check;

alter table public.sessions
  add constraint sessions_status_check
    check (status in ('scheduled', 'active', 'finished', 'processing', 'failed'));

-- -----------------------------------------------------------------------------
-- capture_devices: aceita 'uploading' e ganha session_id (sessão corrente).
-- -----------------------------------------------------------------------------
alter table public.capture_devices
  drop constraint if exists capture_devices_status_check;

alter table public.capture_devices
  add constraint capture_devices_status_check
    check (status in ('offline', 'ready', 'recording', 'uploading', 'error'));

alter table public.capture_devices
  add column if not exists session_id uuid references public.sessions (id) on delete set null;

create index if not exists capture_devices_session_id_idx
  on public.capture_devices (session_id);

-- -----------------------------------------------------------------------------
-- videos: vínculos com Session/Capture Device e metadados de upload.
-- match_id vira opcional: uma gravação pode existir antes da partida formal.
-- -----------------------------------------------------------------------------
alter table public.videos
  alter column match_id drop not null;

alter table public.videos
  add column if not exists session_id uuid references public.sessions (id) on delete set null,
  add column if not exists capture_device_id uuid references public.capture_devices (id) on delete set null,
  add column if not exists mime_type text,
  add column if not exists file_size bigint;

create index if not exists videos_session_id_idx
  on public.videos (session_id);

create index if not exists videos_capture_device_id_idx
  on public.videos (capture_device_id);

-- -----------------------------------------------------------------------------
-- RLS: leitura dos vídeos de captura pelo dono da arena (via Session).
-- -----------------------------------------------------------------------------
create policy "videos_select_session_owner"
  on public.videos
  for select
  using (
    exists (
      select 1
      from public.sessions s
      join public.courts c on c.id = s.court_id
      join public.arenas a on a.id = c.arena_id
      where s.id = session_id
        and a.owner_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Recalc: a Session acompanha o estado dos vídeos associados.
-- Apenas aplica a partir de 'active'/'processing'; uma Session finalizada ou
-- falha permanece assim.
-- -----------------------------------------------------------------------------
create or replace function public.recalculate_session_status(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.sessions%rowtype;
  v_status  text;
begin
  select * into v_session from public.sessions where id = p_session_id;
  if not found then
    return;
  end if;

  if v_session.status not in ('active', 'processing') then
    return;
  end if;

  if exists (
    select 1 from public.videos
    where session_id = p_session_id and processing_status = 'failed'
  ) then
    v_status := 'failed';
  elsif exists (
    select 1 from public.videos
    where session_id = p_session_id
      and processing_status in ('pending', 'uploading', 'processing')
  ) then
    v_status := 'processing';
  else
    v_status := 'finished';
  end if;

  update public.sessions
  set status = v_status,
      ended_at = case
        when v_status in ('finished', 'failed') and ended_at is null then now()
        else ended_at
      end,
      updated_at = now()
  where id = p_session_id;
end;
$$;

-- Trigger: quando o status de um vídeo muda, a Session é recalculada.
-- Vídeo falho derruba a Session (active/processing -> failed) imediatamente.
create or replace function public.video_updated_session_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.session_id is null then
    return new;
  end if;

  if new.processing_status = 'failed' then
    update public.sessions
    set status = 'failed',
        ended_at = coalesce(ended_at, now()),
        updated_at = now()
    where id = new.session_id and status in ('active', 'processing');
    return new;
  end if;

  perform public.recalculate_session_status(new.session_id);
  return new;
end;
$$;

create trigger videos_recalc_session
  after update of processing_status on public.videos
  for each row
  when (old.processing_status is distinct from new.processing_status)
  execute procedure public.video_updated_session_status();

-- -----------------------------------------------------------------------------
-- RPC: sessão corrente do dispositivo pareado (dados públicos mínimos).
-- -----------------------------------------------------------------------------
create or replace function public.get_active_capture_session(
  p_device_id uuid,
  p_installation_id text
)
returns table (
  session_id uuid,
  status text,
  started_at timestamptz,
  court_name text,
  arena_name text
)
language sql
security definer
set search_path = public
as $$
  select
    s.id,
    s.status,
    s.started_at,
    c.name,
    a.name
  from public.capture_devices cd
  join public.sessions s on s.id = cd.session_id
  join public.courts c on c.id = s.court_id
  join public.arenas a on a.id = c.arena_id
  where cd.id = p_device_id
    and cd.paired = true
    and cd.capture_installation_id = p_installation_id
  limit 1;
$$;

-- -----------------------------------------------------------------------------
-- RPC: mudança de status do dispositivo pelo celular pareado.
-- -----------------------------------------------------------------------------
create or replace function public.set_capture_device_status(
  p_device_id uuid,
  p_installation_id text,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device public.capture_devices%rowtype;
begin
  if p_status not in ('ready', 'recording', 'uploading', 'error') then
    return false;
  end if;

  select * into v_device
  from public.capture_devices
  where id = p_device_id;

  if not found then
    return false;
  end if;

  if not v_device.paired
     or v_device.capture_installation_id is distinct from p_installation_id then
    return false;
  end if;

  update public.capture_devices
  set status = p_status,
      last_seen = now(),
      updated_at = now()
  where id = v_device.id;

  return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: cria o registro do Video após a gravação (celular não está logado).
-- Valida pareamento + sessão ativa + mesma quadra (device -> court -> arena).
-- O match_id é opcional; quando informado, precisa pertencer à mesma Session.
-- Retorna o id do vídeo e o caminho no Storage para o upload.
-- -----------------------------------------------------------------------------
create or replace function public.create_capture_video(
  p_device_id uuid,
  p_installation_id text,
  p_session_id uuid,
  p_mime_type text default null,
  p_file_size bigint default null,
  p_duration integer default null,
  p_match_id uuid default null
)
returns table (video_id uuid, storage_path text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device public.capture_devices%rowtype;
  v_session public.sessions%rowtype;
  v_video_id uuid;
  v_ext text;
  v_path text;
begin
  if p_installation_id is null or char_length(btrim(p_installation_id)) = 0 then
    return;
  end if;

  select * into v_device
  from public.capture_devices
  where id = p_device_id;

  if not found then
    return;
  end if;

  -- Pareamento real: somente o celular pareado pode gravar.
  if not v_device.paired
     or v_device.capture_installation_id is distinct from p_installation_id then
    return;
  end if;

  -- Sessão precisa existir, estar ativa/processando e pertencer à mesma quadra
  -- do device. 'processing' é aceito: outro vídeo da sessão pode já estar em
  -- processamento enquanto este dispositivo ainda grava.
  select * into v_session
  from public.sessions
  where id = p_session_id;

  if not found then
    return;
  end if;

  if v_session.status not in ('active', 'processing') or v_session.court_id <> v_device.court_id then
    return;
  end if;

  -- Match opcional: quando informado, precisa pertencer a esta Session.
  if p_match_id is not null
     and not exists (
       select 1 from public.matches
       where id = p_match_id
         and (session_id = p_session_id or session_id is null)
     ) then
    return;
  end if;

  v_ext := case
    when p_mime_type = 'video/webm' then 'webm'
    when p_mime_type = 'video/mp4' then 'mp4'
    when p_mime_type = 'video/quicktime' then 'mov'
    when p_mime_type = 'video/x-m4v' then 'm4v'
    else 'bin'
  end;

  insert into public.videos (
    session_id,
    capture_device_id,
    match_id,
    original_url,
    mime_type,
    file_size,
    duration,
    processing_status
  )
  values (
    v_session.id,
    v_device.id,
    p_match_id,
    '',
    p_mime_type,
    p_file_size,
    p_duration,
    'uploading'
  )
  returning id into v_video_id;

  v_path := 'capture/' || p_installation_id || '/' || v_session.id::text
            || '/' || v_device.id::text || '/' || v_video_id::text || '.' || v_ext;

  update public.videos
  set original_url = v_path
  where id = v_video_id;

  return query select v_video_id, v_path;
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: atualiza o status do vídeo de captura (upload concluído ou falhou).
-- Valida que o installation id confere com o dispositivo que gravou.
-- Não permite transições para 'ready' (reservado ao worker).
-- -----------------------------------------------------------------------------
create or replace function public.update_capture_video_status(
  p_video_id uuid,
  p_installation_id text,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_video public.videos%rowtype;
  v_device public.capture_devices%rowtype;
begin
  if p_status not in ('pending', 'uploading', 'failed') then
    return false;
  end if;

  select * into v_video
  from public.videos
  where id = p_video_id;

  if not found then
    return false;
  end if;

  select * into v_device
  from public.capture_devices
  where id = v_video.capture_device_id;

  if not found
     or not v_device.paired
     or v_device.capture_installation_id is distinct from p_installation_id then
    return false;
  end if;

  -- Estados intermediários de upload: permite pendente/falha/reenvio.
  if v_video.processing_status not in ('uploading', 'pending', 'failed') then
    return false;
  end if;

  update public.videos
  set processing_status = p_status
  where id = v_video.id;

  return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- Heartbeat: preserva recording/uploading enquanto o celular grava/envia.
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
      status = case
        when status in ('recording', 'uploading') then status
        else 'ready'
      end,
      updated_at = now()
  where id = v_device.id;

  return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- Storage: gravações de captura (videos/capture/...) enviadas pelo celular
-- sem login, com instalação/sessão/dispositivo embutidos no caminho.
-- Caminho: capture/{installation_id}/{session_id}/{device_id}/{video_id}.ext
-- -----------------------------------------------------------------------------
create policy "videos_capture_upload_anon"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = 'capture'
    and exists (
      select 1
      from public.capture_devices cd
      join public.sessions s on s.id = cd.session_id
      where cd.id = (storage.foldername(name))[4]::uuid
        and cd.paired = true
        and cd.capture_installation_id = (storage.foldername(name))[2]
        and s.status in ('active', 'processing')
    )
  );

create policy "videos_capture_update_anon"
  on storage.objects
  for update
  to anon, authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = 'capture'
    and exists (
      select 1
      from public.capture_devices cd
      where cd.id = (storage.foldername(name))[4]::uuid
        and cd.paired = true
        and cd.capture_installation_id = (storage.foldername(name))[2]
    )
  );

create policy "videos_capture_delete_anon"
  on storage.objects
  for delete
  to anon, authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = 'capture'
    and exists (
      select 1
      from public.capture_devices cd
      where cd.id = (storage.foldername(name))[4]::uuid
        and cd.paired = true
        and cd.capture_installation_id = (storage.foldername(name))[2]
    )
  );

-- Leitura das gravações de captura pelo dono da arena (dashboard).
create policy "videos_capture_select_owner"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(storage.objects.name))[1] = 'capture'
    and exists (
      select 1
      from public.capture_devices cd
      join public.sessions s on s.id = cd.session_id
      join public.courts c on c.id = s.court_id
      join public.arenas a on a.id = c.arena_id
      where cd.id = (storage.foldername(storage.objects.name))[4]::uuid
        and a.owner_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Grants para o fluxo público do celular (anon) e do dashboard (authenticated).
-- -----------------------------------------------------------------------------
grant execute on function public.get_active_capture_session(uuid, text) to anon, authenticated;
grant execute on function public.set_capture_device_status(uuid, text, text) to anon, authenticated;
grant execute on function public.create_capture_video(uuid, text, uuid, text, bigint, integer, uuid) to anon, authenticated;
grant execute on function public.update_capture_video_status(uuid, text, text) to anon, authenticated;
grant execute on function public.recalculate_session_status(uuid) to authenticated;
