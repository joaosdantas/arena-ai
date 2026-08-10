# Evolução do Domínio — Arena AI

Este documento registra a evolução incremental do Arena AI para o novo domínio:
uma plataforma para arenas esportivas onde celulares funcionam como
dispositivos de captura.

A estratégia é **aditiva**: o domínio antigo (usuários → partidas → vídeos)
continua funcionando e novas entidades são construídas ao redor dele.

---

## 1. Arquitetura antiga

```
User 1:N Match 1:N Video
              ├─1:N Players
              └─1:N Clips
Match N:1 Arena
```

Modelo **flat e centrado em partida**: a partida era a raiz do agregado e todo
o acesso (RLS) derivava de `matches.owner_id` / `matches.is_public`. O vídeo
era apenas um arquivo enviado por upload manual, vinculado diretamente à
partida.

## 2. Arquitetura nova

```
Arena
  └─ 1:N Court (Quadra)
        └─ 1:N Capture Device (celular/câmera)
        └─ 1:N Session (sessão de gravação)
              └─ 1:N Match (partida)        ← entidade existente, agora opcionalmente vinculada
                    └─ 1:N Video            ← entidade existente
```

O novo modelo é **hierárquico e centrado na captura**: a arena contém quadras,
as quadras possuem dispositivos de captura e sessões de gravação, e as partidas
passam a acontecer dentro de uma sessão (o elo entre o mundo antigo e o novo).

## 3. Entidades criadas

### `arenas` (evoluída — tabela existente)
- Novas colunas: `owner_id` (FK → `users`, nullable), `slug` (único quando
  presente), `state`, `status` (`active`/`inactive`), `updated_at`.
- Novos índices: `arenas_owner_id_idx`, `arenas_slug_unique_idx`.
- Colunas legadas (`name`, `city`, `address`, `cover_url`) mantidas intactas.
- Relacionamento: `User 1:N Arena`.

### `courts` (nova)
Quadras físicas de uma arena.

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `arena_id` | uuid FK | → `arenas.id`, cascade |
| `name` | text | obrigatório |
| `sport` | text | modalidade da quadra |
| `status` | text | `active` / `inactive` |
| `created_at` / `updated_at` | timestamptz | `updated_at` via trigger |

Relacionamento: `Arena 1:N Courts`.

### `capture_devices` (nova)
Celular ou câmera usado na captura, vinculado a uma quadra.

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `court_id` | uuid FK | → `courts.id`, cascade |
| `name` | text | nome amigável |
| `qr_code` | text, unique | identificador único do aparelho |
| `position` | text | ex.: `lateral esquerda`, `lateral direita`, `fundo` |
| `height` | numeric | altura instalada (metros) |
| `angle` | numeric | ângulo da câmera (graus) |
| `status` | text | `offline` / `ready` / `recording` / `error` |
| `last_seen` | timestamptz | última vez que o aparelho foi visto |
| `created_at` / `updated_at` | timestamptz | |

Relacionamento: `Court 1:N Capture Devices`.

### `sessions` (nova)
Uma gravação acontecendo em uma quadra.

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `court_id` | uuid FK | → `courts.id`, cascade |
| `started_at` / `ended_at` | timestamptz | opcionais |
| `status` | text | `scheduled` / `active` / `finished` / `processing` |
| `created_by` | uuid FK | → `users.id`, set null |
| `created_at` / `updated_at` | timestamptz | |

Relacionamento: `Court 1:N Sessions`.

### `matches` (evoluída — tabela existente)
- Nova coluna: `session_id` (FK → `sessions.id`, nullable, `on delete set null`).
- Novo índice: `matches_session_id_idx`.
- Todos os campos e policies de RLS existentes permanecem intactos.
- Relacionamento: `Session 1:N Matches`.

## 4. Relacionamentos

| Origem | Destino | Tipo | Coluna |
| --- | --- | --- | --- |
| users | arenas | 1:N | `arenas.owner_id` |
| arenas | courts | 1:N | `courts.arena_id` |
| courts | capture_devices | 1:N | `capture_devices.court_id` |
| courts | sessions | 1:N | `sessions.court_id` |
| sessions | matches | 1:N | `matches.session_id` |
| users | sessions | 1:N | `sessions.created_by` |

## 5. Estratégia de migração

- **Migrações aditivas** (`13` a `17`): apenas `create table` e `add column`
  opcional — nada é dropado, renomeado ou alterado em NOT NULL.
- **Backward compatible**: partidas e arenas existentes (sem `owner_id` /
  `session_id`) continuam válidas; os fluxos atuais de usuário, partida e vídeo
  não dependem das novas colunas.
- **RLS**: as novas tabelas espelham o padrão atual de `arenas` (leitura
  pública, escrita por autenticado). Políticas por proprietário/arena
  (`arenas.owner_id`) e por operador de dispositivo ficam para uma etapa
  futura, junto com o app de captura.
- **Rollback**: cada migration documenta o SQL reverso em comentário de
  cabeçalho.

## 6. Próximos passos (fora do escopo desta etapa)

- Integrar `courts` ao fluxo de criação de partida (wizard).
- Registro de `capture_devices` pelo app (vínculo por `qr_code`).
- Ciclo de vida real das `sessions` (iniciar/parar gravação).
- RLS por proprietário da arena e por dispositivo.
- Vínculo de `videos` às sessões/dispositivos de captura.
- Geração de `highlights` (IA) a partir dos vídeos.
