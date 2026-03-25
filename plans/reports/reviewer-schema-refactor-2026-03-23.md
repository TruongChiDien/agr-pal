# Code Review: Job Type Schema Refactor
**Date:** 2026-03-23
**Scope:** `prisma/schema.prisma`, `prisma/seed.ts`, `src/actions/payroll.ts`, `src/actions/bookings.ts`, `src/components/work-days/add-daily-machine-dialog.tsx`, `src/components/payroll/job-worker-selector.tsx`

---

## Overall Verdict: APPROVED with 2 issues to address

Schema simplification is sound and well-executed. Relationships are consistent across schema, actions, and components. TypeScript types and Prisma include chains are correct. Two issues found: one **missing DB migration** (blocking) and one **cascade gap** (medium risk).

---

## Schema (`prisma/schema.prisma`) ✅

**Relationships — correct:**
- `Job_Type.machine_type_id → MachineType` with `onDelete: Cascade` — correct; deleting a MachineType cleans up job types automatically
- `DailyMachineWorker.job_type_id → Job_Type` (no cascade) — intentional; historical records must survive job type deletion
- `DailyMachineWorker.@@unique([daily_machine_id, worker_id])` — correct; one worker per machine per day
- `@@index([machine_type_id])` on `Job_Type` — good for query performance

**Fields — correct:**
- `applied_base` + `applied_weight` retained on `DailyMachineWorker` — snapshot pattern is correct (salary at time of assignment preserved even if job type default changes later)
- `payment_adjustment` retained — needed for ad-hoc wage corrections
- `Worker_Weight` removed — no longer needed given weight is snapshotted per assignment; removal is correct

**No issues found.**

---

## ⚠️ ISSUE 1 — Missing DB Migration (BLOCKING)

**Severity: High**

The `prisma/migrations/` directory contains the last migration `20260307080621_add_maintenance_tables`. There is **no migration for the Job Type schema refactor** (adding `machine_type_id` to `job_types`, dropping `slot_id` from `daily_machine_workers`, dropping `machine_type_slots` and `worker_weights` tables).

The `schema.prisma` is ahead of the applied migrations. Running `prisma migrate dev` is required, otherwise:
- Production deploy will fail or run on wrong schema
- `prisma generate` client may be inconsistent with DB state

**Action required:** Run `prisma migrate dev --name refactor-job-type-belongs-to-machine-type` to generate and apply the missing migration.

---

## Seed (`prisma/seed.ts`) ✅

- Embedded `job_types: { create: [...] }` within `machineType.create` — correct nested write syntax
- `include: { job_types: true }` to resolve IDs immediately — correct
- `jtCatLua_TaiXe` / `jtCatLua_CotBao` resolved via `.find()` with non-null assertion `!` — safe since the creates are guaranteed
- `applied_base: Number(jt.default_base_salary)` — correct, converts `Decimal` to JS number for Prisma input
- `applied_weight: 1.0` — correct default
- `machineTypeCay` job types (`Tài xế`, `Công phụ`) are created but not used in worker assignments — acceptable for seed data; only `machineTypeCatLua` has sample workers
- No leftover `slot_id` references

**One minor note:** `worker5` (`Hoàng Thị F`) is created but not assigned to any DailyMachineWorker in seed. Not a bug — intentional to populate workers list.

---

## Actions (`payroll.ts`) ✅

**Lines 103–148 (`listPayrolls` / `getPayroll`):**
```
daily_workers: { include: { job_type: true, daily_machine: { include: { machine_type: true, work_day: true } } } }
```
- `job_type: true` — correct, was previously `slot: { include: { job_type: true } }`; now direct FK, include chain is one level shallower ✅
- Wage calc: `applied_base * applied_weight` — correct, uses snapshot values not live job type

**`updatePayroll` (lines 283–390):**
- Transaction correctly disconnects old workers/advances before reconnecting — no double-linking risk ✅
- Re-fetches `updated` record after transaction — safe

**No issues found.**

---

## Actions (`bookings.ts`) ✅

**`getBooking` include chain (lines 97–130):**
```
workers: { include: { worker: true, job_type: true } }
```
- Direct `job_type: true` — correct ✅
- Chain: `booking → daily_bookings → machines → daily_machine → workers → job_type` — all valid relations per schema

**No issues found.**

---

## Actions (`work-days.ts` / `daily-machines.ts`) ✅ (bonus review)

`addDailyMachine` (work-days.ts L182–227) and `_createWorkerEntry` helper (daily-machines.ts L154–181):
- Both look up `job_Type.findUnique` to snapshot `default_base_salary` — correct pattern
- Error thrown if `jobType` not found — good guard
- `addMachineToDay` (daily-machines.ts) deduplicates via `findUnique` on `work_day_id_machine_id` unique index before creating — correct guard

`assignWorkerToSlot` function name still uses "Slot" in its name but references `job_type_id` internally. Cosmetic only — not a functional issue.

---

## Actions (`machine-types.ts`) ✅

- `deleteMachineType`: guards against linked machines but NOT against linked `DailyMachineWorker` records via job types
- However, `DailyMachineWorker.job_type_id` has **no cascade** and `Job_Type` has `onDelete: Cascade` from MachineType → this means deleting a MachineType would cascade-delete its job types, which would then **fail at DB level** if any `DailyMachineWorker` references those job types (FK constraint violation)

**This is correct behavior** — the DB will refuse the delete and Prisma will throw, which the try/catch returns as an error. But the error message returned to the user would be a raw Prisma error, not a human-readable one.

---

## ⚠️ ISSUE 2 — `deleteMachineType` Missing Guard for Active Job Type Usage (Medium)

**Severity: Medium / UX**

`machine-types.ts:63` only checks for linked `Machine` records. It doesn't check if any `Job_Type` belonging to this MachineType has `DailyMachineWorker` records.

**Current flow:**
1. User tries to delete MachineType with historical worker records
2. Check passes (no linked machines)
3. Prisma cascade deletes job types → FK constraint on `daily_machine_workers.job_type_id` fires → raw DB error

**Expected:** Same guard already exists in `deleteJobType` (line 145 checks `dailyMachineWorker.count`). `deleteMachineType` should similarly check `dailyMachineWorker.count` via the job types before attempting delete.

Suggested guard (already pattern-matches existing code):
```ts
const jobTypeIds = (await prisma.job_Type.findMany({
  where: { machine_type_id: id },
  select: { id: true }
})).map(jt => jt.id)

if (jobTypeIds.length > 0) {
  const inUse = await prisma.dailyMachineWorker.count({
    where: { job_type_id: { in: jobTypeIds } }
  })
  if (inUse > 0) {
    return { success: false, error: 'Không thể xóa loại máy có loại công việc đang được dùng trong nhật ký' }
  }
}
```

---

## Component (`add-daily-machine-dialog.tsx`) ✅

- `type MachineTypeWithJobTypes = { job_types: Job_Type[] }` — correctly typed with Prisma's `Job_Type`
- `(selectedMachine.machine_type as unknown as MachineTypeWithJobTypes).job_types` — `as unknown as` double cast is inelegant but necessary because `listMachines()` return type doesn't natively surface the nested include in TypeScript without inference. Functional.
- `jt.default_base_salary` used in display via `Number(jt.default_base_salary)` — correct `Decimal` → number conversion
- Empty state (`jobTypes.length === 0`) handled gracefully
- `assignments` keyed by `job_type_id` → `worker_id`, passed to `addDailyMachine` — matches action signature

**No issues found.**

---

## Component (`job-worker-selector.tsx`) ✅

- `job.job_type.name` — correct (was `job.slot.job_type.name`)
- `job.daily_machine.machine.name` — valid; `listPendingDailyWorkers` includes `daily_machine → machine`
- `job.daily_machine.work_day.date` — valid; `listPendingDailyWorkers` includes `work_day`
- `final_pay` computed client-side as `(applied_base * applied_weight) + payment_adjustment` — consistent with server-side wage calculation in `payroll.ts`
- `onLoaded` callback with `useEffect` — `onLoaded` not in dependency array; if parent passes inline function this could cause infinite re-renders. Low risk if parent uses `useCallback`, but worth noting.

---

## Summary Table

| Area | Status | Note |
|---|---|---|
| Schema relations | ✅ | Correct FK chain, cascade rules |
| DB Migration | ❌ | Missing migration for this refactor |
| Seed data | ✅ | Correct nested write, proper snapshots |
| payroll.ts include chains | ✅ | `job_type: true` correct |
| bookings.ts include chains | ✅ | `job_type: true` correct |
| deleteMachineType guard | ⚠️ | Missing job-type-in-use check |
| add-daily-machine-dialog | ✅ | Typed correctly, data flow valid |
| job-worker-selector | ✅ | Access path fixed, minor `onLoaded` dep risk |
| assignWorkerToSlot naming | ℹ️ | Stale name, cosmetic only |

---

## Unresolved Questions

1. **Migration strategy:** Is there existing prod data with old `slot_id` / `worker_weights` / `machine_type_slots` that needs a data migration script before the schema migration, or is this a fresh DB reset?
2. **`applied_weight` future use:** Still hardcoded to `1.0` in `addDailyMachine`. Is there a planned UI to set non-1.0 weights, or is this field being phased out? If the latter, it could be removed from schema to reduce surface area.
3. **`onLoaded` in `JobWorkerSelector`:** Does the parent wrap this callback in `useCallback`? If not, a subtle re-render loop may exist.
