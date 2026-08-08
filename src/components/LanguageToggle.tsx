import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LanguageToggle({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  return (
    <div className="flex gap-2">
      <button onClick={() => setLang('en')} className={`px-2 py-1 rounded ${lang === 'en' ? 'bg-gray-200' : ''}`}>EN</button>
      <button onClick={() => setLang('hi')} className={`px-2 py-1 rounded ${lang === 'hi' ? 'bg-gray-200' : ''}`}>HI</button>
      <button onClick={() => setLang('bho')} className={`px-2 py-1 rounded ${lang === 'bho' ? 'bg-gray-200' : ''}`}>BHO</button>
    </div>
  );
}
