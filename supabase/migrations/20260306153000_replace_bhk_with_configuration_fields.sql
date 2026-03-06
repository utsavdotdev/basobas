do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'configuration_enum'
  ) then
    create type public.configuration_enum as enum ('bhk', 'bk');
  end if;
end;
$$;

alter table public.rentals
  drop constraint if exists rentals_flat_unit_config_check;

alter table public.rentals
  drop constraint if exists rentals_flat_configuration_check;

drop index if exists public.rentals_unit_config_type_idx;
drop index if exists public.rentals_unit_config_size_idx;

alter table public.rentals
  add column if not exists configuration public.configuration_enum,
  add column if not exists config_unit integer;

update public.rentals
set configuration = coalesce(
      configuration,
      case
        when unit_config_type::text in ('bhk', 'bk')
          then unit_config_type::text::public.configuration_enum
        else null
      end,
      'bhk'::public.configuration_enum
    ),
    config_unit = coalesce(
      config_unit,
      unit_config_size,
      nullif(regexp_replace(bhk_type::text, '\\D', '', 'g'), '')::integer,
      1
    )
where rental_type = 'flat'::public.rental_type_enum;

update public.rentals
set is_kitchen = true
where rental_type = 'flat'::public.rental_type_enum;

update public.rentals
set configuration = null,
    config_unit = null
where rental_type <> 'flat'::public.rental_type_enum;

alter table public.rentals
  drop column if exists unit_config_type,
  drop column if exists unit_config_size,
  drop column if exists bhk_type;

alter table public.rentals
  add constraint rentals_flat_configuration_check
  check (
    (
      rental_type = 'flat'::public.rental_type_enum
      and configuration is not null
      and config_unit is not null
      and config_unit > 0
      and is_kitchen = true
    )
    or (
      rental_type <> 'flat'::public.rental_type_enum
      and configuration is null
      and config_unit is null
    )
  );

create index if not exists rentals_configuration_idx
  on public.rentals (configuration);

create index if not exists rentals_config_unit_idx
  on public.rentals (config_unit);

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'unit_config_type_enum'
  ) and not exists (
    select 1
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_type t on t.oid = a.atttypid
    join pg_namespace n on n.oid = t.typnamespace
    where c.relkind = 'r'
      and n.nspname = 'public'
      and t.typname = 'unit_config_type_enum'
      and a.attnum > 0
      and not a.attisdropped
  ) then
    drop type public.unit_config_type_enum;
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'bhk_type_enum'
  ) and not exists (
    select 1
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_type t on t.oid = a.atttypid
    join pg_namespace n on n.oid = t.typnamespace
    where c.relkind = 'r'
      and n.nspname = 'public'
      and t.typname = 'bhk_type_enum'
      and a.attnum > 0
      and not a.attisdropped
  ) then
    drop type public.bhk_type_enum;
  end if;
end;
$$;
