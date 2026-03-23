# Project Overview & Product Definition Record (PDR)

## 1. Executive Summary

**Project:** agr-pal — Agricultural Service Management ERP
**Status:** Foundation complete, Phase 2 (Backend & Auth) in progress
**Target Release:** 2026 Q2 (MVP with full CRUD + billing/payroll)
**Platform:** Web (Next.js); Vietnamese locale only; single admin user

agr-pal replaces manual ledgers for small/medium agricultural service businesses. The system coordinates bookings, worker/machine jobs, customer billing, and payroll—capturing wage snapshots and financial snapshots to maintain historical accuracy.

---

## 2. Business Purpose

### Problem Statement
Agricultural service businesses (equipment rental, harvesting, plowing) manage operations with spreadsheets or paper ledgers, leading to:
- Lost bookings & billing disputes
- Wage calculation errors (especially with workers earning different rates)
- Machine utilization invisible (no ROI tracking)
- Customer debt unpredictable (no invoice tracking)
- Payroll delays (manual aggregation from job logs)

### Solution
A single-admin ERP to:
1. **Record bookings** from customers (land, service, quantity, pricing)
2. **Assign machines & workers** to daily jobs with **wage snapshots** (immutable at assignment time)
3. **Generate customer bills** by aggregating bookings with partial payment tracking
4. **Calculate payroll** by summing daily jobs, deducting advances
5. **Track machine maintenance** and ROI

### Target User
- **Role:** Single business owner/manager
- **Scale:** 5–20 workers, 50–100 customers
- **Literacy:** Low-tech (prefers simple UI, Vietnamese interface)
- **Usage:** Daily (1–2 hours) to record jobs, weekly for billing/payroll

---

## 3. Key Features

### ✅ Implemented (Phase 1: Foundation)
- **UI Foundation:** AppShell (collapsible sidebar), sticky header, breadcrumbs
- **Component Library:** DataTable (sortable/paginated), form inputs (currency, quantity, date), status badges (14 WCAG AA variants)
- **Type Safety:** TypeScript strict mode, Zod schemas, status enums
- **Locale:** Vietnamese currency (VND), dates (DD/MM/YYYY), formatting

### ⏳ Planned (Phase 2–5)

#### Phase 2: Backend & Auth (2 weeks)
- PostgreSQL + Prisma schema (17 models, 3 domains)
- Authentication: NextAuth credentials + bcrypt + HTTP-only cookies
- Server Actions for mutations
- Seeding & data validation

#### Phase 3: CRUD Modules (4 weeks)
1. **Masters:** Services, Machine Types, Job Types, Workers, Machines
2. **Customers & Land:** Profiles with GPS land parcels
3. **Bookings:** Create, update, cancel; quantity/pricing snapshots
4. **Work Days (Operational Hub):** Daily operations—link bookings + machines + workers
5. **Daily Jobs:** Assign workers to machines with wage snapshots
6. **Billing:** Aggregate bookings, track partial payments, customer debt
7. **Payroll:** Aggregate daily jobs, deduct worker advances, track payments
8. **Maintenance:** Log machine maintenance, track costs

#### Phase 4: Reports & Polish (2 weeks)
- Dashboard: KPI stats, pending tasks, financial summary
- Debt/payroll reports (customer, worker, date range)
- Search and filtering across modules
- Error handling, loading states, form validation

#### Phase 5: Testing & Deployment (1 week)
- Unit tests (Vitest), E2E tests (Playwright)
- Production deployment (Supabase PostgreSQL, Vercel)
- User acceptance testing

---

## 4. Business Rules

### Wage Snapshot Pattern
**Immutable Wage Capture:** When a worker is assigned to a job, the system captures:
- **applied_base:** Job Type's base salary (e.g., 100,000 VND/hour) at assignment time
- **applied_weight:** Worker's salary multiplier (e.g., 1.2×) for that job type
- **final_pay:** Quantity × applied_base × applied_weight

**Why?** If the base salary changes next month (100k → 110k), old jobs preserve historical 100k wage for accurate payroll & audit trail.

### Bill Aggregation
**Bill = Σ(Booking.amount)** for bookings assigned to that bill.
- Customer can have multiple bills (OPEN/PARTIAL_PAID/COMPLETED states)
- Booking belongs to exactly one bill (if any)
- Cannot delete bill with PARTIAL_PAID status (financial guard)
- **Customer Debt = Σ(Bill.total_amount - Bill.total_paid)** for OPEN/PARTIAL bills

### Payroll Aggregation
**Payroll = Σ(DailyMachineWorker wages for period) − Σ(Advance_Payments)**
- Each DailyMachineWorker links to payroll on creation
- Advance Payments deducted from payroll (status: UNPROCESSED → PROCESSED)
- Payroll tracks partial payments like bills

### WorkDay Hub Pattern
Daily operations center on **WorkDay** (unique date):
- **DailyBooking:** Booking executed on a specific date (links Booking → WorkDay)
- **DailyMachine:** Machine working that day (links Machine → WorkDay)
- **DailyMachineWorker:** Worker assigned to machine that day (links Worker → DailyMachine → Job_Type)
- **DailyBookingMachine:** Trace-back which machines served which bookings

**Benefit:** Separates "booking created" (timeless) from "work executed" (date-bound), enabling flexible rescheduling.

---

## 5. Data Model Overview

### Auth Domain (1 model)
- **User:** Single admin (id, email, password_hash, role)

### Masters Domain (6 models)
- **MachineType:** Equipment category (harvester, tractor, etc.)
- **Job_Type:** Position within machine type (driver, loader) + base salary
- **Service:** Service catalog (harvesting, plowing) + unit + price
- **Worker:** Employee profile
- **Machine:** Inventory unit (machine_type_id FK, status, maintenance_date)
- **MaintenanceCategory/MaintenanceLog:** Maintenance tracking

### Operations Domain (6 models)
- **WorkDay:** Operational date hub (unique date per WorkDay)
- **Booking:** Customer service request (snapshots amount at creation)
- **Customer/Land:** Customer profiles + GPS land parcels
- **DailyBooking:** Booking executed on specific date
- **DailyMachine:** Machine used on specific date
- **DailyMachineWorker:** Worker assigned + wage snapshots
- **DailyBookingMachine:** Trace-back (booking ↔ machine)

### Financials Domain (6 models)
- **Bill:** Customer invoice (aggregates bookings)
- **BillPayment:** Partial payments to bill
- **Advance_Payment:** Worker advance (future deduction from payroll)
- **Payroll_Sheet:** Worker payroll (aggregates daily jobs)
- **Payroll_Payment:** Partial payments to payroll

---

## 6. User Workflows

### Workflow 1: Record a Booking
1. Customer requests service for a land parcel
2. Admin creates **Booking** (customer, land, service, quantity, price snapshot)
3. Booking status = NEW, payment_status = PENDING_BILL
4. **Billing later:** Admin groups bookings into a Bill

### Workflow 2: Execute Jobs (Daily)
1. Admin creates **WorkDay** for today
2. Admin **adds DailyBooking** to today (links Booking → WorkDay)
3. Admin **adds DailyMachine** to today (links Machine → WorkDay)
4. Admin **assigns workers** to machine (creates DailyMachineWorker with wage snapshots)
5. Admin optionally **links booking to machine** (DailyBookingMachine) for traceability

### Workflow 3: Generate Customer Bill
1. Admin collects related bookings (for a customer, date range)
2. Admin creates **Bill** (customer, bookings, subtotal)
3. Bill status = OPEN, total_amount = Σ(bookings)
4. Admin records **BillPayment** (partial or full payment)
5. Bill status transitions: OPEN → PARTIAL_PAID → COMPLETED

### Workflow 4: Calculate Worker Payroll
1. Admin selects worker + date range
2. System aggregates **DailyMachineWorker** jobs (already linked to payroll_id)
3. System deducts **Advance_Payments** (status UNPROCESSED → PROCESSED)
4. System creates **Payroll_Sheet** (total_wages − total_adv + adjustments = net_payable)
5. Admin records **Payroll_Payment** (partial or full)
6. Payroll status: OPEN → PARTIAL_PAID → COMPLETED

---

## 7. Authentication & Security

### Authentication Method
- **NextAuth Credentials Provider** (email/password)
- **Bcrypt hashing** (10+ rounds) for password storage
- **HTTP-only cookies** for session persistence
- **CSRF protection** (NextAuth default)
- Single admin user only (no RBAC planned for MVP)

### Security Constraints
- No user account registration (admin creates via `/api/setup-admin`)
- All mutations require valid session
- Decimal precision (12,2) for financial fields to prevent rounding errors
- Prisma transactions for multi-step operations (bill creation, payroll creation)

---

## 8. Locale & Formatting

### Vietnamese Localization
- **Currency:** VND (vietnamensis đồng = đ symbol)
- **Formatting:** formatCurrency(1000000) → "1.000.000 đ"
- **Dates:** DD/MM/YYYY (formatDateShort)
- **Separators:** Thousand separator = `.`, no decimal (VND is integer)

### UI Text
- All navigation, labels, placeholders in Vietnamese (hard-coded)
- Error messages bilingual (EN for dev, VI for user)
- Relative dates in Vietnamese ("2 ngày trước")

---

## 9. Deployment Model

### Infrastructure
- **Frontend:** Vercel (Next.js native)
- **Database:** Supabase PostgreSQL (managed)
- **Storage:** Vercel Blob (if file attachments added later)
- **Auth:** NextAuth (no external service)

### Environment Variables
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://yourapp.com
NEXTAUTH_SECRET=<random-32-char-hex>
```

### Backup Strategy
- Supabase automatic backups (daily, 30-day retention)
- Manual export on major releases

---

## 10. Success Criteria

### MVP Release (Phase 5)
- ✅ All 8 CRUD modules functional
- ✅ Wage & bill snapshots working (no manual corrections)
- ✅ Billing & payroll aggregation accurate (±0% vs manual calc)
- ✅ Authentication working (secure session)
- ✅ Vietnamese locale consistent
- ✅ Dashboard showing KPIs
- ✅ E2E tests covering main workflows
- ✅ Deployment to Vercel + Supabase

### User Acceptance Criteria
- Admin can record, bill, and pay workers in <30 min (vs 2+ hours manual)
- No data loss after deployment (backups verified)
- UI is intuitive enough for low-tech user

---

## 11. Known Gaps & Future Phases

### Phase 6+: Advanced Features (Post-MVP)
- **RBAC:** Multi-user (manager, accountant, worker roles)
- **i18n:** English, Chinese support
- **Reporting:** Export to Excel, PDF invoices, graphs
- **Notifications:** SMS/email alerts for pending bills, payroll
- **Mobile:** React Native or responsive web (currently desktop-only)
- **API:** REST/GraphQL for 3rd-party integrations
- **Testing:** Full test coverage (currently none)

### Known Limitations
- Single admin only (no delegation)
- Vietnamese locale hardcoded (i18n infrastructure needed)
- No audit log (timestamps only)
- No invoice templates (plain data display only)
- No photo/file attachments (scope creep)

---

## 12. Documentation Structure

- `docs/project-overview-pdr.md` — This file (business context, requirements)
- `docs/system-architecture.md` — Technical design, DB schema, data flow
- `docs/codebase-summary.md` — Directory structure, component inventory
- `docs/code-standards.md` — Development conventions, patterns
- `docs/design-guidelines.md` — UI/UX patterns, status badges, form layouts
- `docs/project-roadmap.md` — Current progress, blockers, timelines
- `docs/deployment-guide.md` — Environment setup, migrations, deployment steps

---

**Version:** 1.0 | **Last Updated:** 2026-03-23 | **Owner:** Admin
