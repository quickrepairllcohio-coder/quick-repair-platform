# Quick Repair v4.2 — Staging E2E Acceptance

## Goal
Validate the customer request → dispatch → technician execution → customer completion path in a real Supabase staging project and physical development/preview builds.

## Preconditions
- Staging Supabase project linked to the repository.
- All migrations applied in order.
- `quick-repair-media` private bucket exists.
- Edge Functions deployed: `process-push-queue`, `send-expo-push`.
- Expo project IDs, Android/iOS app identifiers, maps configuration, and push credentials configured.
- Test accounts exist for customer, technician, dispatcher/admin.

## E2E-01 Customer request
1. Sign in as customer.
2. Open Report a Problem.
3. Select a service and saved/new property.
4. Enter title, description, urgency, and optional budget.
5. Attach 1–2 photos.
6. Submit.
7. Verify a `service_requests` row exists for the customer.
8. Verify each photo appears in `request_media` and the private Storage object exists.

## E2E-02 Dispatcher assignment
1. Sign in as dispatcher.
2. Confirm the new request appears in the request/dispatch queue.
3. Assign an available technician.
4. Verify a push queue row is created for the technician.
5. Run the push worker and confirm the queue row becomes `sent`.
6. Confirm the technician receives the notification in a preview/development build.

## E2E-03 Technician execution
1. Open the assigned job from the notification.
2. Confirm address and job details.
3. Change status: `scheduled` → `en_route` → `in_progress`.
4. Toggle a checklist item while online.
5. Upload before/after photos.
6. Confirm photos appear in private Storage and `job_media`.
7. Temporarily disable network.
8. Toggle a checklist item and change job status.
9. Restore network and run/observe offline sync.
10. Verify the server applies each operation once using `client_operation_id` idempotency.

## E2E-04 Customer tracking and completion
1. Customer opens job tracking.
2. Verify technician assignment/status is visible.
3. Technician marks job completed.
4. Verify customer push notification is generated and routed to the job.
5. Verify the customer can open job chat/tracking from the notification.

## E2E-05 Push token lifecycle
1. Install the preview/development build.
2. Grant notifications.
3. Verify `user_devices` has an enabled Expo token.
4. Refresh/reissue the token if the platform does so and verify the row updates.
5. Simulate an invalid Expo token and confirm the push worker disables that device rather than retrying it forever.

## E2E-06 Security checks
- Customer cannot read another customer's request media.
- Technician cannot read another technician's offline queue.
- Staff can read operational media/queue only through the intended RLS policies.
- No secret/service-role key is bundled in mobile code.
- Storage remains private; media access is not based on public URLs.

## E2E-07 Release gate
All E2E cases above must pass before production. Supabase recommends staging load testing, RLS review, and version-controlled migrations before production. Production database changes should be delivered through migrations rather than Dashboard edits.
