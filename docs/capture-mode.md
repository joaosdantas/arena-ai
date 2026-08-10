# Capture Mode — Arena AI

Pareamento **real** de um celular com um Capture Device via QR Code, com
identidade persistente do aparelho e heartbeat para status online/offline no
dashboard da arena.

Esta etapa **não** implementa gravação, upload, processamento, IA, highlights
ou multicâmera. O objetivo é apenas:

1. QR Code real (scannable) apontando para `/capture/:pairingToken`.
2. Pareamento real do celular com o dispositivo.
3. Identidade persistente do celular (`capture_installation_id`).
4. Heartbeat (15s) → status online/offline derivado de `last_seen` (< 30s).
5. Despareamento pela administração do dispositivo.

---

## 1. Pairing token

O QR Code **não** usa o UUID interno nem dados do dono. Cada `capture_devices`
ganha um `pairing_token`:

- único (`unique` na tabela);
- aleatório (64 hex via `gen_random_uuid()` no backfill; base64url no app);
- usado apenas para localizar o dispositivo no pareamento;
- nunca expõe `owner_id`, e-mails, credenciais ou installation id.

O QR codifica a URL:

```
{origin}/capture/{pairingToken}
```

Ex.: `https://app.arena-ai.com/capture/8fK29xP...`

## 2. Fluxo de pareamento

```
Arena cadastra Capture Device          → pairing_token + qr_code gerados
QR é exibido/impresso (suporte físico) → codifica /capture/:pairingToken
Celular escaneia e abre a URL          → rota pública CapturePairingPage
Sistema identifica o dispositivo       → get_capture_device_by_token()
Usuário confirma [Conectar câmera]     → pair_capture_device()
Celular fica vinculado                 → paired=true + capture_installation_id
Redireciona para /capture/device/:id   → CaptureDevicePage (modo captura)
```

A página `/capture` é **pública** (o celular não está logado) e usa apenas
RPCs `SECURITY DEFINER` que devolvem dados mínimos e validam o token.

### Rotas públicas

| Rota                          | Descrição                                     |
| ----------------------------- | --------------------------------------------- |
| `/capture/:pairingToken`      | Confirmação de pareamento (QR escaneado)      |
| `/capture/device/:id`         | Modo captura (câmera + status + heartbeat)    |

## 3. Identidade do celular (capture_installation_id)

`capture_installation_id` é um token aleatório gerado uma única vez e guardado
em `localStorage` (`arena-ai:capture-installation-id`). Ele identifica o
aparelho físico/browser — não é fingerprint, não coleta dados do dispositivo.

- Após o pareamento, o celular é reconhecido mesmo após **atualizar a página**.
- Limpar os dados do navegador gera um novo installation id; o dispositivo fica
  "pareado a outro celular" e precisa ser despareado no dashboard para re-parear.

## 4. Estados

Dois eixos **independentes** (pareamento ≠ status online):

| Eixo | Valores | Fonte |
| --- | --- | --- |
| Pareamento | `unpaired` / `pairing` (transitório) / `paired` | coluna `paired` |
| Presença | `online` (< 30s desde `last_seen`) / `offline` | derivada de `last_seen` |

Um dispositivo pode estar: `paired + offline` (pareado, celular fechado),
`paired + online`, `unpaired + offline`.

## 5. Heartbeat

Enquanto o modo captura está aberto (`/capture/device/:id`), o celular envia
heartbeat a cada **15s** via `send_capture_device_heartbeat()`:

- atualiza `last_seen = now()`;
- valida que o `capture_installation_id` enviado confere com o pareado;
- **preserva** `recording`/`uploading` (durante gravação/envio) e volta a
  `ready` nos demais casos;
- quando o celular fecha/abandona, o heartbeat para e o dashboard marca
  **offline** após 30s (limiar `CAPTURE_DEVICE_OFFLINE_AFTER_MS`).

O dashboard re-consulta os dispositivos a cada 15s (`refetchInterval`), então o
status reflete o backend, não estado local do React.

## 6. Serviços e hooks

`src/services/capture-device.service.ts` (comum, alterna mock/Supabase):

| Método | Supabase | Mock |
| --- | --- | --- |
| `getByPairingToken(token, installationId)` | RPC `get_capture_device_by_token` | `mockArenaStore.findDeviceByPairingToken` |
| `getByDeviceId(id, installationId)` | RPC `get_capture_device_by_id` | `mockArenaStore.getDeviceById` |
| `pairDevice(token, installationId)` | RPC `pair_capture_device` | `mockArenaStore.pairDevice` |
| `sendHeartbeat(id, installationId)` | RPC `send_capture_device_heartbeat` | `mockArenaStore.sendHeartbeat` |
| `setStatus(id, installationId, status)` | RPC `set_capture_device_status` | `mockArenaStore.setDeviceStatus` |
| `unpairDevice(id)` | update autenticado | `mockArenaStore.unpairDevice` |
| `getDeviceStatus(id)` | leitura | mock store |

Hooks (TanStack Query para queries, mutation para pareamento):

- `useCaptureDevice(token, installationId)` / `useCaptureDeviceById(id, installationId)`
- `usePairCaptureDevice()` — mutation de pareamento
- `useCaptureHeartbeat(deviceId, installationId)` — intervalo de 15s + presença
- `useActiveCaptureSession(deviceId, installationId)` — sessão ativa vinculada
- `useUnpairDevice(arenaId)` — desconexão pelo dashboard (invalida queries)

## 7. Mock mode (sem Supabase)

Sem credenciais no `.env`, tudo roda em `localStorage`
(`arena-ai:mock-arena-dashboard`). O mock simula lookup por token, pareamento,
heartbeat e status online/offline com o mesmo contrato do Supabase.

> **Limitação:** no mock, os dados vivem no `localStorage` do browser. Para
> testar o fluxo completo **entre dois aparelhos** é necessário configurar o
> Supabase. No mock, o fluxo é simulado no mesmo browser (abrir o link de
> pareamento → conectar → heartbeat → dashboard mostra online).

## 8. Gravação e upload (resumo)

Desde a migration `20260807000019_session_lifecycle.sql`, o modo captura grava
via `MediaRecorder` e envia a gravação quando a **sessão está ativa**. O fluxo
completo (sessões, RPCs, storage e worker) está documentado em
[`session-lifecycle.md`](./session-lifecycle.md).

## 9. Segurança

- As RPCs públicas devolvem **somente**: `id`, `name`, `position`,
  `court_name`, `arena_name`, `paired` e `is_mine`. Nunca `owner_id`, e-mails
  ou o `capture_installation_id` de outro aparelho.
- Pareamento e heartbeat validam o token/installation id; não dá para assumir
  um dispositivo já pareado a outro installation.
- `pair_capture_device` é idempotente para o mesmo installation id.
- A RLS por proprietário da arena (`arenas.owner_id`) fica para etapa futura;
  a policy atual de `capture_devices` continua leitura pública, como nas demais
  tabelas do domínio novo.

## 9. Como testar (computador + celular)

Com **Supabase configurado** (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`):

1. **Computador:** acesse `/arena/devices` → crie/veja um Capture Device.
2. O card mostra o **QR Code** real e o link `/capture/:pairingToken`.
3. **Celular:** escaneie o QR (ou abra o link) → tela de confirmação com
   arena/quadra/câmera → **[Conectar câmera]**.
4. O celular redireciona para `/capture/device/:id` → **● Conectada**.
5. **Computador:** `/arena/devices` (ou dashboard) mostra **Online** em até ~15s.
6. **Fechar o modo captura no celular:** após ~30s o dashboard mostra **Offline**.
7. Reabrir `/capture/device/:id` no celular → reconhecido (installation id) → online de novo.
8. Em `/arena/devices`, **[Desconectar dispositivo]** → `paired=false`, status
   offline; o QR continua válido para novo pareamento.

### Sem Supabase (mock)

1. Rode `npm run dev` e entre (ou deixe o mock criar a Arena XP).
2. Em `/arena/devices`, copie o **link** do QR e abra no mesmo browser em outra
   aba (`/capture/:pairingToken`).
3. Confirme → `/capture/device/:id` → heartbeat → dashboard mostra **Online**.
4. Feche a aba do modo captura → após ~30s mostra **Offline**.

## 10. Migration

`supabase/migrations/20260807000018_capture_pairing.sql`

- `capture_devices`: `pairing_token` (not null, unique), `paired` (default false),
  `capture_installation_id` + índice `capture_devices_pairing_token_idx`.
- Backfill de tokens para dispositivos existentes (64 hex, URL-safe).
- RPCs `SECURITY DEFINER`: `get_capture_device_by_token`,
  `get_capture_device_by_id`, `pair_capture_device`,
  `send_capture_device_heartbeat` + grants para `anon`/`authenticated`.

## 11. Fora do escopo

IA/highlights, feed de jogadores, multicâmera sincronizada e edição. Gravação,
upload, processamento e sessões de captura já estão implementados (ver
`docs/session-lifecycle.md`).
