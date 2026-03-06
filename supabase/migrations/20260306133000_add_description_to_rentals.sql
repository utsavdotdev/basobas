alter table public.rentals
  add column if not exists description text not null default '';
