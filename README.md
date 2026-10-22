# The SOVEREIGN Summit

Official website and conference platform for **The SOVEREIGN Summit**, the district conference of Rotaract District 3131 for RIY 2026–27, hosted by the Rotaract Club of Bavdhan Pioneers on 13–14 February 2027.

The public site, registration, payments, delegate portal, and administration share one Next.js application and one Supabase database.

Visitor-facing copy for new screens lives in components as plain English strings. A later Marathi or Hindi toggle can move those strings into a dictionary without changing registration or payment behaviour. That toggle is not built yet.

## Stack

- Next.js 16 (App Router, Cache Components) and React 19
- TypeScript (strict)
- Tailwind CSS 4
- Supabase Auth, Postgres, and Storage
- Zod and React Hook Form
- Online transfer to the district account, with a payment screenshot reviewed by finance
- Supabase for the database, authentication, storage, and row level security
- Gmail for registration email, from rtr.harshvardhan3131@gmail.com
- `NEXT_PUBLIC_SHOW_PRICE_ON_HOME=true` prints only the open slab price on the homepage. It defaults to off.

## What is already decided

These facts are the initial published configuration. An administrator can change them without a new deployment.

- Event name, district, host club, and dates
- Provisional registration slabs: Early Bird ₹1,800, Slab 1 ₹2,299, Slab 2 ₹2,599, Final ₹2,999
- Preferred venue region only. The resort name stays unpublished until the District Rotaract Representative approves it
- No speakers, sponsors, or timed sessions until they are approved

The planning attendance of 400 and the ₹15,00,000 budget ceiling are internal. They are not a seat inventory and they are not shown as a public promise. Registration capacity stays unset until an administrator enters a verified limit.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in the Supabase URL, publishable key, and secret key.
2. Apply the SQL files in `supabase/migrations` in filename order, in the Supabase SQL editor, or with the Supabase CLI (`supabase db push`). The second migration publishes the starting pages and FAQs. `20261022103914_interest_signups.sql` adds the notify-me list and the optional homepage notes.
3. In Authentication, create the first committee user. Do not enable open admin signup.
4. Assign that user with:

```bash
npm run bootstrap:admin
```

`BOOTSTRAP_ADMIN_EMAILS` must list an account that already exists. The script uses the secret key and is not a public endpoint.

Provide these variables before `npm run build` as well as at runtime. Public pages are cached from the environment available during the build.

5. Start the site:

```bash
npm install
npm run dev
```

Until Supabase is connected, the public pages render the approved initial information and say that the database is not connected. Registration and administration do not pretend to save.

## Payments

Delegates pay the registration amount by online transfer to the district account shown on the registration form, then upload a screenshot. The screenshot does not confirm the registration. A place is confirmed only after a finance administrator verifies the payment and records the review with a reason.

Do not publish a personal account. Leave the district account lines unpublished until the account name, number, IFSC, and bank are approved.

## Email

Registration mail is sent from rtr.harshvardhan3131@gmail.com through Gmail. Set `GMAIL_APP_PASSWORD` to an app password for that account. If it is absent, the send is recorded as skipped and the registration itself is not rolled back.

## Roles

Roles live in `user_roles`, not in editable user metadata.

| Role | Access |
| --- | --- |
| Super admin | Settings, roles, finance, content, audit |
| District admin | Content, slabs, registrations, reports, communications |
| Finance admin | Payments, reconciliation, refunds, financial export |
| Registration admin | Registrations, check-in, enquiries |
| Content editor | Public content only |
| Delegate | Their own registration, payment status, and profile |

Row Level Security is enabled on every public table. Price, capacity, and payment confirmation run in Postgres functions granted only to the service role.

## Checks

```bash
npm test
npm run lint
npm run build
```

## Still needs an external account

- Supabase project URL and keys
- District account name, number, IFSC, and bank, once approved for the registration form
- Gmail app password for rtr.harshvardhan3131@gmail.com
- Approved venue, speakers, sponsors, programme, public phone, and public email
- Official Rotaract or district logo files, if they are to replace the typographic wordmark
