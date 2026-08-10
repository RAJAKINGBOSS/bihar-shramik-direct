<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>Bihar Shramik Direct</title>
 
<!-- Tailwind CSS via CDN -->
<script src="https://cdn.tailwindcss.com"></script>
 
<!-- FontAwesome via CDN -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
 
<style>
  /* Small custom bits Tailwind utility classes can't express cleanly */
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
 
  .tab-active {
    background-color: #ffffff;
    color: #111827;
  }
  .tab-inactive {
    background-color: transparent;
    color: #9ca3af;
  }
 
  .status-btn-offline {
    background-color: #dc2626; /* red-600 */
  }
  .status-btn-online {
    background-color: #16a34a; /* green-600 */
  }
 
  .progress-bar-fill {
    transition: width 0.5s ease;
  }
 
  /* Simple QR placeholder pattern using CSS gradients — no image asset needed */
  .qr-placeholder {
    background-image:
      linear-gradient(45deg, #111 25%, transparent 25%),
      linear-gradient(-45deg, #111 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #111 75%),
      linear-gradient(-45deg, transparent 75%, #111 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
  }
</style>
</head>
 
<body class="bg-gray-950 text-gray-100 min-h-screen pb-10">
 
  <!-- ============ Sticky Header ============ -->
  <header class="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 shadow-lg">
    <div class="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-bolt text-white text-sm"></i>
        </div>
        <div>
          <h1 class="text-base font-bold leading-tight">Bihar Shramik Direct</h1>
          <p class="text-[11px] text-gray-400 leading-tight" data-en="Zero Commission Platform" data-hi="जीरो कमीशन प्लेटफॉर्म">Zero Commission Platform</p>
        </div>
      </div>
 
      <!-- Language toggle -->
      <button id="lang-toggle" class="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5 text-xs font-semibold active:scale-95 transition-transform">
        <i class="fa-solid fa-language text-green-400"></i>
        <span id="lang-toggle-label">हिंदी</span>
      </button>
    </div>
 
    <!-- Main tabs -->
    <div class="max-w-md mx-auto px-4 pb-3">
      <div class="flex bg-gray-800 rounded-xl p-1 gap-1">
        <button id="tab-worker-btn" onclick="switchTab('worker')" class="flex-1 py-2 rounded-lg text-sm font-semibold tab-active transition-colors flex items-center justify-center gap-2">
          <i class="fa-solid fa-screwdriver-wrench"></i>
          <span data-en="I am a Worker" data-hi="मैं एक श्रमिक हूँ">I am a Worker</span>
        </button>
        <button id="tab-customer-btn" onclick="switchTab('customer')" class="flex-1 py-2 rounded-lg text-sm font-semibold tab-inactive transition-colors flex items-center justify-center gap-2">
          <i class="fa-solid fa-user"></i>
          <span data-en="I am a Customer" data-hi="मैं एक ग्राहक हूँ">I am a Customer</span>
        </button>
      </div>
    </div>
  </header>
 
  <main class="max-w-md mx-auto px-4 pt-5">
 
    <!-- ============================================================ -->
    <!-- WORKER DASHBOARD VIEW (default visible)                       -->
    <!-- ============================================================ -->
    <section id="worker-view">
 
      <!-- Worker profile strip -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-xs text-gray-400" data-en="Welcome back" data-hi="वापसी पर स्वागत है">Welcome back</p>
          <h2 class="text-lg font-bold">Ramesh Kumar</h2>
          <p class="text-xs text-gray-500" data-en="Electrician · Patna" data-hi="इलेक्ट्रीशियन · पटना">Electrician · Patna</p>
        </div>
        <div class="w-11 h-11 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
          <i class="fa-solid fa-user text-gray-400"></i>
        </div>
      </div>
 
      <!-- Status toggle -->
      <button id="status-toggle" onclick="toggleStatus()" class="status-btn-offline w-full rounded-2xl py-5 px-5 flex items-center justify-between shadow-lg active:scale-[0.98] transition-all mb-4">
        <div class="flex items-center gap-3">
          <span id="status-dot" class="w-3 h-3 rounded-full bg-white/70"></span>
          <span id="status-label" class="text-white font-bold text-base" data-en="Go Online / Available for Work" data-hi="ऑनलाइन जाएं / काम के लिए उपलब्ध">Go Online / Available for Work</span>
        </div>
        <i id="status-icon" class="fa-solid fa-power-off text-white text-lg"></i>
      </button>
      <p id="status-note" class="text-[11px] text-gray-500 -mt-2 mb-5 px-1" data-en="You're offline. Go online to receive bookings." data-hi="आप ऑफलाइन हैं। बुकिंग पाने के लिए ऑनलाइन जाएं।">You're offline. Go online to receive bookings.</p>
 
      <!-- Basic Daily Amount tracker -->
      <div class="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-4">
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-sm font-semibold text-gray-300" data-en="Basic Daily Amount" data-hi="न्यूनतम दैनिक राशि">Basic Daily Amount</h3>
          <span class="text-[11px] text-gray-500" data-en="Target: ₹500" data-hi="लक्ष्य: ₹500">Target: ₹500</span>
        </div>
 
        <div class="flex items-baseline gap-1 mb-3">
          <span class="text-2xl font-extrabold text-white">₹300</span>
          <span class="text-xs text-gray-400" data-en="earned today (Aaj ki Kamai)" data-hi="आज कमाया (आज की कमाई)">earned today (Aaj ki Kamai)</span>
        </div>
 
        <!-- Progress bar: 300 / 500 = 60% -->
        <div class="h-3 w-full bg-gray-800 rounded-full overflow-hidden">
          <div class="progress-bar-fill h-full bg-amber-500 rounded-full" style="width: 60%;"></div>
        </div>
        <div class="flex justify-between text-[11px] text-gray-500 mt-1">
          <span>₹0</span>
          <span data-en="60% of daily target" data-hi="दैनिक लक्ष्य का 60%">60% of daily target</span>
          <span>₹500</span>
        </div>
 
        <!-- Top-up / Safety net highlight -->
        <div class="mt-4 bg-amber-950/40 border border-amber-700/40 rounded-xl p-3 flex items-start gap-3">
          <div class="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <i class="fa-solid fa-shield-heart text-amber-400"></i>
          </div>
          <div>
            <p class="text-sm font-bold text-amber-300">
              <span data-en="₹200 Platform Top-up Pending" data-hi="₹200 प्लेटफ़ॉर्म टॉप-अप बकाया">₹200 Platform Top-up Pending</span>
            </p>
            <p class="text-[11px] text-amber-200/70 mt-0.5 leading-snug" data-en="Complete 8 hours online today and if you're still short of ₹500, we'll top up the difference automatically." data-hi="आज 8 घंटे ऑनलाइन पूरा करें, अगर फिर भी ₹500 से कम हो तो हम अंतर अपने आप जोड़ देंगे।">Complete 8 hours online today and if you're still short of ₹500, we'll top up the difference automatically.</p>
            <div class="flex items-center gap-1.5 mt-2 text-[11px] text-amber-300">
              <i class="fa-regular fa-clock"></i>
              <span data-en="4.5 / 8 hours online" data-hi="4.5 / 8 घंटे ऑनलाइन">4.5 / 8 hours online</span>
            </div>
          </div>
        </div>
      </div>
 
      <!-- Direct Wallet -->
      <div class="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <h3 class="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <i class="fa-solid fa-wallet text-green-400"></i>
          <span data-en="Direct Wallet" data-hi="डायरेक्ट वॉलेट">Direct Wallet</span>
        </h3>
 
        <div class="flex items-center gap-4">
          <!-- QR placeholder -->
          <div class="w-24 h-24 bg-white rounded-lg p-2 flex-shrink-0">
            <div class="w-full h-full qr-placeholder rounded"></div>
          </div>
 
          <div class="flex-1 min-w-0">
            <p class="text-[11px] text-gray-500" data-en="Your UPI ID" data-hi="आपकी UPI ID">Your UPI ID</p>
            <p class="text-sm font-semibold text-white truncate">ramesh.electrician@upi</p>
            <p class="text-[11px] text-green-400 mt-1 flex items-center gap-1">
              <i class="fa-solid fa-circle-check"></i>
              <span data-en="100% goes to you, zero commission" data-hi="100% आपको मिलता है, जीरो कमीशन">100% goes to you, zero commission</span>
            </p>
          </div>
        </div>
 
        <button onclick="shareUpi()" class="w-full mt-4 bg-white text-gray-900 font-semibold text-sm rounded-xl py-3 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <i class="fa-solid fa-share-nodes"></i>
          <span data-en="Share UPI ID with Customer" data-hi="ग्राहक के साथ UPI ID शेयर करें">Share UPI ID with Customer</span>
        </button>
      </div>
 
    </section>
 
    <!-- ============================================================ -->
    <!-- CUSTOMER VIEW (hidden by default)                              -->
    <!-- ============================================================ -->
    <section id="customer-view" class="hidden">
 
      <!-- Search bar -->
      <div class="relative mb-4">
        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
        <input
          type="text"
          placeholder="Find services near you (e.g., Patna, Gaya)"
          data-en-placeholder="Find services near you (e.g., Patna, Gaya)"
          data-hi-placeholder="अपने पास सेवाएं खोजें (जैसे, पटना, गया)"
          class="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-sm placeholder-gray-500 focus:outline-none focus:border-green-600"
        >
      </div>
 
      <!-- Quick category chips -->
      <div class="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
        <button class="flex-shrink-0 bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5">
          <i class="fa-solid fa-faucet text-blue-400"></i>
          <span data-en="Plumber" data-hi="प्लंबर">Plumber</span>
        </button>
        <button class="flex-shrink-0 bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5">
          <i class="fa-solid fa-bolt text-yellow-400"></i>
          <span data-en="Electrician" data-hi="इलेक्ट्रीशियन">Electrician</span>
        </button>
        <button class="flex-shrink-0 bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5">
          <i class="fa-solid fa-spa text-pink-400"></i>
          <span data-en="Beautician" data-hi="ब्यूटीशियन">Beautician</span>
        </button>
        <button class="flex-shrink-0 bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5">
          <i class="fa-solid fa-motorcycle text-red-400"></i>
          <span data-en="Delivery" data-hi="डिलीवरी">Delivery</span>
        </button>
      </div>
 
      <p class="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
        <i class="fa-solid fa-map-pin text-green-500"></i>
        <span data-en="3 workers available near Patna" data-hi="पटना के पास 3 श्रमिक उपलब्ध">3 workers available near Patna</span>
      </p>
 
      <!-- Worker card list -->
      <div class="flex flex-col gap-3">
 
        <!-- Card 1 -->
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div class="flex items-start gap-3 mb-3">
            <div class="w-14 h-14 rounded-full bg-blue-900/50 border border-blue-700/50 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-faucet text-blue-400 text-lg"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-white text-base">Ramesh</h3>
                <span class="flex items-center gap-1 bg-green-950/50 text-green-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  <span data-en="Online" data-hi="ऑनलाइन">Online</span>
                </span>
              </div>
              <p class="text-xs text-gray-400" data-en="Plumber · 4.8" data-hi="प्लंबर · 4.8">Plumber · 4.8 <i class="fa-solid fa-star text-amber-400 text-[10px]"></i></p>
              <p class="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                <i class="fa-solid fa-location-dot"></i>
                <span data-en="1.2 km away · Kankarbagh, Patna" data-hi="1.2 किमी दूर · कंकड़बाग, पटना">1.2 km away · Kankarbagh, Patna</span>
              </p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <a href="tel:+919876543210" class="flex items-center justify-center gap-2 bg-gray-800 border border-gray-700 rounded-xl py-2.5 text-sm font-semibold active:scale-95 transition-transform">
              <i class="fa-solid fa-phone text-green-400"></i>
              <span data-en="Call Directly" data-hi="सीधे कॉल करें">Call Directly</span>
            </a>
            <button onclick="payDirectly('Ramesh')" class="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 rounded-xl py-2.5 text-sm font-semibold text-white active:scale-95 transition-transform">
              <i class="fa-solid fa-indian-rupee-sign"></i>
              <span data-en="Pay Directly" data-hi="सीधे भुगतान करें">Pay Directly</span>
            </button>
          </div>
        </div>
 
        <!-- Card 2 -->
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div class="flex items-start gap-3 mb-3">
            <div class="w-14 h-14 rounded-full bg-pink-900/50 border border-pink-700/50 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-spa text-pink-400 text-lg"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-white text-base">Sunita</h3>
                <span class="flex items-center gap-1 bg-green-950/50 text-green-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  <span data-en="Online" data-hi="ऑनलाइन">Online</span>
                </span>
              </div>
              <p class="text-xs text-gray-400" data-en="Beautician · 4.9" data-hi="ब्यूटीशियन · 4.9">Beautician · 4.9 <i class="fa-solid fa-star text-amber-400 text-[10px]"></i></p>
              <p class="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                <i class="fa-solid fa-location-dot"></i>
                <span data-en="2.5 km away · Boring Road, Patna" data-hi="2.5 किमी दूर · बोरिंग रोड, पटना">2.5 km away · Boring Road, Patna</span>
              </p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <a href="tel:+919876543211" class="flex items-center justify-center gap-2 bg-gray-800 border border-gray-700 rounded-xl py-2.5 text-sm font-semibold active:scale-95 transition-transform">
              <i class="fa-solid fa-phone text-green-400"></i>
              <span data-en="Call Directly" data-hi="सीधे कॉल करें">Call Directly</span>
            </a>
            <button onclick="payDirectly('Sunita')" class="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 rounded-xl py-2.5 text-sm font-semibold text-white active:scale-95 transition-transform">
              <i class="fa-solid fa-indian-rupee-sign"></i>
              <span data-en="Pay Directly" data-hi="सीधे भुगतान करें">Pay Directly</span>
            </button>
          </div>
        </div>
 
        <!-- Card 3 -->
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div class="flex items-start gap-3 mb-3">
            <div class="w-14 h-14 rounded-full bg-yellow-900/50 border border-yellow-700/50 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-bolt text-yellow-400 text-lg"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-white text-base">Anil</h3>
                <span class="flex items-center gap-1 bg-gray-800 text-gray-400 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                  <span class="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                  <span data-en="Busy" data-hi="व्यस्त">Busy</span>
                </span>
              </div>
              <p class="text-xs text-gray-400" data-en="Electrician · 4.6" data-hi="इलेक्ट्रीशियन · 4.6">Electrician · 4.6 <i class="fa-solid fa-star text-amber-400 text-[10px]"></i></p>
              <p class="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                <i class="fa-solid fa-location-dot"></i>
                <span data-en="3.8 km away · Rajendra Nagar, Patna" data-hi="3.8 किमी दूर · राजेंद्र नगर, पटना">3.8 km away · Rajendra Nagar, Patna</span>
              </p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <a href="tel:+919876543212" class="flex items-center justify-center gap-2 bg-gray-800 border border-gray-700 rounded-xl py-2.5 text-sm font-semibold active:scale-95 transition-transform">
              <i class="fa-solid fa-phone text-green-400"></i>
              <span data-en="Call Directly" data-hi="सीधे कॉल करें">Call Directly</span>
            </a>
            <button onclick="payDirectly('Anil')" class="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 rounded-xl py-2.5 text-sm font-semibold text-white active:scale-95 transition-transform">
              <i class="fa-solid fa-indian-rupee-sign"></i>
              <span data-en="Pay Directly" data-hi="सीधे भुगतान करें">Pay Directly</span>
            </button>
          </div>
        </div>
 
      </div>
 
      <p class="text-center text-[11px] text-gray-600 mt-5 flex items-center justify-center gap-1.5">
        <i class="fa-solid fa-shield-halved text-green-600"></i>
        <span data-en="Zero commission — 100% of your payment goes to the worker" data-hi="जीरो कमीशन — आपका पूरा भुगतान श्रमिक को जाता है">Zero commission — 100% of your payment goes to the worker</span>
      </p>
 
    </section>
 
  </main>
 
  <!-- Toast notification -->
  <div id="toast" class="fixed left-1/2 -translate-x-1/2 bottom-6 bg-white text-gray-900 text-sm font-medium px-5 py-2.5 rounded-full shadow-xl opacity-0 pointer-events-none transition-all duration-300 z-50 whitespace-nowrap">
  </div>
 
<script>
  // ============================================================
  // State
  // ============================================================
  let currentLang = 'en';   // 'en' | 'hi'
  let isOnline = false;     // worker's Go Online / Offline status
 
  // ============================================================
  // Tab switching — Worker view vs Customer view
  // ============================================================
  function switchTab(tab) {
    const workerView = document.getElementById('worker-view');
    const customerView = document.getElementById('customer-view');
    const workerBtn = document.getElementById('tab-worker-btn')
