-- Align audio_library.type with default catalog category slugs (see DEFAULT_AUDIO_CATEGORY_SLUGS).
update public.audio_library set type = 'weather' where type = 'weather-effects';
update public.audio_library set type = 'combat' where type = 'battle';
update public.audio_library set type = 'creatures' where type = 'animals';
update public.audio_library set type = 'ambience' where type = 'cities';
update public.audio_library set type = 'ambience' where type = 'others';
