<h1 align="center">🎲 SoundQuest</h1>
<p align="center">
  <strong>Create the perfect soundscape for every RPG session.</strong>
</p>
<p align="center">
  <a href="#-getting-started">Getting started</a> •
  <a href="#-configuration">Configuration</a> •
  <a href="#-tech-stack">Tech stack</a> •
  <a href="#-features">Features</a> •
  <a href="#-project-structure">Structure</a>
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
cd project
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
5. Create the database and storage: in Supabase **SQL Editor**, either run the migrations in `supabase/migrations/` in order (or `supabase db push` if you use the CLI), or run the one-time script `supabase/scripts/run-in-supabase.sql` to create tables, RLS, and the `audios` storage bucket in one go. Include the `audio_library` migration if you use the library/AI API.
6. (Optional) For the app to create the `audios` bucket automatically if missing, add `SUPABASE_SERVICE_ROLE_KEY` to `.env` (Supabase Dashboard → Settings → API → service_role key). Otherwise ensure the bucket exists via migrations or the script above.
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
| `SUPABASE_SERVICE_ROLE_KEY`                | **(Server-only.)** Used to create the `audios` storage bucket if missing (`POST /api/ensure-audios-bucket`). Optional if the bucket is created via SQL/migrations.                                              |
| `NEXT_PUBLIC_FREESOUND_API_KEY`            | Freesound API token. Enables Freesound search on the scene page and is read by server routes such as `/api/freesound-search` and `/api/freesound-configured`. [Get a token](https://freesound.org/apiv2/apply). |
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
| `AI_LIBRARY_ALLOWED_USER_IDS`             | Comma-separated UUIDs allowed to use `/api/library` and `/api/ai/chat` (Bearer Supabase JWT). See [docs/plano-api-endpoints-e-banco.md](docs/plano-api-endpoints-e-banco.md).                                  |
| `OPENAI_API_KEY`                           | **(Server-only.)** Required for `POST /api/ai/chat`.                                                                                                                                                          |
| `OPENAI_CHAT_MODEL`                        | Optional override for the chat model (default `gpt-4o-mini`).                                                                                                                                                  |
| `SERPER_API_KEY`                           | Optional. Web search snippets for the AI chat (`POST /api/ai/chat`).                                                                                                                                           |

### Firebase / Firestore (optional)

- Create a project at [Firebase](https://console.firebase.google.com), enable **Authentication** (Google) and optionally **Firestore**.
- Set the `NEXT_PUBLIC_FIREBASE_*` variables in `.env`.
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
| **Backend**               | Next.js API routes (server-only): `ensure-audios-bucket`, `freesound-search`, `freesound-configured`, `library`, `ai/chat`. No separate Node server. |

---

## ✨ Features

- **Authentication** — Google login (Supabase) or continue with local storage (no account).
- **i18n** — English and Portuguese (locale switch in the UI).
- **Dashboard** — List of scenes with title, description and colored tags; reorder by drag; create, edit and delete scenes.
- **Scene page** (`/scene/[id]`) — Audio list with search; play/pause/stop, volume and loop per item; add by URL, file upload (when signed in), **Freesound search** (when `NEXT_PUBLIC_FREESOUND_API_KEY` is set), **Spotify** (track/album/playlist URLs), or YouTube URL support.
- **Global audio bar** — Fixed bar at the bottom when any audio is playing; pause/stop from any page.
- **Support page** (`/support`) — Optional donate/support page with PIX (key + QR) and Stripe link. Configure via `NEXT_PUBLIC_PIX_ID`, `NEXT_PUBLIC_PIX_URL`, and `NEXT_PUBLIC_STRIPE_URL`.
- **Storage** — localStorage (default), Supabase (PostgreSQL + Storage), or Firestore (optional).

### Audio sources

The app stores **metadata** (name + URL). Supported sources:

- [Tabletop Audio](https://tabletopaudio.com) (ambiences)
- [Freesound](https://freesound.org) — search (with `NEXT_PUBLIC_FREESOUND_API_KEY`) or paste direct links
- **Spotify** — paste a track, album, or playlist URL; embedded player with play/pause
- **YouTube** — paste a watch URL to use the track as audio
- Any direct URL to MP3, WAV or OGG; file upload (max 25 MB) when signed in with Supabase

### API routes (server)

| Route                       | Method | Description                                                                                                                                                     |
| --------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/ensure-audios-bucket` | POST   | Creates the Supabase `audios` storage bucket and policies if missing. Requires `Authorization: Bearer <Supabase access_token>` and `SUPABASE_SERVICE_ROLE_KEY`. |
| `/api/freesound-configured` | GET    | Returns `{ configured: boolean }` depending on `NEXT_PUBLIC_FREESOUND_API_KEY`. Used by the client to show or hide Freesound search.                            |
| `/api/freesound-search`     | GET    | Proxies search to Freesound API (query params: `query`, `page`, `pageSize`, `filter`) while keeping the token in `NEXT_PUBLIC_FREESOUND_API_KEY` on the server. |
| `/api/library`              | GET    | Lists the signed-in user’s audio library; optional `?type=…`. Requires Bearer JWT + `AI_LIBRARY_ALLOWED_USER_IDS`. See [docs/plano-api-endpoints-e-banco.md](docs/plano-api-endpoints-e-banco.md). |
| `/api/library`              | POST   | Creates a library item. Same auth as GET.                                                                                                                        |
| `/api/library/[id]`         | PATCH, DELETE | Updates or deletes an item. Same auth.                                                                                                                    |
| `/api/ai/chat`              | POST   | AI chat with optional web search (`SERPER_API_KEY`) + OpenAI. Same allowlist + `OPENAI_API_KEY`.                                                                  |

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

```text
src/
├── app/                    # App Router
│   ├── api/                # API routes
│   │   ├── ensure-audios-bucket/   # Create Supabase audios bucket
│   │   ├── freesound-configured/  # Check if Freesound key is set
│   │   ├── freesound-search/       # Proxy Freesound search (key server-side)
│   │   ├── library/                # Audio library CRUD (JWT + allowlist)
│   │   └── ai/chat/                # AI chat + suggestions
│   ├── auth/               # Auth callback
│   ├── login/               # Login, enroll, verify
│   ├── dashboard/           # Scene list (create scene via modal)
│   ├── scene/[sceneId]/     # Scene page (audio list, player)
│   └── support/             # Support/donate page (PIX, Stripe)
├── components/              # Reusable UI (layout, editor, audio, auth, etc.)
├── contexts/                # Auth, theme, i18n
├── hooks/                   # React hooks (including hooks/api for TanStack Query)
├── lib/                     # Supabase, Firebase, storage, freesound, i18n, schemas
├── locales/                  # en.json, pt.json
└── store/                   # Zustand (audio player state)

supabase/
├── migrations/              # DB and storage migrations (run in order)
└── scripts/                 # One-time SQL (e.g. run-in-supabase.sql)
```

---
