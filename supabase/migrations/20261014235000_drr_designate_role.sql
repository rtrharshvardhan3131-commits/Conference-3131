alter table public.registrations
  drop constraint if exists registrations_participant_role_check;

alter table public.registrations
  add constraint registrations_participant_role_check
  check (participant_role in ('rotaractor', 'rotarian', 'drr_designate'));
