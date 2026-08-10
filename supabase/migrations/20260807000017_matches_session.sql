-- =============================================================================
-- 17_matches_session.sql
-- Vincula partidas a sessões de gravação: Session 1:N Matches.
-- -----------------------------------------------------------------------------
-- Apenas adição de coluna opcional + índice. Todas as colunas e policies de
-- RLS existentes de `matches` permanecem intactas.
--
-- Rollback:
--   drop index if exists matches_session_id_idx;
--   alter table public.matches drop column if exists session_id;
-- =============================================================================

alter table public.matches
  add column if not exists session_id uuid references public.sessions (id) on delete set null;

create index if not exists matches_session_id_idx
  on public.matches (session_id);
