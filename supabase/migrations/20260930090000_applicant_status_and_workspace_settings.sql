alter table public.workspaces
  add column if not exists name text not null default 'Crewcall workspace';

alter table public.applications
  add column if not exists status_token uuid not null default gen_random_uuid();

create unique index if not exists applications_status_token_idx
  on public.applications(status_token);
