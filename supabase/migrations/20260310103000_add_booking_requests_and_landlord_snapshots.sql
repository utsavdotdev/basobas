do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'booking_request_status_enum'
  ) then
    create type public.booking_request_status_enum as enum (
      'pending',
      'approved',
      'rejected',
      'cancelled'
    );
  end if;
end;
$$;

alter table public.rentals
  add column if not exists landlord_name text not null default 'Landlord',
  add column if not exists landlord_email text not null default '',
  add column if not exists landlord_avatar_url text not null default '',
  add column if not exists landlord_phone_verified boolean not null default false;

update public.rentals r
set
  landlord_name = coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Landlord'
  ),
  landlord_email = coalesce(u.email, ''),
  landlord_avatar_url = coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'picture'), ''),
    ''
  ),
  landlord_phone_verified = coalesce(p.phone_verified, false)
from auth.users u
left join public.profiles p on p.id = u.id
where r.user_id = u.id;

create table if not exists public.booking_requests (
  booking_request_id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references public.rentals(rental_id) on delete cascade,
  tenant_id uuid not null references auth.users(id) on delete cascade,
  landlord_id uuid not null references auth.users(id) on delete cascade,
  tenant_name text not null,
  tenant_email text not null,
  tenant_phone text not null,
  tenant_message text,
  move_in_date date not null,
  stay_duration_months integer not null check (stay_duration_months > 0),
  status public.booking_request_status_enum not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  review_message text,
  constraint booking_requests_tenant_message_length_check
    check (tenant_message is null or char_length(tenant_message) <= 500),
  constraint booking_requests_review_message_length_check
    check (review_message is null or char_length(review_message) <= 500),
  constraint booking_requests_tenant_landlord_check
    check (tenant_id <> landlord_id)
);

create unique index if not exists booking_requests_one_active_request_idx
  on public.booking_requests (rental_id, tenant_id)
  where status in (
    'pending'::public.booking_request_status_enum,
    'approved'::public.booking_request_status_enum
  );

create index if not exists booking_requests_tenant_id_idx
  on public.booking_requests (tenant_id, created_at desc);

create index if not exists booking_requests_landlord_id_idx
  on public.booking_requests (landlord_id, created_at desc);

create index if not exists booking_requests_rental_id_idx
  on public.booking_requests (rental_id);

create index if not exists booking_requests_status_idx
  on public.booking_requests (status);

create or replace function public.set_booking_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_booking_requests_updated_at on public.booking_requests;
create trigger trg_booking_requests_updated_at
before update on public.booking_requests
for each row
execute function public.set_booking_requests_updated_at();

alter table public.booking_requests enable row level security;
alter table public.booking_requests replica identity full;

drop policy if exists booking_requests_select_involved on public.booking_requests;
create policy booking_requests_select_involved
on public.booking_requests
for select
to authenticated
using (
  auth.uid() = tenant_id
  or auth.uid() = landlord_id
);

drop policy if exists booking_requests_insert_tenant_only on public.booking_requests;
create policy booking_requests_insert_tenant_only
on public.booking_requests
for insert
to authenticated
with check (
  auth.uid() = tenant_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'tenant'
      and p.phone_verified = true
  )
  and exists (
    select 1
    from public.rentals r
    where r.rental_id = rental_id
      and r.user_id = landlord_id
      and r.status = 'available'
  )
);

drop policy if exists booking_requests_update_tenant_cancel on public.booking_requests;
create policy booking_requests_update_tenant_cancel
on public.booking_requests
for update
to authenticated
using (auth.uid() = tenant_id)
with check (
  auth.uid() = tenant_id
  and status = 'cancelled'
);

drop policy if exists booking_requests_update_landlord_review on public.booking_requests;
create policy booking_requests_update_landlord_review
on public.booking_requests
for update
to authenticated
using (auth.uid() = landlord_id)
with check (
  auth.uid() = landlord_id
  and status in (
    'approved'::public.booking_request_status_enum,
    'rejected'::public.booking_request_status_enum
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'booking_requests'
  ) then
    alter publication supabase_realtime add table public.booking_requests;
  end if;
end;
$$;
