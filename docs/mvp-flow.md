# MVP Flow — Arena AI

## Jornada do usuário

```
Usuário entra
      │
      ▼
Visualiza suas partidas  (Home / Partidas)
      │
      ▼
Cria uma partida         (wizard em 2 etapas)
      │
      ▼
Adiciona vídeo           (upload com progresso)
      │
      ▼
Assiste                  (player HTML5)
      │
      ▼
Compartilha              (link público + WhatsApp)
```

## Telas principais

| Tela | Rota | Descrição |
| --- | --- | --- |
| Login / Cadastro | `/` `/auth/register` | Autenticação (Supabase Auth) |
| Home | `/dashboard` | Saudação, card "Próxima partida" com "Continuar partida", seção "Últimas partidas" |
| Minhas partidas | `/matches` | Lista em grade com estados de loading/erro/vazio |
| Nova partida | `/matches/new` | Wizard em 2 etapas: Informações → Confirmação |
| Detalhes da partida | `/matches/:id` | Header (nome/arena/status), status, gravação, seções futuras |
| Editar partida | `/matches/:id/edit` | Formulário completo |
| Página pública | `/public/matches/:id` | Qualquer pessoa com o link vê a partida e o player |
| Página do vídeo | `/videos/:id` | Player em tela cheia + informações |
| Perfil | `/profile` | Nome e foto |

## Fluxo completo

1. **Entrar** — o usuário autentica e é direcionado para a Home.
2. **Visualizar** — a Home mostra a próxima partida e as últimas registradas; a aba "Partidas" lista tudo.
3. **Criar** — tocar no botão "+" (barra inferior no mobile, FAB ou botão no desktop) abre o wizard: preencher nome, modalidade, arena e data → revisar o resumo → "Criar partida". O usuário é redirecionado para os detalhes da partida criada.
4. **Adicionar vídeo** — na tela de detalhes, a seção "Gravação da partida" permite arrastar/ selecionar um arquivo (.mp4, .mov, .webm, até 2 GB). Uma barra de progresso acompanha o envio; ao concluir, o status da partida muda para "Processando" e o player é exibido. Um toast/estado de sucesso confirma a ação.
5. **Assistir** — o player HTML5 (play/pause, seek, volume e tela cheia) reproduz a gravação. A página pública permite assistir a partir de um link compartilhado.
6. **Compartilhar** — "Compartilhar" na partida (detalhes ou banner quando pronta) usa a Web Share API quando disponível e, como fallback, copia o link público. A página pública oferece "Compartilhar no WhatsApp" e "Copiar link".

## Experiência mobile-first

- **Mobile (390px):** header compacto (logo + avatar), conteúdo rolável, navegação inferior fixa (Home, Partidas, Nova partida, Perfil) e FAB "+ Nova partida".
- **Tablet (768px):** sidebar aparece; navegação inferior e FAB somem.
- **Desktop (1440px):** sidebar persistente + header com menu de usuário; conteúdo limitado a `max-w-7xl`.

## Estados visuais

Todas as telas tratam loading (skeleton/spinner), erro (mensagem amigável com "Tentar novamente") e vazio (call to action).

## Identidade visual

Tokens definidos em `src/styles/theme.ts` e variáveis em `src/index.css`:

- **Cores:** primária verde-arena, accent "lime" (tokens `brand`), neutros frios.
- **Tipografia:** `--font-sans` / `--font-display` (Inter + sistema).
- **Espaçamento/bordas:** escala padrão do Tailwind + raios tokens.
- **Aparência:** gradientes esportivos, cards de herói e navbar "de aplicativo" — nada de dashboard corporativo.

## Limitações / próximos passos

- A página pública exibe o player quando a gravação é acessível (modo mock ou dono autenticado); vídeo em bucket privado depende de URL assinada.
- Não implementado por escopo: IA, processamento automático, tracking e estatísticas esportivas (áreas ficam como placeholders).
