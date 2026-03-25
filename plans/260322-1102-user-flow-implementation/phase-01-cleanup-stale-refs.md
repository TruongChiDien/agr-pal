# Phase 1: Cleanup Stale References

**Priority:** Low
**Status:** Pending
**Estimated effort:** 15 min

## Context Links
- Prisma schema: `prisma/schema.prisma`
- Worker detail page: `src/app/(dashboard)/workers/[id]/page.tsx`

## Overview

TS compiles clean (0 errors). Only 1 cosmetic stale reference found where `job_type?.service?.name` is accessed but `Job_Type` no longer has a `service` relation. This renders silently as empty string due to optional chaining — no runtime crash, but should be cleaned.

## Key Findings

After thorough grep, the original report of "multiple files referencing old Service model" is **outdated**. The refactor already cleaned most references. Only 1 cosmetic leftover remains.

## Related Code Files

### Files to modify:
- `src/app/(dashboard)/workers/[id]/page.tsx` (line 125)

### What to change:
1. **Line 125**: Remove `{item.job_type?.service?.name || ""}` — `Job_Type` has no `service` relation in the new schema
2. **Line 30**: Remove `service?: { name: string }` from the `WorkerWeightWithJobType` type alias

## Implementation Steps

1. Open `src/app/(dashboard)/workers/[id]/page.tsx`
2. In type `WorkerWeightWithJobType` (line 29-31), remove `& { service?: { name: string } }` from the `job_type` type
3. In the weightColumns render (line 123-126), remove the paragraph showing service name
4. Run `npx tsc --noEmit` to confirm clean compilation

## Todo List

- [ ] Remove stale `service` reference from worker detail page type
- [ ] Remove stale `service` display from weight columns
- [ ] Verify clean TS compilation

## Success Criteria

- `npx tsc --noEmit` still returns 0 errors
- Worker detail weight table no longer shows empty service line
