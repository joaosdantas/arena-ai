# Banco de Dados — Arena AI

## Visão geral

O banco de dados é gerenciado pelo **Supabase** (PostgreSQL + Auth + Storage).
Toda a estrutura está versionada em migrations SQL em `supabase/migrations/`.

### Diagrama de relacionamentos

```
auth.users ──(1:1)── public.users
                         │
                         │ 1:N (owner_id)
                         ▼
                     matches ──(N:1)── arenas
                     /    \
                  1:N      1:N
                 /          \
            players       videos
                             │
                           1:N
                             │
                           clips
```

| Relação           | Tipo | Referência                        |
| ----------------- | ---- | --------------------------------- |
| users → matches   | 1:N  | `matches.owner_id` → `users.id`   |
| arenas → matches  | 1:N  | `matches.arena_id` → `arenas.id`  |
| matches → players | 1:N  | `players.match_id` → `matches.id` |
| matches → videos  | 1:N  | `videos.match_id` → `matches.id`  |
| matches → clips   | 1:N  | `clips.match_id` → `matches.id`   |

`users.id` referencia `auth.users.id` e o perfil é criado automaticamente no
signup através do trigger `on_auth_user_created`.

---

## Tabelas

### `users`

Perfil público do usuário autenticado.

| Coluna       | Tipo        | Observação                            |
| ------------ | ----------- | ------------------------------------- |
| `id`         | uuid PK     | referência a `auth.users.id`, cascade |
| `name`       | text        | obrigatório                           |
| `avatar_url` | text        | opcional                              |
| `created_at` | timestamptz | default `now()`                       |

### `arenas`

Locais onde as partidas acontecem.

| Coluna       | Tipo        | Observação                  |
| ------------ | ----------- | --------------------------- |
| `id`         | uuid PK     | default `gen_random_uuid()` |
| `name`       | text        | obrigatório                 |
| `city`       | text        | opcional                    |
| `address`    | text        | opcional                    |
| `cover_url`  | text        | opcional                    |
| `created_at` | timestamptz | default `now()`             |

### `matches`

Partidas esportivas. Núcleo do domínio.

| Coluna          | Tipo           | Observação                  |
| --------------- | -------------- | --------------------------- |
| `id`            | uuid PK        | default `gen_random_uuid()` |
| `owner_id`      | uuid FK        | → `users.id`, cascade       |
| `arena_id`      | uuid FK        | → `arenas.id`, set null     |
| `title`         | text           | obrigatório                 |
| `sport`         | text           | obrigatório                 |
| `status`        | `match_status` | enum, default `created`     |
| `is_public`     | boolean        | default `false`             |
| `started_at`    | timestamptz    | opcional                    |
| `finished_at`   | timestamptz    | opcional                    |
| `video_url`     | text           | opcional                    |
| `thumbnail_url` | text           | opcional                    |
| `preview_url`   | text           | opcional                    |
| `created_at`    | timestamptz    | default `now()`             |

**`match_status`**: `created` → `recording` → `uploading` → `processing` → `ready` / `failed`

### `players`

Jogadores participantes de uma partida.

| Coluna       | Tipo        | Observação                                          |
| ------------ | ----------- | --------------------------------------------------- |
| `id`         | uuid PK     | default `gen_random_uuid()`                         |
| `match_id`   | uuid FK     | → `matches.id`, cascade                             |
| `name`       | text        | obrigatório                                         |
| `team`       | text        | opcional (identifica o time no contexto da partida) |
| `created_at` | timestamptz | default `now()`                                     |

### `videos`

Registro de vídeos de uma partida (upload + status de processamento).

| Coluna              | Tipo                      | Observação                                                  |
| ------------------- | ------------------------- | ----------------------------------------------------------- |
| `id`                | uuid PK                   | default `gen_random_uuid()`                                 |
| `match_id`          | uuid FK                   | → `matches.id`, cascade                                     |
| `original_url`      | text                      | caminho no Storage `videos/{owner_id}/{match_id}/{arquivo}` |
| `thumbnail_url`     | text                      | opcional                                                    |
| `duration`          | integer                   | opcional (segundos)                                         |
| `processing_status` | `video_processing_status` | enum, default `pending`                                     |
| `created_at`        | timestamptz               | default `now()`                                             |

**`video_processing_status`**: `pending` → `processing` → `ready` / `failed`

### `clips`

Recortes de momentos de uma partida.

| Coluna       | Tipo        | Observação                  |
| ------------ | ----------- | --------------------------- |
| `id`         | uuid PK     | default `gen_random_uuid()` |
| `match_id`   | uuid FK     | → `matches.id`, cascade     |
| `title`      | text        | obrigatório                 |
| `start_time` | integer     | segundos, ≥ 0               |
| `end_time`   | integer     | segundos, > `start_time`    |
| `video_url`  | text        | opcional                    |
| `created_at` | timestamptz | default `now()`             |

---

## Índices

Consultas frequentes cobertas por índices (migration `07_indexes.sql`):

- `matches(owner_id)`, `matches(arena_id)`, `matches(status)`
- `players(match_id)`
- `videos(match_id)`
- `clips(match_id)`

---

## Regras de acesso (RLS)

O **Row Level Security está ativado em todas as tabelas**. Sem política que
permita, nenhum dado é acessível (nem por `anon`, nem por `authenticated`).

### Matriz de acesso

| Recurso | anon (público)                | authenticated (dono)                 |
| ------- | ----------------------------- | ------------------------------------ |
| users   | —                             | ler/editar o próprio perfil          |
| arenas  | ler todas                     | ler + criar                          |
| matches | ler apenas `is_public = true` | ler/criar/editar/deletar as próprias |
| players | ler de partidas públicas      | CRUD de partidas próprias            |
| videos  | ler de partidas públicas      | CRUD de partidas próprias            |
| clips   | ler de partidas públicas      | CRUD de partidas próprias            |

Regras principais:

1. **Proprietário** — operações filtradas por `owner_id = auth.uid()`.
2. **Público** — apenas leitura de registros de partidas com `is_public = true`.
3. **Regra derivada** — `players`, `videos` e `clips` herdam o acesso da partida
   através de subquery em `matches` (nunca acessam dados de partidas de terceiros).

### Storage

| Bucket       | Visibilidade | Política                                                              |
| ------------ | ------------ | --------------------------------------------------------------------- |
| `videos`     | privado      | autenticado envia no próprio diretório; somente o proprietário acessa |
| `thumbnails` | público      | leitura pública; upload por autenticados                              |
| `avatars`    | privado      | usuário gerencia o próprio avatar                                     |

Convenção de caminhos:

```
videos/{owner_id}/{match_id}/{arquivo}
thumbnails/{owner_id}/{match_id}/{arquivo}
avatars/{user_id}/{arquivo}
```

---

## Fluxo de dados

```
1. Usuário se autentica (Supabase Auth)
   └─ trigger on_auth_user_created cria o perfil em public.users

2. Cria partida (matchesService.createMatch)
   └─ owner_id = auth.uid() → partida criada com status 'created'

3. Vincula arena (matches.arena_id) e jogadores (players)

4. Upload do vídeo (videosService.uploadVideo)
   └─ bucket privado 'videos' → caminho videos/{owner_id}/{match_id}/...

5. Registro do vídeo (videosService.createVideoRecord)
   └─ linha em videos com processing_status = 'pending'
   └─ Edge Function (futura) processa e atualiza:
        videos.processing_status → 'ready'
        matches.status → 'ready'

6. Compartilhamento
   └─ se matches.is_public = true → anon pode ler partida, players, videos e clips
```

---

## Como aplicar as migrations

### Opção A — Supabase local (Docker, via CLI)

```bash
npm i -D supabase          # instala a CLI
supabase init              # caso o repositório ainda não tenha config
supabase start             # sobe o Postgres + Studio local
supabase db reset          # aplica migrations + seed (supabase/seed/seed.sql)
```

> O `supabase db reset` recria o banco local do zero aplicando todas as
> migrations em ordem cronológica. Para o seed ser executado automaticamente,
> a CLI espera o arquivo `supabase/seed.sql`; copie `supabase/seed/seed.sql`
> para `supabase/seed.sql` (ou aplique manualmente via `supabase db push` + SQL).

### Opção B — Projeto hospedado (production)

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push        # aplica migrations no banco remoto
```

O seed pode ser executado no **SQL Editor** do dashboard usando o conteúdo de
`supabase/seed/seed.sql`.

---

## Como conectar a aplicação ao Supabase

1. Copie o arquivo `.env.example` para `.env`:

   ```bash
   cp .env.example .env
   ```

2. Preencha as credenciais do projeto (Dashboard → Settings → API):

   ```env
   VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
   ```

3. Configure `VITE_API_MOCK=false` para desativar os dados fictícios.

4. O cliente é criado em `src/services/supabase.ts` e consumido pelos serviços
   de acesso a dados (`src/services/*.service.ts`).

5. (Opcional) Regenerar os tipos do banco:

   ```bash
   npm run db:types
   ```
