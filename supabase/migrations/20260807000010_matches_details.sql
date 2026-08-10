-- =============================================================================
-- 10_matches_details.sql
-- Campos de detalhe da partida (descrição e data/hora programada).
-- =============================================================================

alter table public.matches
  add column if not exists description text,
  add column if not exists scheduled_at timestamptz;

create index if not exists matches_scheduled_at_idx on public.matches (scheduled_at);
