# Arena AI — Video Worker

Worker de processamento de vídeos. Depois que o upload é concluído, o app cria uma
tarefa (`videos.processing_status = 'pending'`); o worker coleta essas tarefas,
baixa o vídeo, gera thumbnail e preview e atualiza o banco.

## Como rodar localmente

Requisitos: Python 3.12, FFmpeg no PATH.

```bash
cd services/video-worker
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
```

Configure as variáveis (copie `.env.example` para `.env` e preencha):

```bash
cp .env.example .env
```

Execute uma vez (processa as tarefas pendentes e encerra):

```bash
python worker.py --once
```

Ou execute em loop (modo padrão):

```bash
python worker.py
```

## Estrutura

```
services/video-worker/
├── worker.py                     # loop de polling e entrada do worker
├── requirements.txt
├── .env.example
└── src/
    ├── config/settings.py        # carregamento e validação de configuração
    ├── jobs/video_processing_job.py   # orquestra download → processar → upload → update
    ├── processor/video_processor.py   # duração, metadata, thumbnail, preview
    ├── storage/supabase_storage.py    # cliente Supabase (service role) e Storage
    └── utils/logger.py                # logs estruturados
```

## Fluxo

```
Upload concluído
      │  app cria registro: videos.processing_status = 'pending'
      ▼
Worker (polling a cada POLL_INTERVAL_SECONDS)
      │  reivindica a tarefa: 'pending' → 'processing'
      ▼
Baixa o vídeo original do bucket "videos" (caminho em original_url)
      ▼
Processa
      │  get_video_metadata / get_video_duration
      │  extract_thumbnail  (frame ~10%, bucket "thumbnails")
      │  generate_preview   (15s do início, bucket "videos/previews")
      ▼
Atualiza banco
      │  videos: duration, thumbnail_url, preview_url, processing_status = 'ready'
      │  matches: status = 'ready'
      ▼
Registra logs (início / fim / erro)
```
