-- Replace catalog slug travel → animals (Travel/Movement → Animals in UI).

update public.default_audio_catalog set type = 'animals' where type = 'travel';
update public.audio_library set type = 'animals' where type = 'travel';

alter table public.default_audio_catalog drop constraint if exists default_audio_catalog_type_check;
alter table public.default_audio_catalog add constraint default_audio_catalog_type_check check (type in (
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
));
