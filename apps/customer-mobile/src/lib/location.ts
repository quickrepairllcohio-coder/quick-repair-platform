import { supabase } from './supabase'

export async function recordTechnicianLocation(
  jobId: string,
  latitude: number,
  longitude: number,
  accuracy?: number,
  speed?: number,
  heading?: number,
) {
  const { data, error } = await supabase.rpc('record_technician_location', {
    p_job_id: jobId,
    p_latitude: latitude,
    p_longitude: longitude,
    p_accuracy: accuracy ?? null,
    p_speed: speed ?? null,
    p_heading: heading ?? null,
  })
  if (error) throw error
  return data
}
