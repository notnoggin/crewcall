begin;

alter table public.roles
  add column if not exists intake_mode text not null default 'roster'
    check (intake_mode in ('roster', 'limited_seats')),
  add column if not exists seat_cap integer
    check (seat_cap is null or seat_cap > 0),
  add column if not exists rules text not null default '',
  add column if not exists example_clip_links text[] not null default '{}',
  add column if not exists geo text not null default '',
  add column if not exists niche text not null default '',
  add column if not exists languages text[] not null default '{}',
  add column if not exists min_avg_views integer,
  add column if not exists source_footage_url text;

commit;
