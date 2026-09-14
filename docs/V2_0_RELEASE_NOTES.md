# v2.0 Release Notes

Procurement and inventory control is now part of the platform foundation.

Security note: exposed tables use RLS and the inventory summary view uses `security_invoker=true`. Supabase recommends RLS for exposed tables and security-invoker views where view-level access must follow underlying RLS policies.
