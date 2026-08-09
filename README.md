<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bihar Shramik Direct — Worker Dashboard (Demo)</title>
<style>
  :root {
    --bg: #0a0a0a;
    --card: #1a1a1a;
    --card-2: #222222;
    --border: #2e2e2e;
    --text: #f5f5f5;
    --text-dim: #a3a3a3;
    --text-faint: #737373;
    --green: #22c55e;
    --green-dim: #86efac;
    --amber: #f59e0b;
    --amber-dim: #fbbf24;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-height: 100vh;
  }

  .app {
    max-width: 420px;
    margin: 0 auto;
    padding: 24px 18px 40px;
  }

  /* ---------- Header ---------- */
  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .welcome-label {
    color: var(--text-dim);
    font-size: 13px;
    margin: 0 0 2px;
  }

  .worker-name {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }

  .worker-category {
    color: var(--text-faint);
    font-size: 12px;
    margin-top: 2px;
  }

  .lang-switcher {
    display: flex;
    gap: 3px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 3px;
  }

  .lang-btn {
    border: none;
    background: transparent;
    color: var(--text-faint);
    font-size: 12px;
    font-weight: 600;
    padding: 6px 10px;
    border-radius: 999px;
    cursor: pointer;
  }

  .lang-btn.active {
    background: #fff;
    color: #111;
  }

  /* ---------- Availability toggle ---------- */
  .availability {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 16px;
    padding: 16px 18px;
    margin-bottom: 14px;
    background: var(--card-2);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease;
    user-select: none;
  }

  .availability.online {
    background: #0f2e1c;
    border-color: #1b5e34;
  }

  .avail-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--text-faint);
  }

  .availability.online .dot {
    background: var(--green);
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
    animation: pulse 1.6s infinite;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2); }
    50% { box-shadow: 0 0 0 7px rgba(34, 197, 94, 0.08); }
  }

  .avail-label {
    font-size: 15px;
    font-weight: 500;
  }

  .switch-track {
    width: 46px;
    height: 26px;
    border-radius: 999px;
    background: var(--border);
    position: relative;
    transition: background 0.2s ease;
    flex-shrink: 0;
  }

  .availability.online .switch-track {
    background: var(--green-dim);
  }

  .switch-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s ease;
  }

  .availability.online .switch-thumb {
    transform: translateX(20px);
  }

  .gps-note {
    font-size: 11px;
    color: var(--text-faint);
    margin: -6px 0 14px 2px;
    min-height: 14px;
  }

  /* ---------- Wallet card ---------- */
  .wallet-card {
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 14px;
    background: linear-gradient(180deg, #1c1c1c, #141414);
    border: 1px solid var(--border);
  }

  .wallet-label {
    color: var(--text-dim);
    font-size: 13px;
    margin: 0 0 4px;
  }

  .wallet-balance {
    font-size: 30px;
    font-weight: 700;
    margin: 0;
  }

  .wallet-today {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--green);
    font-size: 13px;
    margin-top: 6px;
  }

  .withdraw-btn {
    width: 100%;
    margin-top: 14px;
    border: none;
    border-radius: 12px;
    background: #fff;
    color: #111;
    font-weight: 600;
    font-size: 14px;
    padding: 12px 0;
    cursor: pointer;
  }

  .withdraw-btn:active {
    transform: scale(0.98);
  }

  .withdraw-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* ---------- Basic Daily Amount tracker ---------- */
  .bda-card {
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 20px;
    background: var(--card);
    border: 1px solid var(--border);
  }

  .bda-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .bda-title {
    font-size: 13px;
    font-weight: 600;
    color: #d4d4d4;
    margin: 0;
  }

  .bda-hours {
    font-size: 11px;
    color: var(--text-faint);
  }

  .bda-amounts {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 10px;
  }

  .bda-earned {
    font-size: 22px;
    font-weight: 700;
  }

  .bda-outof {
    font-size: 13px;
    color: var(--text-dim);
  }

  .bar-track {
    height: 10px;
    width: 100%;
    background: var(--border);
    border-radius: 999px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 999px;
    background: var(--amber);
    transition: width 0.4s ease, background 0.4s ease;
  }

  .bar-fill.reached {
    background: var(--green);
  }

  .bda-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
  }

  .bda-status {
    font-size: 12px;
    color: var(--text-faint);
  }

  .bda-topup {
    font-size: 12px;
    font-weight: 600;
    color: var(--amber-dim);
  }

  .bda-hint {
    font-size: 11px;
    color: #5c5c5c;
    margin-top: 8px;
  }

  /* ---------- Demo controls ---------- */
  .demo-panel {
    border-radius: 16px;
    padding: 16px 18px;
    background: #111;
    border: 1px dashed #3a3a3a;
  }

  .demo-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--text-faint);
    margin: 0 0 12px;
  }

  .demo-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .demo-row label {
    font-size: 12px;
    color: var(--text-dim);
    width: 92px;
    flex-shrink: 0;
  }

  .demo-row input[type="range"] {
    flex: 1;
  }

  .demo-row .val {
    font-size: 12px;
    color: var(--text);
    width: 46px;
    text-align: right;
    flex-shrink: 0;
  }

  .demo-btns {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .demo-btns button {
    flex: 1;
    border: 1px solid var(--border);
    background: var(--card-2);
    color: var(--text);
    font-size: 12px;
    padding: 8px 0;
    border-radius: 8px;
    cursor: pointer;
  }

  .demo-btns button:active {
    transform: scale(0.97);
  }

  .toast {
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%) translateY(20px);
    background: #fff;
    color: #111;
    font-size: 13px;
    font-weight: 500;
    padding: 10px 18px;
    border-radius: 999px;
    opacity: 0;
    transition: opacity 0.25s ease, transform 0.25s ease;
    pointer-events: none;
    white-space: nowrap;
  }

  .toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
</style>
</head>
<body>

<div class="app">

  <!-- ===== Header ===== -->
  <header>
    <div>
      <p class="welcome-label" id="welcome-label">Welcome back</p>
      <h1 class="worker-name">Ramesh Kumar</h1>
      <p class="worker-category" id="worker-category">Electrician · Patna</p>
    </div>
    <div class="lang-switcher">
      <button class="lang-btn active" data-lang="hi">हिं</button>
      <button class="lang-btn" data-lang="bho">भो</button>
      <button class="lang-btn" data-lang="en">EN</button>
    </div>
  </header>

  <!-- ===== Availability toggle ===== -->
  <div class="availability" id="availability">
    <div class="avail-left">
      <span class="dot"></span>
      <span class="avail-label" id="avail-label">Not available</span>
    </div>
    <div class="switch-track">
      <div class="switch-thumb"></div>
    </div>
  </div>
  <p class="gps-note" id="gps-note"></p>

  <!-- ===== Wallet card ===== -->
  <div class="wallet-card">
    <p class="wallet-label" id="wallet-label">Wallet balance</p>
    <p class="wallet-balance">₹<span id="balance">0</span></p>
    <div class="wallet-today">
      <span>↗</span>
      <span><span id="today-label">Today's direct earnings</span>: ₹<span id="today-earnings">0</span></span>
    </div>
    <button class="withdraw-btn" id="withdraw-btn">Withdraw instantly</button>
  </div>

  <!-- ===== Basic Daily Amount tracker ===== -->
  <div class="bda-card">
    <div class="bda-top">
      <p class="bda-title" id="bda-title">Basic Daily Amount</p>
      <span class="bda-hours"><span id="hours-active">0</span>h <span id="hours-label">active</span></span>
    </div>

    <div class="bda-amounts">
      <span class="bda-earned">₹<span id="bda-earned">0</span></span>
      <span class="bda-outof"><span id="outof-label">of</span> ₹<span id="bda-min">400</span></span>
    </div>

    <div class="bar-track">
      <div class="bar-fill" id="bar-fill" style="width: 0%"></div>
    </div>

    <div class="bda-bottom">
      <span class="bda-status" id="bda-status">Keep working to reach today's target</span>
      <span class="bda-topup" id="bda-topup"></span>
    </div>

    <p class="bda-hint" id="bda-hint"></p>
  </div>

  <br/>

  <!-- ===== Demo controls (not part of the real product UI) ===== -->
  <div class="demo-panel">
    <p class="demo-title">Demo controls — simulate a day's work</p>

    <div class="demo-row">
      <label for="hours-slider">Hours active</label>
      <input type="range" id="hours-slider" min="0" max="10" step="0.5" value="0">
      <span class="val" id="hours-val">0h</span>
    </div>

    <div class="demo-row">
      <label for="earnings-slider">Direct earnings</label>
      <input type="range" id="earnings-slider" min="0" max="600" step="10" value="0">
      <span class="val" id="earnings-val">₹0</span>
    </div>

    <div class="demo-btns">
      <button id="simulate-booking">+ ₹80 booking</button>
      <button id="reset-day">Reset day</button>
    </div>
  </div>

</div>

<div class="toast" id="toast"></div>

<script>
/*
  ============================================================
  This is a self-contained MOCK of the real Worker Dashboard.
  No backend, no Supabase, no network calls — everything below
  is the same business logic that lives in lib/wage-calculator.ts
  and components/worker/*.tsx in the real Next.js project, just
  re-implemented in plain JS so it runs directly in any browser.

  "Demo controls" at the bottom simulate what would normally
  happen automatically: the worker going online (GPS + timer)
  and customer bookings landing in real time.
  ============================================================
*/

// ---------- i18n ----------
const translations = {
  hi: {
    welcome: 'फिर से स्वागत है',
    category: 'इलेक्ट्रीशियन · पटना',
    availableForWork: 'काम के लिए उपलब्ध',
    unavailable: 'अभी उपलब्ध नहीं',
    walletBalance: 'वॉलेट बैलेंस',
    todaysEarnings: 'आज की सीधी कमाई',
    withdraw: 'तुरंत निकासी करें',
    basicDailyAmount: 'न्यूनतम दैनिक राशि',
    active: 'सक्रिय',
    outOf: 'में से',
    keepWorking: 'लक्ष्य तक पहुँचने के लिए काम जारी रखें',
    targetReached: 'आज का लक्ष्य पूरा हुआ',
    topUpEligible: 'टॉप-अप के लिए पात्र',
    hint: 'न्यूनतम गारंटी ₹400 — 8 घंटे पूरे होने पर टॉप-अप मिलेगा',
    gpsOn: 'लोकेशन साझा हो रही है — पास के ग्राहक आपको देख सकते हैं',
    withdrawn: 'निकासी शुरू हुई — UPI ऐप खुल रहा है',
    bookingAdded: '₹80 की नई बुकिंग जुड़ी',
  },
  bho: {
    welcome: 'फेर से स्वागत बा',
    category: 'इलेक्ट्रीशियन · पटना',
    availableForWork: 'काम खातिर उपलब्ध बानी',
    unavailable: 'अभी उपलब्ध नइखीं',
    walletBalance: 'वॉलेट बैलेंस',
    todaysEarnings: 'आज के सीधा कमाई',
    withdraw: 'तुरंते निकासी करीं',
    basicDailyAmount: 'न्यूनतम रोज के राशि',
    active: 'सक्रिय',
    outOf: 'में से',
    keepWorking: 'लक्ष्य तक पहुँचे खातिर काम जारी राखीं',
    targetReached: 'आज के लक्ष्य पूरा भइल',
    topUpEligible: 'टॉप-अप खातिर योग्य',
    hint: 'न्यूनतम गारंटी ₹400 — 8 घंटा पूरा होखला पर टॉप-अप मिली',
    gpsOn: 'लोकेशन शेयर हो रहल बा — लगे के ग्राहक देख सकेलें',
    withdrawn: 'निकासी शुरू भइल — UPI ऐप खुल रहल बा',
    bookingAdded: '₹80 के नया बुकिंग जुड़ल',
  },
  en: {
    welcome: 'Welcome back',
    category: 'Electrician · Patna',
    availableForWork: 'Available for work',
    unavailable: 'Not available',
    walletBalance: 'Wallet balance',
    todaysEarnings: "Today's direct earnings",
    withdraw: 'Withdraw instantly',
    basicDailyAmount: 'Basic Daily Amount',
    active: 'active',
    outOf: 'of',
    keepWorking: 'Keep working to reach today\u2019s target',
    targetReached: 'Today\u2019s target reached',
    topUpEligible: 'top-up eligible',
    hint: 'Minimum guaranteed ₹400 — top-up unlocks after 8 full hours',
    gpsOn: 'Sharing location — nearby customers can find you',
    withdrawn: 'Withdrawal started — opening UPI app',
    bookingAdded: '₹80 booking added',
  },
};

let lang = 'hi';

// ---------- Mock state (stands in for the wallets/attendance_sessions rows) ----------
const state = {
  isAvailable: false,
  activeSeconds: 0,        // fed by the "Hours active" demo slider
  directEarnings: 0,       // fed by the "Direct earnings" slider / booking button
  balance: 0,
  dailyMinimumWage: 400,
};

// ---------- Core logic — identical rules to lib/wage-calculator.ts ----------
function calculateBasicDailyAmount({ directEarningsToday, activeSeconds, dailyMinimumWage }) {
  const fullDaySeconds = 8 * 60 * 60;
  const hoursActive = activeSeconds / 3600;
  const isFullDayComplete = activeSeconds >= fullDaySeconds;
  const shortfall = Math.max(0, dailyMinimumWage - directEarningsToday);
  const topUpEligible = isFullDayComplete ? Math.round(shortfall * 100) / 100 : 0;
  const progressPercent = Math.min(100, Math.round((directEarningsToday / dailyMinimumWage) * 100));

  return {
    hoursActive: Math.round(hoursActive * 10) / 10,
    isFullDayComplete,
    shortfall: Math.round(shortfall * 100) / 100,
    topUpEligible,
    progressPercent,
    targetReached: directEarningsToday >= dailyMinimumWage,
  };
}

// ---------- Rendering ----------
function render() {
  const t = translations[lang];

  document.getElementById('welcome-label').textContent = t.welcome;
  document.getElementById('worker-category').textContent = t.category;
  document.getElementById('wallet-label').textContent = t.walletBalance;
  document.getElementById('today-label').textContent = t.todaysEarnings;
  document.getElementById('withdraw-btn').textContent = t.withdraw;
  document.getElementById('bda-title').textContent = t.basicDailyAmount;
  document.getElementById('hours-label').textContent = t.active;
  document.getElementById('outof-label').textContent = t.outOf;
  document.getElementById('bda-hint').textContent = t.hint;

  // Availability
  const availEl = document.getElementById('availability');
  availEl.classList.toggle('online', state.isAvailable);
  document.getElementById('avail-label').textContent = state.isAvailable ? t.availableForWork : t.unavailable;
  document.getElementById('gps-note').textContent = state.isAvailable ? t.gpsOn : '';

  // Wallet
  document.getElementById('balance').textContent = state.balance.toLocaleString('en-IN');
  document.getElementById('today-earnings').textContent = state.directEarnings.toLocaleString('en-IN');
  document.getElementById('withdraw-btn').disabled = state.balance <= 0;

  // Basic Daily Amount
  const wage = calculateBasicDailyAmount({
    directEarningsToday: state.directEarnings,
    activeSeconds: state.activeSeconds,
    dailyMinimumWage: state.dailyMinimumWage,
  });

  document.getElementById('hours-active').textContent = wage.hoursActive;
  document.getElementById('bda-earned').textContent = state.directEarnings.toLocaleString('en-IN');
  document.getElementById('bda-min').textContent = state.dailyMinimumWage.toLocaleString('en-IN');

  const barFill = document.getElementById('bar-fill');
  barFill.style.width = wage.progressPercent + '%';
  barFill.classList.toggle('reached', wage.targetReached);

  document.getElementById('bda-status').textContent = wage.targetReached ? t.targetReached : t.keepWorking;

  const topupEl = document.getElementById('bda-topup');
  if (wage.isFullDayComplete && wage.topUpEligible > 0) {
    topupEl.textContent = `+ ₹${wage.topUpEligible.toLocaleString('en-IN')} ${t.topUpEligible}`;
  } else {
    topupEl.textContent = '';
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ---------- Event wiring ----------
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    lang = btn.dataset.lang;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b === btn));
    render();
  });
});

document.getElementById('availability').addEventListener('click', () => {
  state.isAvailable = !state.isAvailable;
  render();
});

document.getElementById('withdraw-btn').addEventListener('click', () => {
  if (state.balance <= 0) return;
  showToast(translations[lang].withdrawn);
});

const hoursSlider = document.getElementById('hours-slider');
hoursSlider.addEventListener('input', () => {
  state.activeSeconds = parseFloat(hoursSlider.value) * 3600;
  document.getElementById('hours-val').textContent = parseFloat(hoursSlider.value) + 'h';
  render();
});

const earningsSlider = document.getElementById('earnings-slider');
earningsSlider.addEventListener('input', () => {
  state.directEarnings = parseFloat(earningsSlider.value);
  state.balance = state.directEarnings;
  document.getElementById('earnings-val').textContent = '₹' + earningsSlider.value;
  render();
});

document.getElementById('simulate-booking').addEventListener('click', () => {
  state.directEarnings += 80;
  state.balance += 80;
  earningsSlider.value = Math.min(600, state.directEarnings);
  document.getElementById('earnings-val').textContent = '₹' + Math.round(state.directEarnings);
  showToast(translations[lang].bookingAdded);
  render();
});

document.getElementById('reset-day').addEventListener('click', () => {
  state.activeSeconds = 0;
  state.directEarnings = 0;
  state.balance = 0;
  hoursSlider.value = 0;
  earningsSlider.value = 0;
  document.getElementById('hours-val').textContent = '0h';
  document.getElementById('earnings-val').textContent = '₹0';
  render();
});

render();
</script>

</body>
</html>
