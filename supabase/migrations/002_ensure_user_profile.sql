-- Backfill profiles for auth users created before the signup trigger existed
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

insert into public.gamification_stats (user_id)
select p.id
from public.profiles p
left join public.gamification_stats g on g.user_id = p.id
where g.user_id is null
on conflict (user_id) do nothing;

-- Callable by authenticated users when the signup trigger did not run
create or replace function public.ensure_user_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  u record;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.profiles where id = uid) then
    insert into public.gamification_stats (user_id)
    values (uid)
    on conflict (user_id) do nothing;
    return;
  end if;

  select id, email, raw_user_meta_data
  into u
  from auth.users
  where id = uid;

  insert into public.profiles (id, display_name)
  values (
    uid,
    coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
  );

  insert into public.gamification_stats (user_id)
  values (uid)
  on conflict (user_id) do nothing;
end;
$$;

grant execute on function public.ensure_user_profile() to authenticated;
