# Quick Repair v3.0 — Go-Live Runbook

## What is complete in the codebase

- Customer request, emergency intake, estimates, invoices, payments foundation
- Technician workflow, completion, materials and job media foundation
- Dispatcher, scheduling, availability, shifts, time off and candidate ranking
- Technician skills, certifications, service areas and compliance checks
- Vendor expenses, procurement and inventory
- Finance/BI reports and operational health snapshots
- RBAC/RLS/security audit foundation
- Customer history, warranty, reviews and notifications
- Job chat and SMS integration foundation
- Production migration and release documentation

## Required before accepting real customers

1. Create separate Supabase **staging** and **production** projects.
2. Apply migrations to staging first; never edit production schema manually.
3. Run `supabase db lint` and `supabase test db` in staging.
4. Resolve every Security Advisor finding that is applicable to this application.
5. Enable SSL enforcement, MFA, network restrictions where appropriate, and production backups/PITR according to risk.
6. Configure Auth email confirmation and production SMTP.
7. Configure Storage buckets as private and create object-level policies for request/job media.
8. Configure Stripe live keys and signed webhook endpoint; perform a real test payment in live mode with a controlled test customer only.
9. Configure Twilio production credentials and verified sending number.
10. Configure Google Maps/Routes production credentials with API restrictions and billing limits.
11. Configure Sentry/PostHog and verify error/analytics events.
12. Create admin/dispatcher/finance/technician accounts and test least-privilege access.
13. Enter actual service catalog, price book, tax rules, emergency rules and compliance requirements.
14. Enter technician licenses/certifications and verify every document manually.
15. Run the acceptance scenarios in `docs/PRODUCTION_ACCEPTANCE_TESTS.md`.
16. Complete legal review: customer terms, privacy policy, cancellation/refund, warranty, contractor/technician agreements, insurance, local/state licensing requirements.
17. Run a controlled pilot with a small number of real jobs.
18. Only after pilot sign-off, enable public marketing.

## Environment variables

### Mobile/web client
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy anon key during transition)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Server/Edge Functions only
- `SUPABASE_SERVICE_ROLE_KEY` only if a legacy function still requires it
- `SUPABASE_SECRET_KEY` when migrating to the current secret-key model
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GOOGLE_MAPS_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `SENTRY_DSN`
- `POSTHOG_KEY`

Never place server secrets in Expo or browser bundles.

## Release gate

A release is **GO** only when:

- all database tests pass;
- Security Advisor has no unresolved critical/high findings;
- payment webhook is verified;
- storage policies are verified;
- role-based access tests pass;
- technician compliance blocks invalid assignments;
- a customer can complete request → estimate → schedule → payment → completion → review;
- a dispatcher can handle an emergency request;
- a technician can complete a job from a real phone;
- financial totals reconcile with payment provider records;
- backups/restore procedure has been tested;
- legal/insurance/licensing review is signed off.
