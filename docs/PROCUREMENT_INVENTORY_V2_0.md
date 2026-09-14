# Quick Repair v2.0 — Procurement & Inventory

This release adds the procurement/material-control foundation:

- Materials catalog with SKU, unit and reorder point.
- Purchase orders linked to vendors and optionally to jobs.
- Purchase order line items with ordered/received quantities.
- Inventory receipts and receipt line items.
- Inventory transactions for receipts, job issues, adjustments and returns.
- On-hand and reorder-point summary view.
- Staff-only procurement access through RLS and a role-checked purchase-order RPC.

## Intended workflow

Vendor → Purchase Order → Receive → Inventory → Issue to Job → Actual Material Cost

The database remains the source of truth. The client should never be trusted to set inventory balances directly; all inventory mutations should be implemented as server/RPC operations.
