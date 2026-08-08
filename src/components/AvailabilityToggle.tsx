import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AvailabilityToggle({ workerId, isAvailable, onChange }: { workerId: string; isAvailable: boolean; onChange?: (val: boolean)=>void }) {
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(isAvailable);

  async function toggle() {
    setLoading(true);
    const newVal = !value;
    const { error } = await supabase.from('workers').update({ is_available: newVal, updated_at: new Date().toISOString() }).eq('id', workerId);
    if (error) console.error(error);

    if (newVal) {
      await supabase.from('availability_logs').insert([{ worker_id: workerId, started_at: new Date().toISOString() }]);
      // Optionally update location
      if (navigator && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async pos => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          // update last_location as geojson
          await supabase.from('workers').update({ last_location: `SRID=4326;POINT(${lon} ${lat})` }).eq('id', workerId);
        });
      }
    } else {
      // call RPC to close last availability
      await supabase.rpc('close_last_availability', { p_worker_id: workerId });
    }

    setValue(newVal);
    setLoading(false);
    onChange?.(newVal);
  }

  return (
    <button onClick={toggle} disabled={loading} className={`w-full py-3 rounded-lg font-semibold ${value ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
      {loading ? '...' : value ? 'Available' : 'Go Available'}
    </button>
  );
}
