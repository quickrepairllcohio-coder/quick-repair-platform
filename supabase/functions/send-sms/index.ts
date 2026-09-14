import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const allowedRoles = new Set(['dispatcher', 'supervisor', 'admin', 'super_admin']);
const defaultOrigin = Deno.env.get('APP_ORIGIN') || 'http://localhost:3000';
const cors = {
  'Access-Control-Allow-Origin': defaultOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    const accessToken = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (!accessToken) return json({ error: 'Unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY');
    if (!supabaseUrl || !serviceKey) return json({ error: 'Server authentication is not configured' }, 500);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await admin.auth.getUser(accessToken);
    if (authError || !authData.user) return json({ error: 'Unauthorized' }, 401);

    const { data: profile, error: profileError } = await admin.from('users').select('role,status').eq('id', authData.user.id).maybeSingle();
    if (profileError || !profile || profile.status !== 'active' || !allowedRoles.has(profile.role)) {
      return json({ error: 'Forbidden' }, 403);
    }

    const { to, body } = await req.json();
    if (typeof to !== 'string' || typeof body !== 'string' || !to.trim() || !body.trim()) {
      return json({ error: 'to and body are required' }, 400);
    }
    if (to.length > 32 || body.length > 1600) return json({ error: 'SMS recipient or body is too long' }, 400);

    const { data: rateLimitOk, error: rateError } = await admin.rpc('check_sms_rate_limit', { p_user_id: authData.user.id });
    if (rateError || rateLimitOk !== true) return json({ error: 'SMS rate limit exceeded' }, 429);

    const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const token = Deno.env.get('TWILIO_AUTH_TOKEN');
    const from = Deno.env.get('TWILIO_FROM_NUMBER');
    if (!sid || !token || !from) return json({ error: 'Twilio secrets are not configured' }, 500);

    const form = new URLSearchParams({ To: to.trim(), From: from, Body: body.trim() });
    const auth = btoa(`${sid}:${token}`);
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    const data = await response.json();
    if (!response.ok) return json({ error: data?.message || 'Twilio request failed' }, 502);

    await admin.from('sms_send_audit').insert({ user_id: authData.user.id, destination: to.trim(), provider_message_id: data.sid, body_length: body.trim().length });
    return json({ ok: true, sid: data.sid });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 400);
  }
});
