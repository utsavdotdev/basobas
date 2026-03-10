create table if not exists public.rental_private_details (
  rental_id uuid primary key references public.rentals(rental_id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  google_maps_url text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists rental_private_details_owner_user_id_idx
  on public.rental_private_details (owner_user_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rental_private_details_google_maps_url_length_check'
  ) then
    alter table public.rental_private_details
      add constraint rental_private_details_google_maps_url_length_check
      check (char_length(google_maps_url) <= 2048);
  end if;
end;
$$;

create or replace function public.set_rental_private_details_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_rental_private_details_updated_at on public.rental_private_details;
create trigger trg_rental_private_details_updated_at
before update on public.rental_private_details
for each row
execute function public.set_rental_private_details_updated_at();

alter table public.rental_private_details enable row level security;

drop policy if exists rental_private_details_select_owner on public.rental_private_details;
create policy rental_private_details_select_owner
on public.rental_private_details
for select
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists rental_private_details_insert_owner on public.rental_private_details;
create policy rental_private_details_insert_owner
on public.rental_private_details
for insert
to authenticated
with check (auth.uid() = owner_user_id);

drop policy if exists rental_private_details_update_owner on public.rental_private_details;
create policy rental_private_details_update_owner
on public.rental_private_details
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists rental_private_details_delete_owner on public.rental_private_details;
create policy rental_private_details_delete_owner
on public.rental_private_details
for delete
to authenticated
using (auth.uid() = owner_user_id);

insert into public.rental_private_details (rental_id, owner_user_id)
select rental_id, user_id
from public.rentals
on conflict (rental_id) do nothing;

alter table public.booking_requests
  add column if not exists shared_location_url text,
  add column if not exists shared_location_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_requests_shared_location_url_length_check'
  ) then
    alter table public.booking_requests
      add constraint booking_requests_shared_location_url_length_check
      check (
        shared_location_url is null
        or char_length(shared_location_url) <= 2048
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_requests_shared_location_pair_check'
  ) then
    alter table public.booking_requests
      add constraint booking_requests_shared_location_pair_check
      check (
        (shared_location_url is null and shared_location_at is null)
        or (shared_location_url is not null and shared_location_at is not null)
      );
  end if;
end;
$$;
