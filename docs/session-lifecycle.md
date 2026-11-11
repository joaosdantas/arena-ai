# Session Lifecycle — Arena AI

Fluxo **completo** de uma sessão de captura conectando o Arena Dashboard ao
Capture Device e ao sistema de vídeos:

```
scheduled ──iniciar──▶ active ──vídeo enviado──▶ processing ──worker──▶ finished
                        │                            │                     ▲
                        └──marcar falha──▶ failed ────┘                     │
                        └──────────vídeo falhou──────▶ failed               │
                                                          └───────────────┘
```

## 1. Estado das tabelas (migration `20260807000019_session_lifecycle.sql`)

**`sessions`**

- `status` agora aceita `failed`.

**`capture_devices`**

- `session_id` (nullable) — sessão corrente do dispositivo.
- `status` aceita `uploading` (novo).

**`videos`**

- `session_id`, `capture_device_id`, `mime_type`, `file_size` (novos).
- `match_id` passou a ser **opcional**: uma gravação de captura pode existir
  antes da partida formal. O vínculo com partida é feito depois.

Migration `20260807000023_multi_device_capture_rooms.sql` adiciona salas de
envio por sessão. O QR/link da sala é um token aleatório compartilhado: cada
celular que entra recebe um dispositivo próprio vinculado à mesma sessão. O
token fica em uma tabela sem leitura direta por `anon`; a página pública acessa
somente os dados mínimos por RPC. Cada sala aceita até 10 dispositivos.

## 2. RPCs públicas (o celular não está logado)

Todas `SECURITY DEFINER`, executáveis por `anon` e `authenticated`, validando o
pareamento (`capture_installation_id`) e a sessão antes de qualquer mudança.

| RPC                                                                                 | O que faz                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `get_active_capture_session(device, installation)`                                  | devolve a sessão vinculada ao dispositivo (quadra/arena)               |
| `set_capture_device_status(device, installation, status)`                           | muda o status do dispositivo (`ready`/`recording`/`uploading`/`error`) |
| `create_capture_video(device, installation, session, mime, size, duration, match?)` | cria o vídeo `uploading` e devolve `video_id` + `storage_path`         |
| `update_capture_video_status(video, installation, status)`                          | marca `pending`/`uploading`/`failed` após o upload                     |
| `recalculate_session_status(session)`                                               | recalcula o status da sessão a partir dos vídeos (dashboard)           |
| `get_capture_room_by_token(token)` / `join_capture_room(token, installation, name)` | consulta a sala e conecta um celular                                   |

A criação valida que: o device está pareado com a instalação; a sessão existe,
está `active` e pertence à **mesma quadra** do device; se um `match_id` for
informado, ele pertence à sessão. O token compartilhado só aceita novos
dispositivos enquanto a sala estiver aberta.

## 3. Fluxo no celular (`CaptureRecorder`)

1. `useActiveCaptureSession` (poll 15s) informa se há sessão ativa.
2. `set_capture_device_status(..., 'recording')` → `MediaRecorder` grava.
3. Ao parar: `set_capture_device_status(..., 'uploading')`.
4. `create_capture_video(...)` devolve `storage_path`.
5. Upload **anônimo** para `videos/capture/...` (política de storage dedicada).
6. `update_capture_video_status(..., 'pending')` → o worker assume.
7. `set_capture_device_status(..., 'ready')`.

Na página do dispositivo também é possível selecionar um vídeo já gravado no
celular (`.mp4`, `.mov` ou `.webm`, até 2 GB). Ele é registrado na mesma sessão
e segue o mesmo upload anônimo e processamento do vídeo gravado pelo app.

Caminho no storage:

```
capture/{installation_id}/{session_id}/{device_id}/{video_id}.webm
```

O installation id embutido no caminho permite a policy de upload anônimo validar
o pareamento, e a RLS de leitura (dono da arena via session → court → arena)
permite o dashboard acessar.

## 4. Recalc automático

Trigger `videos_recalc_session` (após mudar `processing_status`):

- enquanto a sala está aberta, vídeos pendentes mantêm a sessão em `processing`;
  quando não há processamento pendente, a sessão volta a `active` para aceitar
  outros dispositivos;
- ao encerrar a sala, novos envios são bloqueados e a sessão fica `processing`
  até os uploads/processamentos existentes terminarem; então passa para
  `finished` ou `failed`;
- sessões `scheduled`/`finished` não são recalculadas; `failed` pode ser
  recalculada após reprocessamento (migration `21_session_recovery_capture.sql`).

## 5. Worker de processamento

`services/video-worker/src/jobs/video_processing_job.py` agora aceita vídeos
sem partida:

- `claim_pending_videos` usa **left join** com `matches` e `sessions(courts(arenas))`;
- o owner é derivado do match **ou** da cadeia session → court → arena;
- caminhos de thumbnail/preview usam `{owner_id}/{match_id}` quando há partida e
  `{owner_id}/{session_id}` quando a gravação é só de captura;
- `matches` só é atualizado quando `match_id` existe (vídeos de captura apenas
  mudam `videos.processing_status`).

Recuperação de claims obsoletos:

- `mark_video_processing` também atualiza `videos.updated_at` ("lease");
- `claim_pending_videos` reivindica `pending` **e** `processing` com
  `updated_at` mais antigo que `CLAIM_TIMEOUT_SECONDS` (padrão 600s), cobrindo
  worker que caiu ou foi interrompido no meio do processamento.

## 6. Dashboard (Arena)

- **Sessões** (`/arena/sessions`): botão **Nova sessão** (escolhe quadra +
  agendada/agora).
- **Detalhe da sessão** (`/arena/sessions/:id`):
  - ao iniciar, abre a sala e exibe QR/link para conectar vários dispositivos;
  - ações por status: `scheduled` → Iniciar (vincula os devices da quadra à
    sessão); `active`/`processing` → Encerrar a sala / Marcar falha;
  - card **Gravações** com miniatura, duração, tamanho e status do vídeo
    (`uploading`/`pending`/`processing`/`ready`/`failed`).
- `useCreateSession` / `useSessionLifecycle` / `useSessionVideos` em
  `src/modules/arena/hooks/use-session-lifecycle.ts`.

Enquanto a sala estiver aberta, a sessão aceita novas gravações mesmo quando
outros vídeos já terminaram de processar. **Encerrar** fecha o link para novas
entradas; uploads já registrados podem terminar antes de a sessão ser
finalizada pelo worker.

## 7. Teste manual

1. `npm run dev` → dashboard da Arena XP (mock).
2. `/arena/sessions` → **Nova sessão** na Quadra 1 → **Iniciar agora**.
3. No detalhe da sessão, abra o link/QR da sala e entre como um dispositivo.
4. No modo captura, teste **Abrir câmera** → **Gravar** por ~10s → **Parar**;
   depois selecione um vídeo existente em **Enviar vídeo existente**.
5. Acompanhe os uploads no detalhe da sessão. Para testar vários aparelhos
   enviando ao mesmo tempo, repita o fluxo com Supabase configurado.
6. Use **Encerrar** para fechar a sala. O card **Gravações** acompanha os
   estados e as miniaturas geradas pelo mock.
7. (Player) em `/player` e `/watch/:videoId`, vídeos `processing`/`pending`
   aparecem com placeholder "Seu vídeo está sendo processado." e são
   re-buscados a cada ~5s até ficarem `ready`; o botão **Assistir** só aparece
   quando `ready`.

> **Mock:** dados e vídeo (blob/miniatura) ficam no `localStorage` do browser.
> Para compartilhar o estado entre celulares/computadores, configure o Supabase
> e rode o worker (`services/video-worker`, `python worker.py`). O `vite` já
> escuta em `0.0.0.0` (`server.host: true`); para abrir a câmera no celular, use
> HTTPS ou um contexto seguro.

## 8. Extensão do arquivo de captura (migration 21)

O celular envia o MIME do `MediaRecorder` com parâmetros (ex.:
`video/webm;codecs=vp9,opus`). A migration `21_session_recovery_capture.sql`
corrigiu o `create_capture_video` para derivar a extensão do **MIME base**
(`split_part(mime, ';', 1)`), evitando caminhos `capture/.../.bin`. O frontend
usa a mesma lógica em `getFileExtensionFromMime` (`src/modules/capture/utils/media-recorder.ts`)
ao montar o `File` do blob.

## 9. Rollback

Ver o cabeçalho de `supabase/migrations/20260807000019_session_lifecycle.sql` e
`supabase/migrations/20260807000021_session_recovery_capture.sql`.
