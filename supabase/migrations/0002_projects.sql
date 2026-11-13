-- SERA schema v2: freelancer scope protection.
-- Run once, AFTER 0001: Supabase dashboard -> SQL Editor -> New query -> paste this file -> Run.
-- Same security model as 0001: every table has row-level security, so a signed-in
-- user can only see and change rows where user_id = their own id.
-- The 0001 tables (recordings, moments, ...) are left untouched.

-- ---------------------------------------------------------------- projects
-- The ORIGINAL agreement. It is only changed by an explicit "Edit agreement"
-- action; later change proposals live in `findings` and never overwrite it.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  client_name text not null check (char_length(client_name) between 1 and 160),
  original_description text not null default '',
  agreed_scope text[] not null default '{}',   -- one deliverable per entry
  exclusions text[] not null default '{}',     -- explicitly NOT included / constraints
  fixed_price numeric(12, 2) check (fixed_price >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  deadline date,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_user_idx on public.projects (user_id, created_at desc);

-- ----------------------------------------------------------- conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Untitled conversation',
  transcript text not null check (char_length(transcript) > 0),
  source text not null default 'paste' check (source in ('paste', 'upload', 'recording')),
  summary text,
  recorded_at timestamptz not null default now(),
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'analyzing', 'completed', 'failed')),
  error_message text,
  analysis_started_at timestamptz,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
create index conversations_project_idx on public.conversations (project_id, recorded_at);
create index conversations_user_idx on public.conversations (user_id);

-- ---------------------------------------------------------------- findings
-- What the AI found, with evidence. Two separate status axes so nothing is
-- ever approved automatically:
--   review_status: has the freelancer reviewed the AI's finding?
--   client_status: what the CLIENT did (only ever set by the freelancer by hand).
create table public.findings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null check (category in (
    'potential_scope_addition', 'scope_modification', 'existing_scope',
    'clarification_needed', 'commitment', 'idea'
  )),
  title text not null,
  description text not null default '',
  source_quote text not null,                  -- verified verbatim against the transcript
  transcript_start_seconds integer,            -- null for pasted text
  transcript_end_seconds integer,
  related_scope_item text,                     -- the original scope item, if any
  explanation text not null default '',
  confidence text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  suggested_follow_up text,
  owner_label text,                            -- only when the speaker is known
  due_date date,                               -- only when a deadline was actually stated
  due_phrase text,                             -- the words said, e.g. 'by Friday'
  review_status text not null default 'ai_detected'
    check (review_status in ('ai_detected', 'reviewed', 'dismissed')),
  client_status text not null default 'not_sent'
    check (client_status in ('not_sent', 'sent', 'approved', 'rejected')),
  notes text,
  client_message text,                         -- last generated confirmation message
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index findings_project_idx on public.findings (project_id);
create index findings_conversation_idx on public.findings (conversation_id);
create index findings_user_idx on public.findings (user_id);

-- ------------------------------------------------------------------- tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  finding_id uuid references public.findings (id) on delete set null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  owner text,
  due_date date,
  status text not null default 'open' check (status in ('open', 'done')),
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
create index tasks_project_idx on public.tasks (project_id);
create index tasks_user_idx on public.tasks (user_id);

-- ------------------------------------------------------ row-level security
alter table public.projects enable row level security;
alter table public.conversations enable row level security;
alter table public.findings enable row level security;
alter table public.tasks enable row level security;

create policy "Own rows" on public.projects
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own rows" on public.conversations
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own rows" on public.findings
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own rows" on public.tasks
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Explicit grants (RLS still filters every row).
grant select, insert, update, delete on
  public.projects, public.conversations, public.findings, public.tasks
  to authenticated;
grant all on public.projects, public.conversations, public.findings, public.tasks to service_role;
