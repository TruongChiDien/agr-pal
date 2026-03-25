# Phase 3: Enhance Create Work Day Page

**Priority:** High
**Status:** Pending
**Estimated effort:** 2-3 hours

## Context Links
- User flow: `docs/user-flow.md` → "Create Work Day"
- Current page: `src/app/(dashboard)/work-days/new/page.tsx` (date + notes only)
- Detail page: `src/app/(dashboard)/work-days/[id]/page.tsx` (server component, shows bookings + machines)
- Existing dialogs: `src/components/work-days/add-daily-booking-dialog.tsx`, `add-daily-machine-dialog.tsx`
- Actions: `src/actions/work-days.ts` → `createWorkDay`, `addDailyBooking`, `addDailyMachine`
- Schemas: `src/schemas/work-day.ts`

## Overview

Current `/work-days/new` only creates an empty WorkDay (date + notes). Per user flow, the creation page should also allow selecting bookings and adding machines with worker assignments **before** creation.

**Strategy decision:** Two viable approaches:

1. **Enhance new page to do everything in one submit** — Complex: requires new composite server action that creates WorkDay + DailyBookings + DailyMachines + DailyMachineWorkers in one transaction
2. **Two-step flow: create WorkDay first, then redirect to detail page for adding bookings/machines** — Simpler: reuses existing `addDailyBooking` and `addDailyMachine` actions

**Recommendation: Approach 2 (two-step)** — KISS principle. The detail page already has "Thêm Booking" and "Thêm Máy" buttons that work. Enhance the new page to:
- Create WorkDay
- On success, redirect to detail page where user can add bookings + machines

However, the user flow says "Choose booking from the list" on the creation page itself. So we do a **minimal enhancement**: allow selecting bookings during creation. Machine/worker assignment happens on the detail page after.

**Final approach: Hybrid** — Create WorkDay + attach selected bookings in one submit. Machine assignment on detail page.

## Key Insights

- `addDailyBooking` is a separate action — need a new composite action or call sequentially
- `createWorkDay` returns the new WorkDay ID — can chain `addDailyBooking` calls after
- The existing `AddDailyBookingDialog` fetches all bookings and filters by `PENDING_BILL` — we need similar logic but as inline multi-select (not a dialog)
- Bookings with status NEW or IN_PROGRESS are the targets per user flow

## Requirements

### Functional
- Date picker (existing, keep)
- Notes textarea (existing, keep)
- Multi-select list of bookings with status NEW or IN_PROGRESS
- Show customer name, land name, amount for each booking
- Submit creates WorkDay, then attaches selected bookings as DailyBookings
- Redirect to work-day detail page on success

### Non-functional
- Responsive layout
- Vietnamese labels
- Loading states during submission

## Architecture

```
/work-days/new/page.tsx (client)
  ├─ Date picker (existing)
  ├─ Notes textarea (existing)
  ├─ BookingMultiSelect (new inline component)
  │    └─ Fetches bookings via useBookings()
  │    └─ Filters: status IN (NEW, IN_PROGRESS)
  │    └─ Checkbox list with customer/land/amount
  └─ Submit button
       └─ 1. createWorkDay(date, notes)
       └─ 2. For each selected booking: addDailyBooking(workDayId, bookingId)
       └─ 3. router.push(`/work-days/${id}`)
```

## Related Code Files

### Files to modify:
- `src/app/(dashboard)/work-days/new/page.tsx` — Add booking selection UI + enhanced submit logic

### Files potentially to create:
- `src/components/work-days/booking-multi-select-for-work-day.tsx` — Reusable booking checkbox list (optional: could inline in page if < 200 lines)

### Existing files to leverage:
- `src/hooks/use-bookings.ts` — `useBookings()` fetches all bookings with relations
- `src/actions/work-days.ts` — `createWorkDay`, `addDailyBooking`
- `src/schemas/work-day.ts` — `createWorkDaySchema`

## Implementation Steps

1. **Create `src/components/work-days/booking-multi-select-for-work-day.tsx`**
   - Props: `selectedBookingIds: string[]`, `onSelectionChange: (ids: string[]) => void`
   - Fetch bookings via `useBookings()`
   - Filter: `status` in `[NEW, IN_PROGRESS]`
   - Render checkbox list with: customer name, land name, amount
   - "Select all" / "Deselect all" toggle
   - Show count: "X đơn hàng đã chọn"

2. **Enhance `src/app/(dashboard)/work-days/new/page.tsx`**
   - Add state: `selectedBookingIds: string[]`
   - Render `BookingMultiSelectForWorkDay` below notes
   - Update `onSubmit`:
     ```ts
     const result = await createWorkDay({ date, notes })
     if (result.success) {
       // Attach bookings sequentially
       for (const bookingId of selectedBookingIds) {
         await addDailyBooking(result.data.id, bookingId)
       }
       router.push(`/work-days/${result.data.id}`)
     }
     ```
   - Show loading state during multi-step submit

3. **Test flow:**
   - Create work day with 0 bookings → redirects to detail page
   - Create work day with 2+ bookings → redirects to detail with bookings shown
   - Verify bookings appear in the detail page's left panel

## UI Layout

```
┌──────────────────────────────────────────┐
│ Thêm ngày làm việc mới                  │
│ Bắt đầu quản lý công việc cho một ngày  │
├──────────────────────────────────────────┤
│ Ngày làm việc *                          │
│ [📅 Chọn ngày                        ]  │
│                                          │
│ Ghi chú                                 │
│ [                                     ]  │
│                                          │
│ Chọn đơn hàng (tùy chọn)        [Chọn ↕]│
│ ┌────────────────────────────────────┐   │
│ │ ☑ Nguyễn Văn A — Ruộng 1 — 5tr   │   │
│ │ ☑ Trần Thị B  — Ruộng 3 — 3tr    │   │
│ │ ☐ Lê Văn C    — Ruộng 2 — 8tr    │   │
│ └────────────────────────────────────┘   │
│ 2 đơn hàng đã chọn                      │
│                                          │
│ [Tạo ngày làm việc]  [Hủy]              │
└──────────────────────────────────────────┘
```

## Todo List

- [ ] Create `booking-multi-select-for-work-day.tsx` component
- [ ] Enhance `/work-days/new/page.tsx` with booking selection
- [ ] Update submit handler to chain `addDailyBooking` calls
- [ ] Add loading states for multi-step creation
- [ ] Test: create with 0, 1, 3 bookings
- [ ] Verify detail page shows attached bookings
- [ ] Run `npx tsc --noEmit`

## Success Criteria

- Creating a work day with selected bookings attaches them as DailyBookings
- Redirects to detail page showing the selected bookings
- User can then add machines from the detail page (existing functionality)
- No TS errors

## Risk Assessment

- **Sequential addDailyBooking calls:** If one fails mid-way, some bookings attached and some not. Mitigation: acceptable for MVP — user can add remaining from detail page. Future: composite server action with transaction.
- **Booking already linked to this date:** `DailyBooking` has `@@unique([work_day_id, booking_id])` — will error if duplicate. Mitigation: filter out bookings already linked (unlikely on fresh work day).

## Next Steps

After this phase, user goes to the work-day detail page to:
- Add machines via existing "Thêm Máy" button (with worker slot assignment)
- This completes the "Create Work Day" user flow
