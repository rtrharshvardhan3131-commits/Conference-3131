# The SOVEREIGN Summit — website overview

## 1. What this site is

The SOVEREIGN Summit is the district conference of **Rotaract District 3131** for **RIY 2026–27**.

| Fact | Value |
| --- | --- |
| Event name | The SOVEREIGN Summit |
| Tagline | Two Days. One Summit. A District United. |
| Dates | 13–14 February 2027 |
| Format | Two days and one night |
| District | Rotaract District 3131 |
| Preferred venue region | Lonavala, Mahabaleshwar, Mulshi, or another suitable resort outside Pune |
| Host club | Not announced yet |
| Planning attendance | About 400 delegates (planning figure, not a seat cap) |
| Budget ceiling | ₹15,00,000 (internal only; not shown publicly) |

This repository is both:

1. The **public conference website** (story, programme placeholders, policies, FAQ, contact).
2. The **working registration platform** (delegate form, Easebuzz checkout + manual screenshot fallback, delegate portal, committee desk).

Live production URL: https://conference-3131-dcnp.vercel.app  
Local development: http://localhost:3000

---

## 2. Who uses it

| Audience | What they do |
| --- | --- |
| Visitor | Reads the public pages, shares the event, asks to be notified about speakers / venue / sponsors |
| Rotaractor, Rotarian, or DRR Designate | Registers, pays online via Easebuzz (or bank transfer + screenshot), uploads government ID and photograph |
| Council member | Registers on the first published slab (Early Bird pricing path) even after Early Bird dates close, once an approved council position is named |
| Confirmed delegate | Signs in to see registration status, QR check-in pass, room notes, itinerary placeholders, and support / cancellation request forms |
| Committee staff | Runs registrations, finance review, check-in, content, offers, communications, and reports from one admin desk |

---

## 3. Brand and visual system

- District mark: official Rotaract District 3131 cranberry logo (`/images/rotaract-district-3131.png`), shown in the navy header without colour filters.
- Homepage hero mark: REIGN portrait (`/images/reign-logo.png`) inside a conceptual orbital gateway. Caption: “Conceptual gateway. Not the venue.”
- Colours: navy `#0c1424`, ink `#172033`, cranberry `#d22163`, gold `#c6a36b`, ivory `#f6f1e7`, paper `#fffdf8`.
- Type: Newsreader (display) and Figtree (body).
- Controls are square (no rounded pills). Tap targets stay at least 44px. Inputs use 16px type so iOS does not zoom.
- Public pages are built for a phone first. Mobile registration shows one step at a time with a sticky Next control; desktop can show the full wizard structure.

---

## 4. Public website map

### Primary pages

| Path | Purpose |
| --- | --- |
| `/` | Cinematic hero, countdown, conference story, condensed programme links, delegate benefits, slab names, FAQ preview, partnership categories, notify form |
| `/about` | Why the summit exists; host club stays unpublished until announced |
| `/agenda` | Programme; Coming Soon until sessions are approved |
| `/speakers` | Speaker directory; Coming Soon until people are approved |
| `/venue` | Preferred region only until the resort is approved |
| `/sponsors` | Partnership categories; no named partner until approved |
| `/faq` | Published questions |
| `/contact` | Contact form; public mailbox / phone stay unpublished until supplied |
| `/register` | Four-step registration wizard |
| `/register/status` | Look up a registration by Rotary ID / reference and email |
| `/register/confirmation` | Status after lookup or payment return (display only; URL params never imply paid) |
| `/login` | Delegate / staff sign-in |

### Policy pages (accepted at registration)

| Path | Document |
| --- | --- |
| `/terms` | Terms and Conditions |
| `/privacy` | Privacy Policy |
| `/refunds` | Refund and Cancellation Policy |
| `/guidelines` | Event guidelines |
| `/accessibility` | Accessibility statement |

### Sharing and discovery

- Open Graph / Twitter large card image at `/opengraph-image` (navy card; venue remains “Coming Soon”).
- `robots.txt` allows the public site and disallows `/admin`, `/delegate`, `/api`, confirmation, and status pages.
- Sitemap lists the main public routes.
- WhatsApp share uses the event name, tagline, dates, and site URL.

### What stays unpublished on purpose

Until the district approves them, the public site does **not** invent:

- Venue name, address, or map
- Speakers, biographies, or session timings
- Named sponsors or award recipients
- District bank account details
- A public support email or phone
- Host club name (footer and contact say announcement is coming)

Homepage fee list shows **names only** (Early Bird, Slab 1, Slab 2, Final). The open slab rupee amount appears on the registration form. Homepage prices appear only if `NEXT_PUBLIC_SHOW_PRICE_ON_HOME` is exactly `true`, and then only for the open slab.

---

## 5. Registration platform

### Fee slabs (provisional, admin-configurable, stored as integer paise)

| Slab | Amount | Window (as configured) |
| --- | --- | --- |
| Early Bird | ₹1,800 | Through 30 November 2026 |
| Slab 1 | ₹2,299 | After Early Bird |
| Slab 2 | ₹2,599 | After Slab 1 |
| Final | ₹2,999 | Final window before the conference |

The **server** calculates and validates the fee. The browser cannot set a paid amount. Coupon codes (Admin → Offers) only apply when published, inside dates and quantity, and still leave an amount to transfer.

### Wizard steps

1. **Details**
   - Rotary ID (district member lookup can prefill name, role, club, zone)
   - Full name, email, mobile
   - Role: Rotaractor / Rotarian / DRR Designate
   - Rotaract club (district club list), club position, zone (Zone 1–7)
   - T-shirt size (XS–3XL)
   - Emergency contact name and number
   - Dietary preference, accommodation preference
   - Optional: council member + council position
   - Private uploads: government ID (JPG/PNG/WEBP/PDF), professional photograph (image only)

2. **Slab**
   - Open slab and price (council members locked to first slab)
   - Optional coupon code

3. **Consent**
   - Accept terms, privacy, refunds, and guidelines
   - Accepted policy version stored with the registration (current: `2026-11-24`)

4. **Payment**
   - Primary: **Pay ₹…** → Easebuzz hosted checkout (`beginCheckout` mode `easebuzz` → `/api/payments/easebuzz/initiate`)
   - Fallback: collapsed **Pay by bank transfer instead** → screenshot + optional UTR → finance Verify
   - Amount always from server-stored paise; client amount ignored

### Payment rules that must stay true

- A screenshot, browser redirect, or client success message does **not** mark anyone paid.
- Easebuzz confirmation requires verified response hash + Retrieve API + `confirm_gateway_payment` (idempotent; coupon already reserved at pending create).
- Webhook: `/api/payments/easebuzz/webhook`. Return: `/api/payments/easebuzz/return` (303 to confirmation, display-only). Cron/admin reconcile for stale `initiated`/`pending` attempts.
- Manual Verify in admin remains **manual provider only**.
- District bank lines stay “Not published” until account name, bank, number, IFSC, and branch are supplied in `src/content/district-bank.ts`.
- Test Easebuzz (or Razorpay scaffold) keys must not be treated as live district settlement.

### After registration

- Confirmation / status pages show progress without claiming payment is verified early.
- When Gmail is configured, registration mail can be sent from `rtr.harshvardhan3131@gmail.com`.
- Status lookup: Rotary ID / reference + email → access cookie → confirmation page. Mismatch returns “missing”; invalid short reference returns “invalid”.

---

## 6. Delegate portal (`/delegate`)

Signed-in delegates can open:

| Path | Purpose |
| --- | --- |
| `/delegate` | Home: status, amount, announcements, QR when confirmed |
| `/delegate/registration` | Registration summary, support request, cancellation request |
| `/delegate/payment` | Payment status view |
| `/delegate/profile` | Contact / emergency / dietary updates before check-in |
| `/delegate/room` | Room allocation when published |
| `/delegate/itinerary` | Personal itinerary placeholder |

A cancellation request is recorded for the committee. It does **not** refund money or by itself cancel the registration status. Refunds stay a finance action.

---

## 7. Committee desk (`/admin`)

Staff sign in at `/login` and are routed by role. Delegates go to `/delegate`. Frontend hiding is not the security boundary; permissions and Postgres RLS are.

### Roles

| Role | Access |
| --- | --- |
| Super admin | Settings, roles, finance, content, audit |
| District admin | Content, slabs, registrations, reports, communications |
| Finance admin | Payments, reconciliation, refunds, financial export |
| Registration admin | Registrations, check-in, enquiries |
| Content editor | Public content only |
| Delegate | Own registration and profile only |

### Desk areas

| Area | Work |
| --- | --- |
| Overview | Counts, latest registrations, slab mix |
| Registrations | Search / filter monitor; open individual records |
| Check-in | QR / reference check-in; offline saved list on phone |
| Payments | Manual review and finance actions |
| Slabs / Offers | Fee windows and coupon codes |
| Agenda / Speakers / Sponsors / Venue | Publish only approved content |
| Announcements / Content / Communications | Public copy and outreach |
| Enquiries | Contact and delegate support inbox |
| Reports / Audit / Settings | Oversight and configuration |

### Exports

| Export | Format | Use |
| --- | --- | --- |
| `/api/admin/exports/registrations` | CSV | Full registration dump |
| `/api/admin/exports/payments` | CSV | Finance export (finance roles) |
| `/api/admin/exports/registration-desk` | Excel (`.xls`) | Club-wise desk list: people by club + club totals |

Government ID, photograph, and payment proof download only through staff-authenticated private routes. The `registration-documents` storage bucket is private.

### Health

`GET /api/health` reports whether the app can reach the conference database (`ok` / `database` status).

---

## 8. How it is built

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router, Cache Components, partial prefetch), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + summit tokens in `globals.css` |
| Data / auth / files | Supabase (Postgres, Auth, Storage, RLS) |
| Forms | Zod + React Hook Form |
| Email | Nodemailer + Gmail app password |
| Hosting | Vercel project `conference-3131-dcnp` |

Important behaviour constraints:

- Money, slab availability, coupon redemption, and payment confirmation are decided on the server / in Postgres, not in the browser.
- Public site content is cached (`site-content` tag). Admin saves bust the tag; raw SQL alone may not.
- Secrets live only in gitignored `.env.local`.
- Certificates and a public photo gallery stay deferred until after 14 February 2027.

### Local commands

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

Bootstrap the first admin (existing Auth user email in `BOOTSTRAP_ADMIN_EMAILS`):

```bash
npm run bootstrap:admin
```

---

## 9. Registration status flow (high level)

```
pending_payment → confirmed | payment_failed | cancelled
confirmed → refund_pending → refunded | confirmed
```

- Pending payment holds the place until finance confirms or the place is released.
- Confirmed delegates can be checked in once at the desk.
- A cancellation **request** from the delegate portal is an enquiry for the committee; it is not an automatic refund.

---

## 10. Still waiting on approved material

These must be supplied before they appear on the public site or registration form:

1. Public support mailbox (and phone, if any). Do not publish the admin Gmail as the public contact unless that decision is explicit.
2. District bank account name, bank, number, IFSC, branch (and UPI if used).
3. Approved venue name and address.
4. Agenda / session timings.
5. Speakers and biographies.
6. Named sponsors and award categories / recipients.
7. Host club announcement.

Until then, Coming Soon / “Not published” / “announcement coming soon” copy stays in place on purpose.
