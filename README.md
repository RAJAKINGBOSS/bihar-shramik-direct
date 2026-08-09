# Bihar Shramik Direct — Full Source Code

Every file from the project in one place. File path is shown above each block.

---

## PROJECT_STRUCTURE.md

```markdown
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
```

---

## database/schema.sql

```sql
-- =====================================================================
-- Bihar Shramik Direct — Database Schema (Postgres / Supabase)
-- =====================================================================
-- Notes:
--  - Uses Supabase's built-in `auth.users` for phone-OTP identity;
--    each of `workers` and `customers` has a 1:1 FK to auth.users.
--  - Money columns use NUMERIC(10,2) — never FLOAT — to avoid
--    rounding errors in wallet balances.
--  - Row Level Security (RLS) policies are sketched at the bottom;
--    enable + tighten per environment before going to production.
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists postgis; -- for geography/location queries

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------

create type worker_category as enum (
  'delivery', 'electrician', 'plumber', 'driver', 'daily_wage_labor', 'other'
);

create type kyc_status as enum ('pending', 'in_review', 'verified', 'rejected');

create type booking_status as enum (
  'requested', 'accepted', 'in_progress', 'completed', 'cancelled'
);

create type transaction_type as enum (
  'direct_payment',      -- customer paid worker directly via UPI (logged for records only)
  'welfare_topup',       -- Basic Daily Amount top-up from platform fund
  'withdrawal',          -- worker withdrew wallet balance to bank/UPI
  'reversal'             -- admin correction
);

create type language_pref as enum ('hi', 'bho', 'en');

-- ---------------------------------------------------------------------
-- WORKERS
-- ---------------------------------------------------------------------

create table workers (
  id                  uuid primary key default uuid_generate_v4(),
  auth_user_id        uuid not null references auth.users(id) on delete cascade,

  full_name           text not null,
  phone               text not null unique,
  category            worker_category not null,

  -- Identity linkage (either or both may be present)
  e_shram_card_id     text unique,
  bihar_gig_worker_id text unique,      -- platform-issued unique ID

  language_pref       language_pref not null default 'hi',

  -- KYC
  kyc_status          kyc_status not null default 'pending',
  kyc_documents       jsonb default '[]'::jsonb,   -- [{type, url, uploaded_at}]
  kyc_verified_at     timestamptz,
  kyc_verified_by     uuid references auth.users(id),

  -- Availability & live location
  is_available        boolean not null default false,
  last_location       geography(Point, 4326),      -- PostGIS point (lng, lat)
  last_location_at     timestamptz,

  -- Payout destination for direct customer payments (shown on QR)
  upi_id               text,

  rating_avg           numeric(3,2) default 0.00,
  rating_count          integer default 0,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_workers_available_location
  on workers using gist (last_location)
  where is_available = true;

create index idx_workers_category on workers (category);

-- ---------------------------------------------------------------------
-- CUSTOMERS
-- ---------------------------------------------------------------------

create table customers (
  id            uuid primary key default uuid_generate_v4(),
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  full_name     text,
  phone         text not null unique,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- WALLETS  (one per worker)
-- ---------------------------------------------------------------------

create table wallets (
  id                      uuid primary key default uuid_generate_v4(),
  worker_id               uuid not null unique references workers(id) on delete cascade,

  balance                 numeric(10,2) not null default 0.00,

  -- Rolling "today" figures — reset by a daily cron at midnight IST
  today_direct_earnings   numeric(10,2) not null default 0.00,
  today_topup_amount      numeric(10,2) not null default 0.00,
  today_active_seconds    integer not null default 0,
  today_date              date not null default current_date,

  -- State-mandated minimum wage this worker is entitled to per full
  -- (8hr) working day. Configurable per category/district by admin.
  daily_minimum_wage      numeric(10,2) not null default 400.00,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- ATTENDANCE SESSIONS  (tracks the 8-hour active window)
-- ---------------------------------------------------------------------

create table attendance_sessions (
  id            uuid primary key default uuid_generate_v4(),
  worker_id     uuid not null references workers(id) on delete cascade,
  session_date  date not null default current_date,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  active_seconds integer default 0,   -- accumulated while is_available = true

  unique (worker_id, session_date)
);

-- ---------------------------------------------------------------------
-- BOOKINGS
-- ---------------------------------------------------------------------

create table bookings (
  id                uuid primary key default uuid_generate_v4(),
  customer_id       uuid not null references customers(id),
  worker_id         uuid not null references workers(id),

  service_category  worker_category not null,
  status            booking_status not null default 'requested',

  agreed_amount     numeric(10,2),
  payment_method    text default 'upi_direct',   -- always direct, never platform-routed
  paid_at           timestamptz,

  customer_location geography(Point, 4326),
  address_text      text,

  requested_at      timestamptz not null default now(),
  accepted_at       timestamptz,
  completed_at      timestamptz,
  cancelled_at      timestamptz,

  customer_rating   smallint check (customer_rating between 1 and 5)
);

create index idx_bookings_worker on bookings (worker_id, status);
create index idx_bookings_customer on bookings (customer_id);

-- ---------------------------------------------------------------------
-- TRANSACTIONS  (wallet ledger — every credit/debit is logged)
-- ---------------------------------------------------------------------

create table transactions (
  id            uuid primary key default uuid_generate_v4(),
  wallet_id     uuid not null references wallets(id) on delete cascade,
  booking_id    uuid references bookings(id),

  type          transaction_type not null,
  amount        numeric(10,2) not null,
  note          text,

  created_at    timestamptz not null default now()
);

create index idx_transactions_wallet on transactions (wallet_id, created_at desc);

-- ---------------------------------------------------------------------
-- WELFARE FUND  (the pool that finances Basic Daily Amount top-ups)
-- ---------------------------------------------------------------------

create table welfare_fund (
  id                  uuid primary key default uuid_generate_v4(),
  total_pool          numeric(14,2) not null default 0.00,
  allocated_today     numeric(14,2) not null default 0.00,
  reserved_buffer     numeric(14,2) not null default 0.00,  -- untouchable safety reserve
  last_replenished_at timestamptz,
  updated_at          timestamptz not null default now()
);

create table welfare_fund_contributions (
  id            uuid primary key default uuid_generate_v4(),
  source        text not null,        -- 'govt_grant', 'csr_donation', 'platform_reserve'
  amount        numeric(14,2) not null,
  received_at   timestamptz not null default now(),
  note          text
);

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY (sketch — tighten before production)
-- ---------------------------------------------------------------------

alter table workers enable row level security;
alter table wallets enable row level security;
alter table transactions enable row level security;
alter table attendance_sessions enable row level security;

create policy "Workers can view/update their own profile"
  on workers for all
  using (auth.uid() = auth_user_id);

create policy "Workers can view their own wallet"
  on wallets for select
  using (worker_id in (select id from workers where auth_user_id = auth.uid()));

create policy "Workers can view their own transactions"
  on transactions for select
  using (wallet_id in (
    select w.id from wallets w
    join workers wk on wk.id = w.worker_id
    where wk.auth_user_id = auth.uid()
  ));

-- Customers can read minimal public worker info (name, category, rating,
-- location, availability) via a view rather than the raw table, so KYC
-- documents / phone / UPI ID stay private:

create view public_worker_directory as
  select id, full_name, category, rating_avg, rating_count,
         is_available, last_location, last_location_at
  from workers
  where kyc_status = 'verified';

```

---

## lib/translations.ts

```typescript
// Lightweight in-app dictionary — deliberately not using a heavy i18n
// framework so the JS bundle stays small on 3G/4G connections.

export type Lang = 'hi' | 'bho' | 'en';

export const translations = {
  hi: {
    availableForWork: 'काम के लिए उपलब्ध',
    unavailable: 'अभी उपलब्ध नहीं',
    goOnline: 'ऑनलाइन जाएं',
    goOffline: 'ऑफलाइन करें',
    todaysEarnings: 'आज की सीधी कमाई',
    basicDailyAmount: 'न्यूनतम दैनिक राशि',
    topUpEligible: 'टॉप-अप के लिए पात्र राशि',
    minimumGuaranteed: 'गारंटीड न्यूनतम',
    hoursActive: 'सक्रिय घंटे',
    withdraw: 'तुरंत निकासी करें',
    walletBalance: 'वॉलेट बैलेंस',
    outOf: 'में से',
    keepWorking: 'लक्ष्य तक पहुँचने के लिए काम जारी रखें',
    targetReached: 'आज का लक्ष्य पूरा हुआ',
  },
  bho: {
    availableForWork: 'काम खातिर उपलब्ध बानी',
    unavailable: 'अभी उपलब्ध नइखीं',
    goOnline: 'ऑनलाइन होखीं',
    goOffline: 'ऑफलाइन होखीं',
    todaysEarnings: 'आज के सीधा कमाई',
    basicDailyAmount: 'न्यूनतम रोज के राशि',
    topUpEligible: 'टॉप-अप खातिर योग्य राशि',
    minimumGuaranteed: 'गारंटी वाला न्यूनतम',
    hoursActive: 'सक्रिय घंटा',
    withdraw: 'तुरंते निकासी करीं',
    walletBalance: 'वॉलेट बैलेंस',
    outOf: 'में से',
    keepWorking: 'लक्ष्य तक पहुँचे खातिर काम जारी राखीं',
    targetReached: 'आज के लक्ष्य पूरा भइल',
  },
  en: {
    availableForWork: 'Available for work',
    unavailable: 'Not available',
    goOnline: 'Go online',
    goOffline: 'Go offline',
    todaysEarnings: "Today's direct earnings",
    basicDailyAmount: 'Basic Daily Amount',
    topUpEligible: 'Top-up you qualify for',
    minimumGuaranteed: 'Minimum guaranteed',
    hoursActive: 'Hours active',
    withdraw: 'Withdraw instantly',
    walletBalance: 'Wallet balance',
    outOf: 'of',
    keepWorking: 'Keep working to reach today\u2019s target',
    targetReached: 'Today\u2019s target reached',
  },
} as const;

export function t(lang: Lang, key: keyof typeof translations['en']): string {
  return translations[lang][key] ?? translations.en[key];
}

```

---

## lib/wage-calculator.ts

```typescript
// Core "Basic Daily Amount" (income safety net) logic.
// Kept separate from any UI component so it can be:
//   1. Unit tested in isolation.
//   2. Reused by the nightly Supabase Edge Function / cron job that
//      actually credits the welfare top-up to a worker's wallet.

export interface WageInput {
  directEarningsToday: number; // sum of confirmed customer payments today
  activeSeconds: number;       // time spent with is_available = true today
  dailyMinimumWage: number;    // state-mandated minimum for a full day
  fullDaySeconds?: number;     // defaults to 8 hours
}

export interface WageResult {
  hoursActive: number;
  isFullDayComplete: boolean;
  shortfall: number;        // how much below the minimum they are
  topUpEligible: number;    // amount the welfare fund would pay out
  progressPercent: number;  // 0-100, for the UI progress bar
  targetReached: boolean;
}

const SECONDS_IN_FULL_DAY = 8 * 60 * 60; // 8-hour qualifying window

/**
 * Determines whether — and how much — a worker should receive from the
 * welfare fund to top their earnings up to the state minimum wage.
 *
 * Rule: a worker only becomes eligible for a top-up once they've put in
 * a full 8-hour "available" day. This prevents someone from logging in
 * for 10 minutes and claiming the full daily minimum — the guarantee is
 * tied to genuine availability, not just presence.
 */
export function calculateBasicDailyAmount(input: WageInput): WageResult {
  const fullDaySeconds = input.fullDaySeconds ?? SECONDS_IN_FULL_DAY;
  const hoursActive = input.activeSeconds / 3600;
  const isFullDayComplete = input.activeSeconds >= fullDaySeconds;

  const shortfall = Math.max(
    0,
    input.dailyMinimumWage - input.directEarningsToday
  );

  // Top-up only pays out once the full day is complete AND there's
  // an actual shortfall against the minimum wage.
  const topUpEligible = isFullDayComplete ? Math.round(shortfall * 100) / 100 : 0;

  const progressPercent = Math.min(
    100,
    Math.round((input.directEarningsToday / input.dailyMinimumWage) * 100)
  );

  return {
    hoursActive: Math.round(hoursActive * 10) / 10,
    isFullDayComplete,
    shortfall: Math.round(shortfall * 100) / 100,
    topUpEligible,
    progressPercent,
    targetReached: input.directEarningsToday >= input.dailyMinimumWage,
  };
}

```

---

## lib/upi.ts

```typescript
// Helpers for generating UPI deep links. Used in two places:
//   1. Worker's "Withdraw" button — pulls wallet balance into their own UPI app.
//   2. Customer-facing payment QR — points directly at the WORKER's upi_id,
//      never at a platform-owned account. This is what makes the
//      zero-commission / 100%-to-worker promise structurally true rather
//      than just a policy.

interface UpiLinkParams {
  payeeUpiId: string;
  payeeName: string;
  amount: number;
  note?: string;
}

export function generateUpiWithdrawLink({ payeeUpiId, payeeName, amount, note }: UpiLinkParams): string {
  const params = new URLSearchParams({
    pa: payeeUpiId,                 // payee address
    pn: payeeName,                  // payee name
    am: amount.toFixed(2),          // amount
    cu: 'INR',
    tn: note ?? 'Wallet withdrawal',
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * Builds the payment link a CUSTOMER scans/taps to pay a worker directly.
 * Rendered as a QR code (e.g. via the `qrcode` npm package) on the
 * customer-facing booking screen.
 */
export function generateCustomerPaymentLink(params: UpiLinkParams): string {
  return generateUpiWithdrawLink(params);
}

```

---

## lib/supabase/client.ts

```typescript
import { createBrowserClient } from '@supabase/ssr';

// Public, anon-key client for use in client components. All sensitive
// reads/writes are gated by the Row Level Security policies defined in
// database/schema.sql — the anon key alone grants no special access.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

```

---

## hooks/useWallet.ts

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { calculateBasicDailyAmount, WageResult } from '@/lib/wage-calculator';

export interface WalletState {
  balance: number;
  todayDirectEarnings: number;
  todayTopupAmount: number;
  dailyMinimumWage: number;
  activeSeconds: number;
  wage: WageResult;
  loading: boolean;
}

/**
 * Subscribes to the worker's wallet + today's attendance session and
 * recomputes the Basic Daily Amount progress in realtime as bookings
 * complete and payments land. Falls back to a single fetch if the
 * Realtime channel is unavailable (e.g. flaky mobile network).
 */
export function useWallet(workerId: string): WalletState {
  const [state, setState] = useState<WalletState>({
    balance: 0,
    todayDirectEarnings: 0,
    todayTopupAmount: 0,
    dailyMinimumWage: 400,
    activeSeconds: 0,
    wage: calculateBasicDailyAmount({
      directEarningsToday: 0,
      activeSeconds: 0,
      dailyMinimumWage: 400,
    }),
    loading: true,
  });

  useEffect(() => {
    if (!workerId) return;

    async function loadWallet() {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('worker_id', workerId)
        .single();

      const { data: session } = await supabase
        .from('attendance_sessions')
        .select('active_seconds')
        .eq('worker_id', workerId)
        .eq('session_date', new Date().toISOString().slice(0, 10))
        .maybeSingle();

      if (!wallet) return;

      const activeSeconds = session?.active_seconds ?? 0;
      const wage = calculateBasicDailyAmount({
        directEarningsToday: wallet.today_direct_earnings,
        activeSeconds,
        dailyMinimumWage: wallet.daily_minimum_wage,
      });

      setState({
        balance: wallet.balance,
        todayDirectEarnings: wallet.today_direct_earnings,
        todayTopupAmount: wallet.today_topup_amount,
        dailyMinimumWage: wallet.daily_minimum_wage,
        activeSeconds,
        wage,
        loading: false,
      });
    }

    loadWallet();

    // Realtime: re-fetch whenever this worker's wallet row changes
    // (new booking paid, top-up credited, withdrawal made, etc.)
    const channel = supabase
      .channel(`wallet-${workerId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `worker_id=eq.${workerId}` },
        loadWallet
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workerId]);

  return state;
}

```

---

## components/worker/AvailabilityToggle.tsx

```tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { t, Lang } from '@/lib/translations';

interface Props {
  workerId: string;
  initialAvailable: boolean;
  lang: Lang;
}

/**
 * The single most important control in the worker app: a big,
 * thumb-friendly toggle that flips `is_available` and starts capturing
 * GPS location so nearby customers can find this worker. Deliberately
 * oversized for one-handed use on cheap Android devices.
 */
export default function AvailabilityToggle({ workerId, initialAvailable, lang }: Props) {
  const [available, setAvailable] = useState(initialAvailable);
  const [busy, setBusy] = useState(false);

  async function handleToggle() {
    setBusy(true);
    const next = !available;

    // Capture GPS only when going online — avoids draining battery /
    // asking for location permission unnecessarily when offline.
    let location: { lat: number; lng: number } | null = null;
    if (next && 'geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
        );
        location = { lat: position.coords.latitude, lng: position.coords.longitude };
      } catch {
        // Location permission denied or timed out — worker can still
        // go online, they just won't show up on the map until granted.
      }
    }

    await supabase
      .from('workers')
      .update({
        is_available: next,
        ...(location && {
          last_location: `POINT(${location.lng} ${location.lat})`,
          last_location_at: new Date().toISOString(),
        }),
      })
      .eq('id', workerId);

    // Start or stop the attendance session that feeds the 8-hour
    // Basic Daily Amount eligibility calculation.
    if (next) {
      await supabase.from('attendance_sessions').upsert(
        { worker_id: workerId, session_date: new Date().toISOString().slice(0, 10), started_at: new Date().toISOString() },
        { onConflict: 'worker_id,session_date', ignoreDuplicates: true }
      );
    }

    setAvailable(next);
    setBusy(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className={`w-full flex items-center justify-between rounded-2xl px-5 py-4 transition-colors ${
        available ? 'bg-green-600' : 'bg-neutral-700'
      } disabled:opacity-60`}
    >
      <span className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${available ? 'bg-green-300 animate-pulse' : 'bg-neutral-400'}`} />
        <span className="text-white font-medium text-base">
          {available ? t(lang, 'availableForWork') : t(lang, 'unavailable')}
        </span>
      </span>

      {/* Switch track */}
      <span className={`relative w-14 h-8 rounded-full transition-colors ${available ? 'bg-green-300' : 'bg-neutral-500'}`}>
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            available ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}

```

---

## components/worker/BasicDailyAmountTracker.tsx

```tsx
'use client';

import { WageResult } from '@/lib/wage-calculator';
import { t, Lang } from '@/lib/translations';

interface Props {
  wage: WageResult;
  dailyMinimumWage: number;
  todayDirectEarnings: number;
  lang: Lang;
}

/**
 * Visual "safety net" tracker. Shows a progress bar filling toward the
 * state minimum wage, and — once the worker has completed a full 8-hour
 * available day — surfaces the top-up amount the welfare fund will pay.
 */
export default function BasicDailyAmountTracker({
  wage,
  dailyMinimumWage,
  todayDirectEarnings,
  lang,
}: Props) {
  const barColor = wage.targetReached ? 'bg-green-500' : 'bg-amber-500';

  return (
    <div className="rounded-2xl bg-neutral-800 p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-neutral-300">{t(lang, 'basicDailyAmount')}</h3>
        <span className="text-xs text-neutral-400">
          {wage.hoursActive}h {t(lang, 'hoursActive').toLowerCase()}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-semibold text-white">
          ₹{todayDirectEarnings.toLocaleString('en-IN')}
        </span>
        <span className="text-sm text-neutral-400">
          {t(lang, 'outOf')} ₹{dailyMinimumWage.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 w-full rounded-full bg-neutral-700 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${wage.progressPercent}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-neutral-400">
          {wage.targetReached ? t(lang, 'targetReached') : t(lang, 'keepWorking')}
        </p>

        {wage.isFullDayComplete && wage.topUpEligible > 0 && (
          <span className="text-xs font-medium text-amber-400">
            + ₹{wage.topUpEligible.toLocaleString('en-IN')} {t(lang, 'topUpEligible')}
          </span>
        )}
      </div>

      {!wage.isFullDayComplete && wage.shortfall > 0 && (
        <p className="mt-2 text-[11px] text-neutral-500">
          {t(lang, 'minimumGuaranteed')}: ₹{dailyMinimumWage} — {t(lang, 'topUpEligible').toLowerCase()}{' '}
          {t(lang, 'outOf').toLowerCase()} 8h {t(lang, 'hoursActive').toLowerCase()}
        </p>
      )}
    </div>
  );
}

```

---

## components/worker/EarningsCard.tsx

```tsx
'use client';

import { t, Lang } from '@/lib/translations';

interface Props {
  balance: number;
  todayDirectEarnings: number;
  lang: Lang;
  onWithdraw: () => void;
  withdrawing: boolean;
}

export default function EarningsCard({ balance, todayDirectEarnings, lang, onWithdraw, withdrawing }: Props) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 p-5">
      <p className="text-sm text-neutral-400">{t(lang, 'walletBalance')}</p>
      <p className="text-3xl font-bold text-white mt-1">₹{balance.toLocaleString('en-IN')}</p>

      <div className="flex items-center gap-1 mt-2 text-sm text-green-400">
        <span>↗</span>
        <span>
          {t(lang, 'todaysEarnings')}: ₹{todayDirectEarnings.toLocaleString('en-IN')}
        </span>
      </div>

      <button
        onClick={onWithdraw}
        disabled={withdrawing || balance <= 0}
        className="mt-4 w-full rounded-xl bg-white text-neutral-900 font-medium py-3 disabled:opacity-50 active:scale-[0.98] transition-transform"
      >
        {withdrawing ? '...' : t(lang, 'withdraw')}
      </button>
    </div>
  );
}

```

---

## components/worker/WorkerDashboard.tsx

```tsx
'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/lib/supabase/client';
import { generateUpiWithdrawLink } from '@/lib/upi';
import { Lang, translations } from '@/lib/translations';
import AvailabilityToggle from './AvailabilityToggle';
import BasicDailyAmountTracker from './BasicDailyAmountTracker';
import EarningsCard from './EarningsCard';

interface WorkerDashboardProps {
  worker: {
    id: string;
    full_name: string;
    category: string;
    is_available: boolean;
    upi_id: string | null;
    language_pref: Lang;
  };
}

/**
 * Worker's home screen. Three jobs, top to bottom:
 *   1. Let them flip online/offline in one tap (AvailabilityToggle).
 *   2. Show today's wallet + let them cash out instantly (EarningsCard).
 *   3. Show progress toward the state minimum wage, and the welfare
 *      top-up they'll receive if they fall short (BasicDailyAmountTracker).
 *
 * Kept as a single client component (not split across server/client
 * boundaries) because everything here is live, per-user data with no
 * SEO value — server rendering it would just add a redundant fetch.
 */
export default function WorkerDashboard({ worker }: WorkerDashboardProps) {
  const [lang, setLang] = useState<Lang>(worker.language_pref ?? 'hi');
  const [withdrawing, setWithdrawing] = useState(false);
  const wallet = useWallet(worker.id);

  async function handleWithdraw() {
    if (!worker.upi_id) {
      alert(lang === 'en' ? 'Please add your UPI ID first.' : 'कृपया पहले अपनी UPI ID जोड़ें।');
      return;
    }

    setWithdrawing(true);
    try {
      // Deep-links straight into the worker's UPI app (PhonePe/GPay/Paytm)
      // with the amount pre-filled — the actual bank transfer happens
      // entirely within that app, platform never custodies the funds
      // beyond the wallet ledger record.
      const upiLink = generateUpiWithdrawLink({
        payeeUpiId: worker.upi_id,
        payeeName: worker.full_name,
        amount: wallet.balance,
        note: 'Bihar Shramik Direct wallet withdrawal',
      });
      window.location.href = upiLink;

      await supabase.from('transactions').insert({
        wallet_id: worker.id, // resolved server-side via RLS-safe RPC in production
        type: 'withdrawal',
        amount: wallet.balance,
        note: 'Instant UPI withdrawal initiated',
      });
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <div>
          <p className="text-neutral-400 text-sm">
            {lang === 'en' ? 'Welcome back' : lang === 'bho' ? 'फेर से स्वागत बा' : 'फिर से स्वागत है'}
          </p>
          <h1 className="text-white text-xl font-semibold">{worker.full_name}</h1>
        </div>

        {/* Language switcher — three-way toggle, kept simple on purpose */}
        <div className="flex gap-1 bg-neutral-800 rounded-full p-1">
          {(Object.keys(translations) as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                lang === l ? 'bg-white text-neutral-900' : 'text-neutral-400'
              }`}
            >
              {l === 'hi' ? 'हिं' : l === 'bho' ? 'भो' : 'EN'}
            </button>
          ))}
        </div>
      </header>

      <main className="px-5 flex flex-col gap-4">
        <AvailabilityToggle workerId={worker.id} initialAvailable={worker.is_available} lang={lang} />

        {wallet.loading ? (
          <div className="animate-pulse rounded-2xl bg-neutral-800 h-32" />
        ) : (
          <EarningsCard
            balance={wallet.balance}
            todayDirectEarnings={wallet.todayDirectEarnings}
            lang={lang}
            onWithdraw={handleWithdraw}
            withdrawing={withdrawing}
          />
        )}

        {wallet.loading ? (
          <div className="animate-pulse rounded-2xl bg-neutral-800 h-28" />
        ) : (
          <BasicDailyAmountTracker
            wage={wallet.wage}
            dailyMinimumWage={wallet.dailyMinimumWage}
            todayDirectEarnings={wallet.todayDirectEarnings}
            lang={lang}
          />
        )}
      </main>
    </div>
  );
}

```

---

## app/(worker)/dashboard/page.tsx

```tsx
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import WorkerDashboard from '@/components/worker/WorkerDashboard';

// Server component: fetches the logged-in worker's row once at request
// time (fast, no client-side loading flash for the header/profile bits),
// then hands off to the client component for everything realtime.
export default async function DashboardPage() {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/onboarding');

  const { data: worker } = await supabase
    .from('workers')
    .select('id, full_name, category, is_available, upi_id, language_pref')
    .eq('auth_user_id', user.id)
    .single();

  if (!worker) redirect('/onboarding');

  return <WorkerDashboard worker={worker} />;
}

```

---

## package.json

```json
{
  "name": "bihar-shramik-direct",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/ssr": "^0.4.0",
    "@supabase/supabase-js": "^2.45.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.14.0"
  }
}

```
