# Quick Repair v4.0 — Mobile Release Candidate

## Completed
- Private Supabase Storage bucket `quick-repair-media` with RLS policies.
- Technician before/after/material camera uploads now write to `job_media`.
- Customer request-media upload helper added for use by the request wizard.
- Device registration from v3.8 retained.
- Job assignment/status events now enqueue push notifications in `push_notification_queue`.
- Server-side `process-push-queue` Edge Function added with retry handling.
- Push sender prefers the current `SUPABASE_SECRET_KEY` configuration and keeps the legacy service key only as fallback.
- Expo/RN 0.86 / React 19.2.3 alignment retained.

## Important production boundary
The mobile apps never receive the Supabase secret key. Push queue processing must run from a trusted scheduler/worker. The Edge Function is ready, but a real production scheduler and Expo credentials must still be configured and tested.

## Verification performed
- Staging preflight: PASS
- Mobile build configuration check: PASS
- 27 migrations unique and ordered
- JSON/package checks: PASS
- ZIP integrity: PASS

## Still required before store release
1. Link the real Supabase project and run remote migration diff/lint/tests.
2. Configure EAS project IDs, Android/iOS identifiers, push credentials, and map keys.
3. Install dependencies in CI and run TypeScript checks.
4. Build preview Android/iOS binaries with EAS.
5. Test camera upload, push delivery, offline queue, payments, chat, tracking and emergency flow on physical devices.
6. Configure a trusted scheduler for `process-push-queue`.
7. Perform final security/RLS review and store compliance review.
