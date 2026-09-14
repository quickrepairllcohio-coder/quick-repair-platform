import { supabase } from './supabase'

export function subscribeToJobTracking(jobId: string, onLocation: (payload: unknown) => void) {
  const channel = supabase
    .channel(`job:${jobId}`, { config: { private: true } })
    .on('broadcast', { event: 'technician_location' }, ({ payload }) => onLocation(payload))
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
