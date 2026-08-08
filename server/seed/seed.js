const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing env vars NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

async function upsertSetting() {
  const key = 'state_minimum_daily_amount';
  const value = { amount_cents: 22000 };
  const { data, error } = await supabase
    .from('app_settings')
    .upsert({ key, value }, { onConflict: 'key' })
    .select();
  if (error) console.error('setting upsert error', error);
  return data;
}

async function ensureWelfareFund() {
  const { data } = await supabase.from('welfare_fund').select('*').limit(1).single();
  if (!data) {
    const { error } = await supabase.from('welfare_fund').insert([{ balance_cents: 5000000 }]); // INR 50,000.00
    if (error) console.error('welfare fund insert error', error);
  }
}

async function seed() {
  console.log('Seeding demo data...');
  await upsertSetting();
  await ensureWelfareFund();

  const today = new Date();
  today.setHours(0,0,0,0);
  const startedAt = new Date(today.getTime() + 8 * 60 * 60 * 1000); // today 08:00
  const endedAt = new Date(startedAt.getTime() + 9 * 60 * 60 * 1000); // 9 hours later

  const demoWorkers = [
    { full_name: 'Ram Kumar', phone: '+919876543210', upi_id: 'ram@upi', kyc_status: 'verified' },
    { full_name: 'Sita Devi', phone: '+919876543211', upi_id: 'sita@upi', kyc_status: 'verified' },
    { full_name: 'Mahesh Yadav', phone: '+919876543212', upi_id: 'mahesh@upi', kyc_status: 'verified' }
  ];

  for (const w of demoWorkers) {
    // upsert worker
    const { data: workerData, error: werr } = await supabase
      .from('workers')
      .upsert(w, { onConflict: 'phone' })
      .select()
      .single();
    if (werr) {
      console.error('worker upsert error', w.phone, werr);
      continue;
    }

    const workerId = workerData.id;

    // ensure wallet
    const { data: wallet } = await supabase.from('wallets').select('*').eq('worker_id', workerId).single();
    if (!wallet) {
      await supabase.from('wallets').insert([{ worker_id: workerId, balance_cents: 0 }]);
    }

    // create some earnings (varying)
    let earningsToInsert = [];
    if (w.full_name.startsWith('Ram')) {
      // Ram has earned less than minimum (e.g., INR 50)
      earningsToInsert.push({ worker_id: workerId, amount_cents: 5000, source: 'direct' });
    } else if (w.full_name.startsWith('Sita')) {
      // Sita has enough earnings (INR 300)
      earningsToInsert.push({ worker_id: workerId, amount_cents: 30000, source: 'direct' });
    } else {
      // Mahesh zero earnings
    }

    if (earningsToInsert.length > 0) {
      const { error: eerr } = await supabase.from('earnings').insert(earningsToInsert);
      if (eerr) console.error('earnings insert error', eerr);
    }

    // insert availability log of 9 hours so they qualify for topup in demo
    const { error: aerr } = await supabase.from('availability_logs').insert([{ worker_id: workerId, started_at: startedAt.toISOString(), ended_at: endedAt.toISOString() }]);
    if (aerr) console.error('availability insert error', aerr);
  }

  console.log('Seeding complete.');
}

seed().catch(err => { console.error(err); process.exit(1); });
