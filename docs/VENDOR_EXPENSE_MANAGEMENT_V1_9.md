# Quick Repair v1.9 — Vendor & Expense Management

This release adds vendor and expense controls for job-costing and company overhead.

## Expense scopes
- `job`: directly attributable to a Job.
- `company`: general company expense.
- `overhead`: operating overhead not attributable to one Job.

## Rules
- Never duplicate an expense already represented by a job material record.
- Keep receipt path metadata private.
- A job expense must have a Job ID.
- Final tax filing remains separate from this operational expense report.

## Admin
Open `/expenses` in Admin Web. Finance/Admin/Supervisor roles can view the expense dashboard.
