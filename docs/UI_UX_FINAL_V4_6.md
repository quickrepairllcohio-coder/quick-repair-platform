# Quick Repair — Final UI/UX Direction v4.6

## Product goal
A modern, minimal service experience that is easy to understand on the first screen and consistent across Customer, Technician, and Admin surfaces.

## Design language
- Deep navy for primary actions and navigation.
- Teal for active/positive service states.
- Amber only for attention/warning states.
- Soft gray page backgrounds, white surfaces, and restrained borders.
- Large readable headings, 16px+ body copy, short labels, and one clear primary action per screen.
- 12–24px spacing scale, 12–24px corner radius, minimal shadows.

## Customer app
The home screen leads with one task: **Report a Problem**. Emergency service is visually distinct but secondary. Quick access uses simple cards for estimates, invoices, history, and notifications. Authentication uses the same visual language and explains what the user can do after sign-in.

## Technician app
The home screen prioritizes today's workload. Jobs use status chips, time, and an obvious Open Job action. The job screen follows the real field sequence: status → location/contact → checklist → photos → completion report. Offline state is visible without blocking field work.

## Admin web
The Admin workspace uses a persistent navigation sidebar, a lightweight sticky header, responsive content width, reusable cards/stat blocks, and consistent tables/badges. Mobile widths collapse the sidebar and preserve readable content. Login is intentionally separated from the operational shell.

## Accessibility and simplicity rules
- Do not rely on color alone to communicate status.
- Keep destructive/emergency actions visually explicit.
- Prefer plain-language labels over internal system terminology.
- Make primary actions large enough for touch targets.
- Keep loading, empty, success, and error states explicit.
- Use consistent icon + label patterns rather than icon-only controls for critical actions.

## Release note
The UI layer is source-reviewed and syntax-validated in this package. Full visual/device acceptance still requires running each app in its target environment and testing on representative Android/iOS/desktop screen sizes.
