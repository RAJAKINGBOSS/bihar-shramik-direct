// server/cron/topup.js
// Simple Node script to run daily top-ups using SUPABASE_SERVICE_ROLE_KEY

const fetch = require('node-fetch');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing env vars NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function rpc(path, body) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function getSettings() {
  const url = `${SUPABASE_URL}/rest/v1/app_settings?select=value&key=eq.state_minimum_daily_amount`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`
    }
  });
  return res.json();
}

async function runTopups() {
  console.log('Starting topup run...');
  const settings = await getSettings();
  const minVal = (settings && settings[0] && settings[0].value && settings[0].value.amount_cents) || 22000;
  console.log('state minimum', minVal);

  // Fetch workers who are verified
  const workersUrl = `${SUPABASE_URL}/rest/v1/workers?select=id,kyc_status&kyc_status=eq.verified`;
  const wres = await fetch(workersUrl, { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } });
  const workers = await wres.json();

  for (const w of workers) {
    try {
      const workerId = w.id;
      // Sum today's earnings
      const today = new Date();
      today.setHours(0,0,0,0);
      const earningsUrl = `${SUPABASE_URL}/rest/v1/earnings?select=amount_cents&worker_id=eq.${workerId}&created_at=gte.${today.toISOString()}`;
      const eres = await fetch(earningsUrl, { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } });
      const earnings = await eres.json();
      const sum = (earnings || []).reduce((a, r) => a + Number(r.amount_cents || 0), 0);

      // Compute active hours today
      const availUrl = `${SUPABASE_URL}/rest/v1/availability_logs?select=started_at,ended_at&worker_id=eq.${workerId}&started_at=gte.${today.toISOString()}`;
      const ares = await fetch(availUrl, { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } });
      const logs = await ares.json();
      let activeMs = 0;
      for (const l of logs) {
        const start = new Date(l.started_at).getTime();
        const end = l.ended_at ? new Date(l.ended_at).getTime() : Date.now();
        activeMs += Math.max(0, end - start);
      }
      const activeHours = activeMs / (1000 * 60 * 60);

      if (activeHours >= 8 && sum < minVal) {
        const topup = minVal - sum;
        console.log('Topup for', workerId, topup);
        // Debit welfare fund (simplified) and create earning
        // Create earning record with source admin_topup
        const createEUrl = `${SUPABASE_URL}/rest/v1/earnings`;
        await fetch(createEUrl, {
          method: 'POST',
          headers: {
            apikey: SERVICE_ROLE,
            Authorization: `Bearer ${SERVICE_ROLE}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify([{ worker_id: workerId, amount_cents: topup, source: 'admin_topup', metadata: { reason: 'basic_daily_amount' } }])
        });

        // Update wallets.balance_cents increment
        const walletUrl = `${SUPABASE_URL}/rpc/increment_wallet_balance`;
        // We recommend implementing a safe RPC increment_wallet_balance on DB side. For now, try patch wallets directly (simpler):
        const patchUrl = `${SUPABASE_URL}/rest/v1/wallets?worker_id=eq.${workerId}`;
        await fetch(patchUrl, {
          method: 'PATCH',
          headers: {
            apikey: SERVICE_ROLE,
            Authorization: `Bearer ${SERVICE_ROLE}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify({ balance_cents: `balance_cents + ${topup}`, last_topup_cents: topup, last_topup_at: new Date().toISOString() })
        });
      }

    } catch (err) {
      console.error('error for worker', w.id, err);
    }
  }
  console.log('Topup run complete');
}

runTopups().catch(e=>{console.error(e);process.exit(1);});
