# Quick Repair v4.4 — Store Release Readiness

## Scope
This release prepares the customer and technician apps for the final store/testing gate without pretending that external accounts or real builds have been completed.

### Added
- Production submit profiles in both `eas.json` files.
- Android production submission target defaults to the `internal` track for the first controlled release.
- Automated `scripts/store-release-check.sh` to verify identifiers, production profiles, and secret-boundary rules.
- Root commands:
  - `npm run store:release-check`
  - `npm run release:check`

## Required external setup
Before a real build/submission, configure:

1. Expo/EAS project IDs for both apps.
2. Apple Developer + App Store Connect credentials for the iOS customer and technician apps.
3. Google Play Console app records and Android signing credentials.
4. Supabase staging and production project refs/secrets.
5. Google Maps API keys with correct restrictions.
6. Push notification credentials/configuration.
7. Production privacy policy, terms, support contact, app icons, screenshots, store descriptions, age/content declarations, and data-safety/privacy disclosures.

## Release sequence
1. Run local/static release checks.
2. Build staging apps with the `staging` profile.
3. Install and test on physical Android/iOS devices.
4. Run Supabase migrations and Edge Functions in staging through CI/CD.
5. Complete customer -> dispatch -> technician -> completion E2E.
6. Fix all P0/P1 issues.
7. Create production builds with the `production` profile.
8. Submit Android to Play Internal Testing and iOS to TestFlight.
9. Complete store testing and approval checks.
10. Promote the approved build to public release.

## Important boundary
This artifact does not contain or invent Apple, Google, Expo, Supabase, Stripe, Twilio, or Maps credentials. No real store submission is claimed by this release.
