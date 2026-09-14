# Quick Repair v4.1 — Production Integration Hardening

## Completed
- Added idempotent technician offline operation IDs.
- Added secure server-side application of supported offline operations.
- Integrated technician checklist toggles with offline queue and automatic sync.
- Added push queue row claiming with PostgreSQL `FOR UPDATE SKIP LOCKED` to prevent duplicate workers from processing the same notification simultaneously.
- Preserved private Supabase Storage for job media.

## Supported offline operations
- `job_checklist_item / toggle`
- `job / status` for technician-safe statuses

## Important production requirements
1. Run migrations against staging first.
2. Run Supabase Security Advisor and RLS tests.
3. Configure `SUPABASE_SECRET_KEY` for the push queue Edge Function.
4. Configure a scheduled invocation for `process-push-queue`.
5. Test duplicate offline operations and reconnect behavior on physical Android/iOS devices.
6. Build preview binaries with EAS before production.

## Not claimed as complete in this environment
- Remote Supabase migration parity.
- Real EAS Android/iOS binaries.
- Physical-device push delivery.
- App Store / Google Play submission.
