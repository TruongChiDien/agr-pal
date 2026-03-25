# Phase 2: Create Machine Type Dialog

**Priority:** High
**Status:** Pending
**Estimated effort:** 1-2 hours

## Context Links
- User flow: `docs/user-flow.md` → "Create Machine Type"
- Existing page: `src/app/(dashboard)/machine-types/page.tsx` (server component, has button but no dialog)
- Server action: `src/actions/machine-types.ts` → `createMachineType` (fully implemented)
- Schema: `src/schemas/machine-type.ts` → `createMachineTypeSchema`
- Hook: `src/hooks/use-machine-types.ts` → `useCreateMachineType` (fully implemented)
- Job types action: `src/actions/machine-types.ts` → `listJobTypes`

## Overview

The "Thêm loại máy" button exists on `machine-types/page.tsx` but is not wired to any dialog. The backend (action, schema, hook) is 100% complete. Only the dialog component is missing.

**Challenge:** `machine-types/page.tsx` is a server component (uses `async function` + `await`). A dialog requires client-side state. Solution: create a client wrapper component that renders the button + dialog.

## Key Insights

- `createMachineType` action already supports nested slot creation:
  ```ts
  slots: [{ job_type_id: string, quantity: number }]
  ```
- `listJobTypes` returns all job types with machine_type_slots and worker_weight counts
- The page already fetches `jobTypes` — they can be passed as props to the dialog
- `useCreateMachineType` hook handles mutation + cache invalidation + toast

## Requirements

### Functional
- Dialog with fields: name (required), description (optional)
- Dynamic slot rows: each row = job_type select + quantity input
- Add/remove slot rows
- Job type dropdown populated from existing job types
- Submit calls `useCreateMachineType` → revalidates machine-types list
- Dialog closes on success

### Non-functional
- Vietnamese labels matching existing UI patterns
- Form validation via Zod (schema already exists)
- < 200 lines per file

## Architecture

```
machine-types/page.tsx (server)
  └─ MachineTypePageActions (client wrapper)
       └─ CreateMachineTypeDialog (client)
            ├─ Form: name, description
            └─ Dynamic slots array: [{job_type_id, quantity}]
```

## Related Code Files

### Files to create:
- `src/components/machine-types/create-machine-type-dialog.tsx` — Dialog with form
- `src/components/machine-types/machine-type-page-actions.tsx` — Client wrapper for page buttons

### Files to modify:
- `src/app/(dashboard)/machine-types/page.tsx` — Replace plain `<Button>` with `<MachineTypePageActions>`

## Implementation Steps

1. **Create `src/components/machine-types/create-machine-type-dialog.tsx`**
   - Props: `open`, `onOpenChange`
   - Use `react-hook-form` + `zodResolver(createMachineTypeSchema)`
   - `useFieldArray` for dynamic slots
   - Fetch job types via `useMachineTypes` or accept as props
   - Each slot row: `<Select>` for job_type_id + `<Input type="number">` for quantity + remove button
   - "Add slot" button
   - Submit via `useCreateMachineType` hook
   - On success: close dialog, reset form

2. **Create `src/components/machine-types/machine-type-page-actions.tsx`**
   - Client component (`"use client"`)
   - Renders "Thêm loại máy" button
   - Manages `open` state for CreateMachineTypeDialog
   - Optionally: also render "Thêm loại công việc" button for job type creation

3. **Update `src/app/(dashboard)/machine-types/page.tsx`**
   - Import `MachineTypePageActions`
   - Replace the plain `<Button>Thêm loại máy</Button>` with `<MachineTypePageActions />`
   - Keep server component — client wrapper handles interactivity

## Form Structure

```
┌──────────────────────────────────┐
│ Tạo loại máy mới                 │
├──────────────────────────────────┤
│ Tên loại máy *     [___________] │
│ Mô tả              [___________] │
│                                  │
│ Vị trí worker:                   │
│ ┌────────────────────────────┐   │
│ │ [Tài xế     ▾]  Qty: [1]  │ ✕ │
│ │ [Cột bao    ▾]  Qty: [2]  │ ✕ │
│ └────────────────────────────┘   │
│ [+ Thêm vị trí]                  │
│                                  │
│            [Hủy]  [Tạo loại máy] │
└──────────────────────────────────┘
```

## Todo List

- [ ] Create `create-machine-type-dialog.tsx` with form + dynamic slots
- [ ] Create `machine-type-page-actions.tsx` client wrapper
- [ ] Update `machine-types/page.tsx` to use client wrapper
- [ ] Test: create machine type with 0 slots
- [ ] Test: create machine type with 2+ slots
- [ ] Verify page refreshes/revalidates after creation

## Success Criteria

- "Thêm loại máy" button opens dialog
- Form validates: name required, slots optional but each slot needs job_type_id
- New machine type appears in list after creation without page reload
- `npx tsc --noEmit` passes clean

## Risk Assessment

- **Server component mixing:** Mitigated by client wrapper pattern (proven pattern in this codebase — see `CreateMachineDialog` used in machines page)
- **Job types not loaded:** If no job types exist, slot creation should show helpful empty state. Consider showing a message "Tạo loại công việc trước" with link.

## Security Considerations

- `createMachineType` action already calls `requireAuth()` — no additional auth needed
- Input validated server-side via Zod schema — client validation is UX only
