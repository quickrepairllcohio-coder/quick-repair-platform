# Quick Repair v1.7 — Automated Testing & Deployment

## Required environments

Use separate Supabase projects for development, staging, and production.
Never reuse a production database for local testing.

## CI gates

Every pull request should pass:
1. `npm ci`
2. TypeScript typecheck
3. Migration ordering check
4. Local Supabase reset
5. `supabase db lint`
6. `supabase test db`

## Release flow

`feature/*` → Pull Request → CI → `develop`/staging → manual acceptance → `main`/production.

Production migrations should be applied only after staging acceptance and a verified backup.

## Secrets

Store Supabase, Stripe, Google Maps, Twilio and Sentry secrets in the deployment provider's secret store. Never commit `.env` files or provider secret keys.

## Observability

The application should send unexpected client/server exceptions to Sentry in staging and production. Keep PII out of error messages and breadcrumbs whenever possible.

## Pilot release checklist

- [ ] Production Supabase project created
- [ ] RLS smoke tests pass
- [ ] Stripe webhook endpoint configured
- [ ] Google Maps restrictions configured
- [ ] Twilio sender verified
- [ ] Sentry project configured
- [ ] Backups verified
- [ ] Restore drill completed
- [ ] Emergency escalation policy approved
- [ ] Customer Terms / Privacy / Cancellation / Warranty reviewed by counsel
