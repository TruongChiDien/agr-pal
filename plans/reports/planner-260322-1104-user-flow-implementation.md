# Planner Report: User Flow Implementation

**Date:** 2026-03-22
**Plan:** `plans/260322-1102-user-flow-implementation/`

## Findings

### Critical Discovery: TS Errors Already Fixed

The original analysis reported 10 TypeScript errors referencing stale `Service` model. After running `npx tsc --noEmit` — **0 errors**. The refactor was already completed. Only 1 cosmetic stale reference remains (`workers/[id]/page.tsx` line 125: `job_type?.service?.name` renders as empty string via optional chaining).

### What's Already Implemented (verified working)

| Flow | Status | Location |
|------|--------|----------|
| Create Machine Type | ❌ Missing dialog | `machine-types/page.tsx` — button exists, no dialog |
| Create Machine | ✅ Working | `machines/page.tsx` → `CreateMachineDialog` |
| Create Service | ⚠️ No Service model in schema | Service removed in date-centric refactor |
| Create Worker | ✅ Working | `workers/page.tsx` → `CreateWorkerDialog` |
| Create Customer | ✅ Working | `customers/page.tsx` → `CreateCustomerDialog` |
| Create Booking | ✅ Working | `customers/[id]/page.tsx` → `CreateBookingDialog` |
| Create Work Day | ⚠️ Partial | Date+notes only — no booking selection |
| Update Work Day | ❌ Not implemented | Detail page is read-only |

### Backend Readiness

| Component | Action | Schema | Hook |
|-----------|--------|--------|------|
| MachineType | ✅ `createMachineType` with nested slots | ✅ `createMachineTypeSchema` | ✅ `useCreateMachineType` |
| WorkDay create | ✅ `createWorkDay` | ✅ `createWorkDaySchema` | None (uses action directly) |
| DailyBooking add | ✅ `addDailyBooking` | ✅ `addDailyBookingSchema` | None |
| DailyMachine add | ✅ `addDailyMachine` with worker snapshots | ✅ `addDailyMachineSchema` | None |
| DailyBooking update | ❌ Missing | ✅ Schema exists | None |
| DailyMachine update | ❌ Missing | ✅ Schema exists | None |
| Machine-Booking link | ✅ `linkMachineToBooking` | ✅ | None |

## Plan Summary

**4 phases, ~7 hours total estimated effort:**

1. **Cleanup stale refs** (15 min) — Remove 1 cosmetic `service` reference in worker detail
2. **Create Machine Type dialog** (1-2h) — New dialog component + client wrapper for server page
3. **Enhance Create Work Day** (2-3h) — Add booking multi-select to creation form, chain addDailyBooking calls
4. **Update Work Day page** (3-4h) — Convert detail page to support inline editing, add 3 new server actions

## Key Design Decisions

1. **Two-step work day creation** (Phase 3): Create WorkDay first, then attach bookings. Machine/worker assignment on detail page. KISS over single-transaction approach.
2. **Inline edit mode** (Phase 4): Toggle edit mode on detail page vs. separate `/edit` route. Reduces navigation complexity.
3. **Client wrapper pattern** (Phase 2): Machine types page stays server component; client wrapper handles dialog state. Proven pattern in codebase.

## Unresolved Questions

1. **"Create Service" user flow** — The schema no longer has a `Service` model (removed in date-centric refactor). Should this flow be dropped from the user-flow doc, or does the business need a Service catalog reintroduced? Needs product decision.
2. **Batch save vs. individual calls** (Phase 4) — Current plan calls `updateDailyBooking` per item sequentially. A single transaction endpoint would be more robust. Acceptable for MVP?
3. **Booking auto-completion** — When a booking's total across all work days matches its expected amount, should the system auto-set status to COMPLETED, or just prompt?
