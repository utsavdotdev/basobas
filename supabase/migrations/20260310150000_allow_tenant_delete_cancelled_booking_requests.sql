drop policy if exists booking_requests_delete_tenant_cancelled on public.booking_requests;
create policy booking_requests_delete_tenant_cancelled
on public.booking_requests
for delete
to authenticated
using (
  auth.uid() = tenant_id
  and status = 'cancelled'::public.booking_request_status_enum
);
