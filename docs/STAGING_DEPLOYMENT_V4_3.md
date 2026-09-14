# Quick Repair v4.3 — Staging Deployment & Release Gate

## Purpose
v4.3 turns the v4.2 E2E acceptance plan into an explicit staging environment workflow. It adds a dedicated EAS `staging` build profile/channel and CI templates for the `develop` branch.

## Environment model
- `local` → developer/local Supabase
- `staging` → dedicated hosted Supabase project + EAS staging channel
- `production` → production Supabase project + EAS production channel

Keep Supabase projects separate by environment. Never put `SUPABASE_SECRET_KEY`, service-role keys, database passwords, Stripe secret keys, or other server secrets in mobile environment variables.

## Required staging secrets
Configure these as encrypted CI secrets:
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`

Configure EAS environment variables/credentials separately for the customer and technician apps:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PROJECT_ID`
- `GOOGLE_MAPS_ANDROID_API_KEY` when Android Google Maps is used
- `GOOGLE_MAPS_IOS_API_KEY` when iOS Google Maps provider is used

Server-only secrets belong in Supabase Edge Function secrets, not in the apps.

## Staging build commands
From the relevant workspace:

```bash
npm run build:customer:staging
npm run build:technician:staging
```

The staging profile uses internal distribution and the `staging` EAS Update channel. This keeps staging updates isolated from production.

## Database deployment
For a real staging project:

```bash
supabase link --project-ref "$SUPABASE_PROJECT_ID"
supabase db push
supabase migration list
```

The repository's migration files are the source of truth. Do not manually edit production/staging schema through the Dashboard once the release workflow is established.

## Acceptance order
1. `npm run staging:config-check`
2. `npm run staging:e2e-check`
3. Link staging Supabase project.
4. Apply migrations.
5. Deploy Edge Functions.
6. Install customer and technician staging builds.
7. Run E2E-01 through E2E-06 from `docs/STAGING_E2E_V4_2.md`.
8. Record pass/fail evidence.
9. Only then prepare a production build.

## Important limitation
This repository cannot prove remote Supabase/EAS/device behavior without the actual project references, credentials, and physical/test devices. v4.3 therefore provides the deployment gate and configuration, not a claim that the remote staging environment has already passed.
