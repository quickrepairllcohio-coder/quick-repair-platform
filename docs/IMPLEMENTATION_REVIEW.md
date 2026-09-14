# Implementation Review — Recommendations Incorporated

The architecture review's recommendations were accepted with the following treatment:

| Recommendation | Decision | Implementation |
|---|---|---|
| Double-entry accounting | Yes | Ledger accounts/entries/lines + balanced posting RPC |
| Recurring subscriptions | Yes | Subscription plans/customer subscriptions; Stripe Billing adapter remains deployment work |
| Surge pricing | Controlled | Rule-based multiplier with auditability; customer disclosure required |
| Technician offline mode | Yes | Local sync queue foundation; production conflict/idempotency worker remains |
| CRM | Yes | Contacts, lifecycle, follow-up, tags |
| Marketing | Yes | Campaigns + recipients; consent/suppression still required before sending |
| Tipping | Yes | Job/customer/technician tip model |
| AI support | Yes, advisory | AI triage result schema; no autonomous safety decisions |
| Inventory forecasting | Yes, staged | Forecast table; forecasting worker/model is deployment phase |

## Strategic decisions

1. Do not start with microservices. Keep the current monorepo and Supabase architecture until traffic and team size justify decomposition.
2. Keep sensitive business logic server-side.
3. Use deterministic rules before ML for pricing, compliance and dispatch; AI assists intake and support rather than making irreversible decisions.
4. Pilot in a constrained Ohio service area before nationwide expansion.
5. Measure unit economics before scaling marketing spend.
