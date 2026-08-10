# Processamento de vídeos (video worker)

Pipeline inicial que transforma o vídeo bruto enviado no app em conteúdo
apresentável: thumbnail, preview de 15s e metadados. Não há análise de
IA/tracking/reconhecimento de jogadores nesta etapa.

## Arquitetura

```
Upload (frontend)
      │  videos.original_url = caminho no bucket "videos"
      │  videos.processing_status = 'pending'
      │  matches.status = 'processing'
      ▼
video worker (services/video-worker/)
      │  polling: videos.processing_status = 'pending'
      │  reivindica: -> 'processing'
      ▼
Download do original (Storage bucket "videos", caminho em original_url)
      ▼
processamento (local, FFmpeg + OpenCV)
      │  get_video_metadata  -> duração, resolução, fps, codec
      │  extract_thumbnail   -> frame ~10% (JPEG)
      │  generate_preview    -> 15s do início (H.264, max 480px de largura)
      ▼
Upload dos artefatos
      │  thumbnails/{owner}/{match}/thumbnail.jpg   (bucket público "thumbnails")
      │  videos/previews/{owner}/{match}/preview.mp4 (bucket "videos")
      ▼
Update no banco
      │  videos: duration, width, height, fps, codec, thumbnail_url,
      │          preview_url, processing_status = 'ready'
      │  matches: status = 'ready', thumbnail_url, preview_url
```

O `thumbnail_url` aponta para o bucket público `thumbnails` e é servido
diretamente. O `preview_url` fica no bucket `videos`, mas a policy
`videos_previews_select_public` (migration 12) permite leitura pública do
prefixo `previews/`.

## Execução local

Requisitos: Python 3.12, FFmpeg no `PATH`.

```bash
cd services/video-worker
python -m venv .venv
.venv\Scripts\activate   # Windows
source .venv/bin/activate # Linux / macOS
pip install -r requirements.txt

cp .env.example .env     # preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
python worker.py --once  # processa pendentes e encerra
python worker.py         # loop contínuo (poll a cada POLL_INTERVAL_SECONDS)
```

> O worker usa a **service role key** do Supabase, que ignora o RLS. Ela deve
> viver apenas no ambiente do worker — nunca no bundle do frontend.

### Variáveis

| Variável                     | Padrão | Descrição                                   |
| ---------------------------- | ------ | ------------------------------------------- |
| `SUPABASE_URL`               | —      | URL do projeto Supabase (obrigatório)       |
| `SUPABASE_SERVICE_ROLE_KEY`  | —      | Service role key (obrigatório)              |
| `POLL_INTERVAL_SECONDS`      | 15     | Intervalo entre rodadas de polling          |
| `WORKER_BATCH_SIZE`          | 5      | Máximo de vídeos por rodada                 |
| `THUMBNAIL_POSITION_RATIO`   | 0.10   | Posição do thumbnail (fração da duração)    |
| `PREVIEW_DURATION_SECONDS`   | 15     | Duração do preview, a partir do início      |

## Regras de negócio

- **Thumbnail**: frame na posição `duração * THUMBNAIL_POSITION_RATIO`
  (mínimo 0.5s para vídeos muito curtos). Formato JPEG.
- **Preview**: `PREVIEW_DURATION_SECONDS` segundos do início do vídeo,
  re-codificado em H.264 (yuv420p, `+faststart`), largura máxima 480px.
- **Status**: erro em qualquer etapa marca `videos.processing_status = 'failed'`
  e `matches.status = 'failed'`, com log do erro e limpeza de artefatos parciais.
- **Idempotência**: o polling reivindica via update `pending -> processing`,
  então dois workers não processam o mesmo vídeo simultaneamente.

## Failover e limitações

- Vídeos cujo `original_url` foi perdido (ex.: Storage reiniciado) falham com
  log claro e marcam a tarefa como `failed`.
- O processamento é local/sequencial por worker; para escala horizontal, cada
  worker novo adiciona capacidade sem conflito graças ao claim via update.

## Próximos passos (IA)

O pipeline está pronto para receber análises de IA — detecção de jogadores,
linhas, tracking por time e estatísticas — sem alterar o fluxo de upload:
basta adicionar um estágio no `video_processing_job.py` antes do upload dos
artefatos.
