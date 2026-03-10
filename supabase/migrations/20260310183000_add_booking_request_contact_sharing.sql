alter table public.booking_requests
  add column if not exists shared_landlord_phone text,
  add column if not exists shared_landlord_phone_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_requests_shared_landlord_phone_length_check'
  ) then
    alter table public.booking_requests
      add constraint booking_requests_shared_landlord_phone_length_check
      check (
        shared_landlord_phone is null
        or char_length(shared_landlord_phone) <= 32
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_requests_shared_landlord_phone_format_check'
  ) then
    alter table public.booking_requests
      add constraint booking_requests_shared_landlord_phone_format_check
      check (
        shared_landlord_phone is null
        or shared_landlord_phone ~ '^\+9779\d{9}$'
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_requests_shared_landlord_phone_pair_check'
  ) then
    alter table public.booking_requests
      add constraint booking_requests_shared_landlord_phone_pair_check
      check (
        (shared_landlord_phone is null and shared_landlord_phone_at is null)
        or (
          shared_landlord_phone is not null
          and shared_landlord_phone_at is not null
        )
      );
  end if;
end;
$$;
