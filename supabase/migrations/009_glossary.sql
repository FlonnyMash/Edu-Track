-- Shared glossary cache for on-demand term definitions
create table if not exists public.glossary (
  term text primary key,
  definition text not null,
  created_at timestamptz not null default now()
);

alter table public.glossary enable row level security;

create policy "glossary_select_authenticated"
  on public.glossary for select
  to authenticated
  using (true);
