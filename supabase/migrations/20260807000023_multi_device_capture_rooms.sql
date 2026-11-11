-- Shared, revocable QR rooms for multi-device capture sessions.
-- Public clients can only access rooms through the scoped SECURITY DEFINER RPCs.
create table public.session_capture_rooms (
  session_id uuid primary key references public.sessions (id) on delete cascade,
  token text not null unique,
  is_open boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.session_capture_rooms enable row level security;
revoke all on public.session_capture_rooms from public, anon, authenticated;

create index session_capture_rooms_open_idx
  on public.session_capture_rooms (session_id)
  where is_open = true;

create or replace function public.open_capture_room(p_session_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.sessions s
    join public.courts c on c.id = s.court_id
    join public.arenas a on a.id = c.arena_id
    where s.id = p_session_id
      and s.status in ('active', 'processing')
      and a.owner_id = auth.uid()
  ) then
    return null;
  end if;

  insert into public.session_capture_rooms (session_id, token, is_open)
  values (p_session_id, replace(gen_random_uuid()::text, '-', ''), true)
  on conflict (session_id) do update
    set is_open = true, updated_at = now()
  returning token into v_token;

  return v_token;
end;
$$;

create or replace function public.get_session_capture_room_token(p_session_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  if auth.uid() is null or not exists (
    select 1
    from public.sessions s
    join public.courts c on c.id = s.court_id
    join public.arenas a on a.id = c.arena_id
    where s.id = p_session_id
      and s.status in ('active', 'processing')
      and a.owner_id = auth.uid()
  ) then
    return null;
  end if;

  if exists (
    select 1 from public.sessions
    where id = p_session_id and status = 'active'
  ) then
    insert into public.session_capture_rooms (session_id, token, is_open)
    values (p_session_id, replace(gen_random_uuid()::text, '-', ''), true)
    on conflict (session_id) do update
      set is_open = true, updated_at = now()
      where session_capture_rooms.is_open = true;
  end if;

  select r.token into v_token
  from public.session_capture_rooms r
  where r.session_id = p_session_id and r.is_open = true;

  return v_token;
end;
$$;

create or replace function public.close_capture_room(p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.sessions s
    join public.courts c on c.id = s.court_id
    join public.arenas a on a.id = c.arena_id
    where s.id = p_session_id
      and a.owner_id = auth.uid()
  ) then
    return false;
  end if;

  update public.session_capture_rooms
  set is_open = false, updated_at = now()
  where session_id = p_session_id;

  update public.sessions
  set ended_at = coalesce(
        ended_at,
        greatest(now(), coalesce(started_at, now()) + interval '1 millisecond')
      ),
      updated_at = now()
  where id = p_session_id;

  perform public.recalculate_session_status(p_session_id);
  return true;
end;
$$;

create or replace function public.get_capture_room_by_token(p_room_token text)
returns table (
  session_id uuid,
  status text,
  arena_name text,
  court_name text
)
language sql
security definer
set search_path = public
stable
as $$
  select s.id, s.status, a.name, c.name
  from public.session_capture_rooms r
  join public.sessions s on s.id = r.session_id
  join public.courts c on c.id = s.court_id
  join public.arenas a on a.id = c.arena_id
  where r.token = p_room_token
    and r.is_open = true
    and s.status in ('active', 'processing')
  limit 1;
$$;

create or replace function public.join_capture_room(
  p_room_token text,
  p_installation_id text,
  p_device_name text
)
returns table (device_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.sessions%rowtype;
  v_device_id uuid;
  v_token text;
  v_name text;
begin
  if p_installation_id is null
     or char_length(btrim(p_installation_id)) = 0
     or char_length(p_installation_id) > 128 then
    return;
  end if;

  select s.* into v_session
  from public.session_capture_rooms r
  join public.sessions s on s.id = r.session_id
  where r.token = p_room_token
    and r.is_open = true
    and s.status in ('active', 'processing')
  for update of r, s;

  if not found then
    return;
  end if;

  v_name := left(coalesce(nullif(btrim(p_device_name), ''), 'Celular'), 64);

  select id into v_device_id
  from public.capture_devices
  where session_id = v_session.id
    and paired = true
    and capture_installation_id = p_installation_id
  order by created_at desc
  limit 1;

  if v_device_id is not null then
    update public.capture_devices
    set name = v_name, status = 'ready', last_seen = now(), updated_at = now()
    where id = v_device_id;
    return query select v_device_id;
    return;
  end if;

  if (
    select count(*)
    from public.capture_devices
    where session_id = v_session.id and paired = true
  ) >= 10 then
    raise exception 'ROOM_DEVICE_LIMIT_REACHED';
  end if;

  v_token := replace(gen_random_uuid()::text, '-', '');

  insert into public.capture_devices (
    court_id, name, qr_code, pairing_token, paired, capture_installation_id,
    status, last_seen, session_id
  )
  values (
    v_session.court_id, v_name, 'ROOM-' || v_token, v_token, true,
    p_installation_id, 'ready', now(), v_session.id
  )
  returning id into v_device_id;

  return query select v_device_id;
end;
$$;

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
  select s.id, s.status, s.started_at, c.name, a.name
  from public.capture_devices cd
  join public.sessions s on s.id = cd.session_id
  join public.session_capture_rooms r on r.session_id = s.id and r.is_open = true
  join public.courts c on c.id = s.court_id
  join public.arenas a on a.id = c.arena_id
  where cd.id = p_device_id
    and cd.paired = true
    and cd.capture_installation_id = p_installation_id
    and s.status in ('active', 'processing')
  limit 1;
$$;

create or replace function public.recalculate_session_status(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.sessions%rowtype;
  v_room_open boolean;
  v_status text;
begin
  select * into v_session
  from public.sessions
  where id = p_session_id;
  if not found or v_session.status not in ('active', 'processing', 'failed') then
    return;
  end if;

  select coalesce(r.is_open, false) into v_room_open
  from (select 1) source
  left join public.session_capture_rooms r on r.session_id = p_session_id;

  if exists (
    select 1 from public.videos
    where session_id = p_session_id
      and processing_status in ('pending', 'uploading', 'processing')
  ) then
    v_status := 'processing';
  elsif v_room_open then
    v_status := 'active';
  elsif exists (
    select 1 from public.videos
    where session_id = p_session_id and processing_status = 'failed'
  ) then
    v_status := 'failed';
  else
    v_status := 'finished';
  end if;

  update public.sessions
  set status = v_status,
      ended_at = case
        when v_room_open then null
        when v_status in ('finished', 'failed') then coalesce(ended_at, now())
        else ended_at
      end,
      updated_at = now()
  where id = p_session_id;
end;
$$;

create or replace function public.video_updated_session_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.session_id is not null then
    perform public.recalculate_session_status(new.session_id);
  end if;
  return new;
end;
$$;

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

  select * into v_device from public.capture_devices where id = p_device_id;
  if not found or not v_device.paired
     or v_device.capture_installation_id is distinct from p_installation_id then
    return;
  end if;

  select * into v_session from public.sessions where id = p_session_id;
  if not found or v_session.status not in ('active', 'processing')
     or v_session.court_id <> v_device.court_id
     or not exists (
       select 1 from public.session_capture_rooms
       where session_id = p_session_id and is_open = true
     ) then
    return;
  end if;

  if p_match_id is not null and not exists (
    select 1 from public.matches
    where id = p_match_id and (session_id = p_session_id or session_id is null)
  ) then
    return;
  end if;

  v_mime_base := lower(split_part(coalesce(p_mime_type, ''), ';', 1));
  if p_file_size is null or p_file_size <= 0 or p_file_size > 2147483648
     or v_mime_base not in ('video/webm', 'video/mp4', 'video/quicktime', 'video/x-m4v') then
    return;
  end if;

  v_ext := case v_mime_base
    when 'video/webm' then 'webm'
    when 'video/mp4' then 'mp4'
    when 'video/quicktime' then 'mov'
    when 'video/x-m4v' then 'm4v'
    else 'bin'
  end;

  insert into public.videos (
    session_id, capture_device_id, match_id, original_url, mime_type,
    file_size, duration, processing_status
  )
  values (
    v_session.id, v_device.id, p_match_id, '', p_mime_type,
    p_file_size, p_duration, 'uploading'
  )
  returning id into v_video_id;

  v_path := 'capture/' || p_installation_id || '/' || v_session.id::text
    || '/' || v_device.id::text || '/' || v_video_id::text || '.' || v_ext;

  update public.videos set original_url = v_path where id = v_video_id;
  return query select v_video_id, v_path;
end;
$$;

create or replace function public.start_capture_video(
  p_device_id uuid,
  p_installation_id text,
  p_session_id uuid,
  p_mime_type text default null,
  p_match_id uuid default null
)
returns table (
  video_id uuid,
  storage_path text,
  recording_started_at timestamptz,
  timeline_offset_ms integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device public.capture_devices%rowtype;
  v_session public.sessions%rowtype;
  v_video_id uuid;
  v_started_at timestamptz := clock_timestamp();
  v_offset integer;
  v_ext text;
  v_mime_base text;
  v_path text;
begin
  if p_installation_id is null or char_length(btrim(p_installation_id)) = 0 then
    return;
  end if;

  select * into v_device from public.capture_devices where id = p_device_id;
  if not found or not v_device.paired
     or v_device.capture_installation_id is distinct from p_installation_id then
    return;
  end if;

  select * into v_session from public.sessions where id = p_session_id for update;
  if not found or v_session.status not in ('active', 'processing')
     or v_session.court_id <> v_device.court_id
     or not exists (
       select 1 from public.session_capture_rooms
       where session_id = p_session_id and is_open = true
     ) then
    return;
  end if;

  if p_match_id is not null and not exists (
    select 1 from public.matches
    where id = p_match_id and (session_id = p_session_id or session_id is null)
  ) then
    return;
  end if;

  if v_session.started_at is null then
    update public.sessions
    set started_at = v_started_at
    where id = p_session_id
    returning * into v_session;
  end if;

  v_offset := greatest(0, floor(extract(epoch from (v_started_at - v_session.started_at)) * 1000)::integer);
  v_mime_base := lower(split_part(coalesce(p_mime_type, ''), ';', 1));
  v_ext := case v_mime_base
    when 'video/mp4' then 'mp4'
    when 'video/x-m4v' then 'm4v'
    when 'video/quicktime' then 'mov'
    when 'video/webm' then 'webm'
    else 'bin'
  end;

  insert into public.videos (
    session_id, capture_device_id, match_id, original_url, mime_type,
    processing_status, recording_started_at, timeline_offset_ms
  )
  values (
    v_session.id, v_device.id, p_match_id, '', p_mime_type,
    'uploading', v_started_at, v_offset
  )
  returning id into v_video_id;

  v_path := 'capture/' || p_installation_id || '/' || v_session.id::text
    || '/' || v_device.id::text || '/' || v_video_id::text || '.' || v_ext;
  update public.videos set original_url = v_path where id = v_video_id;

  return query select v_video_id, v_path, v_started_at, v_offset;
end;
$$;

revoke all on function public.open_capture_room(uuid) from public;
revoke all on function public.get_session_capture_room_token(uuid) from public;
revoke all on function public.close_capture_room(uuid) from public;
revoke all on function public.get_capture_room_by_token(text) from public;
revoke all on function public.join_capture_room(text, text, text) from public;

grant execute on function public.open_capture_room(uuid) to authenticated;
grant execute on function public.get_session_capture_room_token(uuid) to authenticated;
grant execute on function public.close_capture_room(uuid) to authenticated;
grant execute on function public.get_capture_room_by_token(text) to anon, authenticated;
grant execute on function public.join_capture_room(text, text, text) to anon, authenticated;
grant execute on function public.get_active_capture_session(uuid, text) to anon, authenticated;
grant execute on function public.recalculate_session_status(uuid) to authenticated;
grant execute on function public.create_capture_video(uuid, text, uuid, text, bigint, integer, uuid) to anon, authenticated;
grant execute on function public.start_capture_video(uuid, text, uuid, text, uuid) to anon, authenticated;
