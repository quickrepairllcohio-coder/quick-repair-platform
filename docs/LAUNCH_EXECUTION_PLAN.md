# Quick Repair — Launch Execution Plan

Status: Final Production Candidate → Launch execution

## Gate 1 — Environment
- [ ] Create separate Supabase staging and production projects
- [ ] Apply migrations to staging first
- [ ] Configure production secrets server-side
- [ ] Configure custom domain and HTTPS
- [ ] Configure Sentry/PostHog
- [ ] Configure Stripe test/live modes separately
- [ ] Configure Twilio messaging and consent controls
- [ ] Configure Google Maps/Routes restrictions

## Gate 2 — Security
- [ ] Run Supabase Security Advisor
- [ ] Verify RLS on every exposed table
- [ ] Verify staff role permissions
- [ ] Verify no secret keys in mobile/web bundles
- [ ] Test customer cannot read another customer's records
- [ ] Test technician cannot access unrelated jobs
- [ ] Test dispatcher/admin permissions by role
- [ ] Verify webhook signature and idempotency
- [ ] Verify audit events for privileged actions

## Gate 3 — End-to-End
1. Customer creates account
2. Adds property
3. Reports problem with media
4. Dispatcher receives request
5. Technician is selected
6. Appointment is scheduled
7. Estimate is created/approved
8. Payment is completed in test mode
9. Technician receives job
10. Technician checks in
11. Materials/labor are recorded
12. Change order is approved if needed
13. Job is completed
14. Invoice/payment reconciles
15. Tip/review/warranty are recorded
16. Ledger entries balance

## Gate 4 — Field Pilot
- Start with 10–30 real jobs in one operating area
- Use only verified technicians
- Review every emergency dispatch manually
- Reconcile every payment daily
- Review failed notifications and sync conflicts daily
- Track gross margin per completed job

## Gate 5 — Production Go/No-Go
Go only if:
- no P0/P1 defects are open
- payment reconciliation passes
- RLS tests pass
- emergency workflow has been exercised
- technician offline sync has been exercised
- customer cancellation/refund paths have been tested
- backups/recovery procedure is documented and tested
