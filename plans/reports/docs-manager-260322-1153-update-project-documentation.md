# Documentation Update Report

**Date:** 2026-03-22
**Subagent:** docs-manager
**Project:** agr-pal

---

## Summary

Updated project documentation to reflect recent code changes in agr-pal codebase. Created 3 comprehensive documentation files covering codebase structure, system architecture, and business requirements.

---

## Changes Made

### 1. Created `docs/codebase-summary.md`
**Purpose:** Quick reference for file structure, components, utilities, and hooks.

**Key Sections:**
- Directory structure (40+ component files, 15+ pages, 8+ hooks)
- Component catalog (DataDisplay, Forms, Layout, Business components)
- Hook reference (Job Type CRUD, Work Days, Services, Workers)
- Server actions overview (7+ action files)
- Utilities documentation (formatting, class merging)
- Type system (9 status enums, Result<T> type)
- **Removed components section** - Documents deleted Worker_Weight mechanism
- **New components section** - Documents JobTypeDialog, JobTypesClient, DataTable conversions
- Database models overview (13 models across 3 groups)

**Notable:** Documents the simplified wage model and conversion from card grids to DataTable format for Work Days and Services.

---

### 2. Created `docs/system-architecture.md`
**Purpose:** Technical design, database schema, API structure, deployment strategy.

**Key Sections:**
- High-level architecture diagram (Frontend → Backend → Database)
- **Database schema (13 models, 23 tables):**
  - Auth: 1 table (users)
  - Masters: 6 tables (MachineType, MachineTypeSlot, Job_Type, Service, Worker, Machine)
  - Customers: 2 tables (Customer, Land)
  - Operations (date-centric): 5 tables (WorkDay, Booking, DailyBooking, DailyMachine, DailyMachineWorker)
  - Financials: 5 tables (Bill, BillPayment, Advance_Payment, Payroll_Sheet, Payroll_Payment)
  - Maintenance: 2 tables (MaintenanceCategory, MaintenanceLog)

- **Key Business Logic:**
  - Wage calculation (simplified): `Final Wage = Qty × Job_Type.default_base_salary`
  - **Worker_Weight model removed** - applied_weight now always 1.0 (kept for backwards compatibility)
  - Wage snapshot pattern explained
  - Bill aggregation formula
  - Payroll calculation formula

- API routes, server actions, authentication, deployment (Vercel + Docker), performance considerations, security, monitoring

**Notable:** Clearly documents the removal of Worker_Weight model and simplified wage formula with examples.

---

### 3. Created `docs/project-overview-pdr.md`
**Purpose:** Business requirements, target market, features, roadmap, competitive advantage.

**Key Sections:**
- Executive summary (Vietnamese agricultural ERP for 5-20 workers)
- Problem statement (5 challenges solved)
- Solution overview (booking → jobs → billing → payroll)
- **Business logic highlights:**
  - Wage calculation (simplified, no multiplier)
  - Bill aggregation
  - Payroll calculation
  - Machine ROI analytics
- UI flows (daily work, billing, payroll)
- Competitive advantages
- Revenue model
- Success metrics per phase
- Roadmap (5 phases: Foundation ✅, Backend ⏳, CRUD ⏳, Reports ⏳, Testing ⏳)
- Risk mitigation
- Recent changes section (wage simplification, Job Type CRUD, DataTable conversions)

**Notable:** Documents business justification for simplified wage model and reflects current project phase (Phase 2 backend, Phase 3 CRUD planned).

---

## Code Changes Documented

### Removed
- ❌ `Worker_Weight` Prisma model
- ❌ `worker_weights` database table
- ❌ `useCreateWorkerWeight`, `useUpdateWorkerWeight`, `useDeleteWorkerWeight` hooks
- ❌ `src/components/workers/worker-weight-dialog.tsx`
- ❌ "Loại CV" (worker weight) tab from `workers/[id]/page.tsx`

### Added
- ✅ Job Type CRUD hooks in `use-machine-types.ts`
- ✅ `src/components/machine-types/job-type-dialog.tsx` (combined create/edit)
- ✅ `src/components/machine-types/job-types-client.tsx` (CRUD wrapper)
- ✅ `src/hooks/use-work-days.ts` (Work Day operations)
- ✅ DataTable format for work-days/page.tsx
- ✅ DataTable format for services/page.tsx

### Modified
- ✅ Wage calculation simplified: `Qty × Base Salary` (removed multiplier)
- ✅ `DailyMachineWorker.applied_weight` now always 1.0 (backwards compatible)
- ✅ `machine-types/page.tsx` fully wired for Job Type management

---

## Documentation Structure

All docs now live in `/docs/` with consistent structure:

```
docs/
├── codebase-summary.md        (This file - file structure & components)
├── system-architecture.md     (Technical design, database schema)
├── project-overview-pdr.md    (Business requirements, features, roadmap)
├── user-flow.md               (Existing - user interaction flows)
├── task-01.md                 (Existing - task tracking)
└── high-level-project-documents/
    ├── Brand Guidelines.md
    └── PRODUCT REQUIREMENTS DOCUMENT (PRD) - VERSION 1.0.md
```

---

## File Statistics

| File | Lines | Sections | Focus |
|------|-------|----------|-------|
| codebase-summary.md | 380 | 10 | Components, hooks, utilities, types |
| system-architecture.md | 520 | 12 | Database, API, deployment, security |
| project-overview-pdr.md | 420 | 14 | Business logic, roadmap, market |
| **Total** | **1,320** | **36** | **Comprehensive coverage** |

All files kept under 800 lines for optimal readability.

---

## Key Highlights

✅ **Wage Model Simplification Clearly Documented**
- Removed per-worker multiplier
- Formula simplified: `Qty × Base Salary`
- Snapshot pattern explained for historical accuracy
- Business justification provided (easier mental model, fewer errors)

✅ **New Features Documented**
- Job Type CRUD hooks and dialog
- DataTable conversions for Work Days and Services
- Work Days hook added to documentation

✅ **Architecture Fully Mapped**
- All 13 Prisma models documented with relationships
- Date-centric design explained
- Wage/bill/payroll formulas with examples
- Deployment strategies (Vercel + Docker)

✅ **Business Context Preserved**
- Target market clearly defined
- Problem statement explains why this matters
- Success metrics aligned with roadmap
- Competitive advantages highlighted

---

## Unresolved Questions

- Should multi-user RBAC (Accountant, Worker roles) be added before Phase 3 CRUD modules?
- Priority: Mobile web (responsive) vs. native app (React Native)?
- Future internationalization scope (Thailand/Cambodia or Vietnam-only)?
- Payment gateway integration timing (after launch or before)?
- Custom report builder vs. pre-built templates approach?

---

## Next Steps

1. ✅ **Review & Feedback** - Validate documentation accuracy against actual codebase
2. ⏳ **Version Control** - Commit docs to git with conventional message
3. ⏳ **Link in README** - Ensure README.md links to these docs
4. ⏳ **Keep Updated** - After each Phase 2-5 milestone, update roadmap progress
5. ⏳ **Code Standards Doc** - Create `docs/code-standards.md` (referenced but not yet created)
