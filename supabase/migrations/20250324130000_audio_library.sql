-- Per-user audio library (by type). See docs/plano-api-endpoints-e-banco.md
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

create policy "Users can manage own audio library"
  on public.audio_library for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
