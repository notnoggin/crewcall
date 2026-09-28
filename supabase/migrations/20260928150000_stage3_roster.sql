begin;

alter table public.roster_entries
  add column if not exists role_id uuid references public.roles(id) on delete set null;

create index if not exists roster_entries_workspace_status_idx
  on public.roster_entries(workspace_id, status);
create index if not exists roster_entries_role_id_idx
  on public.roster_entries(role_id);

commit;
