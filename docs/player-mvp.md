# Player MVP — Arena AI

## Jornada do jogador

```
Jogador abre o app (já autenticado)
      │
      ▼
Acessa "Minhas partidas"  (/player)
      │
      ▼
Escolhe uma partida       (/player/matches/:id)
      │
      ▼
Seleciona um vídeo        (/player/videos/:id)
      │
      ▼
Assiste                   (player HTML5)
      │
      ▼
Compartilha               (link público /watch/:videoId + WhatsApp)
```

O **espectador** não precisa de conta: recebe um link público (`/watch/:videoId`) e
assiste à gravação diretamente.

## Telas principais

| Tela | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| Minhas partidas | `/player` | autenticado | Lista mobile-first com arena, quadra, data, modalidade, nº de vídeos e status |
| Detalhes da partida | `/player/matches/:id` | autenticado | Arena, quadra, data, modalidade, quantidade de vídeos, status + lista de gravações |
| Vídeo | `/player/videos/:id` | autenticado | Player + informações da partida + compartilhar |
| Assistir (público) | `/watch/:videoId` | público | Player sem login + botões "Assistir" e "Compartilhar" |

Navegação mobile (barra inferior): **Minhas partidas** e **Perfil**; o header traz a marca **Arena AI**.

## Arquitetura

Módulo `src/modules/player`:

- `types/player.types.ts` — `PlayerMatch`, `PlayerVideo`, `PlayerVideoView`.
- `services/player.service.ts` — orquestra mock e Supabase:
  - `getPlayerMatches()` — partidas visíveis + contagem de vídeos por partida.
  - `getPlayerMatch(id)` / `getPlayerMatchVideos(matchId)` — detalhe e gravações.
  - `getPlayerVideo(id)` — vídeo com URL assinada (quando `ready`).
  - `getPublicVideo(videoId)` — dados públicos via RPC (anon).
- `services/mock-player.service.ts` — fixtures: **Arena XP, Quadra 1, Futebol (Sessão de teste)**
  com um vídeo `ready` e um `processing`; reaproveita `mockMatchStore`.
- `hooks/use-player.ts` — queries do TanStack Query.
- `pages/` — as 4 telas acima.

### Supabase

- `get_public_video(uuid)` — RPC `SECURITY DEFINER` (migration `20_player_public.sql`,
  ajustada na `21_session_recovery_capture.sql`) que retorna somente campos seguros
  de vídeos de partidas `is_public = true` — inclusive vídeos **em processamento**,
  para o `/watch` exibir o placeholder enquanto o worker termina.
- Política de storage `videos_public_match_select` permite que `anon`/`authenticated`
  assinem vídeos originais de partidas públicas (`videos/{owner}/{match}/...`). A
  migration 21 adiciona `videos_public_capture_match_select` para gravações de
  captura (`capture/{installation}/{session}/{device}/...`) de partidas públicas.
  Previews e thumbnails já são públicos.
- A URL assinada só é gerada no cliente quando `processing_status = 'ready'`.
- As tabelas `matches`, `videos`, `arenas`, `sessions`, `courts` e `capture_devices`
  já possuem políticas de leitura pública que tornam a consulta do jogador funcional.

## Estados visuais

- **Vídeo pronto** → `VideoPlayer` com controles (play/pause, seek, volume, tela cheia).
  Falha de reprodução (ex.: URL assinada expirada) mostra um aviso com **Tentar novamente**.
- **Processando / pendente** → "Seu vídeo está sendo processado." com re-busca
  automática (poll de ~5s no `/watch`, ~10s nas telas autenticadas) até ficar `ready`.
- **Falhou / indisponível** → mensagem amigável.
- Telas de lista tratam loading (skeleton), erro (tentar novamente) e vazio.
- `/player/videos/:id` distingue vídeo não encontrado de erro de carregamento, e o
  "voltar" usa a partida quando ela existe (fallback para o perfil do jogador).

## Limitações / próximos passos

- "Quadra" é exibida quando o vínculo existe (via `matches.session_id → sessions.court_id`);
  em modo mock a fixture traz "Quadra 1".
- URL pública depende da política de storage acima; em modo mock o vídeo usa URL pública de exemplo.
- Sem IA / destaques / estatísticas (fora de escopo do MVP).
