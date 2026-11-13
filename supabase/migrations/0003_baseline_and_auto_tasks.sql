-- Sera schema v3: baseline calls and auto-created tasks.
-- Run once, AFTER 0002: Supabase dashboard -> SQL Editor -> New query -> paste this file -> Run.
-- Safe to run twice. Existing rows keep working (both columns default to false).

-- The call that set up a project's agreement. It is not compared against
-- anything; every LATER call on the project is compared against what was agreed.
alter table public.conversations
  add column if not exists is_baseline boolean not null default false;

-- Tasks Sera created on its own from a promise you made on a call. Lets a
-- re-run of the analysis replace its own untouched tasks without touching yours.
alter table public.tasks
  add column if not exists auto_created boolean not null default false;
