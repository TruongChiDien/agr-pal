# Project Roadmap & Progress Tracking

## 1. Project Status Overview

**Current Phase:** Phase 2 (Backend & Auth) — In Progress
**Branch:** `feat/change-approach-to-group-by-date` (WorkDay hub refactor)
**Foundation:** ✅ Complete (UI library, components, locale)
**Target MVP Release:** 2026 Q2

---

## 2. Phase Breakdown

### Phase 1: Foundation ✅ COMPLETE (2026-01-15)
**Status:** Done

Delivered:
- ✅ Next.js 16 project setup (App Router, React 19)
- ✅ TypeScript 5 strict mode enabled
- ✅ Tailwind CSS 4 + shadcn/ui (18 components)
- ✅ Component library: layout, forms, tables, status badges
- ✅ Form inputs: CurrencyInput (VND), QuantityInput, DatePicker (vi-VN)
- ✅ DataTable: sortable, paginated, card/table toggle, empty states
- ✅ Status badge system: 14 WCAG AA variants
- ✅ Type-safe enums (8 status types)
- ✅ Vietnamese localization (dates, currency, labels)
- ✅ Demo pages: dashboard, data-table, forms, status-badges

**Metrics:**
- 46 components delivered
- 0 TypeScript errors
- 100% WCAG AA contrast ratios
- <200 LOC per component

---

### Phase 2: Backend & Auth ⏳ IN PROGRESS
**Timeline:** 2 weeks (current)
**Status:** ~60% complete

#### Completed (2026-03-15 → now)
- ✅ Prisma schema design (17 models, 3 domains)
  - Auth: User
  - Masters: MachineType, Job_Type, Service, ServiceMachineType, Worker, Machine, MaintenanceCategory, MaintenanceLog
  - Customers: Customer, Land
  - Operations: WorkDay, Booking, DailyBooking, DailyMachine, DailyMachineWorker, DailyBookingMachine
  - Financials: Bill, BillPayment, Advance_Payment, Payroll_Sheet, Payroll_Payment
- ✅ Database enums (8): MachineStatus, BookingStatus, PaymentStatus, JobPaymentStatus, BillStatus, PayrollStatus, AdvanceStatus, PaymentMethod
- ✅ Prisma migrations setup
- ✅ NextAuth Credentials Provider + bcrypt
- ✅ Server Actions infrastructure (13 action files)
- ✅ Zod schemas (11 files)
- ✅ TanStack Query hooks (13 files)

#### Current Work (In Branch)
- 🔄 WorkDay hub refactor (`feat/change-approach-to-group-by-date`)
  - Rethinking operational model: date-centric jobs
  - DailyBooking, DailyMachine relationships
  - Wage snapshot capture on DailyMachineWorker assignment

#### Remaining (This Phase)
- [ ] Seeding script (create admin user, sample data)
- [ ] Database connection pooling (Prisma middleware)
- [ ] Session middleware (auth guard in layout)
- [ ] Error handling standardization (Result<T> pattern)
- [ ] Integration tests (happy path for main workflows)

**Blockers:**
- None currently

**Next Milestone:** Merge WorkDay refactor + deploy dev instance to Supabase

---

### Phase 3: CRUD Modules ⏳ PLANNED (2 weeks, 2026-04-01)
**Status:** Not started

**8 Modules to implement:**

#### 1. Masters Setup
- [ ] MachineType CRUD (create, read, update, delete)
  - Guard: Cannot delete if machines exist
  - Guard: Cannot delete if worker_weights reference it
- [ ] Job_Type CRUD (nested under MachineType)
  - Guard: Cannot delete if in use
  - Default base salary management
- [ ] Service CRUD
  - Service ↔ MachineType M:N relationship
  - Price history (snapshot at booking time)

#### 2. Customers & Land
- [ ] Customer CRUD
  - [ ] Customer detail page (4 tabs: info, lands, bills, bookings)
  - [ ] Lands CRUD (nested under customer)
  - [ ] GPS coordinate picker (optional enhancement)
  - [ ] Customer debt summary (aggregated bills)

#### 3. Workers
- [ ] Worker CRUD
  - [ ] Worker detail page (3 tabs: info, salary weights, advance history, payrolls)
  - [ ] Set Worker Weight (multiplier per job_type)
  - [ ] View pending daily jobs (not yet in payroll)
  - [ ] View payroll history

#### 4. Machines
- [ ] Machine CRUD
  - [ ] Machine detail page (2 tabs: info, maintenance logs)
  - [ ] Status management (AVAILABLE ↔ IN_USE ↔ MAINTENANCE)
  - [ ] Maintenance log CRUD (category, brand, price, quantity, date)
  - [ ] ROI calculation (revenue from jobs - maintenance costs)

#### 5. Bookings
- [ ] Booking CRUD
  - [ ] Create from customer detail (modal)
  - [ ] Booking detail page (status, payment status, quantity, price snapshot)
  - [ ] Status transitions (NEW → IN_PROGRESS → COMPLETED/CANCELED)
  - [ ] Add to bill workflow

#### 6. Work Days (Operational Hub)
- [ ] WorkDay CRUD
  - [ ] Create WorkDay (date-unique)
  - [ ] WorkDay detail page (2 sections: daily bookings, daily machines)
  - [ ] Add booking to day (link Booking → WorkDay via DailyBooking)
  - [ ] Add machine to day (link Machine → WorkDay via DailyMachine)
  - [ ] Assign workers to machine (DailyMachineWorker with wage snapshots)
  - [ ] Link booking ↔ machine (trace-back, DailyBookingMachine)

#### 7. Billing
- [ ] Bill CRUD
  - [ ] Create bill (select bookings, aggregate amount, set adjustment)
  - [ ] Bill detail page (bookings, payments, customer debt)
  - [ ] Payment workflow (BillPayment, partial payment tracking)
  - [ ] Status transitions (OPEN → PARTIAL_PAID → COMPLETED)
  - [ ] Guard: Cannot delete PARTIAL_PAID bills

#### 8. Payroll
- [ ] Payroll CRUD
  - [ ] Create payroll (select worker + date range)
  - [ ] Payroll detail page (daily jobs, advances, net calculation, payments)
  - [ ] Worker advance deduction (Advance_Payment → PROCESSED)
  - [ ] Payment workflow (Payroll_Payment, partial payment)
  - [ ] Guard: Cannot delete PARTIAL_PAID payrolls

**Success Criteria:**
- All CRUD operations functional (create, read, update, delete with guards)
- Server Actions validated with Zod
- TanStack Query hooks with auto-invalidation
- Wage/bill snapshots working (no recalculation on master changes)
- Form validation working (RHF + Zod)
- All pages protected by auth session

---

### Phase 4: Reports & Polish ⏳ PLANNED (2 weeks, 2026-04-15)
**Status:** Not started

#### Dashboard
- [ ] KPI stats (total revenue, outstanding debt, payroll owed, machines in use)
- [ ] Pending tasks (unbilled bookings, unpaid bills, unpaid payrolls)
- [ ] Recent activity (last 10 bookings, last 5 bills, last 5 payroll)
- [ ] Financial summary (revenue vs expenses trend, customer debt trend)

#### Reports
- [ ] Customer debt report (by customer, date range, outstanding amount)
- [ ] Payroll report (by worker, date range, wages, advances, net paid)
- [ ] Machine ROI report (revenue from jobs - maintenance costs)
- [ ] Booking status summary (NEW, IN_PROGRESS, COMPLETED by date)

#### Search & Filtering
- [ ] Global search (customers, workers, machines, bookings)
- [ ] Advanced filters (status, date range, amount range, customer)
- [ ] Sort columns (all tables, multiple keys)

#### Polish
- [ ] Error boundaries (graceful error handling, UI fallback)
- [ ] Loading states (skeleton screens, spinners)
- [ ] Form validation feedback (real-time, on blur)
- [ ] Toast notifications (success, error, warning)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Accessibility review (WCAG AA compliance)

**Success Criteria:**
- Dashboard displays accurate KPIs (verified against manual calc)
- All reports exportable to CSV/PDF (phase 6 enhancement)
- Search latency <500ms (indexed fields)
- No UI jank (smooth animations, no layout shift)

---

### Phase 5: Testing & Deployment ⏳ PLANNED (1 week, 2026-04-22)
**Status:** Not started

#### Unit Tests
- [ ] Utilities (formatCurrency, formatDateShort, parseCurrency)
- [ ] Schema validation (Zod schemas for all entities)
- [ ] Status transitions (booking status valid transitions)
- [ ] Calculations (wage calculation, bill aggregation, payroll aggregation)

#### Integration Tests
- [ ] Create booking → add to bill → record payment (end-to-end)
- [ ] Create workday → add machine → assign workers → calculate payroll
- [ ] Create customer with lands, then create bookings
- [ ] Authentication flow (login, session persist, logout)

#### E2E Tests (Playwright)
- [ ] Main workflows (booking → bill → payment)
- [ ] Critical paths (login, CRUD operations)
- [ ] Error scenarios (validation, guards, edge cases)

#### Deployment
- [ ] Vercel build optimization
- [ ] Supabase PostgreSQL setup (production instance)
- [ ] Environment variables (.env.production)
- [ ] Database migrations (`prisma migrate deploy`)
- [ ] Seed data (admin user, sample data for demo)
- [ ] Monitoring setup (error tracking, performance)

#### User Acceptance Testing
- [ ] Business owner reviews workflows
- [ ] Data accuracy verification (wage calc, billing, payroll)
- [ ] Performance testing (100+ records per table)
- [ ] UI/UX feedback & polish

**Success Criteria:**
- 80%+ test coverage (critical paths)
- All E2E tests pass in CI/CD
- 0 unhandled errors in production (for 1 week)
- MVP ready for real business use

---

## 3. Known Gaps & Post-MVP Features (Phase 6+)

### High Priority (Q3 2026)
- [ ] RBAC (multi-user: admin, accountant, worker roles)
  - Currently: single admin only
  - Impact: 1 week implementation
  - Requires: role enums, RLS policies, UI role checks

- [ ] Internationalization (i18n)
  - Currently: Vietnamese hardcoded
  - Planned: English, Chinese support
  - Impact: 2 weeks (setup, string extraction, translation)
  - Requires: next-intl, locale detection, translation files

- [ ] Invoice Templates & PDF Export
  - Currently: plain data display
  - Planned: customizable invoice templates, PDF generation (react-pdf)
  - Impact: 1 week implementation

### Medium Priority (Q4 2026)
- [ ] Notifications
  - Email/SMS alerts for pending bills, payroll
  - Requires: email service (SendGrid/AWS SES), queue (Bull/RabbitMQ)
  - Impact: 2 weeks

- [ ] Mobile App
  - React Native or responsive web (PWA)
  - Currently: desktop-only
  - Impact: 4 weeks (MVP)

- [ ] API Layer (REST/GraphQL)
  - For 3rd-party integrations
  - Impact: 2 weeks (REST), 4 weeks (GraphQL)

### Low Priority (Post-MVP)
- [ ] Audit Log (track all changes: who, what, when)
- [ ] Advanced Reporting (charts, graphs, forecasts)
- [ ] Webhook Integration (notify external systems)
- [ ] File Attachments (photos of work, invoices)

---

## 4. Current Blockers & Risks

### Technical Blockers
**None currently** — schema design finalized, server actions working, NextAuth configured.

### Known Issues
1. **WorkDay hub refactor ongoing** (`feat/change-approach-to-group-by-date`)
   - Rethinking: should WorkDay be purely operational, or should we keep Booking timeless?
   - Impact: Schema changes, potential action refactor
   - Status: Pending decision in PR review

2. **Wage snapshot capture timing**
   - Question: Capture at DailyMachineWorker creation or at payroll time?
   - Current: At DailyMachineWorker creation (immutable)
   - Risk: Cannot adjust wages after assigning if mistake found
   - Mitigation: payment_adjustment field for corrections

### Business Risks
1. **Scope creep** — Features like RBAC, i18n, notifications may delay MVP
   - Mitigation: Strict MVP definition, post-MVP roadmap

2. **Data accuracy** — First-time users may misunderstand wage snapshot concept
   - Mitigation: Help text, tooltip, demo data with errors to learn from

3. **Adoption resistance** — Low-tech users may struggle with UI
   - Mitigation: Keep UI simple (KISS), user training materials

---

## 5. Timeline & Milestones

### 2026 Timeline

| Date | Phase | Milestone |
|------|-------|-----------|
| 2026-01-15 | 1 | Foundation complete (UI library) |
| 2026-03-23 | 2 | WorkDay hub finalized, Supabase dev instance |
| 2026-03-30 | 2 | Auth + seeding, dev environment stable |
| 2026-04-01 | 3 | Phase 3 starts: CRUD modules |
| 2026-04-15 | 4 | Phase 3 complete, Phase 4 starts: Reports & Polish |
| 2026-04-22 | 5 | Phase 4 complete, Phase 5 starts: Testing |
| 2026-05-01 | 5 | MVP ready for UAT |
| 2026-05-15 | 5 | Production deployment (Vercel + Supabase) |
| 2026-06-01 | 6 | RBAC + i18n planning |

---

## 6. Success Metrics (MVP Definition)

### Functional Completeness
- ✅ 8 CRUD modules functional
- ✅ Wage & bill snapshots working (immutable at capture)
- ✅ Billing & payroll aggregation accurate
- ✅ Authentication functional (single admin)
- ✅ Dashboard showing KPIs

### Data Quality
- ✅ No wage calculation errors (±0% vs manual calc)
- ✅ No billing discrepancies (±0% bill total vs sum of bookings)
- ✅ No payroll errors (±0% net pay vs expected)

### Performance
- ✅ Page load <2s (first page)
- ✅ CRUD operations <1s
- ✅ Search results <500ms
- ✅ Support 1000+ records per table

### Reliability
- ✅ 0 unhandled errors (production, 1 week)
- ✅ 99.9% uptime (Vercel SLA)
- ✅ Daily automated backups (Supabase)

### User Experience
- ✅ Admin can record jobs in <5 min
- ✅ Admin can generate bills in <2 min
- ✅ Admin can calculate payroll in <3 min
- ✅ Accessibility: WCAG AA compliance

---

## 7. Dependencies & Integration Points

### External Services
- **Supabase PostgreSQL:** Database
- **Vercel:** Hosting & deployment
- **NextAuth:** Authentication (self-hosted, no 3rd party)

### Internal Dependencies
- Phase 2 must complete before Phase 3 (schema → CRUD)
- Phase 3 must complete before Phase 4 (data entry → reporting)
- Phase 4 must complete before Phase 5 (functionality → testing)

### Team Size & Capacity
- **Current:** Solo developer
- **Estimated effort:** Phase 2-5 = 8 weeks at 20 hrs/week
- **Contingency:** +20% buffer for unknowns

---

## 8. Post-MVP Vision (2026 Q3-Q4)

After MVP launch, prioritize in this order:
1. **User feedback:** Collect pain points, feature requests
2. **RBAC:** Multi-user support (manager, accountant roles)
3. **i18n:** English + Chinese support
4. **Advanced features:** Notifications, mobile, API layer

**Long-term goal:** Become standard ERP for agricultural service businesses in Southeast Asia.

---

**Version:** 1.0 | **Last Updated:** 2026-03-23 | **Owner:** Product Manager
