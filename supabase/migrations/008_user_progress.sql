-- Tracks curriculum position for self-driving AI progression
create table if not exists public.user_progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_chapter text not null default 'Hiragana',
  mastered_topics jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger user_progress_updated_at
  before update on public.user_progress
  for each row execute function public.set_updated_at();

alter table public.user_progress enable row level security;

create policy "user_progress_select_own"
  on public.user_progress for select
  using (user_id = auth.uid());

create policy "user_progress_insert_own"
  on public.user_progress for insert
  with check (user_id = auth.uid());

create policy "user_progress_update_own"
  on public.user_progress for update
  using (user_id = auth.uid());
