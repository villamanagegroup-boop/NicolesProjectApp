# The Energy Leader — Client Portal

Personal growth portal built for Nicole. Quiz → archetype → one of three programs:

- **Path A — Seal the Leak** ($27 one-time): 7-day reset
- **Path B — 365 Days of Alignment** ($9/mo or $67/yr): daily card practice
- **Path C — The Circle** ($497 once or $197×3): 90-day cohort coaching

Stack: Next.js 15 (App Router) · TypeScript · Supabase · Stripe · Vercel.

---

## 1. Local setup

```bash
npm install
cp .env.local.example .env.local      # then fill in the values
npm run dev
```

Open http://localhost:3000.

### Required environment variables

See `.env.local.example`. The keys break down into:

| Group | Keys | Where to find |
|---|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| Stripe (server) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → API keys / Webhooks |
| Stripe products | `STRIPE_PRODUCT_CARDS`, `STRIPE_PRODUCT_LEAK`, `STRIPE_PRODUCT_CIRCLE_ONETIME`, `STRIPE_PRODUCT_CIRCLE_MONTHLY` | Stripe → Products → click each product → copy `prod_…` ID |
| Stripe payment links | `NEXT_PUBLIC_STRIPE_*` (5 keys) | Stripe → Payment Links |
| App | `NEXT_PUBLIC_APP_URL` | The deployed domain, e.g. `https://theenergyleader.com` |

---

## 2. Database (Supabase)

Apply migrations in order from `supabase/migrations/` via the Supabase SQL editor. There are 15 files (`001` through `015`). Each one is idempotent — safe to re-run.

If starting from a fresh project, paste each file from oldest to newest. Migration order matters (later files reference earlier tables).

### What each migration does
- `001` — Core schema: users, daily_cards, journal_entries, program modules/lessons + RLS
- `002` — Wins, check-ins, onboarding_assessments, quiz_leads, `handle_new_user()` trigger
- `003` — The Circle: cohorts, members, weekly content, partner messages, live calls
- `004` — `skip_path_chooser` column
- `005` — Daily Cards add-on for Path A users
- `006` — Admin: roles, coaching notes, alerts, message templates, broadcasts
- `007–009` — Admin features for Circle (uploads, RLS overrides, media slots)
- `010` — Support / bug reports
- `011` — Admin read+write on user data
- `012` — Program reflections
- `013` — `pending_purchases` (bridges pre-signup Stripe payments to user accounts)
- `014` — `has_seen_welcome` flag for the first-login modal
- `015` — `admin_audit_log` (optional; powers `/admin/audit` viewer)

### Provisioning the first admin
After someone signs up, promote them by running this in the SQL editor:

```sql
insert into admin_roles (user_id, role)
values ('<their auth.users.id>', 'owner');
```

Find the user's ID from `auth.users` or `public.users`. They'll see the admin sidebar after their next page load.

---

## 3. Stripe configuration

### Products and payment links
Four products live in Stripe (already created):
- **365 Days of Alignment** — recurring, monthly + yearly prices
- **Seal the Leak** — one-time
- **The Circle (one-time)** — one-time $497
- **The Circle (monthly)** — recurring, $197 × 3 cycles

Each product has a Payment Link (`https://buy.stripe.com/…`). Those URLs are what we use as the CTA on the paths page — the user is taken to Stripe's hosted checkout, then redirected back to `/signup?path=A|B|C`.

### Webhook
Point the webhook at `https://<your-domain>/api/stripe/webhook` and subscribe to:
- `checkout.session.completed` — initial purchase via Payment Link
- `invoice.paid` — admin-sent invoices + subscription renewals (auto-grants access)
- `customer.subscription.deleted` — Path B cancellations revoke access
- `customer.subscription.updated` — informational logging for past-due / unpaid
- `invoice.payment_failed` — logged for ops visibility

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

### Promo code (admin bypass)
A `ngadmin100` 100%-off coupon needs to exist in Stripe → Coupons. For each Payment Link, enable **"Allow promotion codes"** so admins/testers can use it.

### Success URL on payment links
Each Payment Link's success URL should be `https://<your-domain>/signup?path=A` (or B / C). Stripe replaces variables; no extra params needed.

---

## 4. Architecture overview

### Auth + path guarding
Three guards work together:

1. **Quiz guard** (`app/(auth)/signup/page.tsx`): you can't reach signup without `clarity_quiz_result` in sessionStorage and a `?path=` param. Missing either → bounced back to `/quiz` or `/quiz/paths`.
2. **Portal guard** (`app/(portal)/layout.tsx`): you can't reach the portal without `selected_path` set on your `users` row. Path C also requires `onboarding_complete`.
3. **Path isolation** (same file): users only see routes their path allows. A locked route redirects to `/upgrade`.
4. **Admin guard** (`proxy.ts`): `/admin/*` requires a row in `admin_roles`.

### Payment → signup flow
1. User takes quiz → sees archetype result → `/quiz/paths`
2. Clicks "Buy" → Stripe Payment Link in same tab (sessionStorage survives)
3. Stripe webhook fires `checkout.session.completed` → row inserted in `pending_purchases` keyed on email
4. Stripe redirects user to `/signup?path=X`
5. User creates account → `/api/claim-purchase` matches the email against `pending_purchases` and writes `has_paid = true`, `selected_path = X`, `stripe_customer_id`, etc. on the new user row
6. User lands in their portal; `WelcomeModal` shows once

If the webhook hasn't fired yet by the time the user finishes signup, that's fine — `selected_path` is still set from the URL param, so the portal still grants access.

### Subscription cancellation (Path B)
`customer.subscription.deleted` revokes `has_paid` for Path B users. They keep their data but lose card access.

---

## 5. Deployment (Vercel)

1. Push the repo to GitHub.
2. Import into Vercel.
3. Paste every key from `.env.local` into Vercel → Project Settings → Environment Variables.
4. Set the production domain to `theenergyleader.com`.
5. Update the Stripe webhook URL to the deployed domain.
6. Update each Payment Link's success URL to the deployed domain.
7. Deploy.

### Production checklist
- [ ] All env vars set in Vercel (Production + Preview)
- [ ] Custom domain attached and DNS verified
- [ ] Supabase migrations 001–015 all applied
- [ ] First admin promoted via `admin_roles` insert
- [ ] Stripe webhook URL points to deployed domain, all 3 events subscribed
- [ ] `ngadmin100` promo code created and "Allow promotion codes" toggled on each Payment Link
- [ ] Test the full purchase → signup → portal flow with the promo code

---

## 6. Day-to-day operations

### Adding a new admin
SQL editor → `insert into admin_roles (user_id, role) values ('<uuid>', 'owner');`

### Creating a new Circle cohort
`/admin/cohorts/new` — set name, dates, max members. Then seed weekly content via `/admin/content` or the seed script in `scripts/seed-circle-content-complete.ts`.

### Editing daily cards
`/admin/cards` — inline editor for all 365 cards. Optimistic save.

### Managing users
`/admin/users` — see every signup. Inline-edit path, paid status, admin status. Useful for granting comp accounts or fixing webhook misses.

### Previewing a member's experience
`/admin/preview` — choose a path / day / cohort and view the portal as that user. Banner stays visible until you exit.

### Bug reports
`/admin/support` — users submit via the support form (TBD, currently database-only). Admins can mark open → in_progress → resolved.

---

## 7. Known gaps / nice-to-haves

These are non-blocking but worth noting for v2:

- **Email notifications** — not wired. Payment failures, password resets (Supabase handles), and welcome emails are all opportunities. Recommend Resend.
- **Granular admin permissions UI** — admin roles work as `owner` vs `assistant`, but the per-permission checkboxes in `/admin/settings` are still stubs.
- **2FA** — placeholder in user settings.
- **Mobile polish** — settings page nav, journal sidebar, and onboarding match-cards are tight on phones.
- **Error tracking** — Sentry / LogRocket not configured. `console.error` calls go to the browser/server console only.
- **Stripe checkout API endpoint** — removed, the app uses hosted Payment Links directly. If switching to embedded checkout later, recreate `app/api/stripe/checkout/route.ts`.

---

## 8. Project structure

```
app/
  (auth)/         login, signup, password reset
  (portal)/       authenticated user pages (program, dashboard, circle, settings, etc.)
  (admin)/admin/  admin tools (users, cohorts, cards, content, comms, support)
  api/            claim-purchase, stripe/webhook
  quiz/           public quiz funnel
components/       layout, portal widgets, admin widgets, quiz UI
context/          AppContext — auth + user state
data/             paths.ts (single source of truth for path metadata + pricing)
lib/
  supabase/       client / server / auth helpers
  admin/          admin-only data hooks
  utils/          quiz scoring, day calculations
supabase/migrations/   numbered SQL migrations
proxy.ts          Next middleware: session refresh + admin gate
```

---

## 9. Two-week post-launch checklist

Calendar reminder for ~14 days after launch. Run through this list to catch anything brewing:

**Stripe + access**
- [ ] `/admin/purchases` — any unclaimed rows older than 24 hours? Reach out to those buyers and either force-claim or refund.
- [ ] Stripe Dashboard → Webhooks → check for failed deliveries (red marks). Re-send any failures.
- [ ] Spot-check 2–3 paid users: does `has_paid = true`, `selected_path` set, `stripe_customer_id` populated?

**User health**
- [ ] `/admin/users` — count signups by path. Anyone with `selected_path` set but `quiz_result` null? (Should be zero — flag if not.)
- [ ] Anyone with `has_paid = false` whose email matches an unclaimed `pending_purchases` row? Use `/admin/purchases` to fix.
- [ ] Any users with no activity since signup? Consider a re-engagement message via `/admin/comms`.

**Operations**
- [ ] `/admin/support` — any open bug reports older than 3 days?
- [ ] At least one `admin_roles` row exists. Confirm Nicole + any assistants have access.
- [ ] `ngadmin100` promo code still active in Stripe.

**Health metrics worth eyeballing**
- [ ] Path A purchases (one-time) vs. Path B subscriptions vs. Path C — does the mix match expectations?
- [ ] Vercel deployment logs — any 500s in the last 14 days?
- [ ] Supabase → Logs → Postgres → any RLS denials worth investigating?

If anything's broken or surprising, the codebase has a CLAUDE.md file. Open Claude Code in this directory and ask it to investigate — point it at the failing flow.

---

## 10. Support

This portal was built by Hicks Virtual Solutions LLC. For technical questions about the codebase, contact the developer. For Stripe / Supabase account access, the client (Nicole) holds the credentials.
