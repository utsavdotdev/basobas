do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'unit_config_type_enum'
  ) then
    create type public.unit_config_type_enum as enum ('bhk', 'bk');
  end if;
end;
$$;

alter table public.rentals
  add column if not exists unit_config_type public.unit_config_type_enum,
  add column if not exists unit_config_size integer;

update public.rentals
set unit_config_type = 'bhk'::public.unit_config_type_enum,
    unit_config_size = greatest(
      1,
      coalesce(
        nullif(regexp_replace(bhk_type::text, '\\D', '', 'g'), '')::integer,
        1
      )
    )
where rental_type = 'flat'::public.rental_type_enum
  and (unit_config_type is null or unit_config_size is null);

update public.rentals
set is_kitchen = true
where rental_type = 'flat'::public.rental_type_enum
  and is_kitchen is distinct from true;

update public.rentals
set unit_config_type = null,
    unit_config_size = null
where rental_type <> 'flat'::public.rental_type_enum;

alter table public.rentals
  drop constraint if exists rentals_flat_unit_config_check;

alter table public.rentals
  add constraint rentals_flat_unit_config_check
  check (
    (
      rental_type = 'flat'::public.rental_type_enum
      and unit_config_type is not null
      and unit_config_size is not null
      and unit_config_size > 0
      and is_kitchen = true
    )
    or (
      rental_type <> 'flat'::public.rental_type_enum
      and unit_config_type is null
      and unit_config_size is null
    )
  );

create index if not exists rentals_unit_config_type_idx
  on public.rentals (unit_config_type);

create index if not exists rentals_unit_config_size_idx
  on public.rentals (unit_config_size);
