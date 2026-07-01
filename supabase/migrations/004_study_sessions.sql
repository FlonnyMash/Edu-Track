-- study_sessions: daily learning time tracking
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  duration_seconds integer not null check (duration_seconds > 0),
  created_at timestamptz not null default now()
);

create index idx_study_sessions_user_created
  on public.study_sessions(user_id, created_at desc);

alter table public.study_sessions enable row level security;

create policy "study_sessions_all_own"
  on public.study_sessions
  for all
  using (user_id = auth.uid());

grant select, insert, update, delete on public.study_sessions to authenticated;
