import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import LanguageToggle from '../../components/LanguageToggle';
import AvailabilityToggle from '../../components/AvailabilityToggle';
import DailyTracker from '../../components/DailyTracker';
import en from '../../locales/en.json';
import hi from '../../locales/hi.json';
import bho from '../../locales/bho.json';

export default function WorkerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [worker, setWorker] = useState<any>(null);
  const [lang, setLang] = useState<string>('en');
  const [langMap, setLangMap] = useState<Record<string, string>>(en as any);

  useEffect(() => {
    if (lang === 'hi') setLangMap(hi as any);
    else if (lang === 'bho') setLangMap(bho as any);
    else setLangMap(en as any);
  }, [lang]);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const u = (data as any)?.user || null;
      setUser(u);
      // For demo: fetch first worker
      const { data: w } = await supabase.from('workers').select('*').limit(1).single();
      if (w) setWorker(w);
    }
    init();
  }, []);

  async function handleWithdraw() {
    const { data: wallet } = await supabase.from('wallets').select('balance_cents').eq('worker_id', worker.id).single();
    const balance = wallet?.balance_cents ?? 0;
    if (balance <= 0) {
      alert('No balance available');
      return;
    }
    const upiId = worker.upi_id;
    const amount = (balance / 100).toFixed(2);
    if (!upiId) {
      alert('UPI ID not set. Please add your UPI ID in profile.');
      return;
    }
    const pa = encodeURIComponent(upiId);
    const pn = encodeURIComponent(worker.full_name || 'Worker');
    const am = encodeURIComponent(amount);
    const upiLink = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&mode=02`;
    if (typeof window !== 'undefined') window.location.href = upiLink;
  }

  if (!worker) return <main className="p-6">Loading…</main>;

  return (
    <main className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-md mx-auto">
        <header className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-lg font-bold">{langMap['title']}</h1>
            <div className="text-sm text-gray-500">{worker.full_name || worker.phone}</div>
          </div>
          <LanguageToggle lang={lang} setLang={setLang} />
        </header>

        <section className="mb-4">
          <AvailabilityToggle workerId={worker.id} isAvailable={worker.is_available} onChange={() => {}} />
        </section>

        <section className="bg-white rounded-lg shadow p-3">
          <DailyTracker workerId={worker.id} langMap={langMap} />
        </section>

        <button onClick={handleWithdraw} className="mt-4 w-full py-3 rounded-lg bg-blue-600 text-white font-semibold">{langMap['withdraw']}</button>
      </div>
    </main>
  );
}
