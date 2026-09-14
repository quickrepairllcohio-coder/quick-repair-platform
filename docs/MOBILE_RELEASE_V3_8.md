# Quick Repair v3.8 — Mobile Release Hardening

## Implemented in this release

### 1. Maps build configuration
- Customer and Technician now use `app.config.js` instead of static `app.json`.
- Android/iOS application IDs are defined.
- Google Maps keys are injected only at build time through environment variables.
- `react-native-maps` and `expo-location` are configured for both apps.
- Customer live-tracking screen uses Google Maps on Android and the native Apple Maps provider on iOS.

Expo documents that `react-native-maps` needs build-time Google Maps configuration for store binaries when Google Maps is used. Apple Maps on iOS does not require a Google key when the native Apple provider is used. citeturn0search0turn0search4

### 2. Push notifications
- Both apps register Expo push tokens after authentication.
- Tokens are stored through the secure `register_user_device()` RPC.
- `user_devices` has RLS and a unique `(user_id, push_token)` constraint.
- Technician app now includes the Expo Notifications plugin.
- Added a staff-only `send-expo-push` Edge Function foundation for sending Expo pushes.

Expo's current SDK 57 documentation says remote push notifications require a development/release build rather than Expo Go on Android. citeturn2search7

### 3. Technician offline UI
- Added an amber offline banner.
- Banner appears when network connectivity is unavailable.
- It also reports the number of queued local operations when connectivity returns.
- Existing `offlineSync` remains the source of queued operations.

## Required secrets / EAS environment

```text
GOOGLE_MAPS_ANDROID_API_KEY=
GOOGLE_MAPS_IOS_API_KEY=
EXPO_PROJECT_ID=
```

Never commit real API keys to Git. Restrict Google keys by Android package + SHA-1 and iOS bundle identifier.

## Important production limitation

This release does **not** claim that push notifications are fully automated for every business event. Device registration and a secure staff-only sender are implemented. The existing notification/event pipeline still needs event-specific wiring (new job, technician accepted, technician en route, technician arrived, estimate approved, payment received, etc.) and physical-device E2E testing.

## Important dependency blocker inherited from v3.7

The repository currently declares Expo SDK 57 while some React Native dependencies remain aligned to the older React Native 0.81 generation. Expo's SDK reference states SDK 57 targets React Native 0.86 and React 19.2.3. Before the production store build, run `npx expo install --fix` in each mobile app and commit the resolved compatible versions after typecheck and native build validation. citeturn1search0

Do not publish the app until this dependency alignment has passed an actual EAS Android and iOS build.
