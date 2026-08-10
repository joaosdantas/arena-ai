# Partidas — Arena AI

## Visão geral

O módulo de partidas gerencia os jogos registrados pelo usuário. Cada partida
pertence ao usuário autenticado (`owner_id`) e carrega dados básicos (título,
modalidade, arena, data programada e descrição) que servem de contexto para o
futuro fluxo de gravação e processamento de vídeo.

Sem credenciais do Supabase no `.env`, o módulo roda em **modo mock**: as
partidas são persistidas em `localStorage` (chave `arena-ai:mock-matches`) e as
arenas vêm da lista simulada de `arenas.service.ts`. A primeira vez que o usuário
abre a lista, três partidas de exemplo são semeadas automaticamente.

### Rotas

| Rota                | Descrição                                        |
| ------------------- | ------------------------------------------------ |
| `/matches`          | Lista "Minhas partidas"                          |
| `/matches/new`      | Cria uma nova partida                            |
| `/matches/:id`      | Detalhes, status, edição e exclusão              |
| `/matches/:id/edit` | Edição dos dados básicos da partida              |

Todas as rotas são protegidas por `ProtectedRoute` + `AppLayout`.

## Modelo de dados

Tabela `public.matches` (migração `03_matches.sql` + `10_matches_details.sql`):

| Coluna          | Tipo        | Notas                                |
| --------------- | ----------- | ------------------------------------ |
| `id`            | uuid        | PK (default gen_random_uuid)         |
| `owner_id`      | uuid        | FK → `auth.users`, NOT NULL          |
| `arena_id`      | uuid        | FK → `public.arenas`, nullable       |
| `title`         | text        | Título da partida, NOT NULL          |
| `sport`         | text        | `football` / `basketball` / `volleyball` / `other` |
| `status`        | enum        | `match_status`, default `created`    |
| `is_public`     | boolean     | default `false`                      |
| `description`   | text        | adicionada na migração 10            |
| `scheduled_at`  | timestamptz | adicionada na migração 10            |
| `started_at`    | timestamptz | preenchido quando a gravação começa  |
| `finished_at`   | timestamptz | preenchido ao encerrar               |
| `video_url`     | text        | URL do vídeo processado              |
| `thumbnail_url` | text        | URL da capa                          |
| `preview_url`   | text        | URL do preview                       |
| `created_at`    | timestamptz | default `now()`                      |

### Status

`MatchStatus` segue o fluxo de captura e processamento:

```
created → recording → uploading → processing → ready
                                   ↘ failed
```

| Status       | Significado                     |
| ------------ | ------------------------------- |
| `created`    | Partida agendada/criada         |
| `recording`  | Gravação em andamento           |
| `uploading`  | Vídeo sendo enviado             |
| `processing` | Vídeo em processamento          |
| `ready`      | Vídeo pronto para compartilhar  |
| `failed`     | Ocorreu uma falha no processo   |

## Arquitetura

```
src/modules/matches/
  components/
    match-status-badge.tsx  → badge colorido por status (6 estados)
    match-card.tsx          → card de listagem (título, modalidade, arena, data, status)
    match-card-skeleton.tsx → skeleton de loading
    arena-select.tsx        → dropdown de arenas (via useArenas)
    match-form.tsx          → formulário reutilizável (criar/editar)
  hooks/
    use-matches.ts          → useMatches, useMatch, useCreateMatch,
                              useUpdateMatch, useUpdateMatchStatus, useDeleteMatch
    use-arenas.ts           → useArenas
  pages/
    matches-page.tsx        → "Minhas partidas"
    new-match-page.tsx      → criação
    match-detail-page.tsx   → detalhes + status + exclusão
    match-edit-page.tsx     → edição
  schemas/
    match.schema.ts         → matchFormSchema (Zod) + MatchFormInput
  services/
    match.service.ts        → domínio: alterna entre mock e Supabase
    mock-matches.ts         → store mock em localStorage
  types/
    match.types.ts          → Match, MatchStatus, SportType, MatchFormData

src/services/
  matches.service.ts        → acesso Supabase (createMatch, getMyMatches,
                              getMatchById, updateMatch, updateMatchStatus,
                              deleteMatch) com relation arena
  arenas.service.ts         → getArenas, createArena (+ fallback mock)

src/types/
  matches.ts                → MatchRow, MatchInsert/Update, MatchWithRelations
  database.ts               → tipagem gerada da tabela matches (atualizada
                              com description e scheduled_at)
```

O `match.service.ts` de domínio decide o backend: se `isSupabaseConfigured()`
for `false`, delega ao `mockMatchStore` (com `mockDelay`); caso contrário,
converte entre o `MatchFormData` da UI e os `MatchRow`/`CreateMatchInput` do
Supabase.

### Hooks

```ts
const { data: matches, isLoading, isError, refetch } = useMatches()      // lista do usuário
const { data: match } = useMatch(id)                                      // detalhe com arena
const createMutation = useCreateMatch()                                   // invalida listas
const updateMutation = useUpdateMatch(id)                                 // invalida lista + detalhe
const statusMutation = useUpdateMatchStatus(id)                           // invalida lista + detalhe
const deleteMutation = useDeleteMatch()                                   // invalida listas
const { data: arenas } = useArenas()                                      // lista de arenas
```

Query keys: `matchKeys.list('mine')` e `matchKeys.detail(id)` sob o prefixo
`['matches']`. Mutations invalidam os caches corretamente após o sucesso.

### Formulário

`matchFormSchema` (Zod) valida:

- `title` — obrigatório, 3 a 120 caracteres.
- `sport` — enum `football | basketball | volleyball | other`.
- `arenaId` — obrigatório.
- `description` — opcional, até 500 caracteres.
- `scheduledDate` — obrigatório (datetime-local).

O `MatchForm` é usado tanto na criação (`NewMatchPage`) quanto na edição
(`MatchEditPage`, com `defaultValues` convertidos a partir da partida carregada).

## Segurança

- RLS em `public.matches` garante que o usuário só acesse partidas onde
  `owner_id = auth.uid()`.
- `createMatch()` sempre insere `owner_id` a partir da sessão
  (`getRequiredUserId`), nunca de um campo do cliente.
- `getMyMatches()` filtra por `owner_id` no servidor.
- Arenas são leitura pública (policy `arenas_select_public`).

## Como testar

1. Inicie o app com `npm run dev`.
2. Entre com uma conta (ou use o modo mock sem credenciais no `.env`).
3. **Criar**: em `/matches/new`, preencha o formulário (a arena vem da lista)
   e salve — a partida é criada com status `created` e você é redirecionado
   para os detalhes.
4. **Listar**: `/matches` mostra "Minhas partidas" com status, modalidade,
   arena e data; estados de loading/erro/vazio são exibidos.
5. **Detalhes**: `/matches/:id` mostra as informações, permite alterar o
   status e exibe placeholders de vídeo, thumbnail, melhores momentos e
   jogadores.
6. **Editar**: use "Editar" nos detalhes para alterar os dados básicos.
7. **Excluir**: use "Excluir" (confirmação via `window.confirm`) — após
   excluir, retorna à lista.

## Ajustes no Supabase

Ao conectar o Supabase real, rode as migrations:

```
supabase db push
```

A migration `20260807000010_matches_details.sql` deve ser aplicada para criar
as colunas `description` e `scheduled_at`. Verifique se a policy de select das
partidas existe (`matches_select_owner`) e que a tabela `public.arenas` possui
dados para o `ArenaSelect`.

## Fora do escopo

Gravação de câmera, upload de vídeo, IA, processamento e geração de
melhores momentos **não são implementados** neste módulo — ficam como
placeholders na página de detalhes (`MatchVideosSection` e blocos de
placeholder) para uma próxima etapa.
