-- Rename rooms.subtitle to description (preserves all data)
alter table public.rooms rename column subtitle to description;
