-- Speed up list query: where user_id = ? order by order
create index if not exists idx_scenes_user_id_order
  on public.scenes (user_id, "order" nulls last);
