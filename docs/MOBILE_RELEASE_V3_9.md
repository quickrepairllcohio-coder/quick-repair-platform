# Quick Repair v3.9 — Production Mobile Build Hardening

## Scope

v3.9 is the mobile build-hardening step after v3.8. It aligns the two Expo mobile apps with Expo SDK 57, adds EAS build profiles, and adds a static mobile build gate.

## Dependency alignment

Expo SDK 57 targets React Native 0.86 and React 19.2.3. Both mobile apps now declare that pair. Expo SDK documentation recommends using the SDK-matched versions rather than mixing an older React Native release with SDK 57.

Key aligned packages include:
- expo ~57.0.0
- react 19.2.3
- react-native 0.86.0
- expo-router ~57.0.20
- react-native-maps 1.27.2
- expo-location ~57.0.16
- expo-notifications ~57.0.17
- expo-image-picker ~57.0.16

## EAS profiles

Each mobile app now has:
- development — development client/internal distribution
- preview — internal distribution
- production — production channel

EAS project IDs must be supplied through the real EAS/Expo project configuration. No production credentials are committed.

## Required staging actions

From each mobile app directory:

```bash
npx expo install --check
npx expo-doctor
npx eas build --platform android --profile preview
npx eas build --platform ios --profile preview
```

Then test on physical devices:
- authentication
- request creation
- push token registration
- foreground/background push
- maps
- technician location updates
- offline banner and queue
- job completion
- chat
- payment redirect

## Production build

Only after preview acceptance:

```bash
npx eas build --platform all --profile production
```

The EAS build service creates installable Android/iOS binaries and can manage signing credentials. Production secrets should be stored in EAS/Supabase/provider configuration, not in Git.

## Known environment gate

This repository does not contain the user's actual Expo/EAS project ID, Google Maps keys, Apple Developer credentials, Android signing credentials, or Supabase production credentials. Therefore this artifact does not claim that a cloud build or real-device E2E test has completed.
