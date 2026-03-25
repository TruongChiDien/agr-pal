# Phase 4: Update Work Day Page

**Priority:** High
**Status:** Pending
**Estimated effort:** 3-4 hours

## Context Links
- User flow: `docs/user-flow.md` → "Update Work Day"
- Detail page: `src/app/(dashboard)/work-days/[id]/page.tsx` (server component, read-only)
- Actions: `src/actions/work-days.ts` — has `updateWorkDay` (notes only), `linkMachineToBooking`, `removeDailyBooking`, `removeDailyMachine`
- Schemas: `src/schemas/work-day.ts` — has `updateDailyBookingSchema`, `updateDailyMachineSchema`
- Prisma models: `DailyBooking.amount`, `DailyMachine.amount`, `DailyBookingMachine` (link table)

## Overview

The detail page (`/work-days/[id]`) is currently **read-only** (server component). Per user flow, at end of day the manager needs to:
1. Edit amounts on daily bookings (how much of each booking was done today)
2. Edit amounts on daily machines (how much each machine produced)
3. Link machines to bookings (trace-back)
4. Check balance: total booking amounts ≈ total machine amounts
5. Update booking status if completed

**Strategy:** Convert the detail page to support inline editing via client components, while keeping the initial data load server-side.

**Approach:** Add an "Chỉnh sửa" (Edit) button to the detail page header. When clicked, switch to edit mode showing inline inputs. This avoids creating a separate `/edit` route and keeps the UI unified.

## Key Insights

- `updateDailyBookingSchema` and `updateDailyMachineSchema` already exist in schemas
- **Missing server actions:** No `updateDailyBooking` or `updateDailyMachine` action exists — must create them
- `linkMachineToBooking` action already exists
- Balance check already rendered on detail page (green/red indicator)
- The detail page is a server component — need to extract the content into a client component wrapper

## Requirements

### Functional
1. **Edit button** in page header toggles edit mode
2. **Inline amount editing** for each DailyBooking card (input replaces static amount)
3. **Inline amount editing** for each DailyMachine card
4. **Link machine to booking**: dropdown or dialog on each DailyMachine card to associate with a DailyBooking
5. **Balance indicator** updates in real-time as amounts change
6. **Save button** persists all changes
7. **Booking status update**: if booking's total amount across all work days meets or exceeds its expected amount, prompt to mark as COMPLETED

### Non-functional
- Optimistic UI: show changes immediately, revert on error
- Vietnamese labels
- Responsive two-panel layout preserved

## Architecture

```
/work-days/[id]/page.tsx (server — data fetching)
  └─ WorkDayDetailClient (client — all interactivity)
       ├─ Header: title, date, edit toggle, save/cancel buttons
       ├─ BalanceIndicator (reacts to local state)
       ├─ DailyBookingsList
       │    └─ Each card: amount input (edit mode) or static display
       ├─ DailyMachinesList
       │    └─ Each card: amount input + booking link dropdown (edit mode)
       └─ AddDailyBookingDialog (existing)
       └─ AddDailyMachineDialog (existing)
```

## Related Code Files

### Files to create:
- `src/components/work-days/work-day-detail-client.tsx` — Client component wrapping all detail UI + edit mode
- `src/components/work-days/link-machine-to-booking-select.tsx` — Dropdown to link a DailyMachine to a DailyBooking

### Files to modify:
- `src/app/(dashboard)/work-days/[id]/page.tsx` — Simplify to data fetch + render `WorkDayDetailClient`
- `src/actions/work-days.ts` — Add `updateDailyBooking`, `updateDailyMachine`, `unlinkMachineFromBooking`
- `src/schemas/work-day.ts` — No changes needed (schemas already exist)

### Existing files to leverage:
- `src/components/work-days/add-daily-booking-dialog.tsx`
- `src/components/work-days/add-daily-machine-dialog.tsx`
- `src/components/work-days/delete-daily-item-button.tsx`

## Implementation Steps

### Step 1: Add missing server actions

Add to `src/actions/work-days.ts`:

```ts
export async function updateDailyBooking(
  workDayId: string,
  dailyBookingId: string,
  input: { amount?: number; notes?: string }
): Promise<Result<any>>

export async function updateDailyMachine(
  workDayId: string,
  dailyMachineId: string,
  input: { amount?: number; notes?: string }
): Promise<Result<any>>

export async function unlinkMachineFromBooking(
  workDayId: string,
  dailyBookingMachineId: string
): Promise<Result<void>>
```

Each validates input via existing schemas, updates via Prisma, revalidates path.

### Step 2: Create `work-day-detail-client.tsx`

This is the main component (~150-180 lines). Responsibilities:
- Receive `workDay` data as prop (pre-fetched by server parent)
- `editMode` boolean state
- Local state for edited amounts: `Map<dailyBookingId, number>` and `Map<dailyMachineId, number>`
- In view mode: render cards exactly as current server component does
- In edit mode: replace amount displays with `<Input type="number">`
- Save handler: call `updateDailyBooking` / `updateDailyMachine` for each changed item
- Cancel handler: reset local state to original values

**Modularization note:** If this exceeds 200 lines, split into:
- `work-day-detail-client.tsx` (orchestrator + header + balance)
- `daily-booking-card-editable.tsx` (single booking card with view/edit modes)
- `daily-machine-card-editable.tsx` (single machine card with view/edit modes)

### Step 3: Create `link-machine-to-booking-select.tsx`

Small component (~60 lines):
- Props: `dailyMachineId`, `availableDailyBookings`, `currentLinkedBookingIds`, `workDayId`
- Render a `<Select>` with available daily bookings as options
- On select: call `linkMachineToBooking(workDayId, dailyBookingId, dailyMachineId)`
- Show currently linked bookings as badges

### Step 4: Refactor `/work-days/[id]/page.tsx`

Convert from full server-rendered UI to thin server wrapper:

```tsx
export default async function WorkDayDetailPage({ params }) {
  const { id } = await params
  const workDay = await getWorkDay(id)
  if (!workDay) notFound()
  return <WorkDayDetailClient workDay={workDay} />
}
```

### Step 5: Test complete flow

1. Navigate to work day detail
2. Click "Chỉnh sửa"
3. Edit booking amounts
4. Edit machine amounts
5. Link a machine to a booking
6. Verify balance updates
7. Click "Cập nhật" to save
8. Verify amounts persisted on page refresh

## UI Layout (Edit Mode)

```
┌──────────────────────────────────────────────────┐
│ Ngày làm việc — 22/03/2026      [Hủy] [Cập nhật]│
├──────────────────────────────────────────────────┤
│ ┌─ Balance ─────────────────────────────────┐    │
│ │ Tổng booking: 5.000.000  Tổng máy: 5.000.000 │
│ │ Chênh lệch: Cân bằng ✓                    │   │
│ └────────────────────────────────────────────┘   │
│                                                  │
│ ┌─ Bookings ────────┐  ┌─ Máy móc ──────────┐   │
│ │ Nguyễn Văn A      │  │ Máy cắt lúa #1     │   │
│ │ Ruộng 1            │  │ Máy cắt lúa        │   │
│ │ Amount: [3000000_] │  │ Amount: [3000000_]  │   │
│ │ Máy: Máy cắt #1   │  │ Workers:            │   │
│ ├────────────────────┤  │  Tài xế: Trần B    │   │
│ │ Trần Thị B         │  │  Cột bao: Lê C     │   │
│ │ Ruộng 3            │  │ Booking: [Select ▾] │   │
│ │ Amount: [2000000_] │  │                     │   │
│ └────────────────────┘  └─────────────────────┘   │
│ [+ Thêm Booking]        [+ Thêm Máy]             │
└──────────────────────────────────────────────────┘
```

## Todo List

- [ ] Add `updateDailyBooking` server action
- [ ] Add `updateDailyMachine` server action
- [ ] Add `unlinkMachineFromBooking` server action
- [ ] Create `work-day-detail-client.tsx` with edit mode toggle
- [ ] Create `link-machine-to-booking-select.tsx`
- [ ] Refactor `work-days/[id]/page.tsx` to use client component
- [ ] Inline amount editing for daily bookings
- [ ] Inline amount editing for daily machines
- [ ] Machine-to-booking linking UI
- [ ] Real-time balance update in edit mode
- [ ] Save all changes on "Cập nhật" click
- [ ] Test: edit amounts, save, refresh — verify persistence
- [ ] Test: link machine to booking, verify in booking detail page
- [ ] Run `npx tsc --noEmit`

## Success Criteria

- Edit button toggles inline editing on detail page
- Amount changes for bookings and machines persist after save
- Machine-booking links are created and visible on both sides
- Balance indicator updates in real-time during editing
- All existing functionality (add/remove booking, add/remove machine) still works
- No TS errors

## Risk Assessment

- **Large component:** `work-day-detail-client.tsx` could exceed 200 lines. Mitigated by planned modularization into card sub-components.
- **Concurrent edits:** If multiple users edit same work day simultaneously. Not a concern — single admin system per requirements.
- **Partial save failure:** If some `updateDailyBooking` calls succeed and others fail. Mitigation: show toast with specific failure, user can retry. Future: batch update in single transaction.

## Security Considerations

- All server actions already call `requireAuth()`
- Input validated server-side via Zod schemas
- No new auth requirements
