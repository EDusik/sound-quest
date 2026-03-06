# SoundTable

Frontend-only web app: Google auth, rooms with labels, and audio lists from public URLs. No custom backend; uses Firebase (optional) and localStorage or Firestore.

## Features

- **Auth**: Google OAuth (Firebase Auth) or local demo mode
- **Dashboard**: List your rooms (title, subtitle, colored labels)
- **Create room**: Title, subtitle, labels with color picker
- **Room page** (`/room/[id]`): Audio list with search, play/pause/stop, volume, loop
- **Global audio bar**: Fixed bottom bar when any audio is playing; pause/stop from there
- **Storage**: localStorage (default) or Firestore (client SDK only)

## Setup

1. **Install and run (no config)**

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Use **“Continue with local storage (no account)”** on the login page. Data is stored in the browser only.

2. **Optional: Google sign-in (Supabase)**

   - Create a [Supabase project](https://supabase.com) and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env`.
   - In Supabase: **Authentication → Providers** → enable **Google** and paste your Google OAuth Client ID and Client Secret.
   - In [Google Cloud Console](https://console.cloud.google.com): **APIs & Services → Credentials** → your OAuth 2.0 Client ID → **Authorized redirect URIs**. Add **exactly** this URL (replace `YOUR_PROJECT_REF` with your Supabase project ref from the dashboard URL):
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     Example: `https://adglgkgudriqouudhamt.supabase.co/auth/v1/callback`.  
     **Error 400: redirect_uri_mismatch** means this URI is missing or different in Google Cloud.

   - In Supabase **Authentication → URL Configuration**, add your app URLs to **Redirect URLs** (e.g. `http://localhost:3000/auth/callback`).

   - **Create the database tables** (required for rooms/audios with Supabase). Otherwise you'll see *"Could not find the table 'public.rooms' in the schema cache"*.
     - **Option A:** In Supabase Dashboard go to **SQL Editor** → New query → paste and run the contents of `supabase/migrations/20250305000000_rooms_audios.sql`.
     - **Option B:** If you use [Supabase CLI](https://supabase.com/docs/guides/cli), run `supabase db push` from the project root (or link the project and run migrations).

3. **Optional: Firebase and Firestore**

   - Create a [Firebase project](https://console.firebase.google.com/)
   - Enable **Authentication** → Sign-in method → **Google**
   - Copy env vars from Project settings into `.env.local` (see `.env.example`)
   - For **Firestore**: create a Firestore database, then set `NEXT_PUBLIC_USE_FIRESTORE=true` in `.env.local`
   - Deploy security rules from `firestore.rules` (Firebase Console → Firestore → Rules)

   If you use Firestore with a `rooms` query by `userId` and `orderBy('createdAt')`, create a composite index when the CLI or console prompts you.

## Environment variables

See `.env.example`. All are optional:

- `NEXT_PUBLIC_FREESOUND_API_KEY`: Enables **Search Freesound** on the room page (search and add sounds from [Freesound](https://freesound.org)). Get a token at [freesound.org/apiv2/apply](https://freesound.org/apiv2/apply).
- `NEXT_PUBLIC_FIREBASE_*`: Required for Google sign-in and Firestore
- `NEXT_PUBLIC_USE_FIRESTORE`: Set to `"true"` to use Firestore instead of localStorage

## Audio sources

The app only stores **metadata** (name + URL). Use public/free audio URLs, for example:

- [Tabletop Audio](https://tabletopaudio.com/) (ambient sounds)
- [FreeSound](https://freesound.org/) (after creating an account, you can use direct links to preview files)
- Any direct URL to an MP3 or supported audio file (e.g. royalty-free samples)

Do not store audio files in the app; only the URL is saved.

## Tech stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS
- Firebase Auth + optional Firestore (client SDK only)
- Zustand for global audio player state
- No custom backend or database server

## Scripts

- `npm run dev` – development
- `npm run build` – production build
- `npm run start` – run production build
