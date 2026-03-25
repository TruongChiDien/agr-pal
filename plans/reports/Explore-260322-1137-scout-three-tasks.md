# Scout Report: Three Major Tasks Analysis

**Date:** 2026-03-22  
**Project:** agr-pal (Agricultural Service Management System)  
**Scope:** Codebase analysis for 3 specific implementation tasks

---

## Task 1: Remove Worker_Weight Mechanism

### Current Implementation

**Database Schema (prisma/schema.prisma, lines 116-130):**
- `Worker_Weight` model: links worker → job_type with salary multiplier `weight` (Decimal 5,2)
- Unique constraint: `[worker_id, job_type_id]`
- Relations: Worker has `worker_weights`, Job_Type has `worker_weights`

**Server Actions (src/actions/workers.ts, lines 115-171):**
- `createWorkerWeight()` - Creates weight entry
- `updateWorkerWeight()` - Updates weight value
- `deleteWorkerWeight()` - Deletes weight entry
- All have revalidatePath to `/dashboard/workers`

**Hooks (src/hooks/use-workers.ts, lines 104-175):**
- `useCreateWorkerWeight()` - Create mutation
- `useUpdateWorkerWeight()` - Update mutation
- `useDeleteWorkerWeight()` - Delete mutation
- All invalidate `['workers']` query key

**UI Components:**
- `src/components/workers/worker-weight-dialog.tsx` (lines 1-211): Dialog for create/edit weight with dropdown job_type selector and weight input (0.1-5.0)
- `src/app/(dashboard)/workers/[id]/page.tsx` (lines 117-191): DataTable showing weights with columns:
  - Job Type name
  - Base salary (from job_type.default_base_salary)
  - Weight badge
  - Final salary calculation (base × weight)
  - Edit/Delete actions

**Usage in Daily Operations (src/actions/daily-machines.ts, lines 166-211):**
- `_createWorkerEntry()` function (lines 190-199): Fetches worker_weight from database using unique constraint `[worker_id, job_type_id]`
- Line 199: `const weight = applied_weight ?? (workerWeight ? Number(workerWeight.weight) : 1.0)`
  - Falls back to 1.0 if weight not found
  - Or uses provided `applied_weight` override
- Snapshot approach: `applied_weight` captured in DailyMachineWorker record (lines 206-207)

**Worker Detail Page Usage (src/app/(dashboard)/workers/[id]/page.tsx):**
- Lines 292-298: Calculates pending job wages using `applied_weight` from daily_workers
- Worker Weights Tab (lines 244-245): Shows count + list of weights
- Lines 348-367: Empty state if no weights, allows adding weights

### What Needs to Change

**1. Remove Model & Relations:**
- Delete `Worker_Weight` model from schema
- Remove `worker_weights` relation from Worker model
- Remove `worker_weights` relation from Job_Type model

**2. Database Schema Impact:**
- Job_Type.default_base_salary becomes the ONLY base salary (no per-worker multiplier)
- DailyMachineWorker still has `applied_weight` but it will always be 1.0 (or removed if weight concept dies entirely)
- No need for worker weight snapshots in DailyMachineWorker

**3. Server Actions to Remove:**
- `createWorkerWeight()` - DELETE
- `updateWorkerWeight()` - DELETE
- `deleteWorkerWeight()` - DELETE
- Update `_createWorkerEntry()` in daily-machines.ts: Remove weight lookup (line 190-199), always use 1.0 or remove field

**4. Hooks to Remove:**
- `useCreateWorkerWeight()` - DELETE
- `useUpdateWorkerWeight()` - DELETE
- `useDeleteWorkerWeight()` - DELETE

**5. UI Components to Remove:**
- `src/components/workers/worker-weight-dialog.tsx` - DELETE entire file
- Worker detail page "Loại CV" tab (lines 244-245, 336-368) - REMOVE tab or hide it

**6. Schemas to Update:**
- `src/schemas/worker.ts` - Remove `createWorkerWeightSchema`, `updateWorkerWeightSchema`

**7. Files to Create/Modify:**
- `prisma/schema.prisma` - Remove Worker_Weight model (20 lines)
- `src/actions/workers.ts` - Remove 3 CRUD functions (55 lines)
- `src/hooks/use-workers.ts` - Remove 3 hooks (70 lines)
- `src/schemas/worker.ts` - Remove 2 schemas
- `src/actions/daily-machines.ts` - Simplify `_createWorkerEntry()` (15 lines change)
- `src/app/(dashboard)/workers/[id]/page.tsx` - Remove weight tab (30 lines)
- DELETE: `src/components/workers/worker-weight-dialog.tsx` (211 lines)

### Risks & Considerations

1. **Data Loss**: Existing worker_weights data will be lost in migration
2. **Wage Calculation Simplification**: Final wage becomes `base_salary × quantity` (no per-worker multiplier)
3. **Applied Weight Field**: DailyMachineWorker.applied_weight becomes unused/misleading if kept
4. **Historical Data**: Old DailyMachineWorker records show 1.2× weight but no way to explain why
5. **Business Logic Change**: If business needs worker wage variations, must implement different approach (e.g., per-worker base salary)

### Migration Path

1. Backup existing weight data (if needed for historical reference)
2. Create migration: `prisma migrate create remove_worker_weight`
3. Remove model from schema
4. Delete all associated code/UI
5. Run migration + seed script
6. Update documentation

---

## Task 2: Create/Update Job Type Dialogs

### Current Implementation

**Server Actions Exist (src/actions/machine-types.ts, lines 164-217):**
- `createJobType(input)` - Line 164: Creates Job_Type with name + default_base_salary
- `updateJobType(id, input)` - Line 181: Updates name/salary
- `deleteJobType(id)` - Line 198: Deletes with safety check (must not be in use)
- `listJobTypes()` - Line 219: Fetches all with machine_type_slots + worker_weights count

**Schemas Exist (src/schemas/machine-type.ts, lines 37-45):**
```typescript
createJobTypeSchema = {
  name: string (min 1, max 200),
  default_base_salary: number (min 0)
}
updateJobTypeSchema = createJobTypeSchema.partial()
```

**Hooks MISSING:**
- No `useJobTypes()` hook
- No `useCreateJobType()` hook
- No `useUpdateJobType()` hook
- No `useDeleteJobType()` hook

**UI Status (src/app/(dashboard)/machine-types/page.tsx):**
- Lines 80-119: Job Type section displays read-only cards showing:
  - Job type name
  - Default base salary badge
  - Which machine types use it
  - Count of workers with this job type
- Line 88-91: "Thêm loại công việc" button EXISTS but is ORPHANED - doesn't do anything
- NO dialogs exist for create/edit/delete job types

**Related Components:**
- `src/components/workers/worker-weight-dialog.tsx` (lines 57, 152-156): Already imports `useJobTypes()` → looks for job types dropdown
  - But `useJobTypes()` hook doesn't exist yet!
  - Likely causing runtime error or silent failure

### What Needs to Create

**1. Create Hooks (src/hooks/use-machine-types.ts to update or new file):**
```typescript
useJobTypes() - Query to list job types
useCreateJobType() - Mutation for create
useUpdateJobType(id, data) - Mutation for update  
useDeleteJobType(id) - Mutation for delete
```

**2. Create UI Components:**
- `src/components/machine-types/job-type-create-dialog.tsx` - Dialog for creating job type
  - Fields: name (text), default_base_salary (currency input)
  - Submit button calls createJobType
- `src/components/machine-types/job-type-update-dialog.tsx` - Dialog for updating (or reuse create dialog with conditional)
  - Same fields, but pre-filled
  - Submit button calls updateJobType
- `src/components/machine-types/job-type-delete-dialog.tsx` - Confirmation dialog
  - Shows warning if used by machine types
  - Calls deleteJobType on confirm

**3. Update Page Component:**
- `src/app/(dashboard)/machine-types/page.tsx` (lines 80-119)
  - Replace orphaned button with functional "Thêm loại công việc" that opens create dialog
  - Add Edit button to each card
  - Add Delete button to each card
  - Handle state management for which job type is being edited

**4. Files to Modify:**
- `src/hooks/use-machine-types.ts` - Add 4 new hooks (80-100 lines)
- `src/app/(dashboard)/machine-types/page.tsx` - Add dialog state + handlers (30-40 lines)
- CREATE: `src/components/machine-types/job-type-dialog.tsx` (140-180 lines) - Combined create/edit dialog
- CREATE: `src/components/machine-types/job-type-delete-dialog.tsx` (60-80 lines)

### Current Issues Found

1. **Missing Hooks**: `useJobTypes()` referenced in worker-weight-dialog.tsx but doesn't exist
   - Will cause runtime error: "Cannot read property 'map' of undefined"
   - Location: worker-weight-dialog.tsx line 57: `const { data: jobTypes, isLoading: isLoadingJobTypes } = useJobTypes();`

2. **Orphaned Button**: Line 88-91 button has no onClick handler

### Implementation Order

1. Create hooks in `use-machine-types.ts`
2. Create dialog components
3. Update machine-types page.tsx
4. Test with worker-weight-dialog.tsx (will fix that UI too)

---

## Task 3: Organize All List Pages with DataTable Format

### Current State Analysis

**Pages Using DataTable (properly implemented):**
1. ✅ `src/app/(dashboard)/workers/page.tsx` (lines 1-273)
   - Uses DataTable with columns: name, phone, address, created_at, actions
   - Has search, sort, pagination, create/update/delete dialogs

2. ✅ `src/app/(dashboard)/machines/page.tsx` (lines 1-258)
   - Uses DataTable with columns: name, model, machine_type, status, purchase_date, actions
   - Has status badges, sort, pagination, create/update/delete dialogs

3. ✅ `src/app/(dashboard)/customers/page.tsx` (lines 1-275)
   - Uses DataTable with columns: name, phone, address, created_at, actions
   - Has search, sort, pagination, create/update/delete dialogs

**Pages NOT Using DataTable (need conversion):**

4. ❌ `src/app/(dashboard)/work-days/page.tsx` (lines 1-127)
   - **Current**: Grid of custom Card components (server-side rendering)
   - **Data**: WorkDays with count badges, status, amounts
   - **Issue**: No search, no sort, no pagination (all cards shown)
   - **Needed**: DataTable with columns: date, bookings count/amount, machines count/amount, status

5. ❌ `src/app/(dashboard)/bookings/page.tsx` (lines 1-17)
   - **Current**: Wrapper component using `<BookingList />` sub-component
   - **Issue**: BookingList implementation not shown (likely custom)
   - **Needed**: DataTable implementation or refactor BookingList to use DataTable

6. ❌ `src/app/(dashboard)/bills/page.tsx` (lines 1-17)
   - **Current**: Wrapper component using `<BillList />` sub-component
   - **Issue**: BillList implementation not shown
   - **Needed**: DataTable implementation or refactor BillList to use DataTable

7. ❌ `src/app/(dashboard)/payroll/page.tsx` (lines 1-15)
   - **Current**: Wrapper component using `<PayrollList />` sub-component
   - **Issue**: PayrollList implementation not shown
   - **Needed**: DataTable implementation or refactor PayrollList to use DataTable

8. ❌ `src/app/(dashboard)/services/page.tsx` (lines 1-127)
   - **Current**: Grid of custom Card components (client-side)
   - **Data**: Services with price badge, unit, machine types
   - **Issue**: No search, no sort, no pagination
   - **Needed**: DataTable with columns: name, price, unit, machine_types, actions

9. ❌ `src/app/(dashboard)/page.tsx` (dashboard/page.tsx) (lines 1-93)
   - **Current**: Stats cards + placeholder for recent activity
   - **Not applicable**: This is dashboard, not a list page
   - **Skip**: No change needed

**Machine Types Page Special Case:**
- `src/app/(dashboard)/machine-types/page.tsx` (lines 1-122)
  - Has TWO sections: Machine Types (grid cards) + Job Types (grid cards)
  - Could benefit from DataTable for both sections
  - But grid format shows hierarchical info (slots within machine type) - might need custom rendering

### Files That Need DataTable Conversion

| Page | Current | Target | Complexity |
|------|---------|--------|------------|
| work-days | Custom cards (SSR) | DataTable | Medium |
| bookings | BookingList component | DataTable (needs component refactor) | Medium |
| bills | BillList component | DataTable (needs component refactor) | Medium |
| payroll | PayrollList component | DataTable (needs component refactor) | Medium |
| services | Custom cards (CSR grid) | DataTable | Low |
| machine-types | Grid cards (both sections) | DataTable (or keep grid) | Medium |
| dashboard | Stats only | N/A | N/A |

### DataTable Reference

**Location**: `src/components/data-display/data-table/data-table.tsx`

**Interface:**
```typescript
interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
  getRowId?: (item: T) => string;
  viewMode?: "table" | "card";
  onViewModeChange?: (mode: "table" | "card") => void;
  renderCard?: (item: T) => React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}
```

### Implementation Strategy

**Phase 1: High-Priority Pages**
1. `work-days/page.tsx` - Replace card grid with DataTable
2. `services/page.tsx` - Replace card grid with DataTable

**Phase 2: Component-Based Pages (needs investigation)**
1. Examine `BookingList`, `BillList`, `PayrollList` components
2. Decide: Refactor to use DataTable or wrap them in page

**Phase 3: Optional Enhancement**
1. `machine-types/page.tsx` - Consider DataTable for both sections (or keep grid if hierarchy matters)

### Estimated Changes per Page

**work-days/page.tsx:**
- Lines to add: ~150 (DataTable config, columns, state management, sort/paginate logic)
- Lines to remove: ~90 (card grid rendering)
- Net: +60 lines

**services/page.tsx:**
- Lines to add: ~120
- Lines to remove: ~70
- Net: +50 lines

**bookings/page.tsx, bills/page.tsx, payroll/page.tsx:**
- Depends on BookingList/BillList/PayrollList implementation (not visible in scout)
- If they return raw data: Add DataTable wrapper (~100 lines)
- If they have complex UI: Refactor or extract data, add DataTable

### Benefits of Standardization

✅ Consistent UX across all list pages  
✅ Sort/pagination/search on all pages  
✅ Reduced code duplication  
✅ Easier maintenance (single DataTable component)  
✅ Better performance (pagination vs. all items)

### Risks

⚠️ Work-days page is SSR (server component) → Need to convert to client component for state management  
⚠️ Some pages have custom rendering needs (e.g., nested slots in machine types)  
⚠️ Card view might be preferred for mobile - DataTable may need responsive card mode  

---

## Summary

| Task | Scope | Complexity | Timeline | Impact |
|------|-------|-----------|----------|--------|
| **Remove Worker_Weight** | Delete model, actions, hooks, UI, 1 dialog component | Medium | 2-3 days | Schema change, data loss, business logic simplification |
| **Job Type Dialogs** | Create 4 hooks, 2 dialog components, update 1 page | Medium | 2-3 days | Fixes broken worker-weight-dialog, enables job type management |
| **DataTable Standardization** | Convert 5-6 pages, potentially refactor 3 list components | High | 4-5 days | UX consistency, better navigation, pagination everywhere |

---

## Unresolved Questions

1. **Worker_Weight Removal**: If weight mechanism removed, how should business handle varying worker rates?
   - Option A: Use per-worker base salary (new field on Worker)?
   - Option B: Always use job_type.default_base_salary (no variations)?
   - Option C: Implement inline wage overrides in DailyMachineWorker?

2. **Job Type Hooks**: Should hooks be added to `use-machine-types.ts` or new file `use-job-types.ts`?

3. **BookingList/BillList/PayrollList**: Are these components full implementations or placeholders?
   - Need to inspect files to decide DataTable integration strategy

4. **work-days Page SSR**: Should it convert to client component for sort/pagination?
   - Alternative: Implement search/sort on server side?

5. **Machine Types Grid**: Keep visual hierarchy or flatten to DataTable?
   - Grid shows slots inside machine type - DataTable loses this relationship

