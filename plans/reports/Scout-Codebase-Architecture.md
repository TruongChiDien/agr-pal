# Scout Report: agr-pal Codebase Architecture

**Date:** 2026-03-23  
**Project:** agr-pal (Agricultural Service Management System)  
**Scope:** Complete frontend architecture & component inventory

---

## 1. Page Routes (`src/app/`)

### Root & Auth
- **`/` (root)** → Redirects to `/dashboard` (server-side)
- **`/login`** (protected) → Login form (NextAuth credentials), displays default credentials (admin@agrpal.local / admin123)

### Dashboard & Main Routes (Auth-Protected via Server Component)
All routes under `(dashboard)` check session; redirect to `/login` if unauthenticated.

| Route | Component | Type | Protected |
|-------|-----------|------|-----------|
| `/dashboard` | DashboardLayout wrapper + page.tsx | Server | ✅ Session check |
| `/work-days` | page.tsx | Client | ✅ Via layout |
| `/work-days/[id]` | Detail page | Client | ✅ Via layout |
| `/work-days/new` | Creation page | Client | ✅ Via layout |
| `/bookings` | page.tsx | Client | ✅ Via layout |
| `/bookings/[id]` | Detail page | Client | ✅ Via layout |
| `/services` | page.tsx | Client | ✅ Via layout |
| `/customers` | page.tsx | Client | ✅ Via layout |
| `/customers/[id]` | Detail page | Client | ✅ Via layout |
| `/workers` | page.tsx | Client | ✅ Via layout |
| `/workers/[id]` | Detail page | Client | ✅ Via layout |
| `/bills` | page.tsx | Client | ✅ Via layout |
| `/bills/[id]` | Detail page | Client | ✅ Via layout |
| `/payroll` | page.tsx | Client | ✅ Via layout |
| `/payroll/[id]` | Detail page | Client | ✅ Via layout |
| `/machines` | page.tsx | Client | ✅ Via layout |
| `/machines/[id]` | Detail page | Client | ✅ Via layout |
| `/machines/new` | Creation page | Client | ✅ Via layout |
| `/machine-types` | page.tsx | Client | ✅ Via layout |

### API Routes
- **`/api/auth/[...nextauth]`** → NextAuth handlers (GET/POST)
- **`/api/setup-admin`** → Admin initialization endpoint
- **`/api/advances`** → Worker advances API

---

## 2. Layout System (`src/components/layout/`)

### AppShell (Main Container)
- **Component:** `app-shell.tsx`
- **Props:** `{ children, className?, user? }`
- **Structure:** Fixed sidebar (64/256px) + sticky header + flex main content
- **Client-side:** State management for sidebar collapse
- **User data:** Optional user object (name, email) passed from Server Layout

### Header (`header/header.tsx`)
- **Layout:** Sticky top-0 z-30, 16px height
- **Left section:** Breadcrumbs auto-generated from route
- **Right section:** Search (icon), Notifications (icon), User dropdown menu
- **User Menu:**
  - Shows user name & email
  - Menu items: Profile, Settings, Logout (signOut → /login)
  - Destructive logout styling

### Sidebar (`sidebar/sidebar.tsx`)
- **Fixed:** left-0 top-0 z-40, toggles 256px → 64px
- **Header:** Logo (Tractor icon) + branding (expanded only)
- **Navigation:** `<SidebarNav collapsed={collapsed} />` (navigation.config groups)
- **Footer:** Collapse toggle button

### Supporting Components
- **`breadcrumbs.tsx`** → Auto-generated from pathname
- **`sidebar-nav.tsx`** → Renders navigation groups (9 routes across 5 categories)
- **`page-container.tsx`** → Common page wrapper
- **`content-section.tsx`** → Section wrapper with styling

---

## 3. Form Components (`src/components/forms/`)

### CurrencyInput
**File:** `currency-input.tsx`  
**Props:**
- `value: number | undefined | null`
- `onChange: (value: number | undefined) => void`
- `min?, max?, incrementStep?`
- `placeholder?, disabled?, ...HTMLInputAttrs`

**Features:**
- Formats display: `1000000` → `"1.000.000 đ"` (VND locale)
- Clears on blur if value is 0
- Arrow keys: ↑↓ increment/decrement by `incrementStep` (default 1000)
- Shows currency symbol (đ) as right suffix

### QuantityInput
**File:** `quantity-input.tsx`  
**Props:**
- `value: number | undefined | null`
- `onChange: (value: number | undefined) => void`
- `min?, max?, step?, unit?` (e.g., "công", "kg", "hours")
- `showButtons?` (±buttons, default true)

**Features:**
- Decimal input (inputMode="decimal")
- +/- buttons for quick adjust
- Arrow keys increment/decrement
- Unit suffix display (optional)
- Clears on blur if value is 0

### DatePicker
**File:** `date-picker.tsx`  
**Props:**
- `value: Date | undefined`
- `onChange: (date: Date | undefined) => void`
- `disabled?, placeholder?, ...HTMLInputAttrs`

**Features:**
- Vi-VN locale (DD/MM/YYYY format)
- Calendar popover
- Time selection available

### FormField
**File:** `form-field.tsx`  
**Purpose:** React Hook Form integration helper

### Multi-Select Checkbox
**File:** `multi-select-checkbox.tsx`  
**Purpose:** Checkbox group for multi-selection

---

## 4. DataTable (`src/components/data-display/`)

### ColumnDef Interface
```typescript
interface ColumnDef<T> {
  key: string;              // Object property name
  label: string;            // Header text
  sortable?: boolean;       // Enable sorting
  align?: "left" | "center" | "right";
  width?: string;           // CSS width (e.g., "200px", "20%")
  render?: (item: T) => React.ReactNode;  // Custom cell render
  className?: string;       // Cell styling
}
```

### DataTableProps
- **Data:** `columns[], data[], getRowId()?`
- **Pagination:** `currentPage, pageSize, totalPages?, totalItems?, onPageChange(), onPageSizeChange()`
- **Sorting:** `sortKey?, sortDirection?, onSort(key)?`
- **Interaction:** `onRowClick(item)?, getRowId(item)?`
- **View modes:** `viewMode ("table" | "card"), onViewModeChange()?, renderCard()?`
- **State:** `isLoading?, emptyMessage?, emptyDescription?, emptyAction?`

### DataTable Features
- **Table view:** Sortable headers, clickable rows, horizontal scroll
- **Card view:** Grid layout (3 cols lg, 2 cols md)
- **Loading state:** Skeleton rows
- **Empty state:** Custom message + action button
- **Pagination:** Bottom pagination with size selector

### Supporting Components
- `data-table-header.tsx` → Sort direction indicators
- `data-table-pagination.tsx` → Page controls
- `data-table-empty.tsx` → Empty state display

---

## 5. Status Badges (`src/components/status/`)

### StatusBadge (Base Component)
**File:** `status-badge.tsx`  
**Props:**
- `variant: StatusVariant` (14 variants)
- `label: string`
- `icon?: LucideIcon`
- `showIcon?: boolean` (default true)

### 14 Status Variants with WCAG AA Colors
| Variant | Color | Use Case |
|---------|-------|----------|
| `new` | Blue | NEW status |
| `in-progress` | Orange | IN_PROGRESS |
| `completed` | Green | COMPLETED |
| `blocked` | Gray | BLOCKED |
| `canceled` | Red | CANCELED |
| `pending` | Yellow | PENDING_BILL, PENDING_PAYROLL |
| `partial` | Amber | PARTIAL_PAID |
| `paid` | Emerald | FULLY_PAID |
| `open` | Sky | OPEN bills/payroll |
| `available` | Teal | AVAILABLE machines |
| `in-use` | Violet | IN_USE machines |
| `maintenance` | Rose | MAINTENANCE |

### Status-Specific Wrapper Components
- **`booking-status.tsx`** → Maps BookingStatus enum to badge
- **`payment-status.tsx`** → Maps PaymentStatus enum
- **`job-payment-status.tsx`** → Maps JobPaymentStatus enum
- **`bill-status.tsx`** → Maps BillStatus enum
- **`payroll-status.tsx`** → Maps PayrollStatus enum
- **`machine-status.tsx`** → Maps MachineStatus enum
- **`advance-status.tsx`** → Maps AdvanceStatus enum
- **`job-status.tsx`** → Custom job status wrapper
- **`status-select.tsx`** → Dropdown selector for status changes

---

## 6. Feature Components by Module

### Bills (`src/components/bills/`)
| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `bill-list.tsx` | DataTable of bills | `bills[], onRowClick?` |
| `create-bill-dialog.tsx` | Dialog to create new bill | `open, onOpenChange, onSuccess` |
| `update-bill-dialog.tsx` | Dialog to edit bill | `bill, open, onOpenChange, onSuccess` |
| `booking-selector.tsx` | Multi-select bookings for bill | `selectedBookings[], onChange` |
| `add-bill-payment-dialog.tsx` | Record customer payment | `bill, open, onOpenChange, onSuccess` |
| `bill-payment-history.tsx` | Timeline of payments | `bill` |

### Bookings (`src/components/bookings/`)
| Component | Purpose |
|-----------|---------|
| `booking-list.tsx` | DataTable of bookings |
| `create-booking-dialog.tsx` | Create new booking |
| `update-booking-dialog.tsx` | Edit booking |

### Customers (`src/components/customers/`)
| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `create-customer-dialog.tsx` | Create customer | `open, onOpenChange, onSuccess` |
| `update-customer-dialog.tsx` | Edit customer | `customer, open, onOpenChange, onSuccess` |
| `customer-tabs.tsx` | Tabbed view (info, lands, bills, bookings) | `customer` |
| `land-list.tsx` | DataTable of customer's land | `lands[], onRowClick?` |
| `land-dialog.tsx` | Create/edit land parcel | `land?, open, onOpenChange, onSuccess` |

### Workers (`src/components/workers/`)
| Component | Purpose |
|-----------|---------|
| `create-worker-dialog.tsx` | Create worker |
| `update-worker-dialog.tsx` | Edit worker |
| `advance-payment-dialog.tsx` | Record advance payment |

### Machines (`src/components/machines/`)
| Component | Purpose |
|-----------|---------|
| `create-machine-dialog.tsx` | Create machine |
| `update-machine-dialog.tsx` | Edit machine |
| `create-maintenance-dialog.tsx` | Log maintenance event |
| `maintenance-history.tsx` | Timeline of maintenance records |

### Payroll (`src/components/payroll/`)
| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `create-payroll-dialog.tsx` | Create payroll sheet | `open, onOpenChange, onSuccess` |
| `update-payroll-dialog.tsx` | Edit payroll | `payroll, open, onOpenChange, onSuccess` |
| `payroll-list.tsx` | DataTable of payroll sheets | `payroll[], onRowClick?` |
| `payroll-preview.tsx` | Summary view before creation | `jobs[], workers[], deductions?` |
| `job-worker-selector.tsx` | Multi-select job workers | `selectedJobs[], onChange` |
| `advance-selector.tsx` | Multi-select advances to deduct | `selectedAdvances[], onChange` |
| `add-payroll-payment-dialog.tsx` | Record worker payment | `payroll, open, onOpenChange, onSuccess` |
| `payroll-payment-history.tsx` | Timeline of payments | `payroll` |

### Work Days (`src/components/work-days/`)
| Component | Purpose |
|-----------|---------|
| `add-daily-booking-dialog.tsx` | Add booking to daily log |
| `add-daily-machine-dialog.tsx` | Add machine usage to daily log |
| `edit-daily-booking-amount.tsx` | Edit booking quantity/amount |
| `edit-daily-machine-amount.tsx` | Edit machine usage amount |
| `delete-daily-item-button.tsx` | Remove item from daily log |

### Machine Types (`src/components/machine-types/`)
| Component | Purpose |
|-----------|---------|
| `create-machine-type-dialog.tsx` | Create new machine type |
| `machine-types-client.tsx` | Client-side machine type manager |
| `machine-type-detail-sheet.tsx` | Side panel detail view |
| `job-type-inline-form.tsx` | Inline form for job type base salary |

### Services (`src/components/services/`)
| Component | Purpose |
|-----------|---------|
| `create-service-dialog.tsx` | Create service/pricing |

### Advances (`src/components/advances/`)
| Component | Purpose |
|-----------|---------|
| `advance-list.tsx` | DataTable of worker advances |

---

## 7. Providers & State Management (`src/providers/` & `src/store/`)

### Providers
**`query-provider.tsx`** → TanStack Query (React Query)
- Wraps app with `QueryClientProvider`
- Enables React Query devtools in dev mode
- Powers data fetching, caching, background sync

### Store (Zustand)
**`auth-store.ts`** → Session state management
```typescript
interface AuthState {
  session: Session | null
  setSession: (session: Session | null) => void
}
export const useAuthStore = create<AuthState>(...)
```
- Minimal; main auth via NextAuth server session
- Can be enhanced for client-side user state

---

## 8. Authentication (`src/app/(auth)/`)

### Login Flow
1. **Route:** `/login` (redirected from `/api/auth/callback` if unauthenticated)
2. **Form:** Email + Password (credentials provider)
3. **Backend:** NextAuth Credentials Provider
   - Database query: `prisma.user.findUnique({ email })`
   - Password verify: `bcrypt.compare(password, user.password_hash)`
   - Returns: `{ id, name, email }`
4. **Session:** Stored in HTTP-only cookie (secure)

### Session Check (Server-Side)
- **File:** `src/lib/auth.ts`
- **`getSession()`** → Returns session or null
- **`requireAuth()`** → Throws if unauthorized
- **Dashboard Layout:** Calls `getSession()`, redirects unauthenticated users to `/login`

### Auth Config
**File:** `src/lib/auth.base.config.ts` (imported by auth.config.ts)
- NextAuth configuration (pages, callbacks, session options)
- Credentials provider with bcrypt password verification
- Supports role-based authorization (RBAC) structure

---

## 9. Configuration & Types

### Site Config (`src/config/site.ts`)
```typescript
{
  name: "Agri-ERP",
  currency: "VND",
  currencySymbol: "đ",
  locale: "vi-VN",
  defaultPageSize: 20,
  maxPageSize: 100,
  features: { darkMode, notifications, exportData, advancedSearch }
}
```

### Navigation Config (`src/config/navigation.ts`)
- 5 groups (Main, Operations, People, Financial, Assets)
- 9 total routes across module areas
- Each item: id, label, href, icon (Lucide), enabled flag

### Status Enums (`src/types/enums.ts`)
- **BookingStatus:** NEW, IN_PROGRESS, BLOCKED, COMPLETED, CANCELED
- **PaymentStatus:** PENDING_BILL, ADDED_BILL, FULLY_PAID
- **JobPaymentStatus:** PENDING_PAYROLL, ADDED_PAYROLL, FULLY_PAID
- **BillStatus:** OPEN, PARTIAL_PAID, COMPLETED
- **PayrollStatus:** OPEN, PARTIAL_PAID, COMPLETED
- **MachineStatus:** AVAILABLE, IN_USE, MAINTENANCE
- **PaymentMethod:** CASH, BANK_TRANSFER
- **AdvanceStatus:** UNPROCESSED, PROCESSED

---

## 10. UI Primitives (`src/components/ui/`)

18 shadcn/ui components:
- **Containers:** card, alert, tabs
- **Forms:** input, label, checkbox, textarea, button, select, command
- **Dialogs:** dialog, popover, sheet, dropdown-menu
- **Display:** table, badge, skeleton, skeleton-table, calendar
- **Notifications:** sonner (toast)
- **Navigation:** tooltip, collapsible

---

## Key Patterns

### 1. Server/Client Boundary
- **Root Layout** (server) → Providers only
- **Dashboard Layout** (server) → Auth check, session passed to AppShell
- **AppShell** (client) → Layout, sidebar collapse state
- **Pages** (client) → Data fetching via React Query

### 2. Form Dialogs
- Modal trigger + controlled open state
- FormField wrapper for React Hook Form integration
- OnSuccess callback for list refresh
- Zod schemas for validation (defined per module)

### 3. Data Display
- DataTable as generic component (ColumnDef API)
- Sortable/paginated by default
- Row click handlers for detail routes
- Card view option for mobile

### 4. Status Management
- Enum-based status (type-safe)
- StatusBadge wrapper for consistent rendering
- Status-specific components map enum → badge variant
- StatusSelect for inline status changes

### 5. Vietnamese Localization
- Currency: VND (đ) with dot separator
- Dates: vi-VN locale (DD/MM/YYYY)
- All UI text in Vietnamese
- Configured in site.ts

---

## Module Readiness

| Module | Status | Components |
|--------|--------|-----------|
| Bookings | MVP | list, create, update |
| Bills | MVP | list, create, update, payment history |
| Payroll | MVP | list, create, update, advance selector |
| Customers | MVP | create, update, tabs (info/lands/bills) |
| Workers | MVP | create, update, advance payment |
| Machines | MVP | create, update, maintenance log |
| Work Days | MVP | daily booking/machine entry, edit, delete |
| Machine Types | MVP | create, detail, job type form |
| Services | MVP | create |
| Advances | MVP | list |

---

## Unresolved Questions

1. **Auth persistence:** How sessions persist across tab closes—check NextAuth cookie config
2. **Error boundaries:** No global error handling layer visible—add catch route?
3. **Optimistic updates:** React Query mutations—verify onSuccess callbacks
4. **Search implementation:** Header search icon non-functional—implement search page?
5. **Notifications feature flag:** Enabled but no bell dropdown—implement later?
6. **Multi-user RBAC:** Auth supports roles structurally but UI not enforced—future phase?

