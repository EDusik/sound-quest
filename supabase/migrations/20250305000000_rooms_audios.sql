-- Rooms: salas do usuário
create table if not exists public.rooms (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subtitle text default '',
  labels jsonb default '[]',
  created_at timestamptz not null default now(),
  "order" int
);

-- Audios: áudios por sala
create table if not exists public.audios (
  id text primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  name text not null,
  source_url text not null,
  kind text default 'file',
  created_at timestamptz not null default now(),
  "order" int
);

create index if not exists idx_rooms_user_id on public.rooms(user_id);
create index if not exists idx_audios_room_id on public.audios(room_id);

alter table public.rooms enable row level security;
alter table public.audios enable row level security;

-- RLS: usuário só acessa suas próprias rooms
create policy "Users can manage own rooms"
  on public.rooms for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS: usuário só acessa audios de salas que possui
create policy "Users can manage audios of own rooms"
  on public.audios for all
  using (
    exists (
      select 1 from public.rooms r
      where r.id = audios.room_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = audios.room_id and r.user_id = auth.uid()
    )
  );
