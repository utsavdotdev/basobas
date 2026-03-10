drop policy if exists booking_requests_update_landlord_review on public.booking_requests;

create policy booking_requests_update_landlord_review
on public.booking_requests
for update
to authenticated
using (auth.uid() = landlord_id)
with check (
  auth.uid() = landlord_id
  and status in (
    'pending'::public.booking_request_status_enum,
    'approved'::public.booking_request_status_enum,
    'rejected'::public.booking_request_status_enum
  )
);
