drop policy if exists rentals_select_public_or_owner on public.rentals;
create policy rentals_select_public_or_owner
on public.rentals
for select
to anon, authenticated
using (
  status = 'available'::public.rental_status_enum
  or auth.uid() = user_id
  or exists (
    select 1
    from public.booking_requests br
    where br.rental_id = rentals.rental_id
      and br.tenant_id = auth.uid()
      and br.status in (
        'pending'::public.booking_request_status_enum,
        'approved'::public.booking_request_status_enum
      )
  )
);

alter table public.rentals replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rentals'
  ) then
    alter publication supabase_realtime add table public.rentals;
  end if;
end;
$$;

create or replace function public.handle_booking_request_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved'::public.booking_request_status_enum
     and old.status is distinct from 'approved'::public.booking_request_status_enum then
    update public.rentals
    set status = 'rented'::public.rental_status_enum
    where rental_id = new.rental_id
      and user_id = new.landlord_id;

    update public.booking_requests
    set
      status = 'rejected'::public.booking_request_status_enum,
      reviewed_at = coalesce(reviewed_at, timezone('utc', now())),
      review_message = coalesce(
        review_message,
        'Another tenant has already secured this rental.'
      )
    where rental_id = new.rental_id
      and booking_request_id <> new.booking_request_id
      and status = 'pending'::public.booking_request_status_enum;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_booking_request_status_change on public.booking_requests;
create trigger trg_booking_request_status_change
after update of status on public.booking_requests
for each row
execute function public.handle_booking_request_status_change();
