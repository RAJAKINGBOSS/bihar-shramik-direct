-- =====================================================================
-- Bihar Shramik Direct — Database Schema (Supabase / PostgreSQL)
-- =====================================================================
-- Notes:
--   * Money is stored in paise (integer) to avoid floating-point drift.
--   * Row Level Security (RLS) is on for every table touching money or
--     personal data — policies are sketched at the bottom.
--   * "Basic Daily Amount" logic lives partly in Postgres (via the
--     `daily_earning_summary` view + `settle_daily_topup` function) so
--     the guarantee can be computed/audited independently of the app.
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists postgis; -- for geo queries (worker location, "near me" search)

-- ---------------------------------------------------------------------
-- 1. WORKERS
-- ---------------------------------------------------------------------
create table public.workers (
  id                    uuid primary key default uuid_generate_v4(),
  phone_number          text unique not null,               -- OTP login identity
  full_name             text not null,
  preferred_language    text not null default 'hi'
                          check (preferred_language in ('hi', 'bho', 'en')),
  e_shram_number        text unique,                         -- optional, national e-Shram card
  bihar_gig_worker_id   text unique,                         -- new state-issued ID (fallback if no e-Shram)
  skill_categories      text[] not null default '{}',        -- e.g. {'plumber','electrician'}
  district              text,                                -- Patna, Gaya, Muzaffarpur, ...
  kyc_status            text not null default 'pending'
                          check (kyc_status in ('pending','verified','rejected')),
  kyc_doc_ref           text,                                -- pointer to stored KYC doc, not the doc itself
  upi_id                text,                                -- payout address, e.g. name@okicici
  bank_account_last4    text,                                -- masked, for display only
  is_available          boolean not null default false,      -- "Available for Work Now" toggle
  current_location      geography(Point, 4326),               -- live GPS, updated while available
  location_updated_at   timestamptz,
  rating_avg            numeric(2,1) default 5.0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index workers_location_idx on public.workers using gist (current_location);
create index workers_district_skill_idx on public.workers (district, skill_categories);

-- ---------------------------------------------------------------------
-- 2. AVAILABILITY SESSIONS (tracks the "logged in & active" 8-hour clock)
-- ---------------------------------------------------------------------
create table public.availability_sessions (
  id              uuid primary key default uuid_generate_v4(),
  worker_id       uuid not null references public.workers(id) on delete cascade,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,                     -- null while still active
  active_seconds  integer generated always as (
                    case when ended_at is null then null
                    else extract(epoch from (ended_at - started_at))::int end
                  ) stored
);

create index availability_sessions_worker_idx on public.availability_sessions (worker_id, started_at);

-- ---------------------------------------------------------------------
-- 3. BOOKINGS (direct customer <-> worker jobs, zero commission)
-- ---------------------------------------------------------------------
create table public.customers (
  id            uuid primary key default uuid_generate_v4(),
  phone_number  text unique not null,
  full_name     text,
  created_at    timestamptz not null default now()
);

create table public.bookings (
  id                uuid primary key default uuid_generate_v4(),
  worker_id         uuid not null references public.workers(id),
  customer_id       uuid not null references public.customers(id),
  skill_category    text not null,
  status            text not null default 'requested'
                      check (status in ('requested','accepted','in_progress','completed','cancelled')),
  agreed_amount     integer,                 -- paise, set once worker & customer agree
  paid_amount       integer,                 -- paise, actually settled via UPI (100% to worker)
  payment_ref       text,                    -- UPI transaction ref (informational only — platform never routes funds)
  requested_at      timestamptz not null default now(),
  completed_at      timestamptz
);

create index bookings_worker_idx on public.bookings (worker_id, requested_at);

-- ---------------------------------------------------------------------
-- 4. WALLET (per worker, single running ledger)
-- ---------------------------------------------------------------------
create table public.wallets (
  id                    uuid primary key default uuid_generate_v4(),
  worker_id             uuid unique not null references public.workers(id) on delete cascade,
  balance_paise         integer not null default 0,
  lifetime_earned_paise integer not null default 0,
  lifetime_topup_paise  integer not null default 0,
  updated_at            timestamptz not null default now()
);

create table public.wallet_transactions (
  id              uuid primary key default uuid_generate_v4(),
  wallet_id       uuid not null references public.wallets(id) on delete cascade,
  type            text not null
                    check (type in ('direct_earning','welfare_topup','withdrawal','adjustment')),
  amount_paise    integer not null,               -- positive for credits, negative for withdrawals
  booking_id      uuid references public.bookings(id),   -- set when type = direct_earning
  topup_id        uuid,                                   -- set when type = welfare_topup (see below)
  upi_ref         text,                                    -- set when type = withdrawal
  created_at      timestamptz not null default now()
);

create index wallet_transactions_wallet_idx on public.wallet_transactions (wallet_id, created_at);

-- ---------------------------------------------------------------------
-- 5. BASIC DAILY AMOUNT — WELFARE FUND & TOP-UPS
-- ---------------------------------------------------------------------
create table public.state_minimum_wage_rates (
  district        text primary key,
  daily_min_paise integer not null,       -- Bihar govt notified daily minimum wage, by district/category
  effective_from  date not null default current_date
);

create table public.welfare_fund (
  id                   uuid primary key default uuid_generate_v4(),
  total_pool_paise     integer not null default 0,   -- funds available for top-ups
  reserved_paise       integer not null default 0,   -- earmarked for today's pending settlements
  updated_at           timestamptz not null default now()
);

create table public.daily_topups (
  id                   uuid primary key default uuid_generate_v4(),
  worker_id            uuid not null references public.workers(id),
  work_date            date not null default current_date,
  direct_earnings_paise integer not null,            -- sum of that day's direct_earning transactions
  active_seconds        integer not null,             -- sum of availability_sessions for the day
  min_wage_target_paise integer not null,             -- from state_minimum_wage_rates at time of settlement
  topup_amount_paise     integer not null,            -- max(0, target - earnings), only if active_seconds >= 8h
  status                 text not null default 'pending'
                           check (status in ('pending','paid','denied_kyc','denied_insufficient_hours')),
  created_at             timestamptz not null default now(),
  unique (worker_id, work_date)
);

-- ---------------------------------------------------------------------
-- View: rolls up "today so far" per worker — powers the dashboard tracker
-- ---------------------------------------------------------------------
create view public.daily_earning_summary as
select
  w.id as worker_id,
  coalesce(sum(wt.amount_paise) filter (
    where wt.type = 'direct_earning' and wt.created_at::date = current_date
  ), 0) as today_direct_earnings_paise,
  coalesce(sum(a.active_seconds) filter (where a.started_at::date = current_date), 0) as today_active_seconds,
  smw.daily_min_paise as min_wage_target_paise
from public.workers w
left join public.wallets wal on wal.worker_id = w.id
left join public.wallet_transactions wt on wt.wallet_id = wal.id
left join public.availability_sessions a on a.worker_id = w.id
left join public.state_minimum_wage_rates smw on smw.district = w.district
group by w.id, smw.daily_min_paise;

-- ---------------------------------------------------------------------
-- Function: settle a day's top-up (run by a nightly job / edge function
-- at end-of-day, or on-demand for the live "eligible so far" preview)
-- ---------------------------------------------------------------------
create or replace function public.settle_daily_topup(p_worker_id uuid, p_work_date date default current_date)
returns public.daily_topups
language plpgsql
as $$
declare
  v_earnings   integer;
  v_seconds    integer;
  v_target     integer;
  v_topup      integer;
  v_status     text := 'pending';
  v_kyc        text;
  v_row        public.daily_topups;
begin
  select kyc_status into v_kyc from public.workers where id = p_worker_id;

  select today_direct_earnings_paise, today_active_seconds, min_wage_target_paise
    into v_earnings, v_seconds, v_target
    from public.daily_earning_summary where worker_id = p_worker_id;

  if v_kyc <> 'verified' then
    v_status := 'denied_kyc';
    v_topup := 0;
  elsif v_seconds < 8 * 3600 then
    v_status := 'denied_insufficient_hours';
    v_topup := 0;
  else
    v_topup := greatest(0, coalesce(v_target, 0) - coalesce(v_earnings, 0));
  end if;

  insert into public.daily_topups (worker_id, work_date, direct_earnings_paise, active_seconds,
                                    min_wage_target_paise, topup_amount_paise, status)
  values (p_worker_id, p_work_date, coalesce(v_earnings,0), coalesce(v_seconds,0),
          coalesce(v_target,0), v_topup, v_status)
  on conflict (worker_id, work_date) do update
    set direct_earnings_paise = excluded.direct_earnings_paise,
        active_seconds = excluded.active_seconds,
        topup_amount_paise = excluded.topup_amount_paise,
        status = excluded.status
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security (sketch — tighten per real auth setup)
-- ---------------------------------------------------------------------
alter table public.workers enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.daily_topups enable row level security;

create policy "workers read own row" on public.workers
  for select using (auth.uid()::text = id::text);

create policy "workers update own availability/location" on public.workers
  for update using (auth.uid()::text = id::text);

create policy "workers read own wallet" on public.wallets
  for select using (auth.uid()::text = worker_id::text);

create policy "workers read own transactions" on public.wallet_transactions
  for select using (
    wallet_id in (select id from public.wallets where worker_id::text = auth.uid()::text)
  );

create policy "workers read own topups" on public.daily_topups
  for select using (auth.uid()::text = worker_id::text);

-- Admin dashboard should use the Supabase service role (bypasses RLS)
-- rather than a broad "admin" policy, to keep the welfare fund tables
-- fully server-side.
