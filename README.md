# Bihar Shramik Direct — Starter Build

A mobile-first, zero-commission platform connecting Bihar's gig workers
(plumbers, electricians, drivers, delivery partners, daily wage laborers)
directly with customers, with a state-backed **Basic Daily Amount**
safety net.

## Project structure

```
bihar-shramik-direct/
├── app/
│   ├── globals.css              # design tokens, font import
│   └── worker/
│       └── dashboard/
│           └── page.tsx         # ⭐ Worker Main Dashboard (the requested deliverable)
├── components/
│   ├── EarningsRing.tsx         # signature diya (oil-lamp) progress ring
│   ├── AvailabilityToggle.tsx   # "Available for Work Now" toggle
│   └── LanguageToggle.tsx       # Hindi / Bhojpuri / English switch
├── lib/
│   └── i18n.ts                  # translation strings + ₹ formatter
├── supabase/
│   └── schema.sql               # full Postgres schema + RLS policies
└── tailwind.config.ts
```

Not included in this pass, but structured for: `app/customer/` (search +
booking flow), `app/admin/` (welfare fund + KYC dashboard), `app/worker/onboarding/`
(OTP + e-Shram linking), and `lib/supabase/client.ts`.

## Database schema — key models (see `supabase/schema.sql` for full detail)

**`workers`** — phone-based identity, e-Shram/Bihar Gig Worker ID, skill
categories, KYC status, live GPS (`geography(Point,4326)` via PostGIS),
`is_available` toggle.

**`wallets`** + **`wallet_transactions`** — single running ledger per
worker. Every rupee is tagged by `type`: `direct_earning` (from a
booking), `welfare_topup`, or `withdrawal`. This keeps the "100% to the
worker" promise auditable — the platform never records itself as a
payee.

**`availability_sessions`** — start/stop timestamps that accumulate the
8-hour "logged in & active" clock the Basic Daily Amount depends on.

**`daily_topups`** + **`welfare_fund`** — the safety-net machinery.
`settle_daily_topup()` is a Postgres function that: checks KYC is
verified, checks 8 active hours were logged, computes
`max(0, state_minimum − direct_earnings)`, and writes an auditable row.
It can run as a nightly settlement job or be called live to power the
dashboard's "eligible so far" preview.

**`daily_earning_summary`** — a view joining today's earnings + active
seconds + district minimum wage, so the dashboard reads one row instead
of aggregating client-side.

## Worker Main Dashboard — what's implemented

- **Availability toggle** — large, thumb-friendly, green when live,
  pulses to signal "broadcasting location."
- **Basic Daily Amount tracker** — the diya ring: the turmeric arc is
  direct customer earnings, the lighter gold arc is welfare top-up, so
  a worker can tell at a glance how much of today's income came from
  customers vs. the safety net, without reading numbers. An hours-active
  bar shows progress toward the 8-hour eligibility threshold separately,
  since hours and earnings are two independent conditions.
- **Wallet card** — balance + one-tap UPI withdrawal button.
- **Language toggle** — Hindi / Bhojpuri / English, persisted per
  worker (`workers.preferred_language`); all UI strings route through
  `lib/i18n.ts`.

The component currently reads from `MOCK_DATA` — swap the `useEffect`
for a Supabase realtime subscription on `wallets`, `wallet_transactions`,
and `availability_sessions` filtered by the logged-in worker's id.

## Design rationale

- **Palette** — indigo, turmeric, sal-leaf green, and sindoor red,
  drawn from Madhubani folk art rather than a generic dashboard scheme.
  Turmeric and gold are reserved for money so the "is this rupee from a
  customer or from welfare" distinction reads instantly.
- **Typography** — Noto Sans Devanagari everywhere (one family, not
  two), because it renders Hindi/Bhojpuri/English cleanly and keeps the
  font payload minimal — a deliberate call given the brief's own
  3G/4G constraint, not a shortcut.
- **Money** — always tabular figures (`font-tabular`), so digits don't
  jitter as balances update live.

## Suggested next build steps

1. `app/worker/onboarding/` — OTP login (e.g. via MSG91/Twilio Verify)
   + e-Shram/Bihar Gig Worker ID capture.
2. `app/customer/search/` — district + skill search, results as a
   list/map of `is_available = true` workers within radius (PostGIS
   `ST_DWithin`).
3. `app/customer/[workerId]/pay/` — UPI deep link / QR generator
   (`upi://pay?pa=<worker_upi_id>&am=<amount>`) — no platform routing.
4. `app/admin/` — welfare fund balance, pending `daily_topups` queue,
   KYC review queue.
5. Wire `settle_daily_topup()` to a Supabase Edge Function on a cron
   schedule, plus an on-demand call for the dashboard's live estimate.
