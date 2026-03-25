# Agri-ERP Codebase Scout Report

## 1. Database Schema (Prisma Models)

### Auth
- **User**: id, name, email, password_hash, role (ADMIN), timestamps

### Masters (Reference Data)
- **MachineType**: id, name, description; owns Job_Type[], relates Service via ServiceMachineType
- **Job_Type**: id, machine_type_id, name, default_base_salary; used for worker salary snapshots
- **Service**: id, name, unit (default: "công"), price, description; many-to-many with MachineType via ServiceMachineType
- **ServiceMachineType**: composite PK (service_id, machine_type_id)
- **Worker**: id, name, phone, address; owns Advance_Payment[], Payroll_Sheet[], DailyMachineWorker[]
- **Machine**: id, name, model, machine_type_id, purchase_date, status (MachineStatus), owns MaintenanceLog[], DailyMachine[]

### Customers & Land
- **Customer**: id, name, phone, address; owns Land[], Bill[], Booking[]
- **Land**: id, customer_id, name, gps_lat, gps_lng; owns Booking[]

### Operations (Date-Centric)
- **WorkDay**: id, date (unique), notes; owns DailyBooking[], DailyMachine[] (hub model)
- **Booking**: id, customer_id, land_id, amount, status (BookingStatus), payment_status (PaymentStatus), bill_id, notes; owns DailyBooking[]
- **DailyBooking**: id, work_day_id, booking_id, amount, notes (unique constraint on work_day+booking); owns DailyBookingMachine[]
- **DailyMachine**: id, work_day_id, machine_id, amount, notes (unique constraint on work_day+machine); owns DailyMachineWorker[], DailyBookingMachine[]
- **DailyMachineWorker**: id, daily_machine_id, worker_id, job_type_id, applied_base, applied_weight, payment_adjustment, payroll_id, payment_status (JobPaymentStatus); snapshot model for worker assignment
- **DailyBookingMachine**: id, daily_booking_id, daily_machine_id (composite PK); traceability link

### Financials
- **Bill**: id, customer_id, total_amount, total_paid, status (BillStatus), adjustment, notes, subtotal; owns BillPayment[], Booking[]
- **BillPayment**: id, bill_id, amount, payment_date, method (PaymentMethod), notes
- **Advance_Payment**: id, worker_id, amount, status (AdvanceStatus), payroll_id, notes; advance wage draws
- **Payroll_Sheet**: id, worker_id, total_wages, total_adv, adjustment, net_payable, total_paid, status (PayrollStatus), notes; owns Payroll_Payment[], DailyMachineWorker[], Advance_Payment[]
- **Payroll_Payment**: id, payroll_id, amount, payment_date, method, notes

### Maintenance
- **MaintenanceCategory**: id, name (unique), owns MaintenanceLog[]
- **MaintenanceLog**: id, machine_id, category_id, brand, price, quantity, maintenance_date, notes

### Enums
- **MachineStatus**: AVAILABLE, IN_USE, MAINTENANCE
- **BookingStatus**: NEW, IN_PROGRESS, BLOCKED, COMPLETED, CANCELED
- **PaymentStatus**: PENDING_BILL, ADDED_BILL, FULLY_PAID
- **JobPaymentStatus**: PENDING_PAYROLL, ADDED_PAYROLL, FULLY_PAID
- **PaymentMethod**: CASH, BANK_TRANSFER
- **BillStatus**: OPEN, PARTIAL_PAID, COMPLETED
- **AdvanceStatus**: UNPROCESSED, PROCESSED
- **PayrollStatus**: OPEN, PARTIAL_PAID, COMPLETED

---

## 2. Server Actions (src/actions/)

### customers.ts
- **Create**: createCustomer(input) → Result<Customer>
- **Update**: updateCustomer(id, input) → Result<Customer>
- **Delete**: deleteCustomer(id) → Result<void>
- **List**: listCustomers() → Customer[]
- **Get**: getCustomer(id) → Customer + lands + bookings + bills (with Decimal→Number conversion)
- **Create Land**: createLand(input) → Result<Land>
- **Update Land**: updateLand(id, input) → Result<Land>
- **Delete Land**: deleteLand(id) → Result<void>

### bookings.ts
- **Create**: createBooking(input) → Result<Booking>
- **Update**: updateBooking(id, input) → Result<Booking>
- **Delete**: deleteBooking(id) → Result<void> (prevents delete if bill_id exists)
- **List**: listBookings() → Booking[] + customer, land, daily_bookings
- **Get**: getBooking(id) → Booking + full hierarchy (machines/workers per daily_booking)

### machines.ts
- **Create**: createMachine(input) → Result<Machine>
- **Update**: updateMachine(id, input) → Result<Machine>
- **Delete**: deleteMachine(id) → Result<void>
- **List**: listMachines() → Machine[] + machine_type + job_types
- **Get**: getMachine(id) → Machine + maintenance_logs + daily_machines + workers (take 20)

### workers.ts
- **Create**: createWorker(input) → Result<Worker>
- **Update**: updateWorker(id, input) → Result<Worker>
- **Delete**: deleteWorker(id) → Result<void>
- **List**: listWorkers() → Worker[] + count daily_workers
- **Get**: getWorker(id) → Worker + daily_workers + job_types + advance_payments + payroll_sheets
- **Create Advance**: createAdvancePayment(input) → Result<Advance_Payment>
- **Update Advance**: updateAdvancePayment(id, input) → Result<Advance_Payment> (prevents amount change if payroll_id)
- **Delete Advance**: deleteAdvancePayment(id) → Result<void> (prevents delete if payroll_id)
- **List Pending Daily Workers**: listPendingDailyWorkers(workerId) → DailyMachineWorker[] (PENDING_PAYROLL)
- **List Payroll Daily Workers**: listPayrollDailyWorkers(payrollId) → DailyMachineWorker[]

### bills.ts
- **Create**: createBill(input) → Result<Bill> (transaction: validates bookings, calculates total, updates booking status)
- **Update**: updateBill(id, input) → Result<Bill> (financial edits only if OPEN + total_paid=0, else notes-only)
- **Delete**: deleteBill(id) → Result<void> (prevents if total_paid > 0, resets booking status)
- **List**: listBills() → Bill[] + customer + bookings
- **Get**: getBill(id) → Bill + customer + bookings + lands + payments
- **Add Payment**: addBillPayment(input) → Result<Bill> (updates total_paid, transitions status to PARTIAL_PAID/COMPLETED)

### payroll.ts
- **Create**: createPayroll(input) → Result<Payroll_Sheet> (transaction: validates jobs+advances, calculates net_payable, updates statuses)
- **Update**: updatePayroll(input) → Result<Payroll_Sheet> (full recalc if not paid, notes-only if paid)
- **Delete**: deletePayroll(id) → Result<void> (prevents if total_paid > 0, resets daily_workers + advances)
- **List**: listPayrolls() → Payroll_Sheet[] + worker + daily_workers + advances
- **Get**: getPayroll(id) → Payroll_Sheet + full details + payments
- **Add Payment**: addPayrollPayment(input) → Result<Payroll_Sheet> (updates total_paid, transitions status, marks daily_workers FULLY_PAID if complete)

### services.ts
- **Create**: createService(input) → Result<Service> (supports machine_type_ids many-to-many)
- **Update**: updateService(id, input) → Result<Service> (recreates ServiceMachineType associations)
- **Delete**: deleteService(id) → Result<void>
- **List**: listServices() → Service[] + machine_types

### machine-types.ts
- **Create MachineType**: createMachineType(input) → Result<MachineType> (nested job_types creation)
- **Update MachineType**: updateMachineType(id, input) → Result<MachineType>
- **Delete MachineType**: deleteMachineType(id) → Result<void> (guards: no linked machines, no worker history)
- **List MachineType**: listMachineTypes() → MachineType[] + job_types + machine count
- **Get MachineType**: getMachineType(id) → MachineType + job_types + machines
- **Create JobType**: createJobType(machine_type_id, input) → Result<Job_Type>
- **Update JobType**: updateJobType(id, input) → Result<Job_Type>
- **Delete JobType**: deleteJobType(id) → Result<void> (prevents if used in DailyMachineWorker)

### work-days.ts
- **Create**: createWorkDay(input) → Result<WorkDay> (normalizes date to UTC midnight, checks uniqueness)
- **Update**: updateWorkDay(id, input) → Result<WorkDay>
- **Delete**: deleteWorkDay(id) → Result<void>
- **List**: listWorkDays() → WorkDay[] + counts + daily_bookings.amount + daily_machines.amount
- **Get**: getWorkDay(id) → WorkDay + full daily_bookings + daily_machines with workers/machines/bookings
- **Get by Date**: getWorkDayByDate(date) → WorkDay
- **Add Daily Booking**: addDailyBooking(id, bookingId, amount?) → Result<DailyBooking>
- **Remove Daily Booking**: removeDailyBooking(id, dailyBookingId) → Result<void>
- **Add Daily Machine**: addDailyMachine(id, machineId, amount, assignments[]) → Result<DailyMachine> (transaction, creates DailyMachineWorker with salary snapshot)
- **Remove Daily Machine**: removeDailyMachine(id, dailyMachineId) → Result<void>
- **Link Machine to Booking**: linkMachineToBooking(workDayId, dailyBookingId, dailyMachineId) → Result<void>

### daily-bookings.ts
- **Add Booking to Day**: addBookingToDay(input) → Result<DailyBooking> (prevents duplicate work_day+booking)
- **Update Daily Booking**: updateDailyBooking(id, input) → Result<DailyBooking>
- **Remove Booking from Day**: removeBookingFromDay(id) → Result<void>
- **Link Machine to Booking**: linkMachineToBooking(input) → Result<void>
- **Unlink Machine from Booking**: unlinkMachineFromBooking(daily_booking_id, daily_machine_id) → Result<void>

### daily-machines.ts
- **Add Machine to Day**: addMachineToDay(input) → Result<DailyMachine> (transaction, auto-creates worker entries)
- **Update Daily Machine**: updateDailyMachine(id, input) → Result<DailyMachine>
- **Remove Machine from Day**: removeMachineFromDay(id) → Result<void>
- **Assign Worker to Slot**: assignWorkerToSlot(input) → Result<DailyMachineWorker> (snapshots salary if not provided)
- **Remove Worker from Machine**: removeWorkerFromMachine(id) → Result<void>
- **Helper**: _createWorkerEntry(tx, daily_machine_id, worker_id, job_type_id, applied_base?, applied_weight?, notes?) → DailyMachineWorker

### machine-logs.ts
- **List Categories**: getMaintenanceCategories() → { success, data: MaintenanceCategory[] }
- **Get Logs**: getMaintenanceLogs(machineId) → { success, data: MaintenanceLog[] (serialized Decimal→Number) }
- **Create Log**: createMaintenanceLog(data) → { success, data: MaintenanceLog } (auto-creates category if not exists)
- **Delete Log**: deleteMaintenanceLog(id) → { success, data? }

### advances.ts (inferred from glob)
- Likely CRUD for advance payments; see workers.ts

---

## 3. Zod Schemas (src/schemas/)

### customer.ts
- **createCustomerSchema**: name (1-200), phone? (max 20), address? (max 500)
- **updateCustomerSchema**: .partial()
- **createLandSchema**: customer_id (required), name (1-200), gps_lat? (-90 to 90), gps_lng? (-180 to 180)
- **updateLandSchema**: .partial() minus customer_id

### booking.ts
- **createBookingSchema**: customer_id (required), land_id?, amount? (≥0), notes? (max 500)
- **updateBookingSchema**: status? (BookingStatus enum), land_id?, amount? (≥0), notes?

### bill.ts
- **createBillSchema**: customer_id (required), booking_ids (1+ strings), adjustment?, notes? (max 500); defaults adjustment=0
- **updateBillSchema**: booking_ids?, adjustment?, notes?

### payroll.ts
- **createPayrollSchema**: worker_id (required), job_ids (1+ strings), advance_payment_ids?, adjustment? (default 0), notes? (max 1000)

### worker.ts
- **createWorkerSchema**: name (1-200), phone? (max 20), address? (max 500)
- **updateWorkerSchema**: .partial()
- **createAdvancePaymentSchema**: worker_id (required), amount (>0), notes? (max 500)
- **updateAdvancePaymentSchema**: amount? (>0), notes?

### machine.ts
- **createMachineSchema**: name (1-200), model? (max 100), machine_type_id (required), purchase_date?
- **updateMachineSchema**: name?, model?, machine_type_id?, purchase_date?, status?

### service.ts
- **createServiceSchema**: name (1-200), unit (1-50), price (≥0), description? (max 500), machine_type_ids?
- **updateServiceSchema**: .partial()

### machine-type.ts
- **createMachineTypeSchema**: name (1-200), description? (max 500), job_types (array of {name, default_base_salary})?
- **updateMachineTypeSchema**: name?, description?
- **createJobTypeSchema**: name (1-200), default_base_salary (≥0)
- **updateJobTypeSchema**: .partial()

### work-day.ts
- **createWorkDaySchema**: date (coerce), notes? (max 500)
- **updateWorkDaySchema**: notes?
- **addDailyBookingSchema**: work_day_id, booking_id, amount? (≥0), notes?
- **updateDailyBookingSchema**: amount? (≥0), notes?
- **addDailyMachineSchema**: work_day_id, machine_id, amount? (≥0), notes?, workers? (array of {worker_id, job_type_id})
- **updateDailyMachineSchema**: amount? (≥0), notes?
- **assignWorkerSchema**: daily_machine_id, worker_id, job_type_id, applied_base?, applied_weight?, notes?
- **linkMachineToBookingSchema**: daily_booking_id, daily_machine_id

### payment.ts
- **addBillPaymentSchema**: bill_id, amount (>0), payment_date, method (CASH|BANK_TRANSFER), notes?
- **addPayrollPaymentSchema**: payroll_id, amount (>0), payment_date, method (CASH|BANK_TRANSFER), notes?

### machine-logs.ts (inferred)
- **createMaintenanceLogSchema**: machine_id, category_name, brand?, price?, quantity?, maintenance_date, notes?

---

## 4. Type Definitions (src/types/)

### enums.ts
- **BookingStatus**: New, InProgress, Blocked, Completed, Canceled
- **PaymentStatus**: PendingBill, AddedBill, FullyPaid
- **JobPaymentStatus**: PendingPayroll, AddedPayroll, FullyPaid
- **BillStatus**: Open, PartialPaid, Completed
- **PayrollStatus**: Open, PartialPaid, Completed
- **MachineStatus**: Available, InUse, Maintenance
- **PaymentMethod**: Cash, BankTransfer
- **AdvanceStatus**: Unprocessed, Processed
- **StatusVariant**: "new" | "in-progress" | "completed" | "blocked" | "canceled" | "pending" | "partial" | "paid" | "open" | "available" | "in-use" | "maintenance"

### result.ts
- **Result<T>**: `{ success: true; data: T } | { success: false; error: string }`

### index.ts
- Exports enums, result, and Prisma-generated types: Job_Type, Worker, Machine, Customer, Land, Booking, Bill, Advance_Payment, Payroll_Sheet, Service

---

## 5. Utility Libraries (src/lib/)

### db.ts
- **PrismaClient** singleton with custom adapter (PrismaPg)
- **Pool** singleton (pg connection pool, max 10 connections)
- **Decimal→Number serialization** via Prisma.$extends() middleware (all operations)
- Automatic connection cleanup on process exit

### format.ts
- **formatCurrency(value, showSymbol)**: VND formatting with locale "vi-VN" (e.g., "1.000.000 đ")
- **parseCurrency(value)**: Parses "1.000.000 đ" → 1000000
- **formatNumber(value)**: Thousand separators (e.g., "1.000.000")
- **formatDate(date, options)**: Vietnamese locale date (default: "long" format)
- **formatDateShort(date)**: DD/MM/YYYY
- **formatDateTime(date)**: DD/MM/YYYY HH:mm
- **formatRelativeDate(date)**: "2 days ago", "1 hour ago", "Vừa xong"

### auth.ts
- **getSession()**: Returns current auth session
- **requireAuth()**: Throws if no session, returns session

### utils.ts
- **cn(...inputs)**: clsx + tailwind-merge utility

### auth.config.ts, auth.base.config.ts
- (Imports from these inferred; details not visible)

---

## 6. React Query Hooks (src/hooks/)

### use-customers.ts
- **useCustomers()**: Query ['customers'], fetches listCustomers(), stale 60s
- **useCustomer(id)**: Query ['customers', id], enabled if id
- **useCreateCustomer()**: Mutation, invalidates ['customers'], shows toast
- **useUpdateCustomer()**: Mutation, invalidates ['customers', id], shows toast
- **useDeleteCustomer()**: Mutation, invalidates ['customers'], shows toast
- **useCreateLand()**: Mutation, invalidates ['customers']
- **useUpdateLand()**: Mutation, invalidates ['customers']
- **useDeleteLand()**: Mutation, invalidates ['customers']

### use-bookings.ts
- **useBookings(options?)**: Query ['bookings'], enabled option
- **useBooking(id)**: Query ['bookings', id], enabled if id
- **useCreateBooking()**: Mutation, invalidates ['bookings', 'customers']
- **useUpdateBooking()**: Mutation, invalidates ['bookings', 'bookings', id, 'customers']
- **useDeleteBooking()**: Mutation, invalidates ['bookings', 'customers']

### use-machines.ts
- **useMachines()**: Query ['machines']
- **useMachine(id)**: Query ['machines', id], enabled if id
- **useCreateMachine()**: Mutation, invalidates ['machines']
- **useUpdateMachine()**: Mutation, invalidates ['machines', 'machines', id]
- **useDeleteMachine()**: Mutation, invalidates ['machines']

### use-workers.ts, use-bills.ts, use-payroll.ts, use-services.ts, use-work-days.ts, use-machine-types.ts, use-machine-logs.ts, use-advances.ts
- (Inferred pattern: follow useCustomers/useBookings/useMachines pattern)
- **use-toast.ts**: Custom hook for toast notifications

---

## 7. Configuration (src/config/)

### site.ts
- **siteConfig**: name="Agri-ERP", description="Hệ thống Quản lý Dịch vụ Nông nghiệp", version="1.0.0", currency="VND", locale="vi-VN", defaultPageSize=20, maxPageSize=100
- Features: darkMode, notifications, exportData, advancedSearch

### navigation.ts
- **NavItem**: id, label, href, icon (LucideIcon), badge?, enabled
- **NavGroup**: id, label, items[]
- **navigationConfig**: 5 groups:
  1. **Main**: Dashboard (/dashboard)
  2. **Operations**: Work Days (/work-days), Bookings (/bookings), Services (/services)
  3. **People**: Customers (/customers), Workers (/workers)
  4. **Financial**: Bills (/bills), Payroll (/payroll)
  5. **Assets**: Machines (/machines), Machine Types (/machine-types)
- Helpers: getNavItem(id), getNavItemByHref(href), allNavItems (flattened)

---

## Key Architectural Insights

### Data Flow
1. **WorkDay** is hub — daily aggregates all operations
2. **DailyMachine** snapshots worker assignments + job salary at point of assignment
3. **DailyBooking** + **DailyBookingMachine** link jobs to customer bookings
4. **Bill** → Booking + DailyBooking chain (financial tracking)
5. **Payroll** → DailyMachineWorker aggregation (wage calculation)

### Snapshots & Immutability
- Job salary snapshotted in DailyMachineWorker.applied_base (protects from job_type changes)
- Booking/Bill amount flows: booking.amount → dailyBooking.amount → bill.subtotal + adjustment
- Advance deductions: Advance_Payment.amount − DailyMachineWorker aggregates → Payroll.net_payable

### Transaction Safety
- Bill creation/deletion: cascades booking status
- Payroll creation/deletion: cascades daily_worker + advance status
- Daily machine/worker ops: transaction blocks ensure consistency

### Locale & Formatting
- Vietnamese: vi-VN locale everywhere (currency, dates)
- VND format: "1.000.000 đ" (dot separators)
- Database handles Decimal, auto-serialized to Number via Prisma extension

---

## Unresolved Questions
1. What is the exact auth.config.ts implementation (NextAuth v4/v5)? How does User role field map to permissions?
2. Are there calculated fields (e.g., remaining_balance on Bill/Payroll) exposed in API responses?
3. Does the maintenance system integrate with machine availability status?
4. Are service-to-machine-type associations used for booking validation (e.g., prevent booking service X on machine Y)?
5. What is the maintenance log price field currency (assumed VND)?

