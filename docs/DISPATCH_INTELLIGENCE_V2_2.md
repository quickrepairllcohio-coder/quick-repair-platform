# Quick Repair v2.2 — Dispatch Intelligence

Adds technician certifications, service areas, and route-aware candidate ranking.

## Dispatch decision order
1. Verified service skill
2. Current certification/compliance signal
3. Service-area coverage
4. Slot availability / time-off / shift
5. Current GPS distance
6. Technician status and historical completion signal

The ranking is a recommendation only. Operations must still confirm licensing, safety, scope, and local requirements before assignment.

## Next hardening
- State/local license rules catalog
- Credential document verification workflow
- Geocoded service-area polygons
- Travel-time matrix from Google Routes API
- Auto-dispatch with human approval
- SLA/ETA monitoring
