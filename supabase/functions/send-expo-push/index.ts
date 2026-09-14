import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return new Response('Unauthorized', { status: 401 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) return new Response('Server configuration missing', { status: 500 });

  const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user } } = await caller.auth.getUser(token);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin','dispatcher','super_admin'].includes(profile.role)) return new Response('Forbidden', { status: 403 });

  const { user_id, title, body, data } = await req.json();
  if (!user_id || !title || !body) return new Response('user_id, title and body are required', { status: 400 });
  const { data: devices, error } = await admin.from('user_devices').select('push_token').eq('user_id', user_id).eq('provider','expo').eq('enabled',true);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const messages = (devices || []).map(d => ({ to: d.push_token, sound: 'default', title, body, data: data || {} }));
  if (!messages.length) return Response.json({ sent: 0 });
  const response = await fetch('https://exp.host/--/api/v2/push/send', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(messages) });
  const result = await response.json();
  return Response.json({ sent: messages.length, result }, { status: response.ok ? 200 : 502 });
});
