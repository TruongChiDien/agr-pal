# User Flow Implementation Plan

**Created:** 2026-03-22
**Status:** Ready for implementation

## Summary

Implement remaining user flows per `docs/user-flow.md`. The codebase refactor from Service-based to date-centric model is mostly complete - TypeScript compiles clean with only minor cosmetic stale references. Focus is on missing UI features.

## Current State

- **TS compilation:** CLEAN (0 errors) - Service references already removed
- **Stale cosmetic refs:** 1 found (`workers/[id]/page.tsx` line 125: `item.job_type?.service?.name`)
- **No `use-work-days` hook exists** - work-day pages use server actions directly
- **No `src/components/machine-types/` dir exists** - needs creation

## Phases

| Phase | File | Status | Priority |
|-------|------|--------|----------|
| 1 | [phase-01-cleanup-stale-refs.md](./phase-01-cleanup-stale-refs.md) | Pending | Low |
| 2 | [phase-02-create-machine-type-dialog.md](./phase-02-create-machine-type-dialog.md) | Pending | High |
| 3 | [phase-03-enhance-create-work-day.md](./phase-03-enhance-create-work-day.md) | Pending | High |
| 4 | [phase-04-update-work-day-page.md](./phase-04-update-work-day-page.md) | Pending | High |

## Key Dependencies

- Phase 2 is independent - can start immediately
- Phase 3 depends on existing `addDailyBooking`, `addDailyMachine` server actions (already implemented)
- Phase 4 requires new server actions for `updateDailyBooking`, `updateDailyMachine`

## Already Working (No changes needed)

- Create Machine: dialog + action + hook all wired
- Create Worker: dialog + action + hook all wired
- Create Customer: dialog + action + hook all wired
- Create Booking: dialog on customer detail page
- Work Day Detail: server component showing bookings + machines + balance
