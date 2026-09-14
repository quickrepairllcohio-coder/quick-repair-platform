# Quick Repair v2.1 — Scheduling & Fleet Operations

Adds a first production-oriented scheduling foundation:
- weekly technician availability
- approved time off
- shifts
- conflict detection against jobs/time off
- secure schedule_job RPC for dispatcher/supervisor/admin roles
- daily technician schedule RPC
- technician schedule screen
- operations scheduling board
- candidate scoring foundation for dispatch

## Workflow
Request → Job → Technician → Time slot → Conflict check → Schedule → Technician daily schedule.

## Important
Scheduling uses explicit time slots and does not silently overwrite conflicts. `p_force=true` exists for authorized operational workflows but should be restricted further before production.

Route-aware distance is only a candidate-ranking foundation. Actual route ETA should continue to use the existing Google Routes integration before committing a high-priority route.
