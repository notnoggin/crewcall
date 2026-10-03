begin;

alter table public.applications
  add column if not exists status_email text;

update public.applications
set status_email = lower(trim(applicant_email))
where status_email is null;

alter table public.applications
  alter column status_email set not null;

create index if not exists applications_role_status_email_idx
  on public.applications(role_id, status_email);

comment on column public.applications.status_email is
  'Normalized applicant email used to recover an existing application status link.';

commit;
