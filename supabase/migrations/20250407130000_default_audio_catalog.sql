-- Global curated default sounds catalog (read-only for clients; manage via SQL Editor or service role).
-- Category slugs match src/lib/default-audio-categories.ts

create table if not exists public.default_audio_catalog (
  id text primary key,
  name text not null,
  source_url text not null,
  type text not null
    check (type in (
      'ambience',
      'combat',
      'magic',
      'creatures',
      'foley',
      'music',
      'tension',
      'stingers',
      'weather',
      'animals'
    )),
  created_at timestamptz not null default now(),
  "order" int
);

create index if not exists idx_default_audio_catalog_type
  on public.default_audio_catalog(type);

alter table public.default_audio_catalog enable row level security;

drop policy if exists "Anyone can read default audio catalog" on public.default_audio_catalog;
create policy "Anyone can read default audio catalog"
  on public.default_audio_catalog
  for select
  to anon, authenticated
  using (true);

comment on table public.default_audio_catalog is 'Curated default sounds for /library/defaults; no INSERT/UPDATE/DELETE for anon/authenticated (use dashboard SQL or service role).';
