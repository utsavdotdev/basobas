alter table public.profiles
add column if not exists phone_verified_at timestamptz;

create table if not exists public.phone_verification_challenges (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text not null check (phone ~ '^\+9779[0-9]{9}$'),
  otp_hash text not null check (otp_hash ~ '^[a-f0-9]{64}$'),
  otp_expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  send_count integer not null default 0 check (send_count >= 0),
  first_sent_at timestamptz not null default timezone('utc', now()),
  last_sent_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists phone_verification_challenges_last_sent_idx
on public.phone_verification_challenges (last_sent_at desc);

create or replace function public.set_phone_verification_challenges_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_phone_verification_challenges_updated_at on public.phone_verification_challenges;
create trigger trg_phone_verification_challenges_updated_at
before update on public.phone_verification_challenges
for each row
execute function public.set_phone_verification_challenges_updated_at();

alter table public.phone_verification_challenges enable row level security;

drop policy if exists phone_verification_challenges_select_own on public.phone_verification_challenges;
create policy phone_verification_challenges_select_own
on public.phone_verification_challenges
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists phone_verification_challenges_insert_own on public.phone_verification_challenges;
create policy phone_verification_challenges_insert_own
on public.phone_verification_challenges
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists phone_verification_challenges_update_own on public.phone_verification_challenges;
create policy phone_verification_challenges_update_own
on public.phone_verification_challenges
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists phone_verification_challenges_delete_own on public.phone_verification_challenges;
create policy phone_verification_challenges_delete_own
on public.phone_verification_challenges
for delete
to authenticated
using (auth.uid() = user_id);
