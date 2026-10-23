# The SOVEREIGN Summit — project overview

The SOVEREIGN Summit is the district conference of Rotaract District 3131 for Rotary year 2026–27. It is held on 13–14 February 2027, as two days and one night. The host club has not been announced. The tagline is “Two Days. One Summit. A District United.”

This repository is the public website and the working registration platform. Delegates are expected to register from a phone, so the public pages are designed for a narrow screen first. The same application also holds the delegate record, finance review, and the committee desk.

Planning attendance is about 400 people. That figure is a planning number, not a seat cap. The internal budget ceiling is ₹15,00,000 and is not shown on the public site.

## Who uses it

- A Rotaractor, Rotarian, or DRR Designate registers, pays the district by transfer, and uploads a government ID and a payment screenshot.
- A council member can register at the first published slab, Early Bird, even after that slab’s dates have closed, once they name an approved council position.
- A delegate signs in to see their own registration, payment status, and room details.
- Committee roles share one admin desk. What each person can open depends on their role: super admin, district admin, finance admin, registration admin, or content editor.

## What a visitor sees

The public site carries the district’s cranberry Rotaract District 3131 mark, and the homepage hero shows the REIGN portrait. Pages cover the conference story, agenda, speakers, venue, sponsors, FAQ, contact, and the policies a delegate accepts at registration.

Unconfirmed facts stay labelled Coming Soon. That includes the resort name and address, speakers and biographies, session times, sponsors, and award recipients. The preferred region is Lonavala, Mahabaleshwar, Mulshi, or another suitable resort outside Pune. The final venue is unpublished until the District Rotaract Representative approves it.

The public fee list shows slab names only: Early Bird, Slab 1, Slab 2, and Final. The rupee amount for the open slab appears on the registration form, not on the homepage. Later slab amounts stay unpublished there.

## Registration

The form is a stacked wizard. Each finished section stays locked until the person chooses Edit.

1. Details. Name, email, mobile, role, Rotaract club from the district list, club position, and zone (Zone 1 through Zone 7). Zone and club position are required. A government ID upload is required. Files stay private to the committee.
2. Slab. The open slab is shown with its price. An optional coupon code can be applied here. Council members skip the choice and are priced on the first slab. They still get the coupon field on the consent step.
3. Consent. The person accepts the terms, privacy policy, refund policy, and event guidelines. The accepted policy version is stored with the registration.
4. Payment. The amount to transfer is the server price, after any valid offer. The person pays the district account themselves and uploads a screenshot. A UTR is optional unless they type one.

A screenshot does not mark anyone paid. Finance confirms the payment in the admin desk. Until then the confirmation page says the payment is not confirmed. After a successful submission, a message with the registration details is sent to that delegate from rtr.harshvardhan3131@gmail.com when Gmail is configured.

Provisional slab prices, stored in paise and changeable by an administrator:

| Slab | Amount |
| --- | --- |
| Early Bird, through 30 November 2026 | ₹1,800 |
| Slab 1 | ₹2,299 |
| Slab 2 | ₹2,599 |
| Final | ₹2,999 |

Offer codes are created under Admin → Offers. A code reduces the fee only when it is published, inside its dates and quantity, and still leaves an amount to transfer. The server calculates the fee. The browser cannot set the price.

District bank lines stay “Not published” until the account name, bank, number, IFSC, and branch are supplied. They are not invented in the form.

## Committee desk

Staff sign in at `/login` and are sent to `/admin`. Delegates go to `/delegate`.

The desk covers registrations, check-in, payments, slabs, offers, agenda, speakers, sponsors, venue, announcements, content, communications, enquiries, reports, the audit log, and settings. CSV exports exist for registrations and payments. Government ID and payment screenshots are downloaded only by staff who can view registrations.

## How it is built

One Next.js 16 application, React 19, TypeScript, and Tailwind CSS 4. Data, sign-in, files, and row-level security live in Supabase. Money, slab availability, coupon redemption, and payment confirmation are decided in Postgres, not in the browser. Email uses Gmail through Nodemailer.

Public pages read published rows. Writes and registration creation use the service role on the server. Secrets stay in `.env.local` and are not committed.

Local commands:

```bash
npm install
npm run dev
npm test
```

The usual local address is http://localhost:3000. A second copy can be started with `npm run dev -- --port 3001`.

## Current gap

The configured Supabase host, `pkngxtwdyqdcjknhelaz.supabase.co`, does not resolve in public DNS. While that is true, the public site cannot load live conference data and registration cannot be saved. Restore that project, or replace the URL and keys in `.env.local`, then restart the server.

Still waiting on approved material: the district bank account, the venue name and address, speakers, the programme, sponsors, a public phone, and a public mailbox.
