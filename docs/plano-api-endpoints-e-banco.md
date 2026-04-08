# API plan: endpoints and database

Technical document listing the required endpoints and data model (Supabase/Postgres) for the AI-powered audio library project.

---

## 1. Overview

- **Auth:** Supabase (unchanged). All routes below that require a user validate the Supabase JWT and, where applicable, the feature flag (allowlist).
- **Feature flag:** environment variable `AI_LIBRARY_ALLOWED_USER_IDS` (comma-separated list of UUIDs). Library and AI endpoints return **403** if the authenticated user is not on the list.
- **API base URL:** same domain as Next.js (e.g. `https://app.example.com/api/...`).
- **JWT security:** Supabase-issued access tokens; server verifies the JWT before trust (see §4). Missing or invalid tokens yield **401**; valid token but not on the allowlist yields **403**.
- **Input validation:** [Zod](https://zod.dev) for request bodies, query strings, and route params on the new routes (see §5). Invalid input returns **400** with a stable error shape before or alongside auth checks.

| Concern        | Mechanism                                   | Details                                             |
| -------------- | ------------------------------------------- | --------------------------------------------------- |
| Authentication | Supabase **JWT** (access token)             | §4 — verify server-side; **401** if missing/invalid |
| Authorization  | **Allowlist** `AI_LIBRARY_ALLOWED_USER_IDS` | §1, §4 — **403** if not listed                      |
| Input shape    | **Zod** schemas                             | §5 — **400** on validation failure                  |
| Data isolation | RLS + `user_id` from verified JWT only      | §2.2, §4                                            |

---

## 2. Database (Supabase / Postgres)

### 2.1 Table `audio_library`

Per-user audio library, organized by type (category). Independent of scenes; scene audio remains in the `audios` table.

| Column       | Type          | Constraints                                       | Description                             |
| ------------ | ------------- | ------------------------------------------------- | --------------------------------------- |
| `id`         | `text`        | PK                                                | Unique identifier (e.g. uuid or nanoid) |
| `user_id`    | `uuid`        | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | Owner of the item                       |
| `name`       | `text`        | NOT NULL                                          | Audio name                              |
| `source_url` | `text`        | NOT NULL                                          | Audio URL (streaming or download)       |
| `type`       | `text`        | NOT NULL                                          | Category (see enum below)               |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now()                            | Creation timestamp                      |
| `order`      | `int`         | NULL                                              | Display order (lower first)             |

**Suggested indexes:**

- `idx_audio_library_user_id` on `(user_id)`
- `idx_audio_library_user_type` on `(user_id, type)` (for listing by type)

**Suggested categories (`type`):** `weather-effects`, `battle`, `animals`, `cities`, `ambience`, `music`, `others`. These can be validated in the app or via CHECK/enum in the database.

### 2.2 SQL migration (example)

File at `supabase/migrations/YYYYMMDDHHMMSS_audio_library.sql`:

```sql
-- Table: per-user audio library (by type)
create table if not exists public.audio_library (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  source_url text not null,
  type text not null,
  created_at timestamptz not null default now(),
  "order" int
);

create index if not exists idx_audio_library_user_id on public.audio_library(user_id);
create index if not exists idx_audio_library_user_type on public.audio_library(user_id, type);

alter table public.audio_library enable row level security;

-- RLS: users can only access their own rows
create policy "Users can manage own audio library"
  on public.audio_library for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 2.3 Existing tables (no changes)

- `scenes` and `audios`: unchanged (per-scene audio).
- Supabase Auth and Storage: unchanged.

---

## 3. API endpoints

All routes below are **Next.js API Routes** under `src/app/api/...`. Where “Auth + feature flag” applies, the flow is: 1) validate Supabase JWT (see §4); 2) get `user_id` from the verified session only; 3) check that `user_id` is in `AI_LIBRARY_ALLOWED_USER_IDS`; if not, return **403**.

---

### 3.1 Audio library (CRUD)

| Method | Route               | Auth + feature flag | Description                                                                                 |
| ------ | ------------------- | ------------------- | ------------------------------------------------------------------------------------------- |
| GET    | `/api/library`      | Yes                 | Lists the user’s library items. Optional query: `?type=weather-effects` to filter by type. |
| POST   | `/api/library`      | Yes                 | Creates a library item (name, source_url, type).                                            |
| PATCH  | `/api/library/[id]` | Yes                 | Updates item (name, type, order). Only if `user_id` is the owner.                           |
| DELETE | `/api/library/[id]` | Yes                 | Deletes item. Only if `user_id` is the owner.                                               |

**GET `/api/library`**

- **Query:** `type` (optional) — filter by category.
- **Response 200:**  
  `{ "items": [ { "id", "userId", "name", "sourceUrl", "type", "createdAt", "order" } ] }`  
  (camelCase field names if the frontend uses them; otherwise keep snake_case.)

**POST `/api/library`**

- **Body:** `{ "name": string, "sourceUrl": string, "type": string }`
- **Response 201:** created item object (with `id`, `createdAt`, etc.).
- **Response 400:** invalid body or disallowed type.

**PATCH `/api/library/[id]`**

- **Body:** `{ "name"?: string, "type"?: string, "order"?: number }` (all optional).
- **Response 200:** updated item object.
- **Response 404:** item not found or not owned by the user.

**DELETE `/api/library/[id]`**

- **Response 204:** no body.
- **Response 404:** item not found or not owned by the user.

---

### 3.2 AI chat (web search)

| Method | Route          | Auth + feature flag | Description                                                                                       |
| ------ | -------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| POST   | `/api/ai/chat` | Yes                 | Sends chat messages; the AI uses web search and returns a reply plus a list of audio suggestions. |

**POST `/api/ai/chat`**

- **Body:**  
  `{ "messages": [ { "role": "user" | "assistant" | "system", "content": string } ] }`
- **Response 200:**  
  `{ "message": { "role": "assistant", "content": string }, "suggestions": [ { "name": string, "sourceUrl": string, "source": string } ] }`
  - `suggestions`: best audio/music options found (for the frontend to show and support “Add to library”).
- **Response 403:** user not on the allowlist.
- **Response 429/502/503:** rate limits or LLM/search errors.

The backend validates the user and feature flag; calls the LLM with a web-search tool (Serper, Google, Bing, etc.); injects search results into context; the LLM returns text plus a structured suggestion list. The frontend uses `suggestions` to render items and calls **POST `/api/library`** when the user clicks “Add to library”.

---

### 3.3 Existing endpoints (reference)

- **POST `/api/ensure-audios-bucket`** — already exists; creates the `audios` Storage bucket if missing (per-scene upload).
- **GET `/api/freesound-search`** and **GET `/api/freesound-configured`** — already exist; not part of the AI library flow (the AI uses web search, not necessarily Freesound).

---

## 4. Security (JWT)

Protected routes must **authenticate** with a valid Supabase **access JWT**, then **authorize** with the allowlist (§1). Do not trust `user_id`, email, or role from the request body or query; derive identity only from the verified token.

### 4.1 How the client sends the token

- **Bearer header (recommended for API routes):** `Authorization: Bearer <access_token>`. The SPA obtains `access_token` from the Supabase client after sign-in (same token used for Storage and PostgREST).
- **Cookie-based session:** If the app already uses `@supabase/ssr` with HTTP-only cookies, the route handler can build a server Supabase client from `cookies()` and call `getUser()` without a manual `Authorization` header—still results in a verified user. Pick one approach per route and document it.

### 4.2 Verifying the JWT on the server

- Use the **Supabase server client** (e.g. `@supabase/ssr` `createServerClient` with project URL + anon key) and pass the JWT when required:
  - `supabase.auth.getUser(accessToken)` with the string from the `Authorization` header, **or**
  - Cookie-backed `getUser()` if using the SSR cookie pattern.
- A successful result yields `user.id` (UUID) — use this as `user_id` for DB writes and filters. Treat missing/invalid/expired tokens as **401** `{ "error": "unauthorized" }` (or a stable schema); do not leak whether the email exists.
- **Service role:** `NEXT_SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Use it only in trusted server code for admin operations if needed; for normal library CRUD prefer the user-scoped client or explicit `user_id` filters so RLS and application checks stay aligned.

### 4.3 Order of checks in a route handler

1. **Optional:** Parse and validate input with Zod (§5)—can run first to save work on junk payloads, or after auth if you prefer to hide schema details from unauthenticated clients.
2. **JWT:** Extract token → `getUser` → on failure **401**.
3. **Allowlist:** If `user.id` ∉ `AI_LIBRARY_ALLOWED_USER_IDS` → **403**.
4. **Handler logic** (DB, LLM, etc.).

### 4.4 Defense in depth

- **RLS** on `audio_library` (§2.2) ensures that even if application code mis-filters once, Postgres still restricts rows to `auth.uid() = user_id`.
- **HTTPS only** in production; never pass tokens in query strings or logs.
- **Secrets:** `NEXT_SUPABASE_SERVICE_ROLE_KEY` and any LLM/search keys stay server-side only; never expose in `NEXT_PUBLIC_*`.

### 4.5 Optional hardening

- Rate limit by `user.id` (or IP) on `/api/ai/chat` and write endpoints.
- Short-lived access tokens + refresh on the client (Supabase default behavior).

---

## 5. Request validation (Zod)

Use **Zod** on library and AI chat routes so malformed payloads fail fast with **400**. Keep JWT verification and the allowlist as separate steps (not expressed as Zod schemas unless you wrap custom parsers).

**Dependency:** `zod` (same major version across the app if schemas are shared with the client).

**Suggested location:** `src/lib/validators/library.ts` and `src/lib/validators/ai-chat.ts` (or a single `src/lib/validators/api.ts`).

**Single source of truth for `type`:** export a `const` array and derive `z.enum([...])` from it so the list matches §2.1 and any future DB CHECK.

### 5.1 Schemas (reference)

```typescript
import { z } from "zod";

export const AUDIO_LIBRARY_TYPES = [
  "weather-effects",
  "battle",
  "animals",
  "cities",
  "ambience",
  "music",
  "others",
] as const;

export const audioLibraryTypeSchema = z.enum(AUDIO_LIBRARY_TYPES);

/** GET /api/library — query */
export const getLibraryQuerySchema = z.object({
  type: audioLibraryTypeSchema.optional(),
});

/** POST /api/library — JSON body */
export const postLibraryBodySchema = z.object({
  name: z.string().min(1).max(500),
  sourceUrl: z.string().url(),
  type: audioLibraryTypeSchema,
});

/** PATCH /api/library/[id] — JSON body (at least one field) */
export const patchLibraryBodySchema = z
  .object({
    name: z.string().min(1).max(500).optional(),
    type: audioLibraryTypeSchema.optional(),
    order: z.number().int().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one of name, type, or order is required",
  });

/** Dynamic segment [id] */
export const libraryIdParamSchema = z.object({
  id: z.string().min(1),
});

const chatRoleSchema = z.enum(["user", "assistant", "system"]);

/** POST /api/ai/chat — JSON body */
export const postAiChatBodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: chatRoleSchema,
        content: z.string().min(1).max(100_000),
      }),
    )
    .min(1)
    .max(50),
});
```

Tune `max` lengths and message array bounds to match product limits.

### 5.2 Usage in route handlers

| Route                      | What to parse | Notes                                                                                                                                            |
| -------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET `/api/library`         | Query         | `getLibraryQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))`. Values are strings; optional `type` matches the enum as-is. |
| POST `/api/library`        | Body          | `postLibraryBodySchema.safeParse(await request.json())`. Catch non-JSON separately if desired.                                                   |
| PATCH `/api/library/[id]`  | Params + body | `libraryIdParamSchema.safeParse(params)` then `patchLibraryBodySchema.safeParse(await request.json())`.                                          |
| DELETE `/api/library/[id]` | Params        | `libraryIdParamSchema.safeParse(params)`.                                                                                                        |
| POST `/api/ai/chat`        | Body          | `postAiChatBodySchema.safeParse(await request.json())`.                                                                                          |

On failure, return **400** with a consistent JSON body, e.g. `{ "error": "validation_error", "details": <Zod flattened or formatted issues> }`. Use one convention project-wide.

### 5.3 Optional: LLM structured output

If the LLM returns JSON for `suggestions`, validate it with a dedicated `z.array(z.object({ name: z.string(), sourceUrl: z.string().url(), source: z.string() }))` (or stricter fields) before sending the response to the client. Invalid model output can be mapped to **502** or sanitized, depending on policy.

---

## 6. Endpoint summary

| Method | Route               | Purpose                                 |
| ------ | ------------------- | --------------------------------------- |
| GET    | `/api/library`      | List library (optional filter by type)  |
| POST   | `/api/library`      | Create item (name, sourceUrl, type)     |
| PATCH  | `/api/library/[id]` | Update item                             |
| DELETE | `/api/library/[id]` | Delete item                             |
| POST   | `/api/ai/chat`      | AI chat + web-sourced audio suggestions |

---

## 7. Required environment variables

| Variable                                                              | Purpose                                                                 |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `AI_LIBRARY_ALLOWED_USER_IDS`                                         | Comma-separated UUIDs; who may access `/api/library` and `/api/ai/chat` |
| `NEXT_ANTHROPIC_API_KEY` (or equivalent)                              | LLM for chat                                                            |
| `NEXT_SERPER_API_KEY` or `GOOGLE_CSE_*` / `BING_*`                    | Web search API (AI tool)                                                |
| Already in use: `NEXT_PUBLIC_SUPABASE_*`, `NEXT_SUPABASE_SERVICE_ROLE_KEY` | Auth and Supabase                                                       |

---

## 8. Suggested implementation order (backend)

1. `audio_library` migration + RLS.
2. Zod schemas + shared `AUDIO_LIBRARY_TYPES` (align with §2.1; add a DB CHECK later if desired).
3. Auth helper: JWT verification + allowlist (§4) and use it in protected routes.
4. GET/POST/PATCH/DELETE `/api/library` (Zod per §5 + JWT per §4).
5. POST `/api/ai/chat` (LLM + web search + suggestion payload format; optional Zod on structured model output per §5.3).
