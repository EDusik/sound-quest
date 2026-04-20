<h1 align="center">🎲 SoundQuest</h1>
<p align="center">
  <strong>Create the perfect soundscape for every RPG session.</strong>
</p>
<p align="center">
  <a href="#-getting-started">Getting started</a> •
  <a href="#-configuration">Configuration</a> •
  <a href="#-tech-stack">Tech stack</a> •
  <a href="#-features">Features</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-documentation">Documentation</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Supabase-2-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Zustand-5-764ABC?style=flat-square" alt="Zustand" />
</p>

---

## 🚀 Getting started

### Prerequisites

- **Node.js** 18+ and **npm** (or yarn/pnpm)

### Option 1 — Quick (no setup)

Works out of the box with data stored only in the browser (localStorage):

```bash
git clone <repo-url>
cd sound-quest
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On the login screen, use **“Continue with local storage (no account)”**. Everything is saved only in your browser.

### Option 2 — With account (Supabase)

For Google login and cloud data:

1. Create a project at [Supabase](https://supabase.com).
2. Create a `.env` file in the project root (use [.env.example](#environment-variables) as a template) and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In Supabase: **Authentication → Providers** → enable **Google** and configure Client ID and Secret from Google Cloud.
4. In [Google Cloud Console](https://console.cloud.google.com): under OAuth 2.0 **Credentials**, add to **Authorized redirect URIs**:
   ```text
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   (replace `YOUR_PROJECT_REF` with your Supabase project ref.)
5. Create the database and storage: in Supabase **SQL Editor**, either run the migrations in `supabase/migrations/` in chronological order (or `supabase db push` if you use the CLI), or run a bundled script such as `supabase/scripts/run-in-supabase.sql` (base schema + bucket) and, for the **audio library**, default catalog, and **default favorites**, also apply `supabase/scripts/apply-audio-library-and-favorites.sql` (or the matching migrations, including `20250324130000_audio_library.sql` and the `20250407*` migrations for catalog slugs, default audio rows, and `audio_library_default_favorites`).
6. (Optional) For the app to create the `audios` bucket automatically if missing, add `NEXT_SUPABASE_SERVICE_ROLE_KEY` to `.env` (Supabase Dashboard → Settings → API → service_role key). Otherwise ensure the bucket exists via migrations or the script above.
7. Run:
   ```bash
   npm run dev
   ```

### Deploy / Production (avoid redirect to localhost)

After deploying, if signing in with Google redirects you to `http://localhost:3000/`, adjust in **Supabase**:

1. **Supabase** → **Authentication** → **URL Configuration**.
2. **Site URL**: set to your app’s production URL (e.g. `https://your-domain.vercel.app`).
3. **Redirect URLs**: add the production callback, e.g. `https://your-domain.vercel.app/auth/callback`. You can keep `http://localhost:3000/auth/callback` for local development.

The app sends `redirectTo` with `window.location.origin`, so production must have the production URL allowed under **Redirect URLs** and **Site URL**.

---

## ⚙️ Configuration

### Environment variables

Copy `.env.example` to `.env` (or `.env.local`) and adjust. **All variables are optional** to run in “localStorage only” mode.

| Variable                                   | Description                                                                                                                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                 | Supabase project URL (e.g. `https://xxx.supabase.co`).                                                                                                                                                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`            | Supabase anonymous key (Auth + DB).                                                                                                                                                                             |
| `NEXT_SUPABASE_SERVICE_ROLE_KEY`           | **(Server-only.)** Used to create the `audios` storage bucket if missing (`POST /api/ensure-audios-bucket`). Optional if the bucket is created via SQL/migrations.                                              |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase: API Key (optional).                                                                                                                                                                                   |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase: Auth Domain.                                                                                                                                                                                          |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase: Project ID.                                                                                                                                                                                           |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase: Storage Bucket.                                                                                                                                                                                       |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase: Messaging Sender ID.                                                                                                                                                                                  |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase: App ID.                                                                                                                                                                                               |
| `NEXT_PUBLIC_USE_FIRESTORE`                | `"true"` to use Firestore instead of localStorage.                                                                                                                                                              |
| `NEXT_PUBLIC_PIX_ID`                       | PIX key for the **Support** page (`/support`): shown for copy and in the “Pay with Pix” section.                                                                                                                |
| `NEXT_PUBLIC_PIX_URL`                      | Optional: URL for Pix payment (e.g. Nubank “cobrar” link). Used by the QR code and “Pay with Pix” on the support page.                                                                                          |
| `NEXT_PUBLIC_STRIPE_URL`                   | Stripe (or other) donation link for the Support page.                                                                                                                                                           |
| `NEXT_PUBLIC_GITHUB_URL`                   | Optional. GitHub profile or repo link (e.g. landing footer). Falls back to a default repo URL if unset.                                                                                                        |
| `NEXT_USER_ADMIN` / `NEXT_PUBLIC_USER_ADMIN` | Comma-separated Supabase user UUIDs with access to the audio library, AI chat, and related APIs (`/api/library`, `/api/ai/chat`, default favorites). Server reads both; the client needs `NEXT_PUBLIC_*` for UI (e.g. “save to library”, library nav). |
| `NEXT_ANTHROPIC_API_KEY`                   | **(Server-only.)** Anthropic API key for `POST /api/ai/chat`.                                                                                                                                                  |
| `NEXT_ANTHROPIC_MODEL`                     | Optional. Claude model id for AI chat (default `claude-opus-4-5`).                                                                                                                                            |
| `NEXT_PIXABAY_API_KEY`                     | **(Server-only.)** Pixabay Sounds API key; used by AI chat to resolve sound suggestions.                                                                                                                         |
| `NEXT_PIXABAY_SOUNDS_API_URL`              | Optional. Override Pixabay sounds JSON base URL.                                                                                                                                                                |
| `NEXT_SERPER_API_KEY`                      | Optional. Web search snippets for the AI chat (`POST /api/ai/chat`).                                                                                                                                           |

### Firebase / Firestore (optional)

- Create a project at [Firebase](https://console.firebase.google.com), enable **Authentication** (Google) and optionally **Firestore**.
- Add the `NEXT_PUBLIC_FIREBASE_*` variables to `.env` (they are not listed in `.env.example`; see `src/lib/firebase.ts` for names).
- For Firestore: create the database and set `NEXT_PUBLIC_USE_FIRESTORE=true`.
- Deploy rules in `firestore.rules` (Console → Firestore → Rules). Create the composite index when prompted if you use queries by `userId` and `orderBy('createdAt')`.

---

## 🛠 Tech stack

| Layer                     | Technology                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Framework**             | [Next.js 16](https://nextjs.org) (App Router)                                                                                  |
| **UI**                    | [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com)                                                       |
| **Language**              | [TypeScript](https://www.typescriptlang.org)                                                                                   |
| **Auth & DB**             | [Supabase](https://supabase.com) (Auth + PostgreSQL); optional: [Firebase](https://firebase.google.com) Auth + Firestore       |
| **Data & API**            | [TanStack Query](https://tanstack.com/query) (React Query) for server state; Zod for schemas                                   |
| **Global state (player)** | [Zustand](https://zustand-demo.pmnd.rs)                                                                                        |
| **Backend**               | Next.js API routes under `src/app/api/**` re-export handlers from `src/features/**/server` (scenes, library, AI, integrations). Includes scenes/audios CRUD, `ensure-audios-bucket`, default catalog, library access checks, `ai/chat`. No separate Node server. |

---

## ✨ Features

- **Authentication** — Google login (Supabase) or continue with local storage (no account).
- **i18n** — English and Portuguese (locale switch in the UI).
- **Dashboard** — List of scenes with title, description and colored tags; reorder by drag; create, edit and delete scenes.
- **Scene page** (`/scene/[id]`) — Audio list with search; play/pause/stop, volume and loop per item; add by URL, file upload (when signed in), **Spotify** (track/album/playlist URLs), or YouTube URL support.
- **Global audio bar** — Fixed bar at the bottom when any audio is playing; pause/stop from any page.
- **Support page** (`/support`) — Optional donate/support page with PIX (key + QR) and Stripe link. Configure via `NEXT_PUBLIC_PIX_ID`, `NEXT_PUBLIC_PIX_URL`, and `NEXT_PUBLIC_STRIPE_URL`.
- **Audio library** — **`/library`** and **`/library/ai`** (Anthropic assistant, Pixabay, optional web search) require the user to be on `NEXT_USER_ADMIN` / `NEXT_PUBLIC_USER_ADMIN`. **`/library/defaults`**: curated default sounds (bundled data + DB) — anyone can browse; allowlisted users can pin their library items as defaults per category.
- **Storage** — localStorage (default), Supabase (PostgreSQL + Storage), or Firestore (optional).

### Audio sources

The app stores **metadata** (name + URL). Supported sources:

- [Tabletop Audio](https://tabletopaudio.com) (ambiences)
- **Spotify** — paste a track, album, or playlist URL; embedded player with play/pause
- **YouTube** — paste a watch URL to use the track as audio
- Any direct URL to MP3, WAV or OGG; file upload (max 25 MB) when signed in with Supabase

### API routes (server)

**Scenes & scene audios** (Bearer Supabase JWT; not the admin allowlist — any signed-in user owns their data):

| Route | Methods | Description |
| ----- | ------- | ----------- |
| `/api/scenes` | GET, POST | List scenes; create scene. |
| `/api/scenes/reorder` | POST | Reorder scenes. |
| `/api/scenes/[sceneId]` | GET, PATCH, DELETE | Get, update, or delete a scene. |
| `/api/scenes/[sceneId]/audios` | GET, POST | List or add audios on a scene. |
| `/api/scenes/[sceneId]/audios/reorder` | POST | Reorder audios in a scene. |
| `/api/audios/[audioId]` | PATCH, DELETE | Update or delete a single audio row. |

**Library & AI** (Bearer JWT **and** user id on `NEXT_USER_ADMIN` / `NEXT_PUBLIC_USER_ADMIN`; see [docs/plano-api-endpoints-e-banco.md](docs/plano-api-endpoints-e-banco.md) for the data model):

| Route | Methods | Description |
| ----- | ------- | ----------- |
| `/api/library` | GET, POST | List (optional `?type=…`) or create library items. |
| `/api/library/[id]` | PATCH, DELETE | Update or delete a library item. |
| `/api/library/default-favorites` | GET, POST | List or add “default sound” picks (per category). |
| `/api/library/default-favorites/[libraryItemId]` | DELETE | Remove a default favorite by library item id. |
| `/api/library/access` | GET | `{ allowed: boolean }` — whether the authenticated user is on the library/AI admin allowlist (Bearer JWT). |
| `/api/ai/chat` | POST | AI chat (Anthropic); Pixabay primary; optional web search (Serper). Requires `NEXT_ANTHROPIC_API_KEY`. |

**Public catalog (no auth)**

| Route | Method | Description |
| ----- | ------ | ----------- |
| `/api/default-audio-catalog` | GET | Default sound catalog: Supabase `default_audio_catalog` when configured, else bundled `data/default-audios.json`. |
| `/api/library/default-favorites/public` | GET | Global “default sounds” (library items promoted to the public catalog). Requires matching Supabase RLS (see migrations). |

**Utilities**

| Route | Method | Description |
| ----- | ------ | ----------- |
| `/api/ensure-audios-bucket` | POST | Creates the Supabase `audios` storage bucket and policies if missing. Requires Bearer token + `NEXT_SUPABASE_SERVICE_ROLE_KEY`. |

---

## 📜 Scripts

| Command         | Description                                                          |
| --------------- | -------------------------------------------------------------------- |
| `npm run dev`   | Development server at [http://localhost:3000](http://localhost:3000) |
| `npm run build` | Production build                                                     |
| `npm run start` | Run production build                                                 |
| `npm run lint`  | Run ESLint                                                           |

---

## 📁 Project structure

Domain logic lives in **`src/features/`** (scenes, library, AI, audio player, integrations). **`src/shared/`** holds cross-cutting UI and helpers and must not import from `features/`. **`src/app/`** stays thin: pages, layouts, and API route files that re-export server handlers. See [docs/architecture/folder-boundaries.md](docs/architecture/folder-boundaries.md).

```text
src/
├── app/                         # App Router: routes, layouts, thin API re-exports
│   ├── api/                     # API route entrypoints → @/features/**/server
│   ├── auth/                    # Auth callback
│   ├── login/                   # Login, enroll, verify
│   ├── dashboard/               # Scene list
│   ├── library/                 # Library browse, AI, default sounds
│   ├── scene/[sceneId]/         # Scene page (audio list, player)
│   └── support/                 # Support / donations (PIX, Stripe)
├── features/                    # scenes, library, ai, audioPlayer, integrations (spotify, youtube, pixabay); each feature may include server/, components/, api/
├── shared/                      # Shared UI (e.g. shared/ui) and libs; no imports from features/
├── components/                  # Shared UI (landing, layout, audio, etc.)
├── contexts/                    # Auth, theme, i18n
├── hooks/                       # React hooks (hooks/api → TanStack Query)
├── lib/                         # Supabase/Firebase clients, storage, schemas, audio helpers
├── locales/                     # en.json, pt.json
├── data/                        # Bundled data (e.g. default-audio catalog fallback)
└── store/                       # Re-exports audio player Zustand store (see features/audioPlayer)

supabase/
├── migrations/                  # DB and storage (run in order)
└── scripts/                     # One-off SQL (e.g. run-in-supabase.sql, apply-audio-library-and-favorites.sql)

docs/
├── architecture/                # e.g. folder-boundaries.md
└── plano-*.md                   # API/data model notes (Portuguese)
```

---

## 📚 Documentation

| Document | Purpose |
| -------- | ------- |
| [docs/architecture/folder-boundaries.md](docs/architecture/folder-boundaries.md) | Import rules for `app/`, `features/`, `shared/`, and server-only code |
| [docs/plano-api-endpoints-e-banco.md](docs/plano-api-endpoints-e-banco.md) | API and database model for the audio library |
| [docs/plano-chat-ia-audios-internet.md](docs/plano-chat-ia-audios-internet.md) | AI chat / external audio sources design notes |

---
