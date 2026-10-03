alter table public.workspaces
  add column if not exists notification_email text;

comment on column public.workspaces.notification_email is
  'Agency email used for Crewcall application and hiring notifications.';
