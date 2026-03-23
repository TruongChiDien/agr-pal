# Codebase Summary

## 1. Directory Structure

```
agr-pal/
├── src/
│   ├── app/                              # Next.js App Router (Server Components)
│   │   ├── (dashboard)/                  # Protected routes with auth layout
│   │   │   ├── page.tsx                  # Dashboard home (/dashboard)
│   │   │   ├── customers/                # Customer CRUD pages
│   │   │   │   ├── page.tsx              # Customer list
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx          # Customer detail + tabs (info/lands/bills/bookings)
│   │   │   │   └── ...components
│   │   │   ├── bookings/                 # Booking CRUD pages
│   │   │   ├── workers/                  # Worker CRUD pages
│   │   │   ├── machines/                 # Machine CRUD pages
│   │   │   ├── machine-types/            # Machine Type & Job Type pages
│   │   │   ├── bills/                    # Bill CRUD pages
│   │   │   ├── payroll/                  # Payroll CRUD pages
│   │   │   ├── work-days/                # Work Day CRUD pages
│   │   │   ├── services/                 # Service CRUD pages
│   │   │   ├── layout.tsx                # Protected layout (sidebar + header)
│   │   │   └── ...shared components
│   │   ├── (auth)/                       # Public routes (no sidebar)
│   │   │   └── login/
│   │   │       └── page.tsx              # Credentials login form
│   │   ├── api/                          # API routes
│   │   │   ├── auth/[...nextauth]/route.ts  # NextAuth handlers
│   │   │   └── setup-admin/route.ts      # Admin user creation (one-time)
│   │   ├── layout.tsx                    # Root layout (fonts, providers)
│   │   ├── page.tsx                      # Root redirect → /dashboard or /login
│   │   └── globals.css                   # Global Tailwind + CSS vars
│   │
│   ├── components/                       # Reusable React components
│   │   ├── layout/                       # Layout components
│   │   │   ├── app-shell.tsx             # Main container (sidebar + header + main)
│   │   │   ├── sidebar/                  # Navigation sidebar
│   │   │   │   ├── navigation-tree.tsx   # 5 groups × 10 items
│   │   │   │   └── index.ts              # Re-export
│   │   │   ├── header/                   # Sticky header
│   │   │   │   ├── breadcrumbs.tsx       # Navigation path
│   │   │   │   ├── search.tsx            # Search bar (placeholder)
│   │   │   │   └── index.ts              # Re-export
│   │   │   └── index.ts                  # Re-export all
│   │   │
│   │   ├── data-display/                 # Data presentation
│   │   │   ├── data-table/               # Generic sortable/paginated table
│   │   │   │   ├── index.tsx             # Main component + hooks
│   │   │   │   ├── types.ts              # ColumnDef, TableState
│   │   │   │   └── styles.tsx            # Table styling
│   │   │   ├── kpi-card.tsx              # Stat card (value, label, change %)
│   │   │   └── index.ts                  # Re-export
│   │   │
│   │   ├── forms/                        # Form input components
│   │   │   ├── currency-input.tsx        # VND input with formatting
│   │   │   ├── quantity-input.tsx        # Number input with +/− buttons
│   │   │   ├── date-picker.tsx           # Calendar (vi-VN)
│   │   │   ├── multi-select-checkbox.tsx # Checkbox group
│   │   │   ├── form-field.tsx            # RHF wrapper
│   │   │   └── index.ts                  # Re-export
│   │   │
│   │   ├── status/                       # Status badge components
│   │   │   ├── booking-status-badge.tsx  # BookingStatus → color
│   │   │   ├── bill-status-badge.tsx     # BillStatus → color
│   │   │   ├── payroll-status-badge.tsx  # PayrollStatus → color
│   │   │   ├── machine-status-badge.tsx  # MachineStatus → color
│   │   │   └── ... (8 enum-specific wrappers)
│   │   │   └── index.ts                  # Re-export all
│   │   │
│   │   └── ui/                           # shadcn/ui primitives
│   │       ├── button.tsx                # Button variants
│   │       ├── card.tsx                  # Card container
│   │       ├── dialog.tsx                # Modal dialog
│   │       ├── input.tsx                 # Text input
│   │       ├── label.tsx                 # Form label
│   │       ├── ... (18 total shadcn components)
│   │       └── index.ts                  # Re-export all
│   │
│   ├── config/                           # Application configuration
│   │   ├── navigation.ts                 # Nav structure (5 groups, 10 items)
│   │   ├── site.ts                       # Site settings (name, currency, locale)
│   │   └── index.ts                      # Re-export
│   │
│   ├── lib/                              # Utilities & core logic
│   │   ├── db.ts                         # Prisma client singleton + middleware
│   │   ├── auth.ts                       # Session helpers (getSession, requireAuth)
│   │   ├── auth.config.ts                # NextAuth config (Credentials Provider)
│   │   ├── auth.base.config.ts           # Auth base settings
│   │   ├── format.ts                     # Formatting (currency, dates, VND)
│   │   ├── utils.ts                      # Utilities (cn, classnames merger)
│   │   ├── booking-status-utils.ts       # Booking status transitions
│   │   ├── query-client.ts               # TanStack Query config
│   │   └── index.ts                      # Re-export all
│   │
│   ├── hooks/                            # React hooks (TanStack Query)
│   │   ├── use-advances.ts               # useAdvances, useCreateAdvance, etc.
│   │   ├── use-bills.ts                  # useBills, useCreateBill, etc.
│   │   ├── use-bookings.ts               # useBookings, useCreateBooking, etc.
│   │   ├── use-customers.ts              # useCustomers, useCreateCustomer, etc.
│   │   ├── use-job-types.ts              # useJobTypes, useCreateJobType, etc.
│   │   ├── use-machine-logs.ts           # useMaintenanceLogs, etc.
│   │   ├── use-machine-types.ts          # useMachineTypes, etc.
│   │   ├── use-machines.ts               # useMachines, useCreateMachine, etc.
│   │   ├── use-payroll.ts                # usePayroll, useCreatePayroll, etc.
│   │   ├── use-services.ts               # useServices, useCreateService, etc.
│   │   ├── use-toast.ts                  # useToast (shadcn hook)
│   │   ├── use-workers.ts                # useWorkers, useCreateWorker, etc.
│   │   ├── use-work-days.ts              # useWorkDays, useCreateWorkDay, etc.
│   │   └── index.ts                      # Re-export all
│   │
│   ├── actions/                          # Server Actions (mutations)
│   │   ├── advances.ts                   # createAdvance, deleteAdvance, etc.
│   │   ├── bills.ts                      # createBill, addBillPayment, etc.
│   │   ├── bookings.ts                   # createBooking, updateBooking, etc.
│   │   ├── customers.ts                  # createCustomer, updateCustomer, etc.
│   │   ├── daily-bookings.ts             # addBookingToDay, removeBookingFromDay, etc.
│   │   ├── daily-machines.ts             # addMachineToDay, assignWorker, etc.
│   │   ├── machine-logs.ts               # createMaintenanceLog, etc.
│   │   ├── machine-types.ts              # createMachineType, etc.
│   │   ├── machines.ts                   # createMachine, updateMachine, etc.
│   │   ├── payroll.ts                    # createPayroll, addPayrollPayment, etc.
│   │   ├── services.ts                   # createService, updateService, etc.
│   │   ├── work-days.ts                  # createWorkDay, getWorkDay, etc.
│   │   ├── workers.ts                    # createWorker, updateWorker, etc.
│   │   └── index.ts                      # Re-export all
│   │
│   ├── schemas/                          # Zod validation schemas
│   │   ├── bill.ts                       # BillSchema, BillPaymentSchema
│   │   ├── booking.ts                    # BookingSchema
│   │   ├── customer.ts                   # CustomerSchema, LandSchema
│   │   ├── machine.ts                    # MachineSchema
│   │   ├── machine-logs.ts               # MaintenanceLogSchema
│   │   ├── machine-type.ts               # MachineTypeSchema, JobTypeSchema
│   │   ├── payment.ts                    # PaymentSchema (shared)
│   │   ├── payroll.ts                    # PayrollSchema, PayrollPaymentSchema
│   │   ├── service.ts                    # ServiceSchema
│   │   ├── worker.ts                     # WorkerSchema
│   │   ├── work-day.ts                   # WorkDaySchema
│   │   └── index.ts                      # Re-export all
│   │
│   ├── types/                            # TypeScript type definitions
│   │   ├── enums.ts                      # Status enums (BookingStatus, etc.)
│   │   ├── result.ts                     # Result<T> type (success/error)
│   │   └── index.ts                      # Re-export all
│   │
│   ├── store/                            # Zustand state management
│   │   ├── auth-store.ts                 # Auth state (user, session)
│   │   └── index.ts                      # Re-export
│   │
│   ├── proxy.ts                          # Proxy utilities (if needed)
│   └── index.ts                          # Root re-exports
│
├── prisma/
│   ├── schema.prisma                     # Database schema (17 models, 8 enums)
│   └── migrations/                       # Auto-generated migrations
│
├── public/                               # Static assets
│   ├── favicon.ico
│   ├── logo.png
│   └── ... (images, fonts)
│
├── .claude/                              # Claude Code workflows
│   └── workflows/
│       ├── primary-workflow.md
│       ├── development-rules.md
│       ├── orchestration-protocol.md
│       └── documentation-management.md
│
├── docs/                                 # Project documentation
│   ├── project-overview-pdr.md           # Business requirements
│   ├── system-architecture.md            # Technical design
│   ├── codebase-summary.md               # This file
│   ├── code-standards.md                 # Conventions & patterns
│   ├── design-guidelines.md              # UI/UX standards
│   ├── project-roadmap.md                # Progress & milestones
│   └── deployment-guide.md               # Environment setup
│
├── plans/                                # Planning & reports
│   └── reports/                          # Scout/research reports
│
├── [config files]
│   ├── next.config.ts                    # Next.js configuration
│   ├── tsconfig.json                     # TypeScript strict mode
│   ├── tailwind.config.ts                # Tailwind CSS config
│   ├── eslint.config.mjs                 # ESLint rules
│   ├── .env.local                        # (Git-ignored) environment variables
│   ├── package.json                      # Dependencies & scripts
│   ├── package-lock.json                 # Locked dependency versions
│   └── README.md                         # Project overview (user guide)
```

---

## 2. What Each Folder Does

### `src/app/` — Next.js Routes & Pages
- **Entry point:** `/app/layout.tsx` (root layout, fonts, providers)
- **(dashboard)** group: Protected routes (auth guard in layout)
  - Each module has: `page.tsx` (list), `[id]/page.tsx` (detail), dialogs (create/edit)
  - Example: `/customers/page.tsx` → list, `/customers/[id]/page.tsx` → detail + tabs
- **(auth)** group: Public routes (login, signup—currently login only)
- **api/:** NextAuth handlers, setup endpoint
- **globals.css:** Tailwind directives, CSS variables (colors, spacing)

**Key Pattern:** Server Components by default (fetch data in `page.tsx`), client components for interactivity (forms, dialogs).

### `src/components/` — Reusable UI Widgets
- **layout/:** AppShell (sidebar + header), navigation, breadcrumbs
- **data-display/:** DataTable (sortable, paginated), KPI cards, stats
- **forms/:** Currency input, quantity input, date picker, form field wrapper
- **status/:** 14 status badge variants (color-coded by enum)
- **ui/:** 18 shadcn/ui primitives (button, card, dialog, input, select, etc.)

**Import Pattern:** `@/components/forms/currency-input`, `@/components/status/booking-status-badge`

### `src/config/` — App Configuration
- **navigation.ts:** NavItem & NavGroup structures (5 groups, 10 items, Vietnamese labels)
- **site.ts:** siteConfig object (app name, currency, locale, feature flags)
- Used by layout & components for centralized config

### `src/lib/` — Core Utilities & Helpers
- **db.ts:** Prisma client singleton + Decimal serialization middleware + retry logic
- **auth.ts/auth.config.ts:** NextAuth Credentials Provider + session helpers
- **format.ts:** formatCurrency (VND), formatDateShort, formatRelativeDate
- **utils.ts:** cn() (Tailwind class merger, from clsx)
- **query-client.ts:** TanStack Query client configuration
- **booking-status-utils.ts:** Status transition helpers

### `src/hooks/` — React Query Hooks (Server State)
- **Pattern:** Each module has `use-module.ts` exporting:
  - `useQuery` hook (fetch data)
  - `useMutation` hooks (create, update, delete)
  - Auto-invalidation on mutation
- **12 hooks:** use-advances, use-bills, use-bookings, use-customers, use-machines, use-payroll, use-workers, use-work-days, use-services, use-machine-types, use-job-types, use-machine-logs, use-toast

**Example:**
```typescript
// src/hooks/use-customers.ts
export function useCustomers() {
  return useQuery({ queryKey: ["customers"], queryFn: listCustomers });
}
export function useCreateCustomer() {
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}
```

### `src/actions/` — Server Actions (Mutations)
- **Pattern:** `"use server"` directive at top of file
- **13 files:** advances, bills, bookings, customers, daily-bookings, daily-machines, machine-logs, machine-types, machines, payroll, services, work-days, workers
- **Typical exports:**
  - `create*`, `update*`, `delete*` (CRUD)
  - `list*`, `get*` (reads)
  - `add*Payment`, `assign*` (special operations)
- **Error handling:** Try-catch with Result<T> pattern

**Example:**
```typescript
// src/actions/customers.ts
"use server"
export async function createCustomer(input: CustomerInput): Promise<Result<Customer>> {
  const session = await requireAuth();
  try {
    const data = CustomerSchema.parse(input);
    return { ok: true, data: await db.customer.create({ data }) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
```

### `src/schemas/` — Zod Validation Schemas
- **11 files:** bill, booking, customer, machine, machine-logs, machine-type, payment, payroll, service, worker, work-day
- **Pattern:** `const XyzSchema = z.object({ ... })`
- **Used in:** Server Actions (input validation), client-side forms (RHF validation)

### `src/types/` — TypeScript Definitions
- **enums.ts:** Status enums (BookingStatus, BillStatus, MachineStatus, etc.) — 8 enums
- **result.ts:** Result<T> = { ok: true, data: T } | { ok: false, error: string }
- **index.ts:** Re-exports all types for `@/types`

### `src/store/` — Zustand State (Client State)
- **auth-store.ts:** Minimal auth state (user, setUser)
- **Pattern:** Create store with zustand, subscribe in components

### `prisma/` — Database Schema & Migrations
- **schema.prisma:** 17 models across 3 domains (Auth, Masters, Operations, Customers, Financials)
- **migrations/:** Auto-generated SQL from `prisma migrate dev`
- **Enums:** 8 status/choice enums defined in schema

### `docs/` — Project Documentation
- **7 files:** Overview (PDR), Architecture, Codebase, Standards, Guidelines, Roadmap, Deployment
- All markdown, concise, <800 lines each

---

## 3. Key Files & What They Do

### `src/app/layout.tsx`
Root layout wrapping all pages. Responsibilities:
- Load fonts (Inter, custom Vietnamese fonts if any)
- Initialize providers (TanStack Query, Zustand, NextAuth)
- Set global meta tags (title, favicon, viewport)
- Children rendered inside providers

### `src/app/(dashboard)/layout.tsx`
Protected dashboard layout (auth guard). Responsibilities:
- Check session via `auth()` Server Component
- Redirect to /login if no session
- Render AppShell (sidebar + header + main)
- Sidebar shows navigation based on user role

### `src/app/api/auth/[...nextauth]/route.ts`
NextAuth API routes. Handles:
- POST /api/auth/signin (login)
- GET /api/auth/session (check session)
- POST /api/auth/signout (logout)
- JWT refresh, session management

### `src/lib/db.ts`
Prisma client setup. Key features:
```typescript
const prisma = new PrismaClient({
  log: ["warn", "error"],
});

// Middleware: Convert Decimal → Number for JSON serialization
prisma.$use(async (params, next) => {
  const result = await next(params);
  if (result && typeof result === 'object') {
    // Convert Decimal to number recursively
  }
  return result;
});

export default prisma;
```

### `src/config/navigation.ts`
Navigation tree structure. Used by Sidebar & Breadcrumbs:
```typescript
export const navigationConfig: NavGroup[] = [
  {
    id: "main",
    label: "Chính",
    items: [
      { id: "dashboard", label: "Bảng điều khiển", href: "/dashboard", ... },
    ],
  },
  // ... 4 more groups
];
```

### `src/components/data-display/data-table/index.tsx`
Generic data table component. Props:
```typescript
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  // ...
}
```

Features:
- Sortable columns (click header)
- Paginated (20 rows/page)
- Toggle table ↔ card view
- Empty state when no data
- Loading skeleton

---

## 4. Component Inventory

### Layout Components (5)
- AppShell, Sidebar, Header, Breadcrumbs, Navigation Tree

### Data Display (3)
- DataTable, KPI Card, Status Badge (14 variants)

### Form Components (5)
- CurrencyInput, QuantityInput, DatePicker, MultiSelectCheckbox, FormField

### Dialogs (Feature-specific, ~20 total)
Examples:
- CreateCustomerDialog, UpdateCustomerDialog
- CreateBookingDialog, UpdateBookingDialog
- CreateBillDialog, AddBillPaymentDialog, BillPaymentHistoryDialog
- CreatePayrollDialog, UpdatePayrollDialog, PayrollPreviewDialog, AddPayrollPaymentDialog

### shadcn/ui Primitives (18)
- Button, Card, Dialog, Input, Label, Select, Textarea, Checkbox, RadioGroup, Tabs, Tooltip, Badge, Alert, AlertDialog, Dropdown Menu, Popover, Separator, Scroll Area

---

## 5. Dependency Graph

```
Pages (React Server Components)
  ↓ use
Hooks (useQuery, useMutation)
  ↓ call
Actions (Server Actions, "use server")
  ↓ use
Schemas (Zod validation)
  ↓ pass to
Database (Prisma client)
  ↓ query
PostgreSQL (Supabase)

Components (React Client Components)
  ↓ use
Hooks & Context
  ↓ call
Actions (Server Actions via fetch/RPC)
  ↓ use
Utilities (format, cn, enums)
```

---

## 6. Data Flow Example: Create Booking

```
1. User opens /bookings/new
2. Page.tsx renders CreateBookingForm (client component)
3. Form has fields: customer, land, service, quantity, price
4. User submits form
5. Form calls createBooking(input) Server Action
6. Server Action:
   a. Validates input (BookingSchema.parse)
   b. Checks session (requireAuth)
   c. Calls db.booking.create({ data })
   d. Returns Result<Booking>
7. Mutation hook catches response
8. On success:
   a. Toast notification ("Booking created")
   b. Invalidate ["bookings"] queries
   c. Refetch list (auto via TanStack Query)
   d. Redirect to /bookings/[id]
9. User sees updated list with new booking
```

---

## 7. File Naming Conventions

- **kebab-case:** All `.tsx`, `.ts` files (currency-input.tsx, use-customers.ts)
- **PascalCase:** React components exported (function CurrencyInput)
- **SCREAMING_SNAKE_CASE:** Constants, enums (NEW, IN_PROGRESS, COMPLETED)
- **camelCase:** Functions, variables (formatCurrency, createBooking)

---

## 8. Line Count Targets

Files <200 LOC (refactor if exceeded):
- `src/components/**/*.tsx` — Typical: 50–150 LOC
- `src/actions/*.ts` — Typical: 100–200 LOC
- `src/hooks/*.ts` — Typical: 30–80 LOC
- `src/schemas/*.ts` — Typical: 20–40 LOC

Exceptions (>200 LOC acceptable):
- `src/app/**/page.tsx` — Complex pages (DataTable + filters + dialogs)
- `prisma/schema.prisma` — Schema definition (no refactor needed)

---

**Version:** 1.0 | **Last Updated:** 2026-03-23 | **Owner:** Tech Lead
