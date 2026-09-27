-- Shared session-relative timeline metadata for captured videos.
alter table public.videos
  add column if not exists recording_started_at timestamptz,
  add column if not exists recording_ended_at timestamptz,
  add column if not exists timeline_offset_ms integer not null default 0;

alter table public.videos
  add constraint videos_timeline_offset_nonnegative
  check (timeline_offset_ms >= 0);

-- Ensure session start time comes from the database when lifecycle begins.
create or replace function public.set_session_capture_started_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status is distinct from 'active' and new.status = 'active' then
    new.started_at := coalesce(old.started_at, clock_timestamp());
  end if;
  return new;
end;
$$;

drop trigger if exists sessions_capture_started_at on public.sessions;
create trigger sessions_capture_started_at
  before update on public.sessions
  for each row execute function public.set_session_capture_started_at();

-- Register a capture before MediaRecorder starts so its timestamp is generated
-- by Postgres, and calculate its offset against the shared session clock.
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
  if p_installation_id is null or char_length(btrim(p_installation_id)) = 0 then return; end if;

  select * into v_device from public.capture_devices where id = p_device_id;
  if not found or not v_device.paired or v_device.capture_installation_id is distinct from p_installation_id then return; end if;

  select * into v_session from public.sessions where id = p_session_id for update;
  if not found or v_session.status not in ('active', 'processing') or v_session.court_id <> v_device.court_id then return; end if;
  if p_match_id is not null and not exists (
    select 1 from public.matches where id = p_match_id and (session_id = p_session_id or session_id is null)
  ) then return; end if;

  if v_session.started_at is null then
    update public.sessions set started_at = v_started_at where id = p_session_id returning * into v_session;
  end if;
  v_offset := greatest(0, floor(extract(epoch from (v_started_at - v_session.started_at)) * 1000)::integer);
  v_mime_base := lower(split_part(coalesce(p_mime_type, ''), ';', 1));
  v_ext := case v_mime_base when 'video/mp4' then 'mp4' when 'video/x-m4v' then 'm4v'
    when 'video/quicktime' then 'mov' when 'video/webm' then 'webm' else 'bin' end;

  insert into public.videos (
    session_id, capture_device_id, match_id, original_url, mime_type,
    processing_status, recording_started_at, timeline_offset_ms
  ) values (v_session.id, v_device.id, p_match_id, '', p_mime_type, 'uploading', v_started_at, v_offset)
  returning id into v_video_id;

  v_path := 'capture/' || p_installation_id || '/' || v_session.id::text || '/' || v_device.id::text
    || '/' || v_video_id::text || '.' || v_ext;
  update public.videos set original_url = v_path where id = v_video_id;
  return query select v_video_id, v_path, v_started_at, v_offset;
end;
$$;

create or replace function public.finish_capture_video(
  p_video_id uuid,
  p_installation_id text,
  p_duration integer,
  p_file_size bigint default null,
  p_mime_type text default null
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
  select * into v_video from public.videos where id = p_video_id;
  if not found then return false; end if;
  select * into v_device from public.capture_devices where id = v_video.capture_device_id;
  if not found or not v_device.paired or v_device.capture_installation_id is distinct from p_installation_id then return false; end if;
  if v_video.recording_started_at is null then return false; end if;
  update public.videos
    set duration = greatest(0, p_duration),
        file_size = coalesce(p_file_size, v_video.file_size),
        mime_type = coalesce(p_mime_type, v_video.mime_type),
        recording_ended_at = v_video.recording_started_at + make_interval(secs => greatest(0, p_duration))
    where id = p_video_id;
  return true;
end;
$$;

grant execute on function public.start_capture_video(uuid, text, uuid, text, uuid) to anon, authenticated;
grant execute on function public.finish_capture_video(uuid, text, integer, bigint, text) to anon, authenticated;
