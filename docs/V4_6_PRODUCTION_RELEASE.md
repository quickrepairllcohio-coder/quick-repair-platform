# Quick Repair v4.6 — Production Release

This release consolidates the v4.6 production hardening for staging and release builds.

## Included fixes
- Migration 022 now reconciles the v2.2 legacy certification/service-area schema before v3.0 indexes/functions use normalized fields.
- Final migration 031 enforces Ohio scheduling in `America/New_York`, server-side technician availability, compliance and service-area checks, and audited dispatch overrides.
- Technician status transitions are server-side enforced and available from the Technician app: En Route → Arrived → Start Job.
- Technician GPS tracking starts for active jobs, supports background updates in standalone builds, and customer tracking is filtered to the specific job.
- Offline status replay follows the same transition rules as online operations.
- SMS sending is JWT-protected, role-protected, audited and rate-limited.
- Dependency manifests are pinned and the Technician app now has a TypeScript config.

## Required verification before production
```bash
npm install --no-audit --no-fund
npm run preflight
npm run typecheck
npm run verify:release
npm run db:lint
npm run test:db
npm run store:release-check
```

## Android test APK
Use `BUILD-APK-WINDOWS.bat` or `BUILD-APK-WINDOWS-DEBUG.bat`. The builder uses EAS CLI 24.3.0 and the `device-test` profile.

## External configuration
Set the Supabase public URL/key, Expo/EAS project IDs, Google Maps keys, and production provider secrets in their appropriate hosting/EAS environments. No production secrets are bundled in this archive.

## Runtime requirement
Expo SDK 57 requires Node.js 22.13.x or newer; the repository pins the supported Node major range in `package.json` and the Windows builders enforce the same minimum.
