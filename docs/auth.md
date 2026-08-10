# Autenticação — Arena AI

## Visão geral

A autenticação é gerenciada pelo **Supabase Auth** (e-mail + senha) e o perfil
público do usuário fica em `public.users`. O fluxo cobre login, cadastro,
recuperação de senha, logout, restauração de sessão e edição de perfil.

Sem credenciais do Supabase no `.env`, o app roda em **modo mock**: a sessão é
simulada em `localStorage` e o perfil é mantido no mesmo registro, permitindo
demonstrar o fluxo completo sem backend.

### Rotas

| Rota               | Pública | Descrição                        |
| ------------------ | ------- | -------------------------------- |
| `/`                | Sim     | Login                            |
| `/auth/register`   | Sim     | Cadastro                         |
| `/auth/recover`    | Sim     | Recuperação de senha             |
| `/dashboard`       | Não     | Protegida por `ProtectedRoute`   |
| `/matches`         | Não     | Protegida por `ProtectedRoute`   |
| `/matches/new`     | Não     | Protegida por `ProtectedRoute`   |
| `/matches/:id`     | Não     | Protegida por `ProtectedRoute`   |
| `/profile`         | Não     | Protegida por `ProtectedRoute`   |

Páginas de auth são envolvidas por `PublicRoute` (redireciona para o dashboard
se já autenticado) e páginas do app por `ProtectedRoute` (redireciona para `/`
se deslogado).

## Arquitetura

```
src/modules/auth/
  components/
    auth-form.tsx      → wrapper reutilizável de formulário de auth
    public-route.tsx   → guard de rota pública (redireciona se logado)
  pages/
    login-page.tsx     → login (RHF + Zod + shadcn/ui)
    register-page.tsx  → cadastro (com confirmação de senha)
    recover-password-page.tsx → solicitação de recuperação
  schemas/
    auth.schemas.ts    → schemas Zod + tipos inferidos
  services/
    auth.service.ts    → signUp, signIn, signOut, getCurrentSession,
                         getCurrentUser, resetPassword, createUserProfile
    mock-session.ts    → sessão simulada em localStorage
  types/auth.ts

src/contexts/AuthContext.tsx → AuthProvider + useAuth
src/routes/ProtectedRoute.tsx → guard de rota privada
src/modules/profile/
  services/profile.service.ts → getProfile, updateProfile, uploadAvatar
```

### `useAuth()`

Expõe o estado de autenticação em qualquer componente:

```ts
const { user, profile, loading, signIn, signOut, refreshProfile } = useAuth()
```

- `user` — objeto `User` do Supabase (ou usuário simulado no modo mock).
- `profile` — perfil em `public.users` (`{ id, fullName, email, avatarUrl }`).
- `loading` — `true` enquanto a sessão inicial é restaurada.
- `signIn(email, password)` — autentica e atualiza o estado.
- `signOut()` — encerra a sessão e limpa o perfil.
- `refreshProfile()` — recarrega o perfil (usado após salvar alterações).

`AuthProvider` é o provider mais externo da árvore (`main.tsx`), envolvendo o
`QueryClientProvider` e o `RouterProvider`.

## Fluxos

### Login

1. O usuário submete e-mail/senha.
2. `authService.signIn()` chama `supabase.auth.signInWithPassword()`.
3. O `AuthContext` atualiza `user` e busca o perfil em `public.users`.
4. `PublicRoute` detecta o usuário e redireciona para `/dashboard`.

### Cadastro

1. `authService.signUp()` chama `supabase.auth.signUp()` com `full_name` nos
   `data` (user metadata) e `emailRedirectTo` para o dashboard.
2. O trigger `on_auth_user_created` insere o perfil em `public.users`.
3. Como fallback, `authService.createUserProfile()` faz um `upsert` do perfil
   (suportado pela policy `users_insert_own`).
4. Se a confirmação de e-mail estiver habilitada e a sessão não for criada,
   o app orienta o usuário a verificar o e-mail; caso contrário, autentica
   automaticamente.

### Recuperação de senha

`authService.resetPassword()` chama `supabase.auth.resetPasswordForEmail()`.
O e-mail de redefinição é enviado pelo Supabase com link de confirmação.

### Sessão

- `getCurrentUser()` é chamado no mount do `AuthProvider` para restaurar a
  sessão (persistida pelo Supabase em `localStorage`).
- `signOut()` revoga a sessão e limpa o estado local.

## Perfil

`/profile` permite editar nome e avatar:

- **Nome** — salvo em `public.users.name` via `updateProfile()`.
- **Avatar** — `uploadAvatar()` envia o arquivo para o bucket `avatars` em
  `{user_id}/{timestamp}.{ext}` e retorna a URL pública; o caminho é salvo em
  `public.users.avatar_url`. No modo mock o arquivo é convertido em data URL.

Após salvar, `refreshProfile()` recarrega o perfil no `AuthContext`.

## Segurança

- Nenhuma senha é armazenada no app ou no banco de dados — apenas o Supabase
  Auth gerencia as credenciais.
- Chaves do Supabase ficam apenas em variáveis de ambiente
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) e no `.env` (gitignored).
- RLS em `public.users`: o usuário só lê/edita/cria o próprio perfil
  (`auth.uid() = id`).
- O bucket `avatars` é público para exibição em `<img>`; uploads ficam restritos
  ao prefixo `{user_id}/` do usuário autenticado.

## Variáveis de ambiente

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Com esses valores vazios, o modo mock é ativado automaticamente.
