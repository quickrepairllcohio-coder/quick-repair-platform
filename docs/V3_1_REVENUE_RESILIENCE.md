# Quick Repair v3.1 — Revenue & Resilience

This release incorporates the next operational priorities identified during architecture review.

## Included
- Double-entry ledger foundation with balanced-entry enforcement.
- Subscription plan/customer subscription data model for Stripe Billing.
- Technician tipping data model.
- CRM contacts and lifecycle/follow-up foundation.
- Marketing campaign/recipient foundation for SMS/email/push.
- Technician offline sync queue foundation using device-local persistence.
- AI triage result storage for future server-side multimodal intake.
- Auditable price-rule multiplier foundation for emergency pricing.
- Inventory forecast storage foundation.
- Fix for the v1.9 expense RPC authentication-column bug.

## Guardrails
- Dynamic pricing must be disclosed before customer approval; do not use hidden surge pricing.
- Marketing must respect consent, unsubscribe and suppression rules.
- Ledger posting is restricted to finance/admin roles and requires balanced debits/credits.
- Offline synchronization must use idempotency keys in the final API workflow to prevent duplicate writes.
- AI triage is advisory only; safety-critical decisions remain human-controlled.

## Remaining production integration
Stripe subscription creation/webhooks, actual tip Checkout/PaymentIntent flow, CRM campaign workers, AI provider secrets/functions, offline conflict resolution, and inventory forecasting jobs must be connected in the production environment and tested end-to-end.
