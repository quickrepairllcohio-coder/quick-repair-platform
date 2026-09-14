# Quick Repair v1.8 — Financial & Business Intelligence

## Purpose
Turn operational data into owner/finance reporting without giving customers direct access to financial internals.

## KPIs
- Revenue from succeeded payments
- Open accounts receivable
- Completed jobs
- Material cost
- Labor cost
- Gross profit
- Gross margin
- Job profitability
- Technician performance
- Customer lifetime value
- Operational tax summary

## Cost model
Material cost comes from `job_materials` and labor cost comes from `job_labor_entries` (`hours * cost_rate`). Revenue for profitability is the completed Job total. This is an operational management model, not a final tax return or GAAP accounting ledger.

## Security
Finance functions are `SECURITY DEFINER` and check the application role before returning data. Keep service/secret keys server-side. Supabase recommends RLS for exposed tables and explicit grants plus RLS for Data API security.

## Next hardening
- Add accounting-period locks
- Add expense/vendor ledger
- Add payroll integration
- Add CSV export via server-side endpoint
- Add Ohio tax classification tables only after the company's actual tax registrations and federal classification are confirmed
