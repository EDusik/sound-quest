---
name: nextjs-architecture
description: >
  Arquitetura e boas práticas de código para projetos Next.js + TypeScript com App Router.
  Use esta skill sempre que o usuário mencionar estrutura de pastas, organização de projeto,
  Server Components, Client Components, gerenciamento de estado com Zustand ou Jotai,
  data fetching com React Query e Axios, camada de serviços, hooks customizados, variáveis
  de ambiente, Route Handlers, tipagem de API, autenticação com Supabase, validação com Zod,
  internacionalização, ou qualquer decisão de arquitetura em Next.js.
  Também use quando o usuário perguntar "como organizar meu projeto", "onde colocar essa lógica",
  "como separar responsabilidades" ou "qual a melhor prática para X em Next.js".
---

# Arquitetura Next.js + TypeScript

> Escopo: **App Router (Next.js 13+)**, projetos pequenos/médios.
> Stack: Axios, React Query (TanStack), Zustand, Supabase, Zod, i18n próprio.

---

## 1. Estrutura de Pastas (Feature-first)

```
src/
├── app/                        # App Router (Server Components + Route Handlers)
│   ├── api/                    # Route Handlers (delegam para features/X/server/)
│   ├── (rotas)/page.tsx
│   ├── layout.tsx              # Root layout — Server Component
│   └── page.tsx
│
├── features/[name]/            # **Tudo de uma feature vive aqui**
│   ├── components/             # UI específica da feature
│   ├── api/                    # React Query hooks + service functions (client → /api)
│   ├── server/                 # Route handlers, repositórios, lógica server-side
│   ├── model/                  # Tipos, schemas Zod, constantes de domínio
│   └── lib/                    # Utilidades internas da feature
│
├── components/
│   ├── ui/                     # Primitivos visuais sem domínio (Button, Modal, etc.)
│   ├── layout/                 # Providers, Header, Sidebar
│   ├── auth/                   # AuthGuard, GlobalAuthLoading
│   └── [topic]/                # Componentes globais NÃO espelhados de features
│
├── contexts/                   # Auth, Theme, I18n (sessão; nunca dados de servidor)
│
├── hooks/
│   ├── api/
│   │   ├── index.ts            # BARREL — re-exporta hooks de features/[name]/api/
│   │   └── queryKeys.ts        # Único arquivo centralizado de chaves
│   └── use[Util].ts            # Hooks utilitários globais (useFocusTrap, useMediaQuery)
│
├── lib/
│   ├── env.ts                  # **Único** lugar que lê process.env (validado com Zod)
│   ├── api/                    # Axios + api-client compartilhado
│   ├── auth/                   # Helpers de auth client+server
│   ├── db/supabase/            # supabase.ts (client), supabase-{service,user,server-anon}.ts
│   ├── storage/                # Abstração local/Supabase
│   ├── utils/types.ts          # Tipos utilitários globais (não-domain)
│   └── validators/             # Zod schemas compartilhados entre features
│
├── locales/                    # JSON de traduções
├── store/                      # Zustand stores (estado de UI/cliente, nunca server state)
└── shared/                     # Helpers raramente compartilhados
```

**Regras:**

- Toda nova chamada de API: cria service function em `features/[name]/api/[X].service.ts` + hook em `features/[name]/api/use[X].ts` + reexporta de `src/hooks/api/index.ts`.
- Tipos de domínio ficam em `features/[name]/model/`. Tipos utilitários genuinamente globais ficam em `src/lib/utils/types.ts`.
- `components/ui/` — sem lógica de negócio, puramente visuais.
- `components/[topic]/` (global) — usar **só** se 2+ features consumirem o componente. **Proibido** criar arquivo que apenas re-exporte de `features/`.
- `contexts/` — Auth, Theme, I18n. Nunca dados de servidor.
- `store/` — estado de UI/cliente; dados de servidor ficam no React Query.
- `lib/validators/` — Zod schemas compartilhados entre features (schemas específicos ficam em `features/[name]/model/`).
- `lib/env.ts` — único arquivo que lê `process.env`. Todos os demais importam `{ env }` daí.

---

## 1A. Nomenclatura de Arquivos

| Item | Padrão | Exemplo |
| --- | --- | --- |
| Componente React | PascalCase.tsx | `SceneCard.tsx` |
| Hook customizado | useCamelCase.ts | `useScenes.ts`, `useAudioStore.ts` |
| Service (HTTP) | camelCase.service.ts | `scenes.service.ts` |
| Schema Zod específico | camelCase.ts (verbo + entity) | `createScene.ts` |
| Tipos de domínio | dentro de `model/` em arquivos descritivos | `model/donation.ts`, `model/scene.ts` |
| Tipos utilitários globais | `types.ts` | `lib/utils/types.ts` |
| Constantes de feature | em `model/` ou `lib/` da feature | `model/donation.ts` exporta `DONATION_MAX_AMOUNT_CENTS` |
| Constantes globais | `*Constants.ts` em camelCase; valores em `SCREAMING_SNAKE_CASE` | `authConstants.ts` exporta `ANONYMOUS_UID` |
| Estilos | **Tailwind inline**; agrupados em `*Styles.ts` quando reusados | `sectionStyles.ts` |
| Barrel re-export | `index.ts` | `features/ai/components/index.ts` |

**Não usar:** `.types.ts`, `.constants.ts`, `interfaces.ts`, `.module.css`, styled-components.

---

## 1B. Importações

- **Sempre** alias `@/...` para imports cross-folder. **Nunca** `../../`.
- **Exceção** permitida: arquivos no mesmo diretório (`./Component`).
- **Ordem** de imports:
  1. React / Next
  2. Bibliotecas externas
  3. `@/` (alfabético)
  4. Relativos (`./`)
  5. Tipos (`import type ...`)

---

## 1C. Hooks — Assinatura e Localização

- Hooks de **server state** vivem em `features/[name]/api/`. **Devem** retornar o objeto do React Query (`{ data, isLoading, error, mutate, ... }`).
- Hooks de **client state** complexo: criar Zustand store em `src/store/`. Para estado simples, `useState` direto.
- Para **persistir** client state: usar `zustand/middleware persist` ou `@tanstack/react-query-persist-client`. **Não** implementar `localStorage` + debounce manual.
- Hooks **nunca** retornam JSX.
- `useEffect` com timer **deve** retornar cleanup. Valores numéricos vão para constantes nomeadas com sufixo `_MS`/`_SECONDS`.
- Reexportar hooks de feature através de `src/hooks/api/index.ts` para que os consumidores importem de `@/hooks/api`.

---

## 1D. Estado React

| Tipo de estado | Onde guardar |
| --- | --- |
| Server state (qualquer dado vindo de API) | React Query, hook em `features/[name]/api/` |
| UI state global (modais, sidebar, player) | Zustand em `src/store/` |
| UI state local | `useState` no componente |
| Sessão (auth, theme, locale) | React Context em `src/contexts/` |
| State persistido | `zustand persist` ou `react-query-persist-client` — nunca localStorage manual |

---

## 1E. Constants & Magic Values

- Timers (`setTimeout`/`setInterval`): **proibido** literal numérico inline. Use `const X_MS = 50`.
- Strings repetidas em ≥2 lugares: extrair para const com escopo apropriado (módulo ou feature).
- Limites de domínio (max upload, max amount): `SCREAMING_SNAKE_CASE` em `model/` da feature.
- Locale codes, theme codes: union type + const tuple `as const`.

---

## 2. Server Components vs Client Components

**Regra de ouro: Server Component por padrão. Adicione `"use client"` apenas quando necessário.**

| Adicione `"use client"` quando precisar de | Mantenha Server Component para      |
| ------------------------------------------ | ----------------------------------- |
| `useState`, `useReducer`                   | Fetch de dados (async/await direto) |
| `useEffect`, `useRef`                      | Layouts e páginas estáticas         |
| Event handlers (`onClick`, `onChange`)     | SEO-critical content                |
| Zustand store, React Context               | Metadata (`generateMetadata`)       |
| APIs de browser (`window`, `localStorage`) | Acesso ao banco via Supabase server |

```tsx
// ✅ Server Component — metadata + render estático
// app/layout.tsx
import { Providers } from "@/components/layout/Providers";

export const metadata = { title: "Sound Quest" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```tsx
// ✅ Providers — "use client" isolado para não contaminar o layout
// components/layout/Providers.tsx
"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/utils/queryClient";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

**Padrão "push down":** mantenha o `"use client"` o mais profundo possível. Nunca marque `layout.tsx` ou `page.tsx` como Client Component sem motivo forte.

---

## 3. HTTP Client com Axios

Configure uma instância única do Axios em `lib/api/axios.ts`. O interceptor de request injeta o token JWT do Supabase automaticamente.

```ts
// lib/api/axios.ts
import axios from "axios";
import { supabase } from "@/lib/db/supabase/supabase";

export const api = axios.create({
  baseURL: "/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

**Por quê usar `/api` como baseURL?** Todas as chamadas do client passam pelos Route Handlers do Next.js — o Supabase service role key e outras credenciais nunca ficam expostas no browser.

---

## 4. Camada de Serviços (Feature-first)

Centralize chamadas HTTP em `features/[name]/api/`, usando a instância do Axios. Cada feature mantém suas próprias services + hooks. Reexporte tudo via `src/hooks/api/index.ts` para consumo externo.

```ts
// features/scenes/api/scenes.service.ts
import { api } from "@/lib/api/axios";
import type { Scene, CreateSceneDTO } from "@/features/scenes/model/scene";

export async function getScenes(): Promise<Scene[]> {
  const { data } = await api.get<{ scenes: Scene[] }>("/scenes");
  return data.scenes;
}

export async function createScene(payload: CreateSceneDTO): Promise<Scene> {
  const { data } = await api.post<Scene>("/scenes", payload);
  return data;
}

export async function deleteScene(sceneId: string): Promise<void> {
  await api.delete(`/scenes/${sceneId}`);
}
```

```ts
// src/hooks/api/index.ts — barrel central de re-exports
export {
  useScenesQuery,
  useCreateSceneMutation,
  useDeleteSceneMutation,
} from "@/features/scenes/api/useScenes";
export { queryKeys } from "./queryKeys";
```

```tsx
// Consumo no componente — sempre importa de @/hooks/api
import { useScenesQuery } from "@/hooks/api";
```

---

## 5. Data Fetching com React Query

React Query gerencia cache, revalidação e estados de loading/error — nunca use `useEffect` + `useState` para fetch de dados no client.

### 5.1 Setup

```ts
// lib/utils/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min em cache
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 5.2 Query Keys

```ts
// hooks/api/queryKeys.ts
export const queryKeys = {
  scenes: {
    all: ["scenes"] as const,
    list: (userId: string) => ["scenes", userId] as const,
    detail: (sceneId: string) => ["scene", sceneId] as const,
  },
  library: {
    all: ["library"] as const,
    list: (typeFilter?: string) => ["library", typeFilter ?? "all"] as const,
    access: () => ["library", "access"] as const,
  },
} as const;
```

### 5.3 Hooks Customizados

Encapsule cada query em um hook — nunca use `useQuery` diretamente nos componentes.

```ts
// features/scenes/api/useScenes.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/queryKeys";
import {
  getScenes,
  createScene,
  deleteScene,
} from "@/features/scenes/api/scenes.service";
import type { CreateSceneDTO } from "@/features/scenes/model/scene";

export function useScenesQuery(userId: string) {
  return useQuery({
    queryKey: queryKeys.scenes.list(userId),
    queryFn: getScenes,
    enabled: Boolean(userId),
  });
}

export function useCreateSceneMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSceneDTO) => createScene(payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.scenes.all });
    },
  });
}
```

```tsx
// Consumo no componente
"use client";
import { useScenes, useDeleteScene } from "@/hooks/api";
import { useAuth } from "@/contexts/AuthContext";

export function SceneList() {
  const { user } = useAuth();
  const { data: scenes, isLoading, isError } = useScenes(user?.uid ?? "");
  const { mutate: deleteScene, isPending } = useDeleteScene();

  if (isLoading) return <p>Carregando...</p>;
  if (isError) return <p>Erro ao carregar cenas.</p>;

  return (
    <ul>
      {scenes?.map((scene) => (
        <li key={scene.id}>
          {scene.title}
          <button onClick={() => deleteScene(scene.id)} disabled={isPending}>
            Excluir
          </button>
        </li>
      ))}
    </ul>
  );
}
```

---

## 6. Gerenciamento de Estado com Zustand

Use Zustand **apenas para estado de UI** (modais, sidebar, preferências locais). Dados de servidor ficam no React Query.

```bash
npm install zustand
```

```ts
// store/ui.store.ts
import { create } from "zustand";

interface UIState {
  isSidebarOpen: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  activeModal: null,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}));
```

**Regras:**

- ❌ Nunca use Zustand para dados que vieram da API
- ✅ Use seletores para evitar re-renders desnecessários
- ✅ Use `persist` só quando o estado precisa sobreviver ao refresh

```tsx
// ✅ Seletor — só re-renderiza quando `activeModal` muda
const activeModal = useUIStore((state) => state.activeModal);

// ❌ Re-renderiza para qualquer mudança na store
const { activeModal, isSidebarOpen } = useUIStore();
```

---

## 7. Auth com Supabase + React Context

A autenticação usa Supabase (Google OAuth) exposta via React Context. Nunca armazene o token manualmente — o Supabase client gerencia a sessão.

### 7.1 Client Supabase (browser)

```ts
// lib/db/supabase/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase =
  typeof window !== "undefined" && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseConfigured = Boolean(
  typeof window !== "undefined" && supabaseUrl && supabaseAnonKey,
);
```

### 7.2 AuthContext

```tsx
// contexts/AuthContext.tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/db/supabase/supabase";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(
        u
          ? {
              uid: u.id,
              email: u.email ?? null,
              displayName: u.user_metadata?.full_name ?? null,
              photoURL: u.user_metadata?.avatar_url ?? null,
            }
          : null,
      );
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(
        u
          ? {
              uid: u.id,
              email: u.email ?? null,
              displayName: u.user_metadata?.full_name ?? null,
              photoURL: u.user_metadata?.avatar_url ?? null,
            }
          : null,
      );
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error("Supabase não configurado");
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user != null,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

### 7.3 AuthGuard

```tsx
// components/auth/AuthGuard.tsx
"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login");
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) return null;
  return <>{children}</>;
}
```

---

## 8. Supabase DB / Storage

Use o client server-side em Route Handlers (com service role key para bypass de RLS quando necessário).

```ts
// lib/db/supabase/supabase-server.ts
import { createClient } from "@supabase/supabase-js";

export function createSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}
```

```ts
// Uso em Route Handler — acesso autenticado ao banco
// app/api/scenes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/db/supabase/supabase-server";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: scenes, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("user_id", user.id)
    .order("order", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scenes });
}
```

**Regras:**

- `lib/db/supabase/supabase.ts` — só importado em Client Components e `lib/api/axios.ts`
- `lib/db/supabase/supabase-server.ts` — só importado em Route Handlers e Server Components
- Nunca importe o client server-side em componentes (vaza a service role key)

---

## 9. Validação com Zod

Use Zod para validar request bodies e query params nos Route Handlers. Nunca confie no payload recebido sem validação.

```ts
// lib/validators/scenes.ts
import { z } from "zod";

export const createSceneSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  labels: z.array(z.string()).max(10).optional(),
});

export const updateSceneSchema = createSceneSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Ao menos um campo é obrigatório",
  });

export type CreateSceneDTO = z.infer<typeof createSceneSchema>;
export type UpdateSceneDTO = z.infer<typeof updateSceneSchema>;
```

```ts
// Uso no Route Handler
import { createSceneSchema } from "@/lib/validators/scenes";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = createSceneSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  // result.data está tipado e validado
  const scene = await createSceneInDB(userId, result.data);
  return NextResponse.json(scene, { status: 201 });
}
```

---

## 10. Internacionalização (i18n)

Arquivos de tradução em `locales/`, carregados de forma lazy pelo `I18nProvider`.

### 10.1 Estrutura

```json
// locales/pt.json
{
  "nav.home": "Início",
  "nav.dashboard": "Painel",
  "scene.create": "Criar cena",
  "scene.deleteConfirm": "Tem certeza que deseja excluir {title}?"
}
```

```json
// locales/en.json
{
  "nav.home": "Home",
  "nav.dashboard": "Dashboard",
  "scene.create": "Create scene",
  "scene.deleteConfirm": "Are you sure you want to delete {title}?"
}
```

### 10.2 I18nContext

```tsx
// contexts/I18nContext.tsx — simplificado
"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

type Locale = "en" | "pt";
type Translations = Record<string, string>;

const localeModules: Record<Locale, () => Promise<Translations>> = {
  en: () =>
    import("@/locales/en.json").then((m) => m as unknown as Translations),
  pt: () =>
    import("@/locales/pt.json").then((m) => m as unknown as Translations),
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    localeModules[locale]().then(setTranslations);
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let text = translations[key] ?? key;
      if (params) {
        text = Object.entries(params).reduce(
          (acc, [k, v]) =>
            acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
          text,
        );
      }
      return text;
    },
    [translations],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslations() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslations must be used within I18nProvider");
  return ctx.t;
}
```

```tsx
// Uso no componente
"use client";
import { useTranslations } from "@/contexts/I18nContext";

export function SceneActions({ title }: { title: string }) {
  const t = useTranslations();

  return (
    <div>
      <button>{t("scene.create")}</button>
      <p>{t("scene.deleteConfirm", { title })}</p>
    </div>
  );
}
```

---

## 11. Tipagem de API e DTOs

```ts
// types/api.types.ts
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  error: string;
  code?: string;
}
```

```ts
// types/domain.types.ts
export type AudioKind = "file" | "youtube" | "spotify";

export interface AudioItem {
  id: string;
  name: string;
  sourceUrl: string;
  kind: AudioKind;
  order: number;
  createdAt: number;
}

export interface Scene {
  id: string;
  slug: string;
  title: string;
  description: string;
  labels: string[];
  order: number;
  createdAt: number;
}

export type CreateSceneDTO = Pick<Scene, "title" | "description" | "labels">;
export type UpdateSceneDTO = Partial<CreateSceneDTO>;
```

---

## 12. Route Handlers

Route Handlers ficam em `app/api/` e delegam lógica pesada para services ou funções de DB.

```ts
// app/api/scenes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/db/supabase/supabase-server";
import { createSceneSchema } from "@/lib/validators/scenes";

async function getAuthUser(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  return user;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createSupabaseServer();
  const { data: scenes, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("user_id", user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scenes });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = createSceneSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServer();
  const { data: scene, error } = await supabase
    .from("scenes")
    .insert({ ...result.data, user_id: user.id })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(scene, { status: 201 });
}
```

---

## 13. Variáveis de Ambiente

```bash
# .env.local (nunca commitar)

# Supabase (banco + auth)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_SUPABASE_SERVICE_ROLE_KEY=eyJ...  # server-only, nunca NEXT_PUBLIC_

# IA
NEXT_ANTHROPIC_API_KEY=sk-ant-...     # server-only
NEXT_OPENAI_API_KEY=sk-...            # server-only

# Pagamentos
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_STRIPE_SECRET_KEY=sk_...         # server-only
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-... # server-only

# App
NEXT_PUBLIC_SITE_URL=https://meusite.com
NEXT_PUBLIC_USER_ADMIN=uuid-do-admin
```

**Regras:**

- `NEXT_PUBLIC_` → acessível no browser (nunca coloque segredos)
- Sem prefixo → só acessível em Server Components e Route Handlers
- Supabase service role key **nunca** deve ter prefixo `NEXT_PUBLIC_`
- **Único** lugar permitido para ler `process.env` é `src/lib/env.ts` (validado com Zod). Todos os demais importam `{ env }` daí:

```ts
// src/lib/env.ts — validação centralizada
import { z } from "zod";

const serverSchema = z.object({
  NEXT_SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_ANTHROPIC_API_KEY: z.string().min(1).optional(),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const isServer = typeof window === "undefined";

const clientParsed = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
const serverParsed = isServer
  ? serverSchema.parse({
      NEXT_SUPABASE_SERVICE_ROLE_KEY: process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY,
      NEXT_ANTHROPIC_API_KEY: process.env.NEXT_ANTHROPIC_API_KEY,
      MERCADO_PAGO_ACCESS_TOKEN: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    })
  : {};

export const env = { ...clientParsed, ...serverParsed };
```

```ts
// Uso em qualquer outro arquivo
import { env } from "@/lib/env";
const apiKey = env.NEXT_ANTHROPIC_API_KEY;
```

---

## 14. Nomenclatura de constantes

**Quando usar `SCREAMING_SNAKE_CASE` (módulo / config imutável):**

- Valores fixos de domínio ou de biblioteca: limites, timeouts, URLs base internas, flags de feature estáveis.
- Coleções estáticas (mapas, listas de opções) exportadas como constante única.
- Prefixos semânticos ajudam leitura: `MAX_UPLOAD_BYTES`, `DEFAULT_PAGE_SIZE`, `API_RETRY_COUNT`.

**Quando usar `camelCase` com `const`:**

- Valores derivados no mesmo arquivo (`const baseUrl = ...`), helpers que retornam config, ou constantes locais em função/componente.
- Objetos de config agrupados: `const queryDefaults = { staleTime: 60_000 }` — o objeto é a constante nomeada; chaves seguem o objeto.

**Boas práticas:**

- Números mágicos: extraia para constante nomeada (`POLL_INTERVAL_MS`) ou comente a unidade no nome (`_MS`, `_SECONDS`).
- Imutabilidade de literais: use `as const` em tuplas e objetos literais quando o tipo deve ser estreito (ex.: lista de rotas, variantes de UI).
- `enum` numérico do TypeScript tende a gerar código extra; prefira union de strings + objeto `as const` + `typeof` / `keyof` quando couber.
- Uma constante por conceito: evite duas constantes com nomes quase iguais (`TIMEOUT` vs `TIME_OUT`); padronize `SNAKE` em módulo e seja consistente no projeto.
- Env vars: nomes em `SCREAMING_SNAKE` já vêm do ambiente (ver seção 13); no código, `const siteUrl = process.env.NEXT_PUBLIC_SITE_URL` em `camelCase` para o binding.

**Evite:**

- `SCREAMING_SNAKE` em todo `const` local — polui e não agrega; reserve para valores realmente “constantes de sistema”.
- Constantes genéricas (`DATA`, `VALUE`, `CONFIG`) sem contexto do domínio ou do arquivo.

---

## 15. Checklist de Arquitetura

Antes de criar um novo arquivo, responda:

- [ ] É um dado de servidor? → React Query + hook em `features/[name]/api/`, reexportado de `src/hooks/api/index.ts`
- [ ] É estado de UI global/local? → Zustand store em `src/store/`; estado persistido com `zustand/middleware persist`
- [ ] É uma chamada HTTP? → service function em `features/[name]/api/` usando `lib/api/axios.ts`
- [ ] Precisa de autenticação? → `useAuth()` do AuthContext
- [ ] É um texto da UI? → `useTranslations()` do I18nContext
- [ ] É validação de entrada no servidor? → Zod em `lib/validators/` (compartilhado) ou `features/[name]/model/` (específico)
- [ ] Precisa de interatividade? → `"use client"` no menor componente possível
- [ ] É um tipo de domínio? → `features/[name]/model/`. Utilitário global? → `lib/utils/types.ts`
- [ ] Precisa de env var? → adicione em `lib/env.ts` e importe `{ env }`
- [ ] Timer/debounce? → constante nomeada com sufixo `_MS`/`_SECONDS`

---

## 16. Anti-Padrões a Evitar

| ❌ Anti-padrão                                       | ✅ Alternativa                                              |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| `useEffect` + `useState` para fetch                  | `useQuery` do React Query                                  |
| Axios direto no componente                           | Service function + hook customizado                        |
| Estado de servidor no Zustand                        | React Query como cache de servidor                         |
| `"use client"` em `layout.tsx`                       | Mova lógica para um Provider separado                      |
| `any` no TypeScript                                  | Tipo explícito ou `unknown` com guard                      |
| `.env` commitado no git                              | `.env.local` + `.gitignore`                                |
| Query keys como strings inline                       | `queryKeys` object centralizado                            |
| Validação manual em Route Handler                    | Schema Zod com `safeParse`                                 |
| `supabase` server-side com anon key                  | `createSupabaseServer()` com service role                  |
| Textos hardcoded em PT/EN                            | `t("chave")` via `useTranslations()`                       |
| Token JWT em localStorage                            | Sessão gerenciada pelo Supabase client                     |
| `src/components/X/` re-exportando `features/X/`      | Importar direto de `@/features/...`                        |
| `process.env.X` espalhado                            | `import { env } from "@/lib/env"`                          |
| `setTimeout(fn, 300)` literal                        | `const SAVE_DEBOUNCE_MS = 300`                             |
| `localStorage.setItem` manual em hook                | Zustand `persist` ou `@tanstack/react-query-persist-client`|
| Hooks de API fora de `features/[name]/api/`          | Mover para a feature; reexportar do barrel                 |
| Caminho relativo `../../foo`                         | Alias `@/foo`                                              |
| Tipos de domínio em `src/types/`                     | `features/[name]/model/`                                   |
| Componente proxy global apenas para reexport         | Implementação real em `components/[topic]/` (≥2 features)  |
