# v3.4 Migration Reconciliation

This release addresses repository-level migration integrity and CI consistency.

- Adds an additive scheduling hardening migration (`202609130026_migration_reconciliation.sql`).
- Fixes technician mobile so the workspace participates in root `typecheck`.
- Removes stale package scripts from the root manifest.
- Makes CI independent of npm cache lockfile discovery until a committed lockfile is intentionally introduced.
- Adds `scripts/check-migration-drift.sh` and a production runbook.

A remote `db pull`/`db diff --linked` was **not** performed because this build environment has no authenticated connection to the user's Supabase project. No claim of cloud/local parity is made until that command is run against the real project.
