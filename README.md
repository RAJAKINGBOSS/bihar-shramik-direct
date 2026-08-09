# Bihar Shramik Direct — Project Structure

A mobile-first, zero-commission gig work platform for Bihar with a
"Basic Daily Amount" income safety net.

## Tech stack

- **Frontend:** Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend / DB:** Supabase (Postgres + Realtime + Auth + Row Level Security)
- **Auth:** Supabase Phone Auth (OTP via SMS)
- **Payments:** UPI deep links (`upi://pay?...`) generated client-side +
  Razorpay Route (only for the welfare-fund top-up leg — never for
  direct customer→worker payments, which stay peer-to-peer over UPI)
- **Realtime location:** Supabase Realtime channels + Postgres `geography` column
- **Maps:** Mapbox GL JS (lighter payload than Google Maps JS SDK, matters on 3G/4G)
- **i18n:** Custom lightweight dictionary (Hindi / Bhojpuri / English) —
  no heavy i18n framework, keeps bundle size down

## Folder layout

```
bihar-shramik-direct/
├── app/
│   ├── (worker)/
│   │   ├── dashboard/page.tsx        # Worker main dashboard (this deliverable)
│   │   ├── onboarding/page.tsx       # OTP login + e-Shram / Gig ID linking
│   │   └── layout.tsx
│   ├── (customer)/
│   │   ├── search/page.tsx           # Geo-search for services
│   │   ├── worker/[id]/page.tsx      # Worker profile + call/WhatsApp/pay
│   │   └── layout.tsx
│   ├── (admin)/
│   │   ├── welfare-fund/page.tsx     # Fund pool management
│   │   ├── kyc/page.tsx              # KYC verification queue
│   │   └── layout.tsx
│   ├── api/
│   │   ├── wallet/topup/route.ts     # Cron-triggered daily top-up calculation
│   │   ├── bookings/route.ts
│   │   └── location/route.ts
│   └── layout.tsx
├── components/
│   ├── worker/
│   │   ├── WorkerDashboard.tsx       # Main dashboard shell (this deliverable)
│   │   ├── AvailabilityToggle.tsx    # "Available for Work Now" switch
│   │   ├── EarningsCard.tsx          # Today's direct earnings
│   │   ├── BasicDailyAmountTracker.tsx  # Top-up progress bar
│   │   └── WithdrawButton.tsx        # UPI instant withdrawal
│   ├── customer/
│   └── shared/
│       ├── LanguageSwitcher.tsx
│       └── BottomNav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── translations.ts               # hi / bho / en dictionary
│   ├── upi.ts                        # UPI deep-link + QR helpers
│   └── wage-calculator.ts            # Basic Daily Amount business logic
├── hooks/
│   ├── useWallet.ts
│   ├── useAvailability.ts
│   └── useGeolocation.ts
├── database/
│   └── schema.sql                    # Full Postgres schema (this deliverable)
└── public/
    └── icons/                        # Simple line icons (rupee, map-pin, tools)
```

## Why this shape

- **Route groups** `(worker)`, `(customer)`, `(admin)` keep the three
  user roles cleanly separated with their own layouts/auth guards,
  while sharing the same Next.js app and component library.
- **Business logic lives in `lib/`**, not inside components, so the
  Basic Daily Amount calculation can be unit-tested and reused by
  both the dashboard UI and the nightly top-up cron job.
- **Payments never touch platform infrastructure for the direct
  customer→worker leg** — the UPI QR/deep link points straight at
  the worker's own UPI ID (see `objectives` §1), which is what makes
  the zero-commission promise actually true rather than just marketed.
- **Realtime worker location** uses a Postgres `geography(Point)`
  column + Supabase Realtime so customer search stays live without a
  separate location microservice.
