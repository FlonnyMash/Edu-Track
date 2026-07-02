-- Syllabus-sync: allow pending status before user confirms items
alter table public.user_learning_items
  drop constraint if exists user_learning_items_status_check;

alter table public.user_learning_items
  alter column status set default 'pending';

alter table public.user_learning_items
  add constraint user_learning_items_status_check
  check (status in ('pending', 'active', 'archived'));

alter table public.user_learning_items
  drop constraint if exists user_learning_items_source_check;

alter table public.user_learning_items
  add constraint user_learning_items_source_check
  check (source in ('custom', 'catalog', 'syllabus_sync'));
