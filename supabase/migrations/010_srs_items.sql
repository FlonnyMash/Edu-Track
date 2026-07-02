-- Spaced repetition items (Leitner-style scheduling)
create table if not exists public.srs_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  easiness_factor numeric not null default 2.5,
  interval integer not null default 1,
  repetitions integer not null default 0,
  next_review_date date,
  unique (user_id, item_key)
);

create index if not exists srs_items_user_due_idx
  on public.srs_items (user_id, next_review_date)
  where next_review_date is not null;

alter table public.srs_items enable row level security;

create policy "srs_items_select_own"
  on public.srs_items for select
  using (user_id = auth.uid());

create policy "srs_items_insert_own"
  on public.srs_items for insert
  with check (user_id = auth.uid());

create policy "srs_items_update_own"
  on public.srs_items for update
  using (user_id = auth.uid());
