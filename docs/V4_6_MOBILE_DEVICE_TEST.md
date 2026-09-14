# Quick Repair v4.6 — Mobile Device Test

This release adds a dedicated `device-test` EAS profile for direct Android installation.

## Android

From the relevant app directory:

```bash
npm install
eas login
eas build --platform android --profile device-test
```

The profile uses `distribution: internal` and `android.buildType: apk`, so EAS produces an APK that can be installed directly on an Android device. EAS provides an install/download URL from the build page.

After installation, test:

1. Customer sign-in
2. Add property
3. Create normal request
4. Upload request photos
5. Emergency request path
6. Appointment selection
7. Customer job status
8. Customer chat
9. Technician sign-in
10. Technician job list/detail
11. Navigation/location permission
12. Before/after photos
13. Offline checklist/status change and later sync
14. Push notification tap/deep-link
15. Job completion

## Important

This repository does not contain real Supabase credentials, EAS project IDs, Google Maps keys, Apple credentials, or Expo tokens. They must be supplied through the appropriate EAS/CI secret or environment configuration. Never place service-role or secret keys in the mobile app.

## iPhone

For iPhone direct device testing, EAS internal distribution requires Apple ad hoc provisioning and registered device UDIDs. A simpler path for broader iPhone testing is TestFlight after a production build is uploaded to App Store Connect.

## Acceptance result

Record each test as PASS/FAIL and include the device model, OS version, app build number, timestamp, and any error message. Do not mark production-ready until the real staging backend and push/storage flows have passed on a physical device.
