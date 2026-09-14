import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { origin, destination } = await req.json()
    if (!origin || !destination) return new Response(JSON.stringify({ error: 'origin and destination are required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    const key = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!key) return new Response(JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY is not configured' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline' },
      body: JSON.stringify({ origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } }, destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } }, travelMode: 'DRIVE', routingPreference: 'TRAFFIC_AWARE', computeAlternativeRoutes: false, languageCode: 'en-US', units: 'IMPERIAL' })
    })
    const data = await response.json()
    return new Response(JSON.stringify(data), { status: response.status, headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
