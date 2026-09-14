import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const key = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const url = Deno.env.get('SUPABASE_URL')!;
  if (!key) return new Response('Server configuration missing', { status: 500 });
  const db = createClient(url, key);
  const { data: rows, error } = await db.rpc('claim_push_notifications', { p_limit: 50 });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  let sent = 0, failed = 0, disabled = 0;
  for (const row of rows || []) {
    const { data: devices } = await db.from('user_devices').select('id,push_token').eq('user_id', row.user_id).eq('provider', 'expo').eq('enabled', true);
    const messages = (devices || []).map((d: any) => ({ to: d.push_token, sound: 'default', title: row.title, body: row.body, data: row.data || {} }));
    if (!messages.length) {
      await db.from('push_notification_queue').update({ status: 'sent', processed_at: new Date().toISOString() }).eq('id', row.id);
      sent++; continue;
    }
    try {
      const r = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(messages) });
      const payload = await r.json().catch(() => null);
      if (!r.ok) throw new Error(JSON.stringify(payload || { status: r.status }));
      const tickets = Array.isArray(payload?.data) ? payload.data : [];
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered' && devices[i]?.id) {
          await db.from('user_devices').update({ enabled: false, updated_at: new Date().toISOString() }).eq('id', devices[i].id);
          disabled++;
        }
      }
      const ticketErrors = tickets.filter((t: any) => t?.status === 'error').length;
      if (ticketErrors === tickets.length && tickets.length > 0) throw new Error(`Expo rejected all ${tickets.length} notification ticket(s).`);
      await db.from('push_notification_queue').update({ status: 'sent', processed_at: new Date().toISOString(), last_error: ticketErrors ? `${ticketErrors} Expo ticket(s) returned errors.` : null }).eq('id', row.id);
      sent++;
    } catch (e: any) {
      await db.from('push_notification_queue').update({ status: row.attempts + 1 >= 5 ? 'failed' : 'pending', available_at: new Date(Date.now() + Math.min(60, row.attempts * 10 + 10) * 1000).toISOString(), last_error: String(e?.message || e) }).eq('id', row.id);
      failed++;
    }
  }
  return Response.json({ processed: (rows || []).length, sent, failed, disabled });
});
