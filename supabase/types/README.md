# Tipos gerados do Supabase

Este diretório reserva o arquivo gerado pelo Supabase CLI:

```bash
# Com o projeto linkado:
supabase gen types typescript --project-id <PROJECT_ID> --schema public > src/types/database.ts
```

O arquivo canônico que a aplicação consome vive em
`src/types/database.ts` (gerado manualmente nesta fase para refletir o schema
das migrations deste repositório).

Assim que um projeto Supabase real estiver vinculado, regenere os tipos com o
comando acima e substitua o conteúdo de `src/types/database.ts`.

## Script disponível

```bash
npm run db:types
```

Requer a CLI do Supabase instalada e o projeto linkado (`supabase login` e
`supabase link --project-ref <PROJECT_ID>`).
