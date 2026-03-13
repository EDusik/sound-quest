-- Backfill slug from title for existing scenes (URL-friendly, unique per user).
-- Run after 20250312000000_add_scenes_slug.sql.

-- Slugify: lowercase, trim, strip non-alphanumeric (keeps spaces/hyphens), spaces→hyphen, collapse hyphens, trim edges. Fallback 'scene'.
create or replace function public.slug_from_title(t text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      trim(both '-' from regexp_replace(
        regexp_replace(
          regexp_replace(lower(trim(coalesce(t, ''))), '[^a-z0-9\s-]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      )),
      ''
    ),
    'scene'
  );
$$;

-- Update scenes: set slug from title, with uniqueness per user (append -2, -3, ... for duplicates).
with
  base as (
    select
      id,
      user_id,
      title,
      slug,
      public.slug_from_title(title) as base_slug
    from public.scenes
    where slug is null or slug = ''
  ),
  numbered as (
    select
      id,
      user_id,
      base_slug,
      row_number() over (partition by user_id, base_slug order by created_at, id) as rn
    from base
  ),
  final_slug as (
    select
      id,
      case when rn = 1 then base_slug else base_slug || '-' || rn end as new_slug
    from numbered
  )
update public.scenes s
set slug = f.new_slug
from final_slug f
where s.id = f.id;

-- Optional: drop the helper if you don't want it in the DB
-- drop function if exists public.slug_from_title(text);

-- =============================================================================
-- One-off version for SQL Editor (no function): run this if you prefer not to
-- add slug_from_title. Same logic, inline.
-- =============================================================================
/*
with
  base as (
    select
      id,
      user_id,
      coalesce(
        nullif(
          trim(both '-' from regexp_replace(
            regexp_replace(
              regexp_replace(lower(trim(coalesce(title, ''))), '[^a-z0-9\s-]', '', 'g'),
              '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
          )),
          ''
        ),
        'scene'
      ) as base_slug
    from public.scenes
    where slug is null or slug = ''
  ),
  numbered as (
    select id, base_slug,
      row_number() over (partition by user_id, base_slug order by created_at, id) as rn
    from base
  ),
  final as (
    select id, case when rn = 1 then base_slug else base_slug || '-' || rn end as new_slug
    from numbered
  )
update public.scenes s
set slug = f.new_slug
from final f
where s.id = f.id;
*/
