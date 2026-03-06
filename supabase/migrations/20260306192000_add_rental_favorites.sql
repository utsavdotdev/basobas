create table if not exists public.rental_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  rental_id uuid not null references public.rentals(rental_id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, rental_id)
);

create index if not exists rental_favorites_rental_id_idx
  on public.rental_favorites (rental_id);

create index if not exists rental_favorites_created_at_idx
  on public.rental_favorites (created_at desc);

alter table public.rental_favorites enable row level security;

drop policy if exists rental_favorites_select_own on public.rental_favorites;
create policy rental_favorites_select_own
on public.rental_favorites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists rental_favorites_insert_own on public.rental_favorites;
create policy rental_favorites_insert_own
on public.rental_favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists rental_favorites_delete_own on public.rental_favorites;
create policy rental_favorites_delete_own
on public.rental_favorites
for delete
to authenticated
using (auth.uid() = user_id);
