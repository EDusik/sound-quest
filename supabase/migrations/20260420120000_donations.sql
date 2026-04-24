-- Donations (Mercado Pago Pix). Access only via service role from Next.js API routes.
create table if not exists public.donations (
  id text primary key,
  amount_cents integer not null check (amount_cents >= 100),
  currency text not null default 'BRL',
  status text not null default 'pending',
  qr_code text,
  qr_code_base64 text,
  ticket_url text,
  payer_email text,
  raw jsonb,
  expires_at timestamptz,
  last_mp_fetch_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_donations_status on public.donations(status);
create index if not exists idx_donations_created_at on public.donations(created_at desc);

alter table public.donations enable row level security;
