"use client";

import { Lang, t } from "@/lib/i18n";

interface AvailabilityToggleProps {
  isAvailable: boolean;
  onToggle: () => void;
  lang: Lang;
}

export default function AvailabilityToggle({ isAvailable, onToggle, lang }: AvailabilityToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={isAvailable}
      className={[
        "w-full rounded-2xl px-5 py-4 flex items-center justify-between",
        "shadow-sm active:scale-[0.98] transition-all duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        isAvailable
          ? "bg-salgreen text-ricepaper focus-visible:outline-salgreen"
          : "bg-white text-ink border border-ink/15 focus-visible:outline-indigo",
      ].join(" ")}
    >
      <span className="flex items-center gap-3">
        <span
          className={[
            "h-3 w-3 rounded-full",
            isAvailable ? "bg-ricepaper animate-pulse" : "bg-ink/30",
          ].join(" ")}
          aria-hidden
        />
        <span className="text-left">
          <span className="block text-base font-bold">
            {isAvailable ? t(lang, "available_now") : t(lang, "unavailable")}
          </span>
          <span className={`block text-xs ${isAvailable ? "text-ricepaper/80" : "text-ink/50"}`}>
            {isAvailable ? t(lang, "tap_to_stop") : t(lang, "tap_to_go_live")}
          </span>
        </span>
      </span>
      <span className="text-2xl" aria-hidden>
        {isAvailable ? "📍" : "○"}
      </span>
    </button>
  );
}
