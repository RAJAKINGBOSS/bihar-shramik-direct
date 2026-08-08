import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function DailyTracker({ workerId, langMap }: { workerId: string; langMap: Record<string,string> }) {
  const [todayEarnings, setTodayEarnings] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [stateMinimum, setStateMinimum] = useState<number>(22000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const { data: setting } = await supabase.from('app_settings').select('value').eq('key','state_minimum_daily_amount').single();
      if (setting?.value?.amount_cents) setStateMinimum(setting.value.amount_cents);

      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
      const { data: rows } = await supabase.from('earnings').select('amount_cents').eq('worker_id', workerId).gte('created_at', startOfDay.toISOString());
      const sum = (rows || []).reduce((acc:any, r:any) => acc + Number(r.amount_cents || 0), 0);
      if (mounted) setTodayEarnings(sum);

      const { data: wallet } = await supabase.from('wallets').select('balance_cents').eq('worker_id', workerId).single();
      if (wallet?.balance_cents != null) setWalletBalance(wallet.balance_cents);
      setLoading(false);
    }
    load();
    return () => { mounted = false; }
  }, [workerId]);

  if (loading) return <div>Loading…</div>;
  const earned = todayEarnings ?? 0;
  const needed = Math.max(0, stateMinimum - earned);
  const progress = Math.min(100, Math.round((earned / stateMinimum) * 100));
  function fmt(c:number){return `₹ ${(c/100).toFixed(2)}`}

  return (
    <div>
      <div className="mb-3">
        <div className="text-sm text-gray-500">{langMap['today_earnings']}</div>
        <div className="text-xl font-bold">{fmt(earned)}</div>
      </div>
      <div className="mb-3">
        <div className="text-sm text-gray-500">{langMap['basic_daily_amount']}</div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 h-3 rounded overflow-hidden">
            <div style={{ width: `${progress}%` }} className="h-full bg-green-500" />
          </div>
          <div className="text-sm">{progress}%</div>
        </div>
        <div className="text-sm mt-2">{langMap['eligible_topup']}: <strong>{fmt(needed)}</strong></div>
      </div>
      <div>
        <div className="text-sm text-gray-500">Wallet Balance</div>
        <div className="text-lg font-semibold">{walletBalance!=null?fmt(walletBalance):'--'}</div>
      </div>
    </div>
  );
}
