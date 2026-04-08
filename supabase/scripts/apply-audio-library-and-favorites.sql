-- Run once in Supabase → SQL Editor (order matters: audio_library first).
-- Fixes: "Could not find the table 'public.audio_library_default_favorites' in the schema cache"

-- 1) Per-user audio library
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

drop policy if exists "Users can manage own audio library" on public.audio_library;
create policy "Users can manage own audio library"
  on public.audio_library for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2) User picks for Default sounds (FK → audio_library)
create table if not exists public.audio_library_default_favorites (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  library_item_id text not null references public.audio_library(id) on delete cascade,
  category text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, library_item_id)
);

create index if not exists idx_audio_library_default_favorites_user
  on public.audio_library_default_favorites(user_id);

alter table public.audio_library_default_favorites enable row level security;

drop policy if exists "Users manage own default favorites" on public.audio_library_default_favorites;
create policy "Users manage own default favorites"
  on public.audio_library_default_favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3) Optional: align legacy library types with default catalog slugs (idempotent)
update public.audio_library set type = 'weather' where type = 'weather-effects';
update public.audio_library set type = 'combat' where type = 'battle';
update public.audio_library set type = 'creatures' where type = 'animals';
update public.audio_library set type = 'ambience' where type = 'cities';
update public.audio_library set type = 'ambience' where type = 'others';
