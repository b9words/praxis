create table if not exists public.community_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_community_waitlist_created_at on public.community_waitlist(created_at);






