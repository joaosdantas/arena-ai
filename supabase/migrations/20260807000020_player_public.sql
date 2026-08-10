-- =============================================================================
-- 20_player_public.sql
-- Acesso público a vídeos de partidas públicas — módulo Player (/watch).
--
-- O módulo Player permite que qualquer pessoa assista à gravação de uma
-- partida marcada como is_public = true, sem estar autenticada.
--
-- Arquitetura:
--   1. get_public_video(uuid)  -> RPC SECURITY DEFINER que retorna apenas os
--      campos seguros (vídeo + partida + arena + quadra). Nunca expõe dados
--      do proprietário (email, owner_id etc.).
--   2. Política de Storage     -> anon/authenticated podem assinar o vídeo
--      original de partidas públicas (caminho: videos/{owner}/{match}/{arquivo}).
--      Previews e thumbnails já são de leitura pública (migrations 08 e 12).
--
-- Rollback:
--   drop policy if exists "videos_public_match_select" on storage.objects;
--   drop function if exists public.get_public_video(uuid);
-- =============================================================================

-- -----------------------------------------------------------------------------
-- RPC: dados públicos de um vídeo de partida pública.
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
    and v.processing_status = 'ready'
  limit 1;
$$;

revoke all on function public.get_public_video(uuid) from public;
grant execute on function public.get_public_video(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Storage: vídeo original de partida pública pode ser lido/assinado por todos.
-- Convenção de caminho: videos/{owner_id}/{match_id}/{arquivo}
-- (storage.foldername(name))[3] = match_id
-- -----------------------------------------------------------------------------
create policy "videos_public_match_select"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = 'videos'
    and exists (
      select 1
      from public.matches m
      where m.id = (storage.foldername(name))[3]::uuid
        and m.is_public = true
    )
  );
