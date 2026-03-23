# Code Standards & Development Conventions

## 1. File Naming Conventions

### TypeScript/JavaScript Files
- **Format:** kebab-case (lowercase, hyphen-separated)
- **Pattern:** descriptive-purpose.ts or descriptive-purpose.tsx
- **Goal:** Self-documenting names for LLM tools (Grep, Glob, Search)

**Examples:**
```
✅ currency-input.tsx          (component)
✅ use-customers.ts             (hook)
✅ booking-status-utils.ts      (utility)
✅ customer.ts                  (schema)
✅ daily-machine-worker.ts      (action)
✅ auth.config.ts               (configuration)

❌ CurrencyInput.tsx            (avoid PascalCase for files)
❌ useCustomers.ts              (avoid camelCase for files)
❌ bookingStatusUtils.ts        (avoid camelCase for files)
```

### React Components (Inside Files)
- **Format:** PascalCase (required by React)
- **Pattern:** `export function ComponentName() {}`

```typescript
// src/components/forms/currency-input.tsx
export function CurrencyInput({ value, onChange }: Props) {
  return <input value={formatCurrency(value)} onChange={...} />;
}

// Export with default for tree-shaking
export default CurrencyInput;
```

### Constants & Enums
- **Format:** SCREAMING_SNAKE_CASE
- **Examples:** NEW, IN_PROGRESS, PENDING_BILL, FULLY_PAID

```typescript
export enum BookingStatus {
  NEW = "NEW",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
```

### Functions & Variables
- **Format:** camelCase
- **Examples:** formatCurrency, createCustomer, parseBookingStatus

```typescript
export function formatCurrency(value: number): string { }
export const createCustomer = async (input) => { };
const parsedAmount = parseCurrency("1.000.000 đ");
```

---

## 2. File Size Management

### Target: Keep Files <200 Lines of Code
- **Reason:** Optimal context for LLM tools and code review
- **Measurement:** Actual code (exclude comments, blank lines)

### Refactoring Triggers
When a file exceeds 200 LOC, split into focused modules:

**Pattern 1: Extract Components**
```typescript
// ❌ CustomerDetail.tsx (~300 LOC)
export function CustomerDetail() {
  return (
    <div>
      <Tabs>
        <TabContent>...</TabContent>    // 80 LOC
        <TabContent>...</TabContent>    // 70 LOC
        <TabContent>...</TabContent>    // 60 LOC
      </Tabs>
    </div>
  );
}

// ✅ Refactored
// customer-detail.tsx (~40 LOC)
export function CustomerDetail() {
  return (
    <Tabs>
      <CustomerInfoTab />
      <CustomerLandsTab />
      <CustomerBillsTab />
    </Tabs>
  );
}

// customer-info-tab.tsx (~80 LOC)
export function CustomerInfoTab() { /* ... */ }

// customer-lands-tab.tsx (~70 LOC)
export function CustomerLandsTab() { /* ... */ }

// customer-bills-tab.tsx (~60 LOC)
export function CustomerBillsTab() { /* ... */ }
```

**Pattern 2: Extract Hooks**
```typescript
// ❌ BookingForm.tsx (~250 LOC with complex state)

// ✅ Refactored
// use-booking-form.ts (~80 LOC)
export function useBookingForm(bookingId?: string) {
  const [form, setForm] = useState(...);
  const { data: booking } = useBooking(bookingId);
  // ... setup logic
  return { form, isValid, submit };
}

// booking-form.tsx (~100 LOC)
export function BookingForm({ bookingId }: Props) {
  const { form, isValid, submit } = useBookingForm(bookingId);
  return <form>...</form>;
}
```

**Pattern 3: Extract Utilities**
```typescript
// ❌ booking-status-utils.ts (~300 LOC with many helpers)

// ✅ Refactored
// booking-status-transitions.ts (~50 LOC)
export function canTransitionTo(from: BookingStatus, to: BookingStatus): boolean { }

// booking-status-labels.ts (~30 LOC)
export function getStatusLabel(status: BookingStatus): string { }

// booking-status-colors.ts (~40 LOC)
export function getStatusColor(status: BookingStatus): string { }
```

---

## 3. Import Conventions

### Path Aliases (Must Use)
```typescript
// ✅ Correct: @/ aliases for absolute imports
import { CurrencyInput } from "@/components/forms/currency-input";
import { formatCurrency } from "@/lib/format";
import { useCustomers } from "@/hooks/use-customers";
import { db } from "@/lib/db";
import { BookingSchema } from "@/schemas/booking";
import { BookingStatus } from "@/types/enums";

// ❌ Wrong: Relative imports (avoid)
import { CurrencyInput } from "../../../components/forms/currency-input";
import { formatCurrency } from "../../lib/format";
```

### Import Organization (Order Matters)
```typescript
// 1. External dependencies (React, Next.js, libraries)
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

// 2. Project imports (@/ aliases)
import { CurrencyInput } from "@/components/forms/currency-input";
import { useCustomers } from "@/hooks/use-customers";
import { formatCurrency } from "@/lib/format";

// 3. Types & Enums
import { BookingStatus, PaymentStatus } from "@/types/enums";
import type { Booking } from "@/types";

// 4. Styles (if file has CSS)
import styles from "./customer-form.module.css";
```

### Avoid Deep Imports
```typescript
// ❌ Avoid deep imports (hard to refactor)
import CurrencyInput from "@/components/forms/currency-input/index.tsx";
import formatCurrency from "@/lib/format/currency";

// ✅ Use re-exports (easier to refactor)
import { CurrencyInput } from "@/components/forms";
import { formatCurrency } from "@/lib/format";
// (index.ts files re-export common items)
```

---

## 4. Component Patterns

### Functional Arrow Function (Preferred)
```typescript
// ✅ Preferred for components
interface Props {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const CurrencyInput = ({ value, onChange, disabled }: Props) => {
  return (
    <input
      type="text"
      value={formatCurrency(value)}
      onChange={(e) => onChange(parseCurrency(e.target.value))}
      disabled={disabled}
    />
  );
};
```

### Async Server Components
```typescript
// ✅ Server Component (default)
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function CustomersPage() {
  const session = await requireAuth();
  const customers = await db.customer.findMany();

  return <CustomersList customers={customers} />;
}
```

### Client Components (Mark Explicitly)
```typescript
// ✅ Client Component (explicitly marked)
"use client";

import { useState } from "react";
import { CurrencyInput } from "@/components/forms/currency-input";

export const CustomerForm = ({ onSubmit }: Props) => {
  const [amount, setAmount] = useState(0);

  return (
    <form onSubmit={() => onSubmit(amount)}>
      <CurrencyInput value={amount} onChange={setAmount} />
    </form>
  );
};
```

### Compound Components (For Complex UIs)
```typescript
// ✅ Compound pattern for complex components
export const Tabs = {
  Root: ({ children }: Props) => (
    <div className="tabs">{children}</div>
  ),

  List: ({ children }: Props) => (
    <div role="tablist">{children}</div>
  ),

  Tab: ({ children, isActive }: Props) => (
    <button role="tab" aria-selected={isActive}>{children}</button>
  ),

  Content: ({ children, isActive }: Props) => (
    isActive ? <div role="tabpanel">{children}</div> : null
  ),
};

// Usage
<Tabs.Root>
  <Tabs.List>
    <Tabs.Tab isActive={tab === 'info'}>Info</Tabs.Tab>
  </Tabs.List>
  <Tabs.Content isActive={tab === 'info'}>
    {/* content */}
  </Tabs.Content>
</Tabs.Root>
```

---

## 5. Form Pattern (React Hook Form + Zod + Server Action)

### Step 1: Define Zod Schema
```typescript
// src/schemas/customer.ts
import { z } from "zod";

export const CustomerSchema = z.object({
  name: z.string().min(1, "Tên khách hàng bắt buộc"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type CustomerInput = z.infer<typeof CustomerSchema>;
```

### Step 2: Create Server Action
```typescript
// src/actions/customers.ts
"use server";

import { CustomerSchema } from "@/schemas/customer";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function createCustomer(input: unknown): Promise<Result<Customer>> {
  const session = await requireAuth();

  try {
    const data = CustomerSchema.parse(input);
    const customer = await db.customer.create({ data });
    return { ok: true, data: customer };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error" };
  }
}
```

### Step 3: Create Hook
```typescript
// src/hooks/use-customers.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCustomer } from "@/actions/customers";

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      // Optionally redirect: useRouter().push("/customers");
    },
    onError: (error) => {
      // Toast notification
      console.error(error);
    },
  });
}
```

### Step 4: Create Form Component
```typescript
// src/app/(dashboard)/customers/create-customer-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerSchema, type CustomerInput } from "@/schemas/customer";
import { useCreateCustomer } from "@/hooks/use-customers";
import { useToast } from "@/hooks/use-toast";

export function CreateCustomerDialog({ onClose }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<CustomerInput>({
    resolver: zodResolver(CustomerSchema),
  });

  const { mutate, isPending } = useCreateCustomer();
  const { toast } = useToast();

  const onSubmit = (data: CustomerInput) => {
    mutate(data, {
      onSuccess: () => {
        toast({ title: "Tạo thành công", description: "Khách hàng mới được tạo" });
        onClose();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register("name")}
        placeholder="Tên khách hàng"
      />
      {errors.name && <span className="text-red-500">{errors.name.message}</span>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Đang lưu..." : "Lưu"}
      </button>
    </form>
  );
}
```

---

## 6. Data Table Pattern

### Define Columns
```typescript
// src/app/(dashboard)/customers/columns.ts
import { ColumnDef } from "@/components/data-display/data-table";
import { Customer } from "@prisma/client";

export const customerColumns: ColumnDef<Customer>[] = [
  {
    key: "name",
    label: "Tên khách hàng",
    sortable: true,
    render: (row) => row.name,
  },
  {
    key: "phone",
    label: "Số điện thoại",
    render: (row) => row.phone || "—",
  },
  {
    key: "address",
    label: "Địa chỉ",
    render: (row) => row.address || "—",
  },
  {
    key: "actions",
    label: "Hành động",
    render: (row) => (
      <button onClick={() => handleEdit(row.id)}>Sửa</button>
    ),
  },
];
```

### Use in Component
```typescript
// src/app/(dashboard)/customers/page.tsx
"use client";

import { useCustomers } from "@/hooks/use-customers";
import { DataTable } from "@/components/data-display/data-table";
import { customerColumns } from "./columns";

export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomers();

  return (
    <DataTable
      columns={customerColumns}
      data={customers ?? []}
      loading={isLoading}
      onRowClick={(row) => router.push(`/customers/${row.id}`)}
    />
  );
}
```

---

## 7. Error Handling

### Result<T> Pattern
```typescript
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function createBill(input: BillInput): Promise<Result<Bill>> {
  try {
    const data = BillSchema.parse(input);
    const bill = await db.bill.create({ data });
    return { ok: true, data: bill };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: "Dữ liệu không hợp lệ" };
    }
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Lỗi không xác định" };
  }
}
```

### Usage in Components
```typescript
const { mutate } = useMutation({
  mutationFn: createBill,
  onSuccess: (result) => {
    if (result.ok) {
      toast({ title: "Thành công", description: "Hóa đơn được tạo" });
    } else {
      toast({ title: "Lỗi", description: result.error, variant: "destructive" });
    }
  },
});
```

### Try-Catch Pattern (Legacy, Avoid)
```typescript
// ❌ Avoid if possible
try {
  const result = await createBill(input);
} catch (error) {
  // Hard to type, error might be undefined
}

// ✅ Prefer Result<T>
const result = await createBill(input);
if (result.ok) {
  // Use result.data
} else {
  // Use result.error
}
```

---

## 8. TypeScript Strict Mode

### No `any` Type
```typescript
// ❌ Never use any
function handleSubmit(data: any) { }

// ✅ Always type properly
function handleSubmit(data: CustomerInput): void { }
```

### Proper Union Types
```typescript
// ❌ Avoid loose unions
type Status = string;

// ✅ Use discriminated unions or enums
type Status = "NEW" | "IN_PROGRESS" | "COMPLETED";
// or
enum Status { NEW = "NEW", IN_PROGRESS = "IN_PROGRESS", COMPLETED = "COMPLETED" }
```

### Nullable Handling
```typescript
// ❌ Avoid optional chaining without null check
const price = booking?.amount?.toFixed(2);

// ✅ Explicit null checks
const price = booking && booking.amount ? booking.amount.toFixed(2) : "—";
// or
const price = booking?.amount?.toFixed(2) ?? "—";
```

---

## 9. Tailwind CSS Conventions

### Class Grouping
Organize Tailwind classes in consistent order:

```typescript
// ✅ Good order: layout → sizing → spacing → colors → effects
<div className="
  flex items-center justify-between
  w-full h-12
  px-4 py-2
  bg-white border border-gray-200 rounded-lg
  shadow-sm
">
  Content
</div>

// Alternative: Use string merger (cn function)
const buttonClasses = cn(
  "px-4 py-2 rounded-lg font-semibold",
  "bg-blue-500 text-white hover:bg-blue-600",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  variant === "outline" && "bg-transparent border-2 border-blue-500",
);
```

### Responsive Classes
```typescript
// ✅ Mobile-first approach
<div className="
  flex flex-col
  md:flex-row md:gap-4
  lg:px-8
">
  {/* Single column on mobile, row on tablet+, larger padding on desktop */}
</div>
```

### Custom CSS (Rare)
```css
/* ✅ Use globals.css for component patterns */
.currency-input {
  @apply block w-full px-3 py-2 border border-gray-300 rounded-md;
}
.currency-input:focus {
  @apply outline-none ring-2 ring-blue-500;
}
```

---

## 10. Code Review Checklist

Before committing, ensure:

- [ ] **File naming:** kebab-case for all `.ts`, `.tsx` files
- [ ] **File size:** <200 LOC (or justified)
- [ ] **Imports:** All use `@/` aliases
- [ ] **TypeScript:** No `any` types, strict mode passing
- [ ] **Components:** Functional, arrow functions, PascalCase names
- [ ] **Forms:** Use RHF + Zod + Server Action pattern
- [ ] **Server Actions:** Have `"use server"` directive, handle errors with Result<T>
- [ ] **TanStack Query:** Hooks export useQuery + useMutation with auto-invalidation
- [ ] **Tailwind:** Classes grouped logically, mobile-first responsive
- [ ] **Vietnamese locale:** All UI text in Vietnamese, VND for currency
- [ ] **No hardcoded strings:** Use enums/constants
- [ ] **Comments:** Complex logic has JSDoc comments
- [ ] **Accessibility:** Images have alt text, buttons have aria labels (if needed)

---

## 11. YAGNI / KISS / DRY Principles

### YAGNI: You Aren't Gonna Need It
```typescript
// ❌ Over-engineering (abstraction for possible future use)
export interface DataAdapter<T> {
  fetch: () => Promise<T[]>;
  create: (data: T) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
  // ... 10 more methods
}

// ✅ Build what's needed now
export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: listCustomers,
  });
}

export function useCreateCustomer() {
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => invalidateQueries(["customers"]),
  });
}
```

### KISS: Keep It Simple, Stupid
```typescript
// ❌ Complex (hard to understand)
const statusOrder = { NEW: 0, IN_PROGRESS: 1, COMPLETED: 2 };
const sorted = items.sort((a, b) =>
  (statusOrder[a.status] ?? 999) - (statusOrder[b.status] ?? 999)
);

// ✅ Simple (explicit, readable)
const statusOrder: Record<BookingStatus, number> = {
  NEW: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
};

const sorted = items.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
```

### DRY: Don't Repeat Yourself
```typescript
// ❌ Repeated validation logic
if (!email) throw new Error("Email required");
if (!email.includes("@")) throw new Error("Invalid email");

if (!phone) throw new Error("Phone required");
if (!phone.match(/^\d{10}$/)) throw new Error("Invalid phone");

// ✅ Extracted to Zod schema (reused everywhere)
const CustomerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().regex(/^\d{10}$/, "Số điện thoại không hợp lệ"),
});

// Used in: Server Action, form validation, API endpoint
```

---

## 12. Commit Message Format

### Conventional Commits
```
type(scope): message

Examples:
feat(customers): add customer creation form
fix(currency): handle negative values in CurrencyInput
refactor(layout): extract sidebar to separate component
docs(README): update installation instructions
test(bookings): add createBooking unit tests
chore(deps): upgrade Next.js to 16.1
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactor (no feature change)
- `docs:` Documentation
- `test:` Tests
- `chore:` Dependencies, config, tooling

---

**Version:** 1.0 | **Last Updated:** 2026-03-23 | **Owner:** Tech Lead
