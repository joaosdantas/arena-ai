# Dashboard da Arena — Arena AI

## Visão geral

O módulo de arena introduz o conceito de **operação por arena**: uma arena
agrupa quadras, cada quadra agrupa dispositivos de captura (câmeras) e as
sessões de captura acontecem por quadra. O dashboard dá uma visão operacional
do dono da arena em um layout próprio (sidebar + header próprios), separado do
app principal.

Sem credenciais do Supabase no `.env`, o módulo roda em **modo mock**: a
estrutura é persistida em `localStorage` (chave `arena-ai:mock-arena-dashboard`)
e, na primeira visita, uma arena de exemplo ("Arena XP") é semeada para o
usuário autenticado.

### Rotas

| Rota                 | Descrição                                        |
| -------------------- | ------------------------------------------------ |
| `/arena`             | Dashboard da arena (visão geral)                 |
| `/arena/new`         | Wizard de criação da primeira estrutura          |
| `/arena/courts`      | Lista de quadras                                 |
| `/arena/devices`     | Dispositivos de captura + QR Code de pareamento  |
| `/arena/sessions`    | Sessões de captura (com filtro por status)       |
| `/arena/sessions/:id`| Detalhe da sessão (dispositivos + partidas)      |
| `/arena/settings`    | Dados da arena (somente leitura por enquanto)    |

Todas as rotas são protegidas por `ProtectedRoute`. O `ArenaAccessGuard`
redireciona para `/arena/new` quando o usuário ainda não tem arena.

## Fluxo de acesso

1. O usuário acessa "Minha Arena" pelo menu do usuário (header).
2. `useCurrentArena` busca a arena do `owner_id`.
3. Sem arena → `NewArenaPage` (wizard de 4 etapas). Com arena → `ArenaLayout`.
4. Após criar, o wizard redireciona para `/arena` e a arena entra no cache.

## Arquitetura

```
src/modules/arena/
  components/
    arena-nav.ts                 → navegação da sidebar (arenaNavigation)
    arena-layout.tsx             → layout próprio (sidebar + header + Outlet)
    arena-header.tsx             → header com trigger, nome da arena e UserMenu
    arena-access-guard.tsx       → redireciona para /arena/new se não houver arena
    arena-status-badge.tsx       → badges de status (dispositivo/sessão/quadra)
    capture-device-status.tsx    → linha de status com "última conexão" (polling)
    court-card.tsx               → card de quadra (modalidade + nº de câmeras)
    capture-device-card.tsx      → card de dispositivo com QR Code copiável
    session-card.tsx             → card de sessão (link para detalhe)
    session-overview.tsx         → detalhe da sessão (info, dispositivos, partidas)
    new-arena-wizard.tsx         → wizard de 4 etapas (Zod + react-hook-form)
  hooks/
    use-arena.ts                 → useCurrentArena + arenaDashboardKeys
    use-arena-dashboard.ts       → useArenaDashboard (summary)
    use-courts.ts                → useCourts
    use-capture-devices.ts       → useCaptureDevices
    use-sessions.ts              → useSessions + useSession
    use-create-arena.ts          → useCreateArena (mutation)
  pages/
    arena-dashboard-page.tsx     → stats + status dos dispositivos + sessões recentes
    arena-courts-page.tsx
    arena-devices-page.tsx
    arena-sessions-page.tsx      → lista com filtro por status
    arena-session-detail-page.tsx
    arena-settings-page.tsx
    new-arena-page.tsx           → layout minimalista + wizard
  services/
    arena-dashboard.service.ts   → domínio: alterna entre mock e Supabase
    mock-arena-dashboard.ts      → store mock em localStorage + seed
  types/
    arena-dashboard.types.ts     → views e status do dashboard
  index.ts                       → barrel do módulo
```

O `arenaDashboardService` decide o backend via `isSupabaseConfigured()`: no
modo mock usa `mockArenaStore`; no modo real combina `arenaService`,
`courtService`, `captureDeviceService` e `sessionService` e consulta direta em
`matches`/`videos` para as contagens do summary.

### Views e status

- `CaptureDeviceStatus` — `offline | ready | recording | error`
- `SessionStatus` — `scheduled | active | finished | processing`
- `CourtStatus` — `active | inactive`
- `ArenaDashboardSummary` — quadras, dispositivos (total/ativos), sessões hoje,
  partidas realizadas e vídeos processados.

### Hooks

```ts
const { data: arena } = useCurrentArena()                       // arena do usuário (ou null)
const { data: summary } = useArenaDashboard(arena?.id)          // métricas do dashboard
const { data: courts } = useCourts(arena?.id)
const { data: devices } = useCaptureDevices(arena?.id)
const { data: sessions } = useSessions(arena?.id)
const { data: session } = useSession(id)
const createArena = useCreateArena()                            // mutation do wizard
```

Query keys vivem sob o prefixo `['arena-dashboard']` (ver `arenaDashboardKeys`).
`useCreateArena` invalida o prefixo e faz `setQueryData` na arena do usuário.

### Wizard de criação

`NewArenaWizard` usa `react-hook-form` + Zod (`newArenaSchema`) com 4 etapas:

1. **Dados da arena** — nome, identificador público (slug), endereço, cidade, UF.
2. **Primeira quadra** — nome e modalidade.
3. **Dispositivo** — nome e posição da câmera.
4. **Finalizar** — resumo dos dados e envio.

A validação é por etapa via `form.trigger(fieldsDaEtapa)`. O slug pode ser
gerado automaticamente a partir do nome. Ao concluir, a arena, a quadra e o
dispositivo são criados (QR Code gerado via `buildQrCode`).

## Segurança

- Todas as rotas exigem autenticação (`ProtectedRoute`).
- Em modo real, `getArenaByOwner` filtra por `owner_id` no servidor; as contagens
  do summary usam apenas recursos que já respeitam as policies existentes
  (arenas são leitura pública, partidas são do próprio usuário).
- O QR Code é uma string derivada (slug + quadra + dispositivo) e serve apenas
  para pareamento futuro; não expõe segredos.

## Como testar

1. Inicie o app com `npm run dev`.
2. Entre com uma conta (ou use o modo mock sem credenciais no `.env`).
3. **Sem arena**: acesse "Minha Arena" no menu do usuário → vai para
   `/arena/new` → preencha o wizard → é criado e redirecionado para `/arena`.
4. **Com arena (mock)**: a "Arena XP" é semeada automaticamente — o dashboard
   mostra stats, status dos dispositivos (com "última conexão" atualizando a
   cada 15s) e sessões recentes.
5. Navegue por Quadras, Dispositivos, Sessões (filtro por status) e detalhe de
   uma sessão. Use o botão "Voltar ao app" para retornar ao `/dashboard`.

## Fora do escopo

Edição/exclusão de arenas, quadras e dispositivos, pareamento real de câmeras,
início/agendamento de sessões pela interface e gravação/processamento não são
implementados nesta etapa — o wizard e as páginas de listagem deixam a estrutura
pronta para esses fluxos futuros.
