# Design Guidelines & UI/UX Patterns

## 1. Status Badge Color System

### 14 WCAG AA Compliant Badge Variants

All status badges follow consistent color scheme ensuring accessible contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text).

#### Booking Status Badges (5 variants)

| Status | Background | Text | Usage |
|--------|------------|------|-------|
| NEW | bg-blue-100 | text-blue-900 | Booking just created, not started |
| IN_PROGRESS | bg-yellow-100 | text-yellow-900 | Work in progress on land |
| BLOCKED | bg-orange-100 | text-orange-900 | Awaiting customer/weather |
| COMPLETED | bg-green-100 | text-green-900 | Job finished, ready to bill |
| CANCELED | bg-red-100 | text-red-900 | Customer canceled |

#### Bill Status Badges (3 variants)

| Status | Background | Text | Usage |
|--------|------------|------|-------|
| OPEN | bg-blue-100 | text-blue-900 | Bill issued, unpaid |
| PARTIAL_PAID | bg-yellow-100 | text-yellow-900 | Partial payment received |
| COMPLETED | bg-green-100 | text-green-900 | Fully paid |

#### Payroll Status Badges (3 variants)

| Status | Background | Text | Usage |
|--------|------------|------|-------|
| OPEN | bg-blue-100 | text-blue-900 | Payroll calculated, unpaid |
| PARTIAL_PAID | bg-yellow-100 | text-yellow-900 | Partial payment to worker |
| COMPLETED | bg-green-100 | text-green-900 | Fully paid to worker |

#### Machine Status Badges (3 variants)

| Status | Background | Text | Usage |
|--------|------------|------|-------|
| AVAILABLE | bg-green-100 | text-green-900 | Ready to use |
| IN_USE | bg-blue-100 | text-blue-900 | Currently assigned to job |
| MAINTENANCE | bg-red-100 | text-red-900 | Under repair/maintenance |

### Badge Component Usage

```typescript
// src/components/status/booking-status-badge.tsx
export function BookingStatusBadge({ status }: Props) {
  const colors = {
    NEW: "bg-blue-100 text-blue-900",
    IN_PROGRESS: "bg-yellow-100 text-yellow-900",
    BLOCKED: "bg-orange-100 text-orange-900",
    COMPLETED: "bg-green-100 text-green-900",
    CANCELED: "bg-red-100 text-red-900",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status]}`}>
      {getStatusLabel(status)}
    </span>
  );
}
```

### Label Translations (Vietnamese)

| Status | Vietnamese Label |
|--------|------------------|
| NEW | Mới tạo |
| IN_PROGRESS | Đang làm |
| BLOCKED | Tạm ngừng |
| COMPLETED | Hoàn thành |
| CANCELED | Đã hủy |
| OPEN | Chưa thanh toán |
| PARTIAL_PAID | Thanh toán một phần |
| FULLY_PAID | Đã thanh toán |
| AVAILABLE | Sẵn sàng |
| IN_USE | Đang sử dụng |
| MAINTENANCE | Bảo trì |

---

## 2. Tailwind CSS Patterns

### Layout Patterns

#### Flex Container (Centering)
```tsx
// Center content horizontally & vertically
<div className="flex items-center justify-center h-screen">
  {/* centered content */}
</div>

// Space between items (left/right)
<div className="flex items-center justify-between px-4 py-2">
  {/* left */ }
  {/* right */}
</div>

// Column layout (stack vertically)
<div className="flex flex-col gap-4">
  {/* items stack vertically */}
</div>
```

#### Grid Layout
```tsx
// 3-column grid (responsive)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* grid items */}
</div>

// Responsive sidebar + main (collapsible)
<div className="grid grid-cols-1 md:grid-cols-[256px_1fr] gap-0">
  <Sidebar /> {/* Full width on mobile, fixed on tablet+ */}
  <Main />
</div>
```

### Spacing Patterns

```tsx
// Padding/Margin (VND: 4px, 8px, 12px, 16px, 24px, 32px increments)
<div className="px-4 py-2">
  {/* 16px horizontal, 8px vertical padding */}
</div>

<div className="mb-4 mt-2">
  {/* 16px bottom margin, 8px top margin */}
</div>

// Gap between items
<div className="flex gap-3">
  {/* 12px gap between flex items */}
</div>
```

### Text Patterns

```tsx
// Heading hierarchy
<h1 className="text-3xl font-bold">Page Title</h1>
<h2 className="text-2xl font-semibold">Section</h2>
<h3 className="text-lg font-semibold">Subsection</h3>

// Body text
<p className="text-base text-gray-600">Regular paragraph text</p>
<p className="text-sm text-gray-500">Secondary text (labels, hints)</p>

// Emphasis
<strong className="font-semibold">Emphasized text</strong>
<em className="italic">Italicized text</em>
```

### Button Patterns

```tsx
// Primary button
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
  Lưu
</button>

// Secondary button (outline)
<button className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
  Hủy
</button>

// Danger button (red)
<button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
  Xóa
</button>

// Ghost button (minimal)
<button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg">
  Chi tiết
</button>
```

### Form Patterns

```tsx
// Form field with label & error
<div className="flex flex-col gap-2">
  <label htmlFor="name" className="text-sm font-medium">
    Tên khách hàng
  </label>
  <input
    id="name"
    type="text"
    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder="Nhập tên"
  />
  {error && <span className="text-sm text-red-600">{error}</span>}
</div>

// Select/Dropdown
<select className="px-3 py-2 border border-gray-300 rounded-lg bg-white">
  <option>Chọn loại máy</option>
  <option>Máy cắt lúa</option>
</select>

// Checkbox
<label className="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" className="w-4 h-4" />
  <span className="text-sm">I agree</span>
</label>
```

---

## 3. shadcn/ui Component Usage

### Button
```tsx
import { Button } from "@/components/ui/button";

<Button>Click me</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Small</Button>
<Button disabled>Disabled</Button>
```

### Card
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Doanh thu tháng này</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold">5.000.000 đ</p>
  </CardContent>
</Card>
```

### Dialog
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Tạo khách hàng mới</DialogTitle>
    </DialogHeader>
    {/* form content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Hủy
      </Button>
      <Button onClick={handleSubmit}>Lưu</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Tabs
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="info">
  <TabsList>
    <TabsTrigger value="info">Thông tin</TabsTrigger>
    <TabsTrigger value="lands">Đất đai</TabsTrigger>
    <TabsTrigger value="bills">Hóa đơn</TabsTrigger>
  </TabsList>
  <TabsContent value="info">
    {/* info content */}
  </TabsContent>
  <TabsContent value="lands">
    {/* lands content */}
  </TabsContent>
</Tabs>
```

### Popover
```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Tuỳ chọn</Button>
  </PopoverTrigger>
  <PopoverContent>
    {/* popover menu */}
  </PopoverContent>
</Popover>
```

### Tooltip
```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost">?</Button>
    </TooltipTrigger>
    <TooltipContent>
      Số lượng công việc chưa hoàn thành
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## 4. DataTable Component Patterns

### Define Columns
```typescript
import { ColumnDef } from "@/components/data-display/data-table";

export const bookingColumns: ColumnDef<Booking>[] = [
  {
    key: "id",
    label: "ID",
    sortable: true,
    width: "120px",
    render: (row) => row.id.slice(0, 8),
  },
  {
    key: "customer_name",
    label: "Khách hàng",
    sortable: true,
    render: (row) => row.customer?.name || "—",
  },
  {
    key: "amount",
    label: "Số tiền",
    sortable: true,
    align: "right",
    render: (row) => formatCurrency(row.amount || 0),
  },
  {
    key: "status",
    label: "Trạng thái",
    sortable: true,
    render: (row) => <BookingStatusBadge status={row.status} />,
  },
  {
    key: "actions",
    label: "",
    width: "100px",
    render: (row) => (
      <button onClick={() => handleEdit(row.id)}>Sửa</button>
    ),
  },
];
```

### Use in Page
```tsx
"use client";

import { DataTable } from "@/components/data-display/data-table";
import { useBookings } from "@/hooks/use-bookings";
import { bookingColumns } from "./columns";

export default function BookingsPage() {
  const { data: bookings, isLoading } = useBookings();
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Đơn hàng</h1>
        <Button onClick={() => router.push("/bookings/new")}>
          + Tạo mới
        </Button>
      </div>

      <DataTable
        columns={bookingColumns}
        data={bookings ?? []}
        loading={isLoading}
        onRowClick={(row) => router.push(`/bookings/${row.id}`)}
      />
    </div>
  );
}
```

---

## 5. Vietnamese Locale UI Conventions

### Date Display
```typescript
import { formatDateShort, formatDate, formatRelativeDate } from "@/lib/format";

formatDateShort(new Date("2026-03-15")); // "15/03/2026"
formatDate(new Date("2026-03-15")); // "15 tháng 3, 2026"
formatRelativeDate(new Date("2026-03-15")); // "2 ngày trước"
```

### Currency Display
```typescript
import { formatCurrency, parseCurrency } from "@/lib/format";

formatCurrency(1000000); // "1.000.000 đ"
formatCurrency(1000000, false); // "1.000.000"
parseCurrency("1.000.000 đ"); // 1000000
```

### Vietnamese Labels (Common)

```typescript
// Status labels
const statusLabels = {
  NEW: "Mới tạo",
  IN_PROGRESS: "Đang làm",
  COMPLETED: "Hoàn thành",
  OPEN: "Chưa thanh toán",
  PARTIAL_PAID: "Thanh toán một phần",
  FULLY_PAID: "Đã thanh toán",
};

// Action labels
const actionLabels = {
  CREATE: "Tạo mới",
  EDIT: "Sửa",
  DELETE: "Xóa",
  SAVE: "Lưu",
  CANCEL: "Hủy",
  CONFIRM: "Xác nhận",
  BACK: "Quay lại",
  NEXT: "Tiếp theo",
  PREVIOUS: "Trước",
};

// Field labels
const fieldLabels = {
  NAME: "Tên",
  PHONE: "Số điện thoại",
  ADDRESS: "Địa chỉ",
  EMAIL: "Email",
  DATE: "Ngày",
  AMOUNT: "Số tiền",
  QUANTITY: "Số lượng",
  NOTES: "Ghi chú",
};
```

### Number Input Locale
```tsx
// Use CurrencyInput for monetary values
<CurrencyInput
  value={amount}
  onChange={setAmount}
  placeholder="Nhập số tiền (VND)"
/>

// Use QuantityInput for quantities
<QuantityInput
  value={quantity}
  onChange={setQuantity}
  min={0}
  step={0.5}
  label="Số công"
/>

// Standard input for other numbers
<input
  type="number"
  value={count}
  onChange={(e) => setCount(parseFloat(e.target.value))}
  placeholder="Nhập số lượng"
/>
```

---

## 6. Form Layout Conventions

### Single Column Layout
```tsx
<form className="space-y-4 max-w-md">
  <div className="space-y-2">
    <label>Tên khách hàng *</label>
    <input type="text" placeholder="Nhập tên" />
  </div>

  <div className="space-y-2">
    <label>Số điện thoại</label>
    <input type="tel" placeholder="Nhập số điện thoại" />
  </div>

  <div className="space-y-2">
    <label>Địa chỉ</label>
    <textarea placeholder="Nhập địa chỉ"></textarea>
  </div>

  <div className="flex gap-2 pt-4">
    <Button type="submit" className="flex-1">
      Lưu
    </Button>
    <Button type="button" variant="outline" className="flex-1">
      Hủy
    </Button>
  </div>
</form>
```

### Two Column Layout (Responsive)
```tsx
<form className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <label>Khách hàng *</label>
      <select>{/* options */}</select>
    </div>

    <div className="space-y-2">
      <label>Ngày *</label>
      <DatePicker value={date} onChange={setDate} />
    </div>
  </div>

  <div className="space-y-2">
    <label>Ghi chú</label>
    <textarea placeholder="Nhập ghi chú..."></textarea>
  </div>

  <div className="flex gap-2">
    <Button type="submit">Lưu</Button>
    <Button type="button" variant="outline">
      Hủy
    </Button>
  </div>
</form>
```

### Dialog Form Layout
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Tạo khách hàng mới</DialogTitle>
    </DialogHeader>

    <form className="space-y-4">
      <div className="space-y-2">
        <label>Tên khách hàng *</label>
        <input type="text" placeholder="Nhập tên" />
      </div>

      <div className="space-y-2">
        <label>Số điện thoại</label>
        <input type="tel" placeholder="Nhập số điện thoại" />
      </div>
    </form>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Hủy
      </Button>
      <Button type="submit">Lưu</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 7. Empty States & Loading States

### Empty State
```tsx
import { AlertCircle } from "lucide-react";

export function EmptyState({ title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
}

// Usage
{bookings.length === 0 && (
  <EmptyState
    title="Không có đơn hàng"
    description="Tạo đơn hàng đầu tiên để bắt đầu"
  />
)}
```

### Loading Skeleton
```tsx
export function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// Usage
{isLoading ? <TableSkeleton /> : <DataTable {...props} />}
```

### Loading Spinner
```tsx
import { Loader2 } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      <span className="ml-2 text-sm text-gray-600">Đang tải...</span>
    </div>
  );
}
```

---

## 8. Responsive Design Patterns

### Mobile-First Approach
```tsx
// Default (mobile): Single column
// md (768px+): Two columns
// lg (1024px+): Three columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* grid items */}
</div>

// Mobile: Stacked, Tablet+: Side by side
<div className="flex flex-col md:flex-row gap-4">
  <Sidebar />
  <Main />
</div>

// Mobile: Full width, Tablet+: Constrained width
<div className="w-full md:max-w-2xl md:mx-auto px-4">
  {/* content */}
</div>
```

### Responsive Text Sizes
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Page Title
</h1>

<p className="text-base md:text-lg text-gray-600">
  Body text scales with screen size
</p>
```

---

**Version:** 1.0 | **Last Updated:** 2026-03-23 | **Owner:** Design Lead
