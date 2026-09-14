# Quick Repair v3.5 — Staging Preflight

This release adds a deterministic local preflight before connecting to the real Supabase project.

## Run

```bash
./scripts/preflight.sh
```

## What it validates

- required production documents and test files
- shell script syntax
- JSON validity of workspace package manifests
- migration filename uniqueness and ordering
- obvious Stripe/private-key leakage in source files

## What it cannot validate locally

- remote Supabase schema drift
- real RLS behavior against the production project
- Stripe/Twilio/Google credentials
- push notification delivery
- real mobile devices
- domain/DNS/SSL
- legal, licensing, insurance, or business approvals

Those checks must be completed in a controlled staging/production environment.
