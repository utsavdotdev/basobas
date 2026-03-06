alter table public.profiles
  add column if not exists role_locked boolean not null default false;

create index if not exists profiles_role_locked_idx on public.profiles(role_locked);
