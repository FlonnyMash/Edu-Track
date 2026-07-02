-- User-managed learning items (custom + activated catalog entries)
create table if not exists public.user_learning_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  term text not null,
  meaning text not null,
  category text not null,
  item_key text not null,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  source text not null default 'custom'
    check (source in ('custom', 'catalog')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_key)
);

create index if not exists user_learning_items_user_status_idx
  on public.user_learning_items (user_id, status);

create trigger user_learning_items_updated_at
  before update on public.user_learning_items
  for each row execute function public.set_updated_at();

alter table public.user_learning_items enable row level security;

create policy "user_learning_items_select_own"
  on public.user_learning_items for select
  using (user_id = auth.uid());

create policy "user_learning_items_insert_own"
  on public.user_learning_items for insert
  with check (user_id = auth.uid());

create policy "user_learning_items_update_own"
  on public.user_learning_items for update
  using (user_id = auth.uid());
