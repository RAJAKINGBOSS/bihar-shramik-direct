# Bihar Shramik Direct

Mobile-first Next.js + Supabase app for gig workers in Bihar.

Setup (local):
1. Install dependencies: npm install
2. Add env vars in .env.local:
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (for server scripts)
3. Run dev: npm run dev

Database:
- Run db/schema.sql in Supabase SQL editor.
- Run db/close_availability_rpc.sql to create RPC.
- Insert app_settings key 'state_minimum_daily_amount' with JSON {"amount_cents":22000}

Deploy:
- Add env vars to Vercel or your host.
- Setup cron to run server/cron/topup.js (uses SUPABASE_SERVICE_ROLE_KEY) daily.
