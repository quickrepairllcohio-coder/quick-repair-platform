# Quick Repair v3.2 — Final Go-Live Plan

## Release status
This release is the final **production candidate**, not a claim that third-party accounts or legal approvals are complete.

## Implemented controls
- Enterprise FSM multi-app structure
- Customer, technician, dispatcher and admin workflows
- Scheduling, availability, dispatch intelligence and compliance foundation
- Billing, estimates, invoices, payments foundation
- Double-entry ledger foundation with balanced-entry enforcement
- Procurement, inventory and expenses
- CRM, campaigns and customer consent records
- Offline technician sync queue and server acknowledgement
- AI triage data contract
- Dynamic pricing rules
- Payment webhook idempotency storage
- Audit/RBAC/security hardening foundations

## Required before real customer launch
1. Create separate Supabase staging and production projects.
2. Apply migrations to staging and run DB lint/RLS tests.
3. Configure production secrets only on server-side/Edge Functions.
4. Connect Stripe live mode and verify signed webhooks.
5. Connect Google Maps/Routes, Twilio and push notification credentials.
6. Configure Storage buckets and media access policies.
7. Configure Sentry/PostHog and alerting.
8. Configure domain, TLS and production redirect URLs.
9. Create real staff accounts and verify least-privilege roles.
10. Enter technician licenses, certifications, insurance and service areas.
11. Obtain/verify applicable Ohio/local licenses, permits and insurance.
12. Publish customer Terms, Privacy Policy, cancellation/refund policy and warranty terms.
13. Run the end-to-end acceptance test with test cards and test SMS/push.
14. Run 10–30 controlled pilot jobs before public advertising.
15. Reconcile every pilot payment against invoices and the ledger.

## Operational launch gate
A launch is approved only when:
- zero critical security findings remain;
- all RLS tests pass;
- payment webhook retries are idempotent;
- technician offline sync has been tested with duplicate/reordered events;
- emergency dispatch has a documented human escalation path;
- every production technician has required credentials;
- real customer payment/refund/invoice flows pass;
- backups and recovery have been verified;
- support ownership and incident response are documented.

## Recommended rollout
**Pilot:** one Ohio service area → controlled jobs → fix defects → expand coverage.

Do not start nationwide marketplace operations until the core Quick Repair service workflow is profitable and reliable.
