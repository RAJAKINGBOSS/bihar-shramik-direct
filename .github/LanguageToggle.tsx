"use client";

import { Lang, LANG_LABELS } from "@/lib/i18n";

interface LanguageToggleProps {
  lang: Lang;
  onChange: (lang: Lang) => void;
}

const ORDER: Lang[] = ["hi", "bho", "en"];

export default function LanguageToggle({ lang, onChange }: LanguageToggleProps) {
  return (
    <div className="inline-flex rounded-full bg-white border border-ink/15 p-1 text-sm">
      {ORDER.map((code) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          aria-pressed={lang === code}
          className={[
            "px-3 py-1 rounded-full transition-colors duration-150",
            lang === code ? "bg-indigo text-ricepaper font-semibold" : "text-ink/70",
          ].join(" ")}
        >
          {LANG_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
