# Mobile UI review — v3.6

## Decision
The visual direction in the supplied text is approved with corrections. React Native Paper + MD3 is suitable for a professional, consistent customer/technician experience.

## Applied
- Shared Quick Repair brand theme: deep navy, teal, amber, restrained error red.
- Safe-area handling on both mobile apps.
- Material 3 PaperProvider on both apps.
- Customer home redesigned around a primary “Report a Problem” action, emergency action, quick-access cards, and clearer hierarchy.
- Technician home redesigned around daily workload, online state, job cards, status chips, and a clear job entry point.
- Rounded cards, spacing, typography, and accessible contrast are standardized.

## Important corrections from the supplied snippets
The following snippets should NOT be copied verbatim into production:
- Technician job query used `technician_id` and `scheduled_time`; the current schema uses `assigned_technician_id` and `scheduled_start`/`scheduled_end`.
- Chat examples referenced a `messages` table and direct inserts; the current platform uses `job_messages` and the secure chat RPCs. Direct inserts should not replace the existing authorization model.
- Tracking examples referenced `latitude`/`longitude`; the current location model uses the established location fields/RPC and should remain behind that secure interface.
- The sample login handler navigated before real authentication; production login must wait for Supabase Auth success.
- The sample root layout mixed customer routes into technician navigation; v3.6 keeps the two apps isolated.

## Not claimed complete
This is a UI/UX improvement release, not proof of production readiness. Real device testing, accessibility testing, Storage media upload, live provider testing, and Supabase remote migration verification remain required.
