# Edge Functions

Este diretório está reservado para as **Supabase Edge Functions** (Deno).

Nesta etapa o backend ainda não possui funções serverless. A previsão de uso:

- `process-video`: recebe o upload de um vídeo, dispara o processamento e
  atualiza `videos.processing_status` e `matches.status`.
- `generate-thumbnail`: gera a miniatura da partida.
- `create-clip`: gera recortes (clips) a partir de `start_time`/`end_time`.

## Estrutura de uma Edge Function

```
functions/
  nome-da-funcao/
    index.ts
    deno.json
```

## Criar uma nova função

```bash
supabase functions new nome-da-funcao
```

## Executar localmente

```bash
supabase start
supabase functions serve nome-da-funcao
```

> Atenção: nenhuma lógica de IA, processamento de vídeo ou captura deve ser
> adicionada nesta etapa. O diretório existe apenas como preparação.
