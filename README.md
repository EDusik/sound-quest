<h1 align="center">🎲 SoundTable</h1>
<p align="center">
  <strong>Create the perfect soundscape for every RPG session.</strong>
</p>
<p align="center">
  <a href="#-getting-started">Getting started</a> •
  <a href="#-configuration">Configuration</a> •
  <a href="#-tech-stack">Tech stack</a> •
  <a href="#-features">Features</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Supabase-2-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Zustand-5-764ABC?style=flat-square" alt="Zustand" />
</p>

### Dashboard

<p align="center">
  <img src="./github/images/SoundTable1.png" alt="SoundTable demo" width="720" />
</p>

## Room

<p align="center">
  <img src="./github/images/SoundTable2.png" alt="SoundTable demo" width="720" />
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
5. Create the database tables: in Supabase **SQL Editor**, run the contents of `supabase/migrations/20250305000000_rooms_audios.sql` (or use `supabase db push` if you have the CLI).
6. Run again:
   ```bash
   npm run dev
   ```

### Deploy / Production (avoid redirect to localhost)

After deploying, if signing in with Google redirects you to `http://localhost:3000/`, adjust in **Supabase**:

1. **Supabase** → **Authentication** → **URL Configuration**.
2. **Site URL**: change to your app’s production URL, e.g. `https://your-domain.vercel.app` (or the domain you use).
3. **Redirect URLs**: add the production callback URL, e.g.:
   ```text
   https://your-domain.vercel.app/auth/callback
   ```
   You can keep `http://localhost:3000/auth/callback` for development as well.

The app already sends `redirectTo` with `window.location.origin`, so in production Supabase must have the production URL allowed under **Redirect URLs** and, if applicable, **Site URL**.

---

## ⚙️ Configuration

### Environment variables

Copy `.env.example` to `.env` (or `.env.local`) and adjust as needed. **All are optional** to run in “localStorage only” mode.

| Variable                                   | Description                                                                                                            |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                 | Supabase project URL (e.g. `https://xxx.supabase.co`)                                                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`            | Supabase anonymous key (Authentication + DB)                                                                           |
| `NEXT_PUBLIC_FREESOUND_API_KEY`            | Enables search on [Freesound](https://freesound.org) on the room page ([get token](https://freesound.org/apiv2/apply)) |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase: API Key (optional)                                                                                           |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase: Auth Domain                                                                                                  |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase: Project ID                                                                                                   |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase: Storage Bucket                                                                                               |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase: Messaging Sender ID                                                                                          |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase: App ID                                                                                                       |
| `NEXT_PUBLIC_USE_FIRESTORE`                | `"true"` to use Firestore instead of localStorage                                                                      |
| `NEXT_PUBLIC_FREE_ACCESS`                  | `"false"` to disable access without login (default: allowed)                                                           |

### Firebase / Firestore (optional)

- Create a project at [Firebase](https://console.firebase.google.com), enable **Authentication** (Google) and optionally **Firestore**.
- Fill in the `NEXT_PUBLIC_FIREBASE_*` variables in `.env`.
- For Firestore: create the database and set `NEXT_PUBLIC_USE_FIRESTORE=true`.
- Deploy the rules in `firestore.rules` (Console → Firestore → Rules). If you use queries by `userId` and `orderBy('createdAt')`, create the composite index when the console/CLI prompts you.

---

## 🛠 Tech stack

| Layer                     | Technology                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Framework**             | [Next.js 16](https://nextjs.org) (App Router)                                                                            |
| **UI**                    | [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com)                                                 |
| **Language**              | [TypeScript](https://www.typescriptlang.org)                                                                             |
| **Auth & DB**             | [Supabase](https://supabase.com) (Auth + PostgreSQL); optional: [Firebase](https://firebase.google.com) Auth + Firestore |
| **Global state (player)** | [Zustand](https://zustand-demo.pmnd.rs)                                                                                  |
| **Backend**               | No custom server; client only (Supabase/Firebase SDK and localStorage)                                                   |

---

## ✨ Features

- **Authentication** — Google login (Supabase) or demo mode with local storage.
- **Dashboard** — List of rooms with title, description and colored tags; reorder by drag; edit and delete.
- **Create room** — Title, description and tags with color picker.
- **Room page** (`/room/[id]`) — Audio list with search; play/pause/stop, volume and loop per item; add by URL or (with API key) Freesound search; YouTube support.
- **Global audio bar** — Fixed bar at the bottom when any audio is playing; pause/stop control from any page.
- **Storage** — localStorage (default), Supabase (PostgreSQL) or Firestore (optional).

### Audio sources

The app stores only **metadata** (name + URL). You can use:

- [Tabletop Audio](https://tabletopaudio.com) (ambiences)
- [Freesound](https://freesound.org) (with account and direct links or search with API key)
- Any direct URL to MP3 or supported audio file

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
├── app/              # Routes (App Router)
│   ├── login/        # Login screen
│   ├── dashboard/    # Room list
│   ├── create-room/  # Create new room
│   └── room/[id]/    # Room page (audio)
├── components/       # Reusable components
├── contexts/         # AuthContext
├── lib/              # Supabase, Firebase, storage, types
├── store/            # Zustand (audioStore)
docs/
└── images/           # Screenshots and banner (add here)
```

---
