-- The host club has not been announced. Keep club names on member records.

update public.event_settings
set host_club = 'a club still to be announced'
where host_club = 'Rotaract Club of Bavdhan Pioneers'
   or host_club = '';

update public.site_pages
set body = replace(
  body,
  'The conference is hosted by the Rotaract Club of Bavdhan Pioneers. ',
  ''
)
where body like '%Rotaract Club of Bavdhan Pioneers%';

update public.site_pages
set body = replace(
  body,
  'The host club is the Rotaract Club of Bavdhan Pioneers. The club is responsible for welcoming the district and for the on-ground experience of the conference, under the direction of the district leadership.',
  'The host club will be named when it is announced. Until then, the district leadership remains responsible for the conference.'
)
where body like '%Rotaract Club of Bavdhan Pioneers%';

update public.site_pages
set body = replace(
  body,
  'It is planned for about 400 delegates at a resort outside Pune, once the venue is approved by the District Rotaract Representative.',
  'It is planned for about 400 delegates at a resort outside Pune, once the venue is approved by the District Rotaract Representative. The host club will be named when it is announced.'
)
where slug = 'home_intro'
  and body not like '%The host club will be named when it is announced.%';
