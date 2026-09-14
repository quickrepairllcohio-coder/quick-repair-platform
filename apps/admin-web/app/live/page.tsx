'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Location = { technician_id: string; job_id: string | null; latitude: number; longitude: number; accuracy: number | null; recorded_at: string }

export default function LivePage() {
  const [locations, setLocations] = useState<Location[]>([])

  async function load() {
    const { data } = await supabase
      .from('technician_locations')
      .select('technician_id,job_id,latitude,longitude,accuracy,recorded_at')
      .order('recorded_at', { ascending: false })
      .limit(100)
    setLocations((data ?? []) as Location[])
  }

  useEffect(() => {
    void load()
    const channel = supabase
      .channel('dispatcher:live', { config: { private: true } })
      .on('broadcast', { event: 'technician_location' }, () => void load())
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [])

  return (
    <main style={{ padding: 28, fontFamily: 'system-ui', maxWidth: 1200, margin: '0 auto' }}>
      <h1>Live Operations</h1>
      <p>Tracking foundation is active. Google Maps rendering is intentionally isolated to the next integration step.</p>
      <section style={{ border: '1px solid #ddd', borderRadius: 14, padding: 18 }}>
        {locations.length === 0 ? <p>No active location updates.</p> : locations.map((x, i) => (
          <div key={`${x.technician_id}-${x.recorded_at}-${i}`} style={{ padding: 12, borderTop: '1px solid #eee' }}>
            <strong>{x.technician_id.slice(0, 8)}…</strong> · Job {x.job_id?.slice(0, 8) ?? '—'} · {Number(x.latitude).toFixed(5)}, {Number(x.longitude).toFixed(5)} · {new Date(x.recorded_at).toLocaleTimeString()}
          </div>
        ))}
      </section>
    </main>
  )
}
