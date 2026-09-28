begin;

do $$ begin
  create type public.application_status as enum (
    'applied', 'needs_info', 'sample_requested', 'test_sent',
    'test_submitted', 'bench', 'active', 'paused', 'dismissed', 'rejected'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.test_outcome as enum ('pending', 'passed', 'failed', 'ghosted');
exception when duplicate_object then null;
end $$;

alter table public.applications
  drop constraint if exists applications_status_check;

alter table public.applications
  alter column status drop default;

alter table public.applications
  alter column status type public.application_status
  using (
    case status
      when 'new' then 'applied'
      when 'reviewing' then 'needs_info'
      when 'accepted' then 'bench'
      else status
    end
  );

alter table public.applications
  alter column status set default 'applied'::public.application_status;

alter table public.applications
  add column if not exists reviewer_id text,
  add column if not exists reject_reason text,
  add column if not exists sample_links text[] not null default '{}',
  add column if not exists handles jsonb not null default '{}'::jsonb,
  add column if not exists weekly_capacity integer,
  add column if not exists timezone text,
  add column if not exists rate_requested numeric,
  add column if not exists software text[] not null default '{}',
  add column if not exists can_start_same_day boolean not null default false;

alter table public.roles
  add column if not exists creator_name text,
  add column if not exists platforms text[] not null default '{}',
  add column if not exists deadline date,
  add column if not exists pay_model text,
  add column if not exists rate_offered numeric,
  add column if not exists volume_per_week integer,
  add column if not exists start_date date,
  add column if not exists coverage_window text,
  add column if not exists timezone text;

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  brief text not null,
  paid boolean not null default false,
  pay_amount numeric,
  sent_at timestamptz not null default now(),
  due_at timestamptz,
  submission_links text[] not null default '{}',
  submitted_at timestamptz,
  outcome public.test_outcome not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  actor_id text,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.roster_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  person_whop_id text,
  role_tag text not null check (role_tag in ('clipper', 'moderator', 'editor', 'va', 'ops')),
  status text not null default 'bench' check (status in ('bench', 'active', 'paused', 'dismissed')),
  coverage_window text,
  last_active_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tests_application_id_idx on public.tests(application_id);
create index if not exists application_events_application_id_idx on public.application_events(application_id);
create index if not exists roster_entries_application_id_idx on public.roster_entries(application_id);

alter table public.tests enable row level security;
alter table public.application_events enable row level security;
alter table public.roster_entries enable row level security;

create or replace function public.prevent_application_event_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'application_events is append-only';
end;
$$;

drop trigger if exists application_events_append_only on public.application_events;
create trigger application_events_append_only
before update or delete on public.application_events
for each row execute function public.prevent_application_event_mutation();

commit;
