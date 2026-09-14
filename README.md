Quick Repair v4.6 — Production-Ready Build Package


> v3.7 Mobile UX update: customer request wizard + technician field job workflow.
# Quick Repair v1.7

Quick Repair is a TypeScript monorepo for customer service requests, dispatch, technician workflows, live tracking, estimates, billing, communication, home history, and operations.

## v1.7 focus

- Automated CI
- Database smoke tests
- RLS/test foundation
- Migration ordering verification
- Release verification script
- Staging → production deployment guidance
- Observability and Sentry rollout checklist

## Local verification

```bash
npm install --no-audit --no-fund
npm run preflight
npm run verify:release
npm run test:db
```

Do not place production secrets in source control.

## v1.8 — Financial & Business Intelligence
The admin Finance page is at `/finance`. It reads secured reporting RPCs for revenue, gross profit, AR, cost, job profitability, and other management KPIs. It also introduces `job_labor_entries` so profitability can include labor cost.

## v1.9 — Vendor & Expense Management
Adds vendors, job/company/overhead expenses, receipt metadata, secure expense creation, expense summary RPC, and Admin Expenses page.

## v2.0
Procurement & Inventory foundation is included. See `docs/PROCUREMENT_INVENTORY_V2_0.md`.

## v3.1 — Revenue & Resilience
- Double-entry ledger foundation
- Subscription/tipping foundation
- CRM and marketing foundation
- Technician offline sync foundation
- AI triage storage foundation
- Controlled emergency price rules
- Inventory forecast foundation
- Known v1.9 expense RPC bug fixed

See `docs/V3_1_REVENUE_RESILIENCE.md` and `docs/IMPLEMENTATION_REVIEW.md`.

## v3.2 Final Production Candidate
The project now includes final go-live controls for payment event idempotency, customer communication consent, offline technician sync, ledger source integrity, and a production go-live gate. See `docs/FINAL_GO_LIVE_V3_2.md`.

## v3.4 reconciliation
Before connecting production, run `bash scripts/check-migration-drift.sh`, then link the intended Supabase project and inspect `supabase db diff --linked`. See `docs/MIGRATION_DRIFT_RUNBOOK.md`.

## v4.2 — Staging E2E Integration
- Customer request wizard now supports optional multi-photo attachment (up to 6) and uploads request media to private Storage after request creation.
- Customer push notifications now route into the relevant job screen when a notification is tapped.
- Push token refresh is persisted through `register_user_device`.
- Push worker now inspects Expo tickets and disables `DeviceNotRegistered` devices instead of retrying dead tokens indefinitely.
- Added `docs/STAGING_E2E_V4_2.md` with end-to-end staging acceptance cases.
- Added `scripts/staging-e2e-check.sh` and `npm run staging:e2e-check`.

Local validation remains static/local only. A real staging Supabase project, EAS build, push provider, and physical-device run are still required before production release.

## v4.4 Store Release Readiness

Run:

```bash
npm run store:release-check
npm run release:check
```

The v4.4 release adds controlled EAS submit profiles and a store-readiness gate. External App Store/Play Console/EAS/Supabase credentials are intentionally not included.

## v4.6 — Mobile Device Test

A dedicated `device-test` profile is included for direct Android APK installation. See `docs/V4_6_MOBILE_DEVICE_TEST.md`.

Run `./scripts/mobile-device-build-check.sh` before starting the EAS build.

## v4.6 release validation boundary
The repository contains the v4.6 production hardening changes and deterministic direct dependency manifests. Full database reset/lint tests, TypeScript compilation, and EAS builds require installation of dependencies and/or external services and credentials; the package does not claim those external checks have been executed locally.
See `docs/BUILD_VALIDATION_STATUS.md`.
