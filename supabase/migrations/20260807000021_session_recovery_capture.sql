-- =============================================================================
-- 21_session_recovery_capture.sql
-- Correções de integração pós-auditoria:
--
--   1. Extensão do arquivo de captura: o celular envia MIME com parâmetros
--      (ex.: 'video/webm;codecs=vp9,opus'). O CASE anterior comparava o MIME
--      exato e caía no else 'bin', gerando caminhos capture/.../.bin.
--      Agora a extensão é derivada do MIME base (antes do ';').
--
--   2. Recuperação de Session 'failed': recalculate_session_status retornava
--      cedo para qualquer status fora de active/processing, então uma Session
--      'failed' ficava presa para sempre mesmo que os vídeos fossem
--      reprocessados com sucesso. 'failed' passa a ser recalculável.
--
--   3. get_public_video: removida a filtragem processing_status = 'ready'
--      para que /watch exiba o placeholder "em processamento" enquanto o
--      worker ainda não terminou (o cliente só assina o URL quando ready).
--
--   4. Nova policy de storage: leitura pública (anon/authenticated) de
--      gravações de captura (caminho capture/...) vinculadas a uma partida
--      pública, para o fluxo /watch sem login.
--
-- Rollback:
--   drop policy if exists "videos_public_capture_match_select" on storage.objects;
--   drop function if exists public.get_active_capture_session(uuid, text);
--   drop function if exists public.get_public_video(uuid);
--   drop function if exists public.recalculate_session_status(uuid);
--   drop function if exists public.create_capture_video(uuid, text, uuid, text, bigint, integer, uuid);
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Extensão do arquivo a partir do MIME base (ignora ';codecs=...').
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
  v_mime_base text;
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

  v_mime_base := lower(split_part(coalesce(p_mime_type, ''), ';', 1));

  v_ext := case
    when v_mime_base = 'video/webm' then 'webm'
    when v_mime_base = 'video/mp4' then 'mp4'
    when v_mime_base = 'video/quicktime' then 'mov'
    when v_mime_base = 'video/x-m4v' then 'm4v'
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
-- 2. Recalculate Session: 'failed' também pode ser recalculado (recuperação).
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

  if v_session.status not in ('active', 'processing', 'failed') then
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

-- -----------------------------------------------------------------------------
-- 3. get_public_video: expõe também vídeos em processamento (sem assinatura).
-- -----------------------------------------------------------------------------
create or replace function public.get_public_video(p_video_id uuid)
returns table (
  video_id        uuid,
  processing_status text,
  duration        integer,
  original_url    text,
  thumbnail_url   text,
  preview_url     text,
  match_id        uuid,
  match_title     text,
  sport           text,
  scheduled_at    timestamptz,
  arena_name      text,
  court_name      text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    v.id as video_id,
    v.processing_status::text as processing_status,
    v.duration as duration,
    v.original_url as original_url,
    v.thumbnail_url as thumbnail_url,
    v.preview_url as preview_url,
    m.id as match_id,
    m.title as match_title,
    m.sport as sport,
    m.scheduled_at as scheduled_at,
    a.name as arena_name,
    c.name as court_name
  from public.videos v
  join public.matches m on m.id = v.match_id
  left join public.arenas a on a.id = m.arena_id
  left join public.sessions s on s.id = m.session_id
  left join public.courts c on c.id = s.court_id
  where v.id = p_video_id
    and m.is_public = true
  limit 1;
$$;

revoke all on function public.get_public_video(uuid) from public;
grant execute on function public.get_public_video(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Storage: leitura pública de gravações de captura de partidas públicas.
--    Convenção de caminho: capture/{installation}/{session}/{device}/{arquivo}.
--    A partida pública é resolvida pelo vídeo cujo original_url é este objeto.
-- -----------------------------------------------------------------------------
create policy "videos_public_capture_match_select"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = 'capture'
    and exists (
      select 1
      from public.videos v
      join public.matches m on m.id = v.match_id
      where v.original_url = name
        and m.is_public = true
    )
  );

-- -----------------------------------------------------------------------------
-- 5. get_active_capture_session: só devolve sessões em que ainda dá para
--    gravar (active/processing). Uma sessão finalizada/falha deixa de aparecer
--    no celular como "ativa" após a arena encerrar.
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
    and s.status in ('active', 'processing')
  limit 1;
$$;
