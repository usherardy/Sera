-- SERA schema v1.
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste this file -> Run.
-- Every user-owned table has row-level security: a signed-in user can only see
-- and change rows where user_id = their own id. The audio bucket is private and
-- each user can only touch files under their own folder ({user_id}/...).

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  timezone text not null default 'Europe/Vilnius',
  created_at timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, timezone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'Europe/Vilnius')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------- recordings
create table public.recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Untitled recording',
  kind text not null default 'conversation' check (kind in ('conversation', 'voice_note')),
  storage_path text,
  mime_type text,
  recorded_at timestamptz not null default now(),
  duration_seconds integer check (duration_seconds >= 0),
  transcript text,
  summary text,
  topics text[] not null default '{}',
  status text not null default 'uploaded'
    check (status in ('uploaded', 'transcribing', 'analyzing', 'completed', 'failed')),
  error_message text,
  attempts integer not null default 0,
  processing_started_at timestamptz,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
create index recordings_user_recorded_idx on public.recordings (user_id, recorded_at desc);

-- ----------------------------------------------------- transcript_segments
create table public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references public.recordings (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  idx integer not null,
  start_ms integer,            -- null when the model gave no timing
  end_ms integer,
  text text not null,
  speaker_label text,          -- unused for now (no diarization)
  unique (recording_id, idx)
);

-- ----------------------------------------------------------------- moments
create table public.moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recording_id uuid not null references public.recordings (id) on delete cascade,
  title text not null,
  category text not null
    check (category in ('decision', 'commitment', 'important_information', 'personal_note')),
  summary text not null,
  importance_reason text not null default '',
  start_ms integer,
  end_ms integer,
  evidence_text text not null,
  confidence text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  dismissed boolean not null default false,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
create index moments_recording_idx on public.moments (recording_id);
create index moments_user_idx on public.moments (user_id);

-- ------------------------------------------------------------- commitments
create table public.commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recording_id uuid not null references public.recordings (id) on delete cascade,
  moment_id uuid references public.moments (id) on delete set null,
  title text not null,
  description text,
  owner_label text,            -- 'me', a person's name, or null when unclear
  due_date date,               -- only when a deadline was actually stated
  due_time text check (due_time ~ '^[0-2][0-9]:[0-5][0-9]$'), -- local HH:MM, only when stated/chosen
  due_phrase text,             -- the words said, e.g. 'by Friday'
  all_day boolean not null default false,
  evidence_text text not null,
  start_ms integer,
  end_ms integer,
  confidence text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'dismissed')),
  completion_status text not null default 'open' check (completion_status in ('open', 'done')),
  external_event_id text,      -- Google Calendar event id once synced
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index commitments_recording_idx on public.commitments (recording_id);
create index commitments_user_idx on public.commitments (user_id);

-- --------------------------------------------------------- daily_summaries
create table public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  summary text not null,
  key_topics text[] not null default '{}',
  key_decisions text[] not null default '{}',
  notable_info text[] not null default '{}',
  outstanding text[] not null default '{}',
  is_sample boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, local_date)
);

-- ------------------------------------------------------------ integrations
-- Status and non-secret metadata only (e.g. connected email). Never tokens.
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  provider text not null check (provider in ('google')),
  connection_status text not null default 'disconnected'
    check (connection_status in ('connected', 'disconnected', 'error')),
  token_metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

-- OAuth refresh tokens, AES-GCM encrypted by the server. RLS on with NO
-- policies, and no grants to signed-in users: only the server's secret key
-- (service role) can read or write this table.
create table public.integration_secrets (
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('google')),
  encrypted_refresh_token text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

-- ------------------------------------------------------ row-level security
alter table public.profiles enable row level security;
alter table public.recordings enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.moments enable row level security;
alter table public.commitments enable row level security;
alter table public.daily_summaries enable row level security;
alter table public.integrations enable row level security;
alter table public.integration_secrets enable row level security;

create policy "Own profile: read" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Own profile: update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Own rows" on public.recordings
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own rows" on public.transcript_segments
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own rows" on public.moments
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own rows" on public.commitments
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own rows" on public.daily_summaries
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Own rows" on public.integrations
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Explicit grants (RLS still filters every row).
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on
  public.recordings, public.transcript_segments, public.moments,
  public.commitments, public.daily_summaries, public.integrations
  to authenticated;
revoke all on public.integration_secrets from anon, authenticated;
grant all on all tables in schema public to service_role;

-- ------------------------------------------------------ private audio bucket
insert into storage.buckets (id, name, public, file_size_limit)
values ('recordings', 'recordings', false, 26214400) -- 25 MB
on conflict (id) do nothing;

create policy "Own audio: read" on storage.objects
  for select to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Own audio: upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Own audio: update" on storage.objects
  for update to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Own audio: delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);
