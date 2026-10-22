update public.event_settings
set field_requirements = coalesce(field_requirements, '{}'::jsonb) || '{"designation": true, "districtZone": true}'::jsonb
where id = 1;
