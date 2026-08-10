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

## 2. RPCs públicas (o celular não está logado)

Todas `SECURITY DEFINER`, executáveis por `anon` e `authenticated`, validando o
pareamento (`capture_installation_id`) e a sessão antes de qualquer mudança.

| RPC | O que faz |
| --- | --- |
| `get_active_capture_session(device, installation)` | devolve a sessão vinculada ao dispositivo (quadra/arena) |
| `set_capture_device_status(device, installation, status)` | muda o status do dispositivo (`ready`/`recording`/`uploading`/`error`) |
| `create_capture_video(device, installation, session, mime, size, duration, match?)` | cria o vídeo `uploading` e devolve `video_id` + `storage_path` |
| `update_capture_video_status(video, installation, status)` | marca `pending`/`uploading`/`failed` após o upload |
| `recalculate_session_status(session)` | recalcula o status da sessão a partir dos vídeos (dashboard) |

A criação valida que: o device está pareado com a instalação; a sessão existe,
está `active` e pertence à **mesma quadra** do device; se um `match_id` for
informado, ele pertence à sessão.

## 3. Fluxo no celular (`CaptureRecorder`)

1. `useActiveCaptureSession` (poll 15s) informa se há sessão ativa.
2. `set_capture_device_status(..., 'recording')` → `MediaRecorder` grava.
3. Ao parar: `set_capture_device_status(..., 'uploading')`.
4. `create_capture_video(...)` devolve `storage_path`.
5. Upload **anônimo** para `videos/capture/...` (política de storage dedicada).
6. `update_capture_video_status(..., 'pending')` → o worker assume.
7. `set_capture_device_status(..., 'ready')`.

Caminho no storage:

```
capture/{installation_id}/{session_id}/{device_id}/{video_id}.webm
```

O installation id embutido no caminho permite a policy de upload anônimo validar
o pareamento, e a RLS de leitura (dono da arena via session → court → arena)
permite o dashboard acessar.

## 4. Recalc automático

Trigger `videos_recalc_session` (após mudar `processing_status`):

- vídeo **falho** → sessão `active`/`processing` vira `failed` imediatamente;
- senão, `recalculate_session_status`:
  - algum vídeo `pending`/`uploading`/`processing` → sessão `processing`;
  - todos `ready` → `finished` (preenche `ended_at`);
  - sessões `scheduled`/`finished` não são recalculadas; **`failed` é recalculável**
    (migration `21_session_recovery_capture.sql`): se os vídeos forem reprocessados
    com sucesso, a sessão sai de `failed` e vai para `finished`/`processing`.

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
  - ações por status: `scheduled` → Iniciar (vincula os devices da quadra à
    sessão); `active`/`processing` → Encerrar / Marcar falha;
  - card **Gravações** com miniatura, duração, tamanho e status do vídeo
    (`uploading`/`pending`/`processing`/`ready`/`failed`).
- `useCreateSession` / `useSessionLifecycle` / `useSessionVideos` em
  `src/modules/arena/hooks/use-session-lifecycle.ts`.

## 7. Teste manual (mock, mesmo browser)

1. `npm run dev` → dashboard da Arena XP (mock).
2. `/arena/sessions` → **Nova sessão** na Quadra 1 → **Iniciar agora**.
3. `/arena/devices` → copie o link do QR da Camera Lateral Principal e abra em
   outra aba → Conectar → `/capture/device/:id`.
4. Na aba do modo captura: **Abrir câmera** → **Gravar** por ~10s → **Parar**.
5. Acompanhe o progresso de upload → "Gravação enviada e em processamento".
6. Volte ao dashboard: a sessão vira **Processando** e depois **Finalizada**, e
   o card **Gravações** mostra o vídeo `ready` com miniatura (gerada pelo mock).
7. (Player) em `/player` e `/watch/:videoId`, vídeos `processing`/`pending`
   aparecem com placeholder "Seu vídeo está sendo processado." e são
   re-buscados a cada ~5s até ficarem `ready`; o botão **Assistir** só aparece
   quando `ready`.

> **Mock:** dados e vídeo (blob/miniatura) ficam no `localStorage` do browser.
> Para o fluxo entre celular + computador de verdade, configure o Supabase e
> rode o worker (`services/video-worker`, `python worker.py`). O `vite` já
> escuta em `0.0.0.0` (`server.host: true`), então o celular acessa via IP da
> máquina na mesma rede.

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
