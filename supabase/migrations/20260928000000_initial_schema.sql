create extension if not exists "pgcrypto";

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  whop_company_id text not null unique,
  hiring_type text not null check (hiring_type in ('clipper', 'moderator', 'va', 'custom')),
  created_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  type text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('draft', 'open', 'closed')),
  capacity integer not null default 1 check (capacity > 0),
  created_at timestamptz not null default now()
);

create table public.application_templates (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  questions jsonb not null default '[]'::jsonb,
  unique (role_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  applicant_whop_id text,
  applicant_email text not null,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'reviewing', 'accepted', 'rejected')),
  notes text not null default '',
  score numeric,
  created_at timestamptz not null default now()
);

create index roles_workspace_id_idx on public.roles(workspace_id);
create index applications_role_id_idx on public.applications(role_id);

alter table public.workspaces enable row level security;
alter table public.roles enable row level security;
alter table public.application_templates enable row level security;
alter table public.applications enable row level security;

-- All reads and writes go through the server API, which authenticates Whop users
-- and uses the Supabase service role. The public application form only needs the
-- narrowly scoped API routes and never receives a Supabase key.
