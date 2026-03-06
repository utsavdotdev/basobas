alter table public.rentals
  add column if not exists images text[] not null default array[]::text[];

create index if not exists rentals_images_gin_idx
  on public.rentals
  using gin (images);
