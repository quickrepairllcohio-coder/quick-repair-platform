# Production Acceptance Tests

## Customer
1. Sign up and confirm email.
2. Add a property.
3. Submit normal request with photo.
4. Submit emergency request and verify emergency queue behavior.
5. Receive estimate and approve it.
6. Pay through Stripe.
7. Receive appointment and technician updates.
8. Track technician/job status.
9. Chat with technician.
10. Review completed job and see warranty/history.

## Dispatcher
1. See new request.
2. Review customer/property/media.
3. Create/approve estimate workflow.
4. See technician candidates.
5. Verify compliance status.
6. Schedule without conflict.
7. Attempt a conflict and verify block.
8. Assign/reassign technician.
9. Monitor active jobs and live location.

## Technician
1. Sign in.
2. See daily schedule.
3. Open job and navigate.
4. Check in.
5. Add materials and photos.
6. Send customer message.
7. Record completion notes.
8. Complete checklist.
9. Check out.
10. Verify job completion, invoice and warranty.

## Finance
1. Create vendor.
2. Record expense.
3. Receive purchase order inventory.
4. Issue material to job.
5. Reconcile invoice/payment.
6. Verify profitability and tax-summary reports.

## Security
- Customer cannot read another customer's property, request, invoice, job or media.
- Technician cannot modify another technician's schedule.
- Technician cannot bypass compliance requirements.
- Finance cannot change admin roles.
- Admin actions are auditable.
- Anonymous users cannot access protected tables/RPCs.
