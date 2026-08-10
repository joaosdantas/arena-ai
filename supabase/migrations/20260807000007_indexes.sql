-- =============================================================================
-- 07_indexes.sql
-- Índices para as consultas mais frequentes.
-- =============================================================================

create index if not exists matches_owner_id_idx
  on public.matches (owner_id);

create index if not exists matches_arena_id_idx
  on public.matches (arena_id);

create index if not exists matches_status_idx
  on public.matches (status);

create index if not exists players_match_id_idx
  on public.players (match_id);

create index if not exists videos_match_id_idx
  on public.videos (match_id);

create index if not exists clips_match_id_idx
  on public.clips (match_id);
