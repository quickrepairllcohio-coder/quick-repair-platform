# Quick Repair v1.6 — Production Readiness

This release hardens the existing v1.5 foundation before public launch.

## Required environment split

Use separate Supabase projects/credentials for:
- development
- staging
- production

Never commit `.env` files, Stripe secret keys, Supabase secret/service keys, Twilio auth secrets, or Google server keys.

## Security checklist

- Enable RLS on every client-accessible table.
- Keep privileged operations in server-side RPCs/Edge Functions.
- Use least-privilege database grants.
- Use private Storage buckets for customer/job media.
- Validate file size/type at the upload boundary and again server-side.
- Verify Stripe webhook signatures.
- Add edge/WAF rate limits in addition to database throttling.
- Enable Sentry for client/server error monitoring without sending secrets or payment data.
- Review audit logs periodically.

## Operational checklist

Before production:
1. Apply migrations to staging.
2. Create test Customer, Dispatcher, Technician, Finance and Admin accounts.
3. Run the full request → dispatch → estimate → payment → completion flow.
4. Test RLS with each role.
5. Test failed payments and webhook retries.
6. Test offline/reconnect behavior on Technician mobile.
7. Test emergency escalation and manual dispatch fallback.
8. Verify backups and perform a restore drill.
9. Configure Sentry, logs and uptime monitoring.
10. Only then promote the same migration set to production.

## Important

The included database rate limiter is a second line of defense, not a replacement for an API gateway/WAF. Production traffic should have infrastructure-level limits as well.
