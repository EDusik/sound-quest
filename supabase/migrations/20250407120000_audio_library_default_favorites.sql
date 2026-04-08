-- User picks from My audio library to surface in Default sounds (per category + display name).
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
