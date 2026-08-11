// lib/i18n.ts
// Minimal dictionary-based i18n — no heavy library needed, keeps the
// bundle small for 3G/4G users. Extend per screen as the app grows.

export type Lang = "hi" | "bho" | "en";

export const LANG_LABELS: Record<Lang, string> = {
  hi: "हिंदी",
  bho: "भोजपुरी",
  en: "English",
};

export const strings: Record<Lang, Record<string, string>> = {
  hi: {
    greeting: "नमस्ते",
    available_now: "अभी काम के लिए उपलब्ध",
    unavailable: "अभी उपलब्ध नहीं",
    tap_to_go_live: "काम शुरू करने के लिए दबाएँ",
    tap_to_stop: "रोकने के लिए दबाएँ",
    todays_earnings: "आज की कमाई",
    direct_from_customers: "सीधे ग्राहकों से",
    basic_daily_amount: "न्यूनतम दैनिक राशि",
    topup_eligible: "टॉप-अप के योग्य राशि",
    target_label: "आज का लक्ष्य",
    hours_active: "घंटे सक्रिय",
    of_required_hours: "/ 8 घंटे ज़रूरी",
    wallet_balance: "वॉलेट बैलेंस",
    withdraw_now: "अभी निकालें (UPI)",
    kyc_pending_note: "टॉप-अप पाने के लिए KYC पूरा करें",
    topup_credited: "टॉप-अप जमा हो गया",
  },
  bho: {
    greeting: "प्रणाम",
    available_now: "अभीे काम खातिर तैयार बानी",
    unavailable: "अभी तैयार नइखीं",
    tap_to_go_live: "काम शुरू करे खातिर दबाईं",
    tap_to_stop: "रोके खातिर दबाईं",
    todays_earnings: "आज के कमाई",
    direct_from_customers: "सीधे ग्राहक से",
    basic_daily_amount: "कम से कम दिन भर के राशि",
    topup_eligible: "टॉप-अप खातिर राशि",
    target_label: "आज के लक्ष्य",
    hours_active: "घंटा सक्रिय",
    of_required_hours: "/ 8 घंटा जरूरी",
    wallet_balance: "वॉलेट बैलेंस",
    withdraw_now: "अभिए निकालीं (UPI)",
    kyc_pending_note: "टॉप-अप पावे खातिर KYC पूरा करीं",
    topup_credited: "टॉप-अप जमा हो गइल",
  },
  en: {
    greeting: "Namaste",
    available_now: "Available for work now",
    unavailable: "Not available right now",
    tap_to_go_live: "Tap to start taking jobs",
    tap_to_stop: "Tap to stop",
    todays_earnings: "Today's earnings",
    direct_from_customers: "Direct from customers",
    basic_daily_amount: "Basic Daily Amount",
    topup_eligible: "Top-up you're eligible for",
    target_label: "Today's target",
    hours_active: "Hours active",
    of_required_hours: "/ 8 hrs required",
    wallet_balance: "Wallet balance",
    withdraw_now: "Withdraw now (UPI)",
    kyc_pending_note: "Complete KYC to receive top-ups",
    topup_credited: "Top-up credited",
  },
};

export function t(lang: Lang, key: string): string {
  return strings[lang][key] ?? strings.en[key] ?? key;
}

export function formatRupees(paise: number): string {
  const rupees = Math.round(paise) / 100;
  return "₹" + rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
