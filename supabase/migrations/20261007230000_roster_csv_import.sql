begin;

-- Imported bench members may not come from an application.
alter table public.roster_entries
  alter column application_id drop not null;

alter table public.roster_entries
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_handle text,
  add column if not exists import_notes text,
  add column if not exists source text not null default 'application',
  add column if not exists weekly_capacity integer,
  add column if not exists timezone text,
  add column if not exists rate_requested numeric,
  add column if not exists platforms text[] not null default '{}';

-- Soft uniqueness for imported contacts per workspace (email, case-insensitive).
create unique index if not exists roster_entries_workspace_contact_email_uidx
  on public.roster_entries (workspace_id, lower(contact_email))
  where contact_email is not null and source = 'import';

create index if not exists roster_entries_workspace_source_idx
  on public.roster_entries (workspace_id, source);

commit;
