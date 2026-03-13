-- Add slug column to scenes for URL-friendly routes (e.g. /scene/my-scene-name)
alter table public.scenes
  add column if not exists slug text;

-- Unique slug per user (allows multiple nulls for existing rows)
create unique index if not exists idx_scenes_user_id_slug
  on public.scenes (user_id, slug)
  where slug is not null;

comment on column public.scenes.slug is 'URL-friendly identifier derived from title; unique per user.';
