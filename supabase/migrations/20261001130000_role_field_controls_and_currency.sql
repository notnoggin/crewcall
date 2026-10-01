begin;

alter table public.roles
  add column if not exists active_fields jsonb not null default '{}'::jsonb,
  add column if not exists rate_currency text not null default 'USD';

alter table public.applications
  add column if not exists rate_currency text not null default 'USD';

comment on column public.roles.active_fields is
  'Per-role allowlist of application field IDs. Empty object means use the full default field set for the role type.';

comment on column public.roles.rate_currency is
  'ISO 4217 currency code used for the display-only offered rate.';

comment on column public.applications.rate_currency is
  'ISO 4217 currency code used for the applicant requested rate.';

commit;
