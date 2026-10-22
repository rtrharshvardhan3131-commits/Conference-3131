-- Published starting copy. Administrators can edit these rows without a deployment.

insert into public.site_pages (slug, title, summary, body, status) values
  ('home_intro', $seed$A district, gathered with purpose$seed$, $seed$Two days of leadership, learning, and fellowship.$seed$, $seed$The SOVEREIGN Summit is the district conference of Rotaract District 3131 for RIY 2026–27. Over two days and one night, delegates come together for leadership development, professional learning, recognition, and the relationships that keep a district working as one.

The conference is hosted by the Rotaract Club of Bavdhan Pioneers. It is planned for about 400 delegates at a resort outside Pune, once the venue is approved by the District Rotaract Representative.$seed$, 'published'),
  ('about', $seed$About the Summit$seed$, $seed$Why this conference exists, and what delegates can expect.$seed$, $seed$The SOVEREIGN Summit is the official district conference for Rotaract District 3131 in RIY 2026–27. It gives Rotaractors a shared place to learn, to recognise the work of the year, and to build the partnerships that clubs cannot create alone.

The conference is designed around leadership development, professional learning, district-wide networking, recognition, fellowship, and inter-club collaboration. Sessions, speakers, and the detailed programme will be published on this website only after they are approved.

The host club is the Rotaract Club of Bavdhan Pioneers. The club is responsible for welcoming the district and for the on-ground experience of the conference, under the direction of the district leadership.

Delegates can expect a two-day residential conference with one night’s stay, once the venue is confirmed. Until then, accommodation, meals, and transport remain unpublished. Registration, updates, and the delegate record for the conference are managed on this website.

Approved guidelines will appear on this page. Delegates will be asked to accept the published guidelines, the privacy policy, and the refund policy before payment.$seed$, 'published'),
  ('guidelines', $seed$Event guidelines$seed$, $seed$Conduct and participation expectations for delegates.$seed$, $seed$Delegates attend The SOVEREIGN Summit as representatives of their clubs and of Rotaract District 3131. They are expected to participate in the published programme, follow the venue rules once those rules are issued, and treat other delegates, speakers, staff, and resort teams with respect.

Registration is personal. A delegate may not transfer a confirmed place unless the organising committee approves the change in writing. The committee may refuse entry where payment is not verified.

Photography and fellowship activities may take place during the conference. Any restriction on photography will be announced before the relevant session.

These guidelines will be updated if the District Rotaract Representative approves additional rules. The version accepted at registration is stored with the delegate’s record.$seed$, 'published'),
  ('privacy', $seed$Privacy Policy$seed$, $seed$How delegate and enquiry information is used.$seed$, $seed$This policy describes how The SOVEREIGN Summit website handles information. It is an event notice. It is not a certified legal opinion.

The website collects the details needed to register a delegate, process payment status, respond to enquiries, and administer the conference. That may include name, email, mobile number, club, designation, district or zone, dietary preference, accommodation preference, and an emergency contact when those fields are required.

Payment card numbers, CVVs, and UPI PINs are never stored on this website. Payment is handled by the configured payment provider. The site stores the provider’s order and payment references, amount, and status.

Information is visible to the delegate who owns the registration and to administrators whose role requires it. It is not sold. It is kept for conference administration, financial reconciliation, and any period the district’s record-keeping practice requires.

Enquiries sent through the contact or sponsorship forms are stored so the organising committee can reply. Do not send identity documents or passwords through those forms.

To ask for a correction, or to ask what is held about a registration, use the contact form or the delegate portal once signed in. The public contact mailbox will be shown here when the committee publishes it.$seed$, 'published'),
  ('terms', $seed$Terms and Conditions$seed$, $seed$The conditions of registering for the conference.$seed$, $seed$By registering for The SOVEREIGN Summit you agree to these terms, the privacy policy, the refund and cancellation policy, and the event guidelines published at the time of payment. The accepted version is stored with your registration.

Registration is offered in slabs. The price you pay is the price of the slab recorded on the server at the moment your registration is created. Later changes to a slab do not rewrite a completed payment.

A place is confirmed only after the payment provider, or an authorised manual review, verifies the payment. A message in the browser is not confirmation.

The venue, programme, speakers, and meal plan can change until they are published. The dates of the conference are 13–14 February 2027. The format is two days and one night, subject to the approved venue.

The organising committee may cancel or postpone the conference if circumstances require it. If that happens, the refund policy in force at registration, and any later notice approved by the committee, will explain what follows.

These terms are an event notice prepared for delegates. They have not been certified as legal advice.$seed$, 'published'),
  ('refunds', $seed$Refund and Cancellation Policy$seed$, $seed$How cancellation requests and refunds are handled.$seed$, $seed$A delegate may ask for a cancellation from the delegate portal or through the conference contact channel. The request is recorded. It does not by itself release a refund.

Refunds are reviewed by an authorised finance administrator. Where the original payment was collected through the payment provider, the refund is executed through that provider. The website does not mark a payment refunded until the provider confirms it, or until an authorised administrator records a manual settlement with a written reason.

The organising committee has not published a fixed refund percentage or a cutoff date. Until that decision is published here, no automatic refund amount is promised. Any approved schedule will replace this paragraph and will show a new policy version.

Pending payments that are not completed may be released so the place is not held indefinitely. A failed or abandoned checkout does not create a confirmed registration.

This policy is an operational notice. It is not a certified legal opinion.$seed$, 'published'),
  ('accessibility', $seed$Accessibility$seed$, $seed$How to ask for access support at the conference and on this website.$seed$, $seed$The SOVEREIGN Summit website aims to be usable with a keyboard, a screen reader, and on a phone. If something blocks you, use the contact form and describe the page and the barrier.

Venue accessibility, step-free routes, and accessible rooms will be published only after the venue is approved and those details are confirmed. They are not guessed in advance.

Delegates who need a dietary or access arrangement should say so during registration where the form asks, and may also write to the conference contact once it is published. The committee will respond with what the confirmed venue can support.

This statement is a commitment to respond and to improve. It is not a formal accessibility certification.$seed$, 'published')
on conflict (slug) do nothing;

insert into public.faqs (category, question, answer, sort_order, status) values
  ($seed$Registration$seed$, $seed$How do I register?$seed$, $seed$Choose Register and complete the delegate details, the open registration slab, and the required policies. A place is reserved only after the server creates the registration and payment is verified.$seed$, 0, 'published'),
  ($seed$Payment$seed$, $seed$How is payment collected?$seed$, $seed$Payments are taken through the district’s approved payment provider and settled to the designated District Bank Account. Card numbers and UPI PINs are not stored on this website. The provider will appear at checkout once its credentials are configured.$seed$, 1, 'published'),
  ($seed$Registration confirmation$seed$, $seed$When is my registration confirmed?$seed$, $seed$After the payment is verified on the server. You will see a registration reference and, when email is configured, a confirmation message. A screen that only says the bank app succeeded is not enough.$seed$, 2, 'published'),
  ($seed$Accommodation$seed$, $seed$Where will delegates stay?$seed$, $seed$The conference is planned as a one-night residential stay. The venue has not been approved, so room details are not published. Room allocations, when they exist, are visible only to the delegate and authorised administrators.$seed$, 3, 'published'),
  ($seed$Meals$seed$, $seed$Are meals included?$seed$, $seed$The residential format includes meals as part of the published package. The meal schedule will be posted after the venue and catering plan are approved. Dietary preferences collected at registration are shared only with the team that needs them.$seed$, 4, 'published'),
  ($seed$Transportation$seed$, $seed$Is transport provided?$seed$, $seed$Transport information will be published with the venue announcement. Nothing is promised here before that approval.$seed$, 5, 'published'),
  ($seed$Agenda$seed$, $seed$When will the programme be published?$seed$, $seed$The agenda page shows only sessions an administrator has published. Until then it reads Conference Programme Coming Soon.$seed$, 6, 'published'),
  ($seed$Venue$seed$, $seed$Where is the conference?$seed$, $seed$The preferred region is Lonavala, Mahabaleshwar, Mulshi, or another suitable resort outside Pune city limits. The final venue will be announced after the District Rotaract Representative approves it.$seed$, 7, 'published'),
  ($seed$Souvenir$seed$, $seed$Is there a delegate souvenir?$seed$, $seed$Yes. A delegate souvenir is part of the approved conference plan. Collection details will be announced closer to the event.$seed$, 8, 'published'),
  ($seed$Refunds and cancellations$seed$, $seed$Can I cancel?$seed$, $seed$You can submit a cancellation request. Refunds are reviewed by the finance team and, when approved, processed through the payment provider. No fixed refund percentage has been published yet.$seed$, 9, 'published'),
  ($seed$Delegate support$seed$, $seed$Who do I contact?$seed$, $seed$Use the contact form. If you already have a registration, sign in to the delegate portal and send a support request from there. A public phone number or mailbox will be shown only after the committee publishes it.$seed$, 10, 'published');
