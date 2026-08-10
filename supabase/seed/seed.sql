-- =============================================================================
-- seed.sql
-- Dados de teste para desenvolvimento.
-- -----------------------------------------------------------------------------
-- Aplicar via: supabase db reset (local) ou SQL Editor (projeto hospedado).
--
-- O usuário demo abaixo não existe em auth.users: ele existe apenas para
-- permitir que as partidas/players tenham owner_id consistente no banco.
-- Usuários reais são criados automaticamente no trigger on_auth_user_created.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Usuário demo
-- ---------------------------------------------------------------------------
insert into public.users (id, name, avatar_url)
values ('00000000-0000-0000-0000-000000000001', 'Usuário Demo', null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Arenas
-- ---------------------------------------------------------------------------
insert into public.arenas (id, name, city, address, cover_url)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'Arena do Vale',
    'São Paulo',
    'Av. das Nações, 1000',
    null
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Ginásio Municipal',
    'Curitiba',
    'Rua dos Pinheiros, 250',
    null
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Complexo Esportivo Norte',
    'Belo Horizonte',
    'Rua do Futebol, 45',
    null
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Partidas (5 fictícias)
-- ---------------------------------------------------------------------------
insert into public.matches (
  id, owner_id, arena_id, title, sport, status, is_public,
  started_at, finished_at, video_url, thumbnail_url, preview_url
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Semifinal — Furacão FC vs. Atlético Real',
    'Futebol',
    'ready',
    true,
    '2026-08-01 19:00:00+00',
    '2026-08-01 20:45:00+00',
    'videos/00000000-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000001/match.mp4',
    'thumbnails/00000000-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000001/thumb.jpg',
    null
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'Clássico da Cidade',
    'Basquete',
    'created',
    false,
    '2026-08-15 20:00:00+00',
    null,
    null,
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    'Jogo 3 — Final',
    'Vôlei',
    'processing',
    false,
    '2026-08-06 21:00:00+00',
    '2026-08-06 22:30:00+00',
    'videos/00000000-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000003/match.mp4',
    null,
    null
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Torneio de Inverno — Fase 1',
    'Futsal',
    'ready',
    true,
    '2026-07-20 18:00:00+00',
    '2026-07-20 19:15:00+00',
    'videos/00000000-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000004/match.mp4',
    'thumbnails/00000000-0000-0000-0000-000000000001/20000000-0000-0000-0000-000000000004/thumb.jpg',
    null
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'Amistoso de Handebol',
    'Handebol',
    'recording',
    false,
    '2026-08-08 19:30:00+00',
    null,
    null,
    null,
    null
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Jogadores
-- ---------------------------------------------------------------------------
insert into public.players (match_id, name, team)
values
  -- Partida 1 (Furacão x Atlético)
  ('20000000-0000-0000-0000-000000000001', 'Carlos Souza', 'Furacão FC'),
  ('20000000-0000-0000-0000-000000000001', 'João Pedro', 'Furacão FC'),
  ('20000000-0000-0000-0000-000000000001', 'Rafael Lima', 'Atlético Real'),
  ('20000000-0000-0000-0000-000000000001', 'Bruno Alves', 'Atlético Real'),

  -- Partida 2 (Basquete)
  ('20000000-0000-0000-0000-000000000002', 'Diego Martins', 'Lobos da Serra'),
  ('20000000-0000-0000-0000-000000000002', 'Felipe Castro', 'Lobos da Serra'),
  ('20000000-0000-0000-0000-000000000002', 'Marcos Paulo', 'Dragões'),
  ('20000000-0000-0000-0000-000000000002', 'Vinícius Rocha', 'Dragões'),

  -- Partida 3 (Vôlei)
  ('20000000-0000-0000-0000-000000000003', 'André Gomes', 'Titãs'),
  ('20000000-0000-0000-0000-000000000003', 'Lucas Ferreira', 'Titãs'),
  ('20000000-0000-0000-0000-000000000003', 'Gabriel Nunes', 'Fênix'),
  ('20000000-0000-0000-0000-000000000003', 'Henrique Dias', 'Fênix'),

  -- Partida 4 (Futsal)
  ('20000000-0000-0000-0000-000000000004', 'Thiago Rocha', 'Equipe Azul'),
  ('20000000-0000-0000-0000-000000000004', 'Pedro Henrique', 'Equipe Azul'),
  ('20000000-0000-0000-0000-000000000004', 'Matheus Costa', 'Equipe Vermelha'),
  ('20000000-0000-0000-0000-000000000004', 'Igor Santos', 'Equipe Vermelha');

-- =============================================================================
-- Evolução do domínio (etapa 2)
-- Arena -> Court -> Capture Device -> Session
-- Dados fictícios apenas para ambiente de desenvolvimento.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Arena XP (dono = usuário demo)
-- ---------------------------------------------------------------------------
insert into public.arenas (
  id, owner_id, name, slug, address, city, state, status
)
values (
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'Arena XP',
  'arena-xp',
  'Rua dos Campeões, 10',
  'São Paulo',
  'SP',
  'active'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Quadra 1 (pertence à Arena XP)
-- ---------------------------------------------------------------------------
insert into public.courts (id, arena_id, name, sport, status)
values (
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000004',
  'Quadra 1',
  'Futebol',
  'active'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Camera Lateral Principal (pertence à Quadra 1)
-- ---------------------------------------------------------------------------
insert into public.capture_devices (
  id, court_id, name, qr_code, pairing_token, paired, capture_installation_id,
  position, height, angle, status, last_seen
)
values (
  '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'Camera Lateral Principal',
  'CAM-LAT-001',
  'demo-pairing-token-camera-lateral-001',
  false,
  null,
  'lateral direita',
  3,
  45,
  'ready',
  now()
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Sessão teste (pertence à Quadra 1)
-- ---------------------------------------------------------------------------
insert into public.sessions (
  id, court_id, started_at, ended_at, status, created_by
)
values (
  '50000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  null,
  null,
  'scheduled',
  '00000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;
