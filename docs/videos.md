# Vídeos — Arena AI

## Visão geral

O módulo de vídeos permite enviar e gerenciar a gravação de uma partida. O
fluxo conecta **partida** (tabela `public.matches`) → **arquivo no Storage**
(bucket `videos`) → **registro na tabela `public.videos`**, mantendo o status da
partida e do vídeo sincronizados.

Sem credenciais do Supabase no `.env`, o módulo roda em **modo mock**: o upload
é simulado com barra de progresso, o arquivo é exibido via object URL e os
registros ficam em `localStorage` (chave `arena-ai:mock-videos`).

## Fluxo de upload

```
1. Usuário seleciona/arrasta um arquivo (.mp4, .mov ou .webm, até 2GB)
        │
2. validateVideoFile() valida formato e tamanho
        │
3. matches.status = 'uploading'   (matchService.updateMatchStatus)
        │
4. Upload do arquivo para videos/{owner_id}/{match_id}/{arquivo}
        │  progresso em tempo real (XHR upload events)
        │  cancelamento via AbortController
        │
5. Cria registro em public.videos
        │  original_url  = caminho no Storage
        │  processing_status = 'processing'
        │
6. matches.status = 'processing'  (matchService.updateMatchStatus)
        │
7. Player HTML5 disponível (URL assinada gerada na leitura)
```

O `useVideoUpload(matchId)` hook orquestra todo o fluxo e expõe `state`
(`idle | uploading | success | error`), `progress`, `start(file)`, `cancel()` e
`reset()`.

> O status `uploading` do vídeo representa o momento do envio. Como o registro é
> criado somente após o arquivo estar no Storage, os registros nascem como
> `processing`; `pending`/`uploading` existem no enum para estados parciais de
> fluxos futuros.

## Estrutura do Storage

Bucket `videos` (privado), organizado por proprietário e partida:

```
videos/
  {owner_id}/
    {match_id}/
      arquivo.mp4
```

Exemplo: `videos/user123/match456/game.mp4`

- O nome do arquivo é sanitizado (`sanitizeFileName`).
- Acesso por **URL assinada** (o bucket é privado). O banco guarda o caminho no
  campo `original_url` e a URL assinada é gerada na leitura (`getSignedUrl`).
- Bucket `thumbnails` (público) fica pronto para miniaturas futuras.

## Relacionamento matches/videos

- Uma partida (`public.matches`) pode ter **vários** registros em
  `public.videos`, cada um com `match_id` (FK, `on delete cascade`).
- O app usa o vídeo mais recente da partida como "Vídeo da partida".
- Ao **excluir** um vídeo, o arquivo é removido do Storage, o registro é
  apagado e `matches.status` volta para `created`.

## Estados possíveis

### `matches.status` (tabela matches)

`created → uploading → processing → ready | failed`

### `videos.processing_status` (tabela videos)

| Status       | Significado                               |
| ------------ | ----------------------------------------- |
| `pending`    | Aguardando processamento                  |
| `uploading`  | Arquivo em envio (registro ainda não criado) |
| `processing` | Arquivo enviado, aguardando processamento |
| `ready`      | Vídeo pronto                              |
| `failed`     | Falha no processamento                    |

> Atualmente `updateVideoStatus()` já atualiza o status do registro. O passo de
> `pending/uploading/ready/failed` será alimentado por processadores futuros
> (IA/worker) — fora do escopo desta etapa.

## Arquitetura

```
src/modules/videos/
  components/
    upload-video.tsx        → drag & drop + seleção, progresso, cancelar, erro
    video-player.tsx        → player HTML5 (play/pause, seek, volume, tela cheia)
    video-status-badge.tsx  → badge por status
    match-videos-section.tsx→ seção "Vídeo da partida" na página de detalhes
  hooks/
    use-video-upload.ts     → estado/progresso/erros/sucesso do upload
    use-videos.ts           → useMatchVideo, useVideo, useDeleteVideo
  pages/
    video-details-page.tsx  → /videos/:id (player, info da partida, placeholders)
  services/
    video.service.ts        → domínio: mock vs Supabase + orquestração do fluxo
    mock-videos.ts          → registros mock em localStorage
  types/
    video.types.ts          → Video, VideoStatus, UploadProgress
  utils/
    video.validation.ts     → validação de formato/tamanho + sanitização

src/services/
  videos.service.ts         → uploadVideo, createVideoRecord, getVideosByMatch,
                              getVideoById, updateVideoStatus, deleteVideo,
                              getSignedUrl
  storage.service.ts        → uploadFile com progresso/abort, deleteFile
```

### Hooks

```ts
const { state, progress, error, start, cancel, reset } = useVideoUpload(matchId)
const { data: video } = useMatchVideo(matchId)   // vídeo mais recente da partida
const { data: video } = useVideo(id)             // vídeo por id (página de detalhes)
const deleteMutation = useDeleteVideo(matchId)   // exclui arquivo + registro
```

Query keys: `videoKeys.byMatch(matchId)` e `videoKeys.detail(id)` sob o prefixo
`['videos']`. Após o upload/exclusão, os caches de vídeo e da partida são
invalidados.

## Segurança

- **Storage** (bucket `videos`): upload/select/update/delete restritos a
  `(storage.foldername(name))[1] = auth.uid()` — cada usuário só mexe nos
  próprios arquivos.
- **Tabela `videos`**: RLS com `videos_insert/update/delete_owner` (dono da
  partida) e `videos_select_owner_or_public` (dono ou partida pública — a leitura
  pública por anon é habilitada quando a exposição pública for implementada).
- **Partida**: `matches_update_owner` garante que só o dono altera o status
  durante o upload.
- Nenhum campo de cliente define `owner_id` — o caminho no Storage é montado
  com o id da sessão (`getRequiredUserId`).

## Como testar

1. `npm run dev` e entre na conta (ou use o modo mock sem credenciais).
2. Abra uma partida em `/matches/:id` → seção **Vídeo da partida**.
3. **Sem vídeo**: aparece "Adicione a gravação da partida" com a área de
   drag & drop e o botão "Selecionar vídeo".
4. Selecione um arquivo `.mp4/.mov/.webm` — o upload inicia com nome, tamanho e
   barra de progresso; `matches.status` vira `uploading`.
5. Ao concluir: o player HTML5 aparece (play/pause, seek, volume, tela cheia),
   `matches.status` vira `processing` e o registro é criado em `videos`.
6. Abra "Página do vídeo" (`/videos/:id`) para ver player, informações da
   partida (título, data, arena) e as áreas reservadas para Highlights, Clips e
   Estatísticas.
7. Use "Excluir" para remover o vídeo (arquivo + registro) — a partida volta
   para o status `created`.
8. Teste o cancelamento durante o upload e um arquivo inválido (ex.: `.txt`) —
   a validação mostra mensagem amigável.

## Ajustes no Supabase

Rode as migrations:

```
supabase db push
```

A migration `20260807000011_videos_upload_status.sql` adiciona o valor
`uploading` ao enum `video_processing_status` e as políticas de update/delete
no bucket `videos` (necessárias para excluir arquivos). Verifique também:

- Bucket `videos` criado e **privado** (migration 08).
- Policies do bucket `videos` (insert/select/update/delete) restritas ao
  primeiro nível do caminho = `auth.uid()`.
- Policy `videos_delete_owner` na tabela `videos`.

## Fora do escopo

Processamento de vídeo, geração de thumbnail automática, IA, highlights,
tracking e análise esportiva **não são implementados** — os status
`pending/ready/failed`, a coluna `thumbnail_url` e as áreas de
Highlights/Clips/Estatísticas na página do vídeo estão preparados para recebê-los
em uma próxima etapa.
