-- Allow anyone (including anon) to read which library items are promoted to Default sounds,
-- and to read those library rows (for playback URLs). Writes remain owner-only via existing policies.

drop policy if exists "Anyone can read default favorites catalog"
  on public.audio_library_default_favorites;
create policy "Anyone can read default favorites catalog"
  on public.audio_library_default_favorites for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can read library rows linked as default favorites"
  on public.audio_library;
create policy "Anyone can read library rows linked as default favorites"
  on public.audio_library for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.audio_library_default_favorites f
      where f.library_item_id = audio_library.id
    )
  );
