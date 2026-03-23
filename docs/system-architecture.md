# System Architecture

## 1. Tech Stack Overview

### Frontend
- **Next.js 16** (App Router, React 19, Server Components)
- **TypeScript 5** (strict mode, no `any`)
- **Tailwind CSS 4** (utility-first, responsive)
- **shadcn/ui** (headless Radix UI + Tailwind wrapper)
- **React Hook Form** + **Zod** (form validation)
- **TanStack Query (React Query)** (server state, caching, auto-refresh)
- **Zustand** (client state: auth store minimal)
- **Lucide React** (icons, 200+ tree-shakeable)

### Backend
- **Prisma ORM** (type-safe, auto-migrations)
- **PostgreSQL 15+** (Supabase managed)
- **NextAuth.js 5** (Credentials Provider, bcrypt, sessions)
- **Next.js Server Actions** (RPC pattern, type-safe mutations)

### Infrastructure
- **Vercel** (front-end deployment, Edge Functions)
- **Supabase** (PostgreSQL, auto backups, Row-Level Security ready)

### Development Tools
- **ESLint** (code quality)
- **Prettier** (code formatting, integrated)
- **Node.js 20+ LTS** (runtime)

---

## 2. Architecture Layers

```
┌─────────────────────────────────────────┐
│      Next.js UI Layer (Pages/Routes)    │
│  (/dashboard, /customers, /bills, ...)  │
└─────────────────────────────────────────┘
           ↓ (Type-safe calls)
┌─────────────────────────────────────────┐
│    React Components + TanStack Query    │
│   (Forms, Tables, Dialogs, Hooks)       │
└─────────────────────────────────────────┘
           ↓ (Server Actions)
┌─────────────────────────────────────────┐
│  Business Logic (src/actions/*.ts)      │
│  (CRUD, validation, transactions)       │
└─────────────────────────────────────────┘
           ↓ (Type-safe ORM)
┌─────────────────────────────────────────┐
│   Prisma Client (src/lib/db.ts)         │
│   (Middleware: Decimal→Number, retry)   │
└─────────────────────────────────────────┘
           ↓ (SQL)
┌─────────────────────────────────────────┐
│    PostgreSQL (Supabase)                │
│    (17 models, 3 domains)               │
└─────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Purpose | Key Files |
|-------|---------|-----------|
| **Pages** | Route handlers, layout composition | `src/app/(dashboard)/**/*.tsx` |
| **Components** | UI widgets, form inputs, tables | `src/components/**/*.tsx` |
| **Hooks** | TanStack Query (useQuery, useMutation) | `src/hooks/use-*.ts` |
| **Actions** | Server-side mutations, validation | `src/actions/*.ts` |
| **Schemas** | Zod validation rules | `src/schemas/*.ts` |
| **Database** | Prisma client, models | `src/lib/db.ts`, `prisma/schema.prisma` |

---

## 3. Database Schema

### Entity Relationship Diagram (Simplified)

```
AUTH
├── User

MASTERS
├── MachineType
│   ├── Job_Type (many per type)
│   └── Machine (many per type)
├── Service
│   └── ServiceMachineType (M:N junction)
└── Worker

CUSTOMERS
├── Customer
└── Land (many per customer)

OPERATIONS (WorkDay = Hub)
├── WorkDay (date-unique)
│   ├── DailyBooking (booking + workday)
│   │   ├── Booking (customer + land + snapshot amount)
│   │   └── DailyBookingMachine (trace-back to machines)
│   └── DailyMachine (machine + workday)
│       └── DailyMachineWorker (worker + job_type + wage snapshots)

FINANCIALS
├── Bill (customer + bookings aggregate)
│   └── BillPayment (partial payments)
├── Advance_Payment (worker advance)
└── Payroll_Sheet (worker payroll aggregate)
    └── Payroll_Payment (partial payments)
```

### Key Models (17 Total)

#### Auth (1)
| Model | Purpose | Key Fields |
|-------|---------|-----------|
| User | Admin account | id, email, password_hash, role (ADMIN) |

#### Masters (6)
| Model | Purpose | Key Fields |
|-------|---------|-----------|
| MachineType | Equipment category | id, name, description |
| Job_Type | Position + base salary | id, machine_type_id FK, name, default_base_salary |
| Service | Service catalog | id, name, unit (công), price |
| ServiceMachineType | M:N Service ↔ MachineType | service_id FK, machine_type_id FK |
| Worker | Employee | id, name, phone, address |
| Machine | Equipment unit | id, machine_type_id FK, name, model, purchase_date, status (AVAILABLE/IN_USE/MAINTENANCE) |

#### Customers (2)
| Model | Purpose | Key Fields |
|-------|---------|-----------|
| Customer | Client profile | id, name, phone, address |
| Land | GPS land parcel | id, customer_id FK, name, gps_lat, gps_lng |

#### Operations (6)
| Model | Purpose | Key Fields |
|-------|---------|-----------|
| WorkDay | Operational hub (date-unique) | id, date (unique), notes |
| Booking | Service request | id, customer_id FK, land_id FK, amount (snapshot), status (NEW/IN_PROGRESS/BLOCKED/COMPLETED/CANCELED), payment_status (PENDING_BILL/ADDED_BILL/FULLY_PAID), bill_id FK |
| DailyBooking | Booking execution on date | id, work_day_id FK, booking_id FK, amount, notes |
| DailyMachine | Machine usage on date | id, work_day_id FK, machine_id FK, amount, notes |
| DailyMachineWorker | Worker assignment + wage snapshot | id, daily_machine_id FK, worker_id FK, job_type_id FK, applied_base (snapshot), applied_weight (snapshot), payment_adjustment, payroll_id FK, payment_status (PENDING_PAYROLL/ADDED_PAYROLL/FULLY_PAID), notes |
| DailyBookingMachine | Trace-back: which booking used which machine | id, daily_booking_id FK, daily_machine_id FK |

#### Financials (6)
| Model | Purpose | Key Fields |
|-------|---------|-----------|
| Bill | Customer invoice | id, customer_id FK, subtotal, adjustment, total_amount, total_paid, status (OPEN/PARTIAL_PAID/COMPLETED), notes |
| BillPayment | Partial payment to bill | id, bill_id FK, amount, payment_date, method (CASH/BANK_TRANSFER), notes |
| Advance_Payment | Worker advance (future deduction) | id, worker_id FK, amount, status (UNPROCESSED/PROCESSED), payroll_id FK, notes |
| Payroll_Sheet | Worker payroll aggregate | id, worker_id FK, total_wages, total_adv, adjustment, net_payable, total_paid, status (OPEN/PARTIAL_PAID/COMPLETED), notes |
| Payroll_Payment | Partial payment to payroll | id, payroll_id FK, amount, payment_date, method, notes |
| MaintenanceCategory | Maintenance type | id, name (unique) |
| MaintenanceLog | Maintenance record | id, machine_id FK, category_id FK, brand, price, quantity, maintenance_date, notes |

### Data Types
- **Integers:** id (cuid), quantity, counts
- **Decimals:** Decimal(12,2) for currency/prices (prevents float rounding)
- **Dates:** DateTime (with timezone), DATE for WorkDay
- **Strings:** name, phone, address, notes (text)
- **Enums:** Status fields (see below)

### Enums (8)
```typescript
MachineStatus = AVAILABLE | IN_USE | MAINTENANCE
BookingStatus = NEW | IN_PROGRESS | BLOCKED | COMPLETED | CANCELED
PaymentStatus = PENDING_BILL | ADDED_BILL | FULLY_PAID
JobPaymentStatus = PENDING_PAYROLL | ADDED_PAYROLL | FULLY_PAID
BillStatus = OPEN | PARTIAL_PAID | COMPLETED
PayrollStatus = OPEN | PARTIAL_PAID | COMPLETED
AdvanceStatus = UNPROCESSED | PROCESSED
PaymentMethod = CASH | BANK_TRANSFER
```

---

## 4. Data Flow Patterns

### Pattern 1: Wage Snapshot (Immutable)

```
Admin assigns Worker to DailyMachine:
  1. Fetch Worker + Job_Type from database
  2. Capture current Job_Type.default_base_salary → applied_base
  3. Capture Worker's weight for this Job_Type → applied_weight
  4. Create DailyMachineWorker with snapshots
  5. Snapshots never change (even if Job_Type.default_base_salary changes next month)

Benefits:
- Historical accuracy: payroll shows what was actually paid
- Audit trail: can see wage changes over time
- No recalculation: old jobs don't break when prices change
```

### Pattern 2: Bill Aggregation

```
Admin creates Bill for Customer:
  1. Select bookings (customer_id, date range, status)
  2. Create Bill record (customer_id, subtotal = Σ(booking.amount))
  3. Update Booking.bill_id, Booking.payment_status = ADDED_BILL
  4. Bill.status = OPEN, Bill.total_amount = subtotal + adjustment

Admin pays partial bill:
  1. Create BillPayment (bill_id, amount, payment_date, method)
  2. Update Bill.total_paid, Bill.status (OPEN → PARTIAL_PAID → COMPLETED)

Benefits:
- Auditable: each payment has timestamp + method
- Flexible: partial payments over time (common in agriculture)
- Traceable: bookings linked to bills for customer clarity
```

### Pattern 3: Payroll Aggregation

```
Admin creates Payroll for Worker:
  1. Select date range (e.g., 01-15 March)
  2. Fetch all DailyMachineWorker records for this worker, date range
  3. Sum wages: Σ(daily_quantity × applied_base × applied_weight)
  4. Fetch Advance_Payments (status UNPROCESSED) → total_adv
  5. Create Payroll_Sheet:
     - total_wages = sum from step 3
     - total_adv = sum from step 4
     - adjustment = manual adjustment (bonus/penalty)
     - net_payable = total_wages - total_adv + adjustment
     - Update Advance_Payment.status = PROCESSED, Advance_Payment.payroll_id = this payroll

Admin pays partial payroll:
  1. Create Payroll_Payment (payroll_id, amount, payment_date, method)
  2. Update Payroll_Sheet.total_paid, Payroll_Sheet.status

Benefits:
- Automatic aggregation: no manual summing
- Advance deduction: advances disappear from net pay
- Adjustment flexibility: bonuses/penalties captured
```

### Pattern 4: WorkDay Hub (Date-Centric)

```
Daily Operations:
  1. Admin creates WorkDay for today (date unique)
  2. Admin adds bookings to today via DailyBooking
  3. Admin adds machines to today via DailyMachine
  4. Admin assigns workers to machines via DailyMachineWorker
  5. Admin (optionally) traces which booking used which machine via DailyBookingMachine

Benefits:
- Flexibility: Booking can be created days before execution
- Rescheduling: Move booking to different WorkDay without modifying Booking
- Traceability: Can see exactly who/what worked on which job each day
- Date-driven dashboards: "What happened on 15 March?"
```

---

## 5. Authentication Flow

### NextAuth Credentials Provider

```
Login Request:
  1. User submits email + password (no registration in UI)
  2. NextAuth POST /api/auth/signin
  3. Prisma query User.password_hash (bcrypt compare)
  4. If match: create session token (JWT with HTTP-only cookie)
  5. Session persists across requests (cookie middleware)

Protected Routes:
  1. Layout component calls auth() (Server Component)
  2. If no session: redirect to /login
  3. If session: render page + pass session to client

Session Structure:
{
  user: { id, email, name, role },
  expires: ISO8601 timestamp
}
```

### Middleware Setup
```typescript
// src/lib/auth.config.ts
export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email, password },
      authorize(credentials) {
        const user = await db.user.findUnique({ where: { email } });
        if (bcrypt.compare(credentials.password, user.password_hash)) {
          return user;
        }
        return null;
      }
    })
  ],
  callbacks: {
    jwt: (token, user) => user ? { ...token, ...user } : token,
    session: (session, token) => ({ ...session, user: token })
  }
});
```

---

## 6. API & Server Actions

### No Traditional REST API
Instead, use **Next.js Server Actions** (type-safe RPC):

```typescript
// src/actions/bookings.ts
"use server"

export async function createBooking(input: BookingInput): Promise<Result<Booking>> {
  const session = await requireAuth();
  try {
    const data = BookingSchema.parse(input);
    return await db.booking.create({ data });
  } catch (error) {
    return { ok: false, error: "Validation failed" };
  }
}

// Client call:
const { mutate } = useMutation({
  mutationFn: (input) => createBooking(input),
  onSuccess: () => invalidateQueries(["bookings"]),
});
```

### Benefits
- **Type safety:** Compiler checks server ↔ client args
- **No serialization overhead:** Direct JS objects
- **Automatic dependency tracking:** TanStack Query invalidation tied to mutations
- **Security:** Sessions checked server-side only

### Transactional Operations
Complex multi-step operations use Prisma transactions:
```typescript
await db.$transaction(async (tx) => {
  const bill = await tx.bill.create({ data: { customer_id, total_amount } });
  await tx.booking.updateMany({
    where: { id: { in: bookingIds } },
    data: { bill_id: bill.id, payment_status: "ADDED_BILL" }
  });
  return bill;
});
```

---

## 7. Component Architecture

### Component Categories

#### Layout Components (`src/components/layout/`)
- **AppShell:** Main container (sidebar + header + main)
- **Sidebar:** Navigation tree (5 groups, 10 items)
- **Header:** Breadcrumbs, search, notifications, user menu
- **Breadcrumb:** Navigation path (`/customers` → `$customer_name`)

#### Data Display (`src/components/data-display/`)
- **DataTable:** Generic sortable/paginated table
  - Props: `columns` (ColumnDef array), `data`, `loading`, `onRowClick`
  - Features: column sorting, pagination, card/table view toggle, empty states
- **StatusBadge:** 14 WCAG AA color variants (see Design Guidelines)
- **KPI Card:** Stat card (value, label, change %)

#### Forms (`src/components/forms/`)
- **CurrencyInput:** VND input with formatting (1.000.000 đ)
- **QuantityInput:** Number input with +/− buttons
- **DatePicker:** Calendar (vi-VN locale, date-only)
- **MultiSelectCheckbox:** Checkbox group with search
- **FormField:** Wrapper for RHF + Zod integration

#### Dialogs (Feature-specific in page directories)
Examples:
- `/customers/[id]/customer-detail-sheet.tsx` — Customer info form
- `/bills/create-bill-dialog.tsx` — Booking selector + bill creation
- `/payroll/create-payroll-dialog.tsx` — Worker selector + advance picker

#### Status Badges (`src/components/status/`)
- **BookingStatusBadge:** Color-coded booking status
- **BillStatusBadge, PayrollStatusBadge, etc.:** 8 enum-specific wrappers

### Component Patterns

#### Server Components (Default)
```typescript
// src/app/(dashboard)/customers/page.tsx
export default async function CustomersPage() {
  const session = await requireAuth();
  const customers = await db.customer.findMany();
  return <CustomersList customers={customers} />;
}
```

#### Client Components (Interactive)
```typescript
// src/components/forms/currency-input.tsx
"use client"

export function CurrencyInput({ value, onChange }: Props) {
  return <input value={formatCurrency(value)} onChange={(e) => onChange(parseCurrency(e.target.value))} />;
}
```

#### Custom Hooks (TanStack Query)
```typescript
// src/hooks/use-customers.ts
export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => db.customer.findMany(),
  });
}

export function useCreateCustomer() {
  return useMutation({
    mutationFn: (input: CustomerInput) => createCustomer(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}
```

---

## 8. State Management

### Server State (TanStack Query)
- **Queries:** Fetch-once, cache, auto-invalidate on mutation
- **Mutations:** Create, update, delete + invalidation
- **Devtools:** React Query Devtools (browser)

### Client State (Zustand)
- **Auth Store:** Current user, session, minimal
```typescript
// src/store/auth-store.ts
export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

### No Redux/Context (KISS principle)
- TanStack Query handles async state
- Zustand handles global client state (minimal)
- Props/context for component-local state

---

## 9. Error Handling

### Result<T> Pattern
```typescript
// src/types/result.ts
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// Usage:
export async function createBill(...): Promise<Result<Bill>> {
  try {
    return { ok: true, data: await db.bill.create(...) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
```

### Validation Errors
```typescript
// Zod schema catches validation early
const BookingSchema = z.object({
  customer_id: z.string().min(1),
  amount: z.number().positive(),
});

try {
  BookingSchema.parse(input);
} catch (error) {
  // ZodError with field-level details
}
```

### User Feedback (Toast)
```typescript
// src/hooks/use-toast.ts
const { toast } = useToast();
// After mutation:
toast({ title: "Success", description: "Bill created" });
```

---

## 10. Performance Considerations

### Query Optimization
- **Indexes:** All FK fields indexed (machine_type_id, customer_id, status)
- **WorkDay date:** Unique + indexed (common filter)
- **Pagination:** Default 20 rows/page, max 100

### Caching Strategy
- **TanStack Query:** 5-min stale time (auto-refetch)
- **Mutations:** Invalidate affected queries (cascade)
- **Static pages:** Use ISR if dashboard stats need refresh

### Database Connection Pooling
- Prisma client singleton with middleware
- Retry logic for transient failures
- Decimal → Number serialization (Prisma middleware)

---

## 11. Deployment Architecture

### Vercel (Frontend)
- Deploy from main branch
- Environment variables injected at build time
- Auto-scaling, HTTPS, CDN, Edge Functions

### Supabase (Database)
- PostgreSQL 15+ managed
- Daily automated backups
- Row-Level Security ready (not used in MVP)
- PostgREST API (fallback if REST layer added)

### Environment Flow
```
Development:
  .env.local (local DB or Supabase dev instance)

Staging:
  VERCEL_URL=*.vercel.app
  DATABASE_URL=<staging-db>

Production:
  VERCEL_URL=yourapp.com (custom domain)
  DATABASE_URL=<prod-db> (Supabase)
```

---

## 12. Migration & Seeding

### Prisma Migrations
```bash
# Development
npx prisma migrate dev --name add_booking_status

# Production (CI/CD)
npx prisma migrate deploy
```

### Seeding Data
```bash
# src/scripts/seed.ts
npx ts-node src/scripts/seed.ts
# Creates: admin user, machine types, job types, sample services
```

---

**Version:** 1.0 | **Last Updated:** 2026-03-23 | **Owner:** Tech Lead
