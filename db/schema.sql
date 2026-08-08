-- db/schema.sql

-- workers
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone varchar(20) UNIQUE NOT NULL,
  full_name text,
  language_preference varchar(8) DEFAULT 'en',
  e_shram_id varchar(64),
  gig_id varchar(64),
  upi_id varchar(128),
  is_available boolean DEFAULT false,
  last_location geometry(Point, 4326),
  kyc_status varchar(20) DEFAULT 'pending',
  kyc_meta jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  balance_cents bigint DEFAULT 0,
  todays_direct_earnings_cents bigint DEFAULT 0,
  last_topup_cents bigint DEFAULT 0,
  last_topup_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  amount_cents bigint NOT NULL,
  source text DEFAULT 'direct',
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS welfare_fund (
  id serial PRIMARY KEY,
  balance_cents bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE,
  doc_type text,
  doc_data jsonb,
  status text DEFAULT 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- sample setting insert (run manually if desired)
-- INSERT INTO app_settings (key, value) VALUES ('state_minimum_daily_amount', '{"amount_cents":22000}');
