# Quick Repair Mobile UX v3.7

## Completed
- Customer request wizard: service → property → problem/urgency/budget → secure submission.
- Secure customer RPCs for property creation and request creation.
- Customer category cards and saved-home selection.
- Technician job detail redesigned around field workflow: schedule, address, chat, navigation, checklist progress, photos, completion report.
- Existing backend field names are preserved (`assigned_technician_id`, `scheduled_start`, `job_messages`, `technician_locations`).

## Important boundary
Photo capture is available in the technician UI, but production Storage upload still requires the final bucket/policy deployment and provider validation. No fake upload success is claimed.

## Next production validation
1. Apply migrations through the normal Supabase migration pipeline.
2. Run database lint/RLS tests against the linked staging project.
3. Install dependencies and run both mobile TypeScript checks.
4. Exercise customer request submission and technician completion in staging with real accounts.
