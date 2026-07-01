-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Single active learning track per user (MVP)
create table public.learning_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  difficulty_preference text not null default 'balanced'
    check (difficulty_preference in ('gentle', 'balanced', 'ambitious')),
  is_active boolean not null default true,
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- AI-generated daily tasks (one per user per local calendar day)
create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.learning_tracks(id) on delete cascade,
  task_date date not null,
  day_number int not null,
  title text not null,
  instructions text not null,
  estimated_minutes int,
  difficulty_level int not null default 1 check (difficulty_level between 1 and 10),
  ai_metadata jsonb not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'skipped')),
  created_at timestamptz not null default now(),
  unique (user_id, task_date)
);

-- Completion record + optional reflection
create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null unique references public.daily_tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  reflection_notes text,
  xp_awarded int not null default 0
);

-- Gamification aggregate state
create table public.gamification_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date,
  total_xp int not null default 0,
  companion_stage int not null default 1 check (companion_stage between 1 and 5),
  map_node_index int not null default 0,
  updated_at timestamptz not null default now()
);

-- Audit / AI context feed
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_daily_tasks_user_date on public.daily_tasks(user_id, task_date desc);
create index idx_activity_logs_user_created on public.activity_logs(user_id, created_at desc);

-- Auto-create profile + gamification row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.gamification_stats (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger gamification_stats_updated_at before update on public.gamification_stats
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.learning_tracks enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.task_completions enable row level security;
alter table public.gamification_stats enable row level security;
alter table public.activity_logs enable row level security;

create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());

create policy "tracks_all_own" on public.learning_tracks for all using (user_id = auth.uid());
create policy "tasks_all_own" on public.daily_tasks for all using (user_id = auth.uid());
create policy "completions_all_own" on public.task_completions for all using (user_id = auth.uid());
create policy "stats_select_own" on public.gamification_stats for select using (user_id = auth.uid());
create policy "stats_update_own" on public.gamification_stats for update using (user_id = auth.uid());
create policy "logs_all_own" on public.activity_logs for all using (user_id = auth.uid());

-- PostgREST / Supabase API role access
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant usage, select on all sequences in schema public to postgres, anon, authenticated, service_role;
