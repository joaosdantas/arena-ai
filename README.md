# Arena AI

Aplicação web para gestão de partidas e arenas esportivas: criação de partidas, upload de gravações, player de vídeo e compartilhamento público via link.

## Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, TanStack Query, React Hook Form + Zod
- **Backend / Banco:** Supabase (Auth, Postgres, Storage)
- **UI:** Radix UI + shadcn/ui, lucide-react, sonner (toasts)
- **Processamento de vídeo:** worker em Python (`services/video-worker/`) com FFmpeg + OpenCV

## Estrutura

```
src/
├── components/   # componentes de UI reutilizáveis
├── contexts/     # AuthContext, ThemeContext
├── hooks/        # hooks customizados
├── layouts/      # layouts responsivos (mobile/tablet/desktop)
├── lib/          # clientes, env, utilitários
├── modules/      # módulos de negócio
├── pages/        # páginas (rotas)
├── routes/       # definição de rotas
├── services/     # clientes de API (Supabase)
├── styles/       # tokens de tema
├── types/        # tipos compartilhados
└── utils/        # helpers

services/
└── video-worker/ # pipeline de processamento de vídeo (Python)
```

## Como rodar

### Frontend

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env` e preencha:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_NAME=Arena AI
VITE_API_MOCK=true
```

Com `VITE_API_MOCK=true` o app roda em modo mock, sem depender do Supabase.

### Video worker (processamento de vídeo)

Requisitos: Python 3.12 e FFmpeg no `PATH`.

```bash
cd services/video-worker
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
cp .env.example .env         # preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY

python worker.py --once      # processa pendentes e encerra
python worker.py             # loop contínuo
```

> A `SUPABASE_SERVICE_ROLE_KEY` deve viver apenas no ambiente do worker — nunca no bundle do frontend.

### Supabase

As migrations e o seed estão em `supabase/`:

```bash
supabase db types typescript --schema public > src/types/database.ts
```

## Scripts

| Comando            | Descrição                          |
| ------------------ | ---------------------------------- |
| `npm run dev`      | Servidor de desenvolvimento (Vite) |
| `npm run build`    | Build de produção (tsc + vite)     |
| `npm run lint`     | ESLint / Oxlint                    |
| `npm run format`   | Prettier                           |
| `npm run typecheck`| Verificação de tipos (tsc)         |

## Documentação

Detalhes de fluxo, domínio e arquitetura em [`docs/`](docs/).
