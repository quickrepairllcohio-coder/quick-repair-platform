# Migration Drift Runbook

## Rule
The repository migrations are the source-controlled schema history. Do not edit an already-applied migration in place.

## Before production
1. Link the local Supabase CLI to the intended project.
2. Run `supabase db diff --linked` and inspect every change.
3. If the remote database contains an intentional change that is not represented locally, create a new numbered migration that reproduces it safely.
4. Run `supabase db reset` locally and then the full database test/lint suite.
5. Commit the migration and CI changes together.

## Important limitation
`supabase db pull` requires access to the actual remote project. This repository cannot truthfully claim that remote drift has been resolved without that access. The release therefore uses an explicit drift gate rather than silently overwriting the cloud database.

## Safe production sequence
- backup / PITR checkpoint
- inspect `db diff --linked`
- apply only reviewed migrations
- run smoke tests
- verify RLS and critical RPCs
- monitor logs
- never run a destructive reset against production
