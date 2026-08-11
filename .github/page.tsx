"use client";

import { useEffect, useMemo, useState } from "react";
import EarningsRing from "@/components/EarningsRing";
import AvailabilityToggle from "@/components/AvailabilityToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { Lang, t, formatRupees } from "@/lib/i18n";

// Replace with a real Supabase client + row subscriptions.
// Shape mirrors public.daily_earning_summary + public.wallets from schema.sql.
interface DashboardData {
  workerName: string;
  isAvailable: boolean;
  todayDirectEarningsPaise: number;
  todayTopupPaise: number;       // credited so far (settle_daily_topup can run mid-day for a live estimate)
  minWageTargetPaise: number;
  activeSeconds: number;
  walletBalancePaise: number;
  kycVerified: boolean;
}

const MOCK_DATA: DashboardData = {
  workerName: "Ravi Kumar",
  isAvailable: true,
  todayDirectEarningsPaise: 32000,   // ₹320 earned directly from customers so far
  todayTopupPaise: 8000,             // ₹80 top-up already credited
  minWageTargetPaise: 55000,         // ₹550 state daily minimum for the worker's category/district
  activeSeconds: 5 * 3600 + 40 * 60, // 5h 40m into the day
  walletBalancePaise: 40000,
  kycVerified: true,
};

const REQUIRED_SECONDS = 8 * 3600;

export default function WorkerDashboardPage() {
  const [lang, setLang] = useState<Lang>("hi");
  const [data, setData] = useState<DashboardData>(MOCK_DATA);

  // TODO: replace with a Supabase realtime subscription on
  // `wallets`, `wallet_transactions`, and `availability_sessions`
  // filtered to the logged-in worker's id.
  useEffect(() => {
    // fetchDashboard(workerId).then(setData);
  }, []);

  const hoursActive = useMemo(() => data.activeSeconds / 3600, [data.activeSeconds]);
  const hoursProgress = Math.min(data.activeSeconds / REQUIRED_SECONDS, 1);

  const projectedTopup = Math.max(
    0,
    data.minWageTargetPaise - data.todayDirectEarningsPaise - data.todayTopupPaise
  );

  function handleToggleAvailability() {
    setData((prev) => ({ ...prev, isAvailable: !prev.isAvailable }));
    // TODO: write to workers.is_available + open/close availability_sessions row
  }

  function handleWithdraw() {
    // TODO: trigger UPI deep link / Razorpay payout for data.walletBalancePaise
    alert(`UPI withdrawal of ${formatRupees(data.walletBalancePaise)} initiated`);
  }

  return (
    <main className="min-h-screen bg-ricepaper pb-10">
      {/* Header */}
      <header className="px-4 pt-5 pb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-ink/60">{t(lang, "greeting")},</p>
          <h1 className="text-xl font-extrabold text-indigo">{data.workerName}</h1>
        </div>
        <LanguageToggle lang={lang} onChange={setLang} />
      </header>

      <div className="px-4 space-y-4">
        {/* Availability toggle */}
        <AvailabilityToggle
          isAvailable={data.isAvailable}
          onToggle={handleToggleAvailability}
          lang={lang}
        />

        {/* Basic Daily Amount tracker */}
        <section className="rounded-3xl bg-white border border-ink/10 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-indigo">{t(lang, "basic_daily_amount")}</h2>
            {!data.kycVerified && (
              <span className="text-xs text-sindoor font-semibold">
                {t(lang, "kyc_pending_note")}
              </span>
            )}
          </div>

          <div className="flex justify-center py-2">
            <EarningsRing
              earnedPaise={data.todayDirectEarningsPaise}
              topupPaise={data.todayTopupPaise}
              targetPaise={data.minWageTargetPaise}
            />
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-5 text-xs mt-1 mb-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-turmeric inline-block" />
              {t(lang, "direct_from_customers")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-topupgold inline-block" />
              {t(lang, "topup_eligible")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-ricepaper p-3">
              <p className="text-xs text-ink/60">{t(lang, "todays_earnings")}</p>
              <p className="font-tabular text-lg font-bold text-indigo">
                {formatRupees(data.todayDirectEarningsPaise)}
              </p>
            </div>
            <div className="rounded-2xl bg-ricepaper p-3">
              <p className="text-xs text-ink/60">{t(lang, "topup_eligible")}</p>
              <p className="font-tabular text-lg font-bold text-topupgold">
                {formatRupees(projectedTopup)}
              </p>
            </div>
          </div>

          {/* Hours-active progress bar — the other condition for topup eligibility */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-ink/60 mb-1">
              <span>{t(lang, "hours_active")}</span>
              <span className="font-tabular">
                {hoursActive.toFixed(1)}h {t(lang, "of_required_hours")}
              </span>
            </div>
            <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
              <div
                className="h-full bg-salgreen transition-all duration-500"
                style={{ width: `${hoursProgress * 100}%` }}
              />
            </div>
          </div>
        </section>

        {/* Wallet */}
        <section className="rounded-3xl bg-indigo text-ricepaper p-5 shadow-sm">
          <p className="text-sm text-ricepaper/70">{t(lang, "wallet_balance")}</p>
          <p className="font-tabular text-3xl font-extrabold mt-1">
            {formatRupees(data.walletBalancePaise)}
          </p>
          <button
            onClick={handleWithdraw}
            className="mt-4 w-full rounded-2xl bg-turmeric text-indigo font-bold py-3
                       active:scale-[0.98] transition-transform duration-150
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ricepaper"
          >
            {t(lang, "withdraw_now")} · UPI
          </button>
        </section>
      </div>
    </main>
  );
}
