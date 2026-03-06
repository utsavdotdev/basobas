do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'rental_type_enum'
  ) then
    create type public.rental_type_enum as enum (
      'single_room',
      'multiple_room',
      'flat'
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'bhk_type_enum'
  ) then
    create type public.bhk_type_enum as enum (
      '1bhk',
      '2bhk',
      '3bhk'
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'rental_status_enum'
  ) then
    create type public.rental_status_enum as enum (
      'available',
      'rented',
      'inactive'
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'bathroom_type_enum'
  ) then
    create type public.bathroom_type_enum as enum (
      'attached',
      'shared'
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'water_facility_enum'
  ) then
    create type public.water_facility_enum as enum (
      'supply_24x7',
      'limited_supply',
      'tanker'
    );
  end if;
end;
$$;

create table if not exists public.rentals (
  rental_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rental_type public.rental_type_enum not null,
  location text not null,
  no_of_rooms integer not null check (no_of_rooms > 0),
  bhk_type public.bhk_type_enum not null,
  rent numeric(12, 2) not null check (rent > 0),
  status public.rental_status_enum not null default 'available',
  is_kitchen boolean not null default false,
  bathroom_type public.bathroom_type_enum not null,
  water_facility public.water_facility_enum not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists rentals_user_id_idx on public.rentals (user_id);
create index if not exists rentals_status_idx on public.rentals (status);
create index if not exists rentals_created_at_idx on public.rentals (created_at desc);

create or replace function public.set_rentals_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_rentals_updated_at on public.rentals;
create trigger trg_rentals_updated_at
before update on public.rentals
for each row
execute function public.set_rentals_updated_at();

alter table public.rentals enable row level security;

drop policy if exists rentals_select_public_or_owner on public.rentals;
create policy rentals_select_public_or_owner
on public.rentals
for select
to anon, authenticated
using (
  status = 'available'::public.rental_status_enum
  or auth.uid() = user_id
);

drop policy if exists rentals_insert_landlord_only on public.rentals;
create policy rentals_insert_landlord_only
on public.rentals
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'landlord'
  )
);

drop policy if exists rentals_update_owner_landlord on public.rentals;
create policy rentals_update_owner_landlord
on public.rentals
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'landlord'
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'landlord'
  )
);

drop policy if exists rentals_delete_owner_landlord on public.rentals;
create policy rentals_delete_owner_landlord
on public.rentals
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'landlord'
  )
);
