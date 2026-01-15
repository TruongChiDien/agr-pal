# agr-pal

**Agricultural Service Management System (Agri-ERP)**

Vietnamese-localized ERP for managing agricultural service operations: bookings, jobs, billing, payroll, machines, and services.

![Status: Foundation Complete](https://img.shields.io/badge/status-foundation%20complete-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Quick Links

- 📚 **[Project Overview & PDR](./docs/project-overview-pdr.md)** - Business requirements, features, roadmap
- 🏗️ **[System Architecture](./docs/system-architecture.md)** - Technical design, database schema, deployment
- 📦 **[Codebase Summary](./docs/codebase-summary.md)** - Directory structure, components, utilities
- 📝 **[Code Standards](./docs/code-standards.md)** - Conventions, patterns, best practices
- 🎨 **[Brand Guidelines](./docs/high-level-project-documents/Brand%20Guidelines.md)** - Colors, typography, UI/UX
- 📋 **[Product Requirements (PRD)](./docs/high-level-project-documents/PRODUCT%20REQUIREMENTS%20DOCUMENT%20(PRD)%20-%20VERSION%201.0.md)** - Detailed functional specs

---

## What is agr-pal?

agr-pal replaces manual ledgers for agricultural service businesses. Track bookings, execute jobs, generate bills, calculate payroll, and monitor machine ROI—all in one system.

**Key Features:**
- 🌾 **Bookings:** Service requests from customers (land, quantity, pricing)
- 🔧 **Jobs:** Worker/machine assignments with wage snapshots
- 💰 **Billing:** Aggregate bookings, track partial payments, customer debt
- 💵 **Payroll:** Calculate wages (base × weight × quantity), deduct advances
- 🚜 **Machines:** Inventory, maintenance logs, ROI reports
- 📊 **Dashboard:** Financial summary, pending tasks, business health

**Target User:** Single admin (business owner) managing 5-20 workers, 50-100 customers.

**Locale:** Vietnamese (VND currency, DD/MM/YYYY dates, vi-VN formatting).

---

## Tech Stack

**Frontend:**
- [Next.js 16](https://nextjs.org) (App Router, React 19, Server Components)
- [TypeScript 5](https://www.typescriptlang.org) (strict mode)
- [Tailwind CSS 4](https://tailwindcss.com) (utility-first styling)
- [shadcn/ui](https://ui.shadcn.com) (Radix UI + Tailwind components)
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) (forms & validation)
- [Lucide React](https://lucide.dev) (icons)

**Backend (Planned):**
- [PostgreSQL](https://www.postgresql.org) (relational database)
- [Prisma](https://www.prisma.io) (type-safe ORM)
- [Clerk](https://clerk.dev) or [NextAuth](https://next-auth.js.org) (authentication)

**Deployment (Planned):**
- [Vercel](https://vercel.com) (recommended for MVP)
- Docker + VPS (cost-effective for production)

---

## Getting Started

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm, yarn, pnpm, or bun
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/agr-pal.git
cd agr-pal

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Available Scripts

```bash
npm run dev      # Start dev server (hot reload)
npm run build    # Build production bundle
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Project Structure

```
agr-pal/
├── docs/                          # 📚 Documentation
│   ├── codebase-summary.md        # Code overview
│   ├── code-standards.md          # Conventions
│   ├── project-overview-pdr.md    # Business requirements
│   ├── system-architecture.md     # Technical design
│   └── high-level-project-documents/
│       ├── PRODUCT REQUIREMENTS DOCUMENT (PRD) - VERSION 1.0.md
│       └── Brand Guidelines.md
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (dashboard)/           # Main app pages
│   │   │   ├── page.tsx           # Dashboard home
│   │   │   ├── data-table/        # DataTable demo
│   │   │   ├── forms/             # Forms demo
│   │   │   └── status-badges/     # Status badges demo
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Root redirect
│   │   └── globals.css            # Global styles
│   ├── components/                # React components
│   │   ├── data-display/          # Tables, cards
│   │   ├── forms/                 # Currency, date, quantity inputs
│   │   ├── layout/                # AppShell, header, sidebar
│   │   ├── status/                # Status badges (13 variants)
│   │   └── ui/                    # shadcn/ui primitives
│   ├── config/                    # App configuration
│   │   ├── navigation.ts          # Nav structure (9 routes)
│   │   └── site.ts                # Site settings (VND, vi-VN)
│   ├── lib/                       # Utilities
│   │   ├── format.ts              # Currency, date formatting
│   │   └── utils.ts               # cn() class merger
│   └── types/                     # TypeScript types
│       ├── enums.ts               # Status enums (9 types)
│       └── index.ts               # Re-exports
├── public/                        # Static assets
├── .claude/                       # Claude Code workflows
├── plans/reports/                 # Scout reports
└── [config files]                 # Next.js, TS, ESLint, Tailwind
```

### Key Directories

**`src/app/`** - Next.js App Router pages (4 demo pages implemented)
**`src/components/`** - Reusable components (46 files: layout, forms, tables, badges)
**`src/lib/`** - Utilities (VND formatting, date formatting, Tailwind class merger)
**`src/types/`** - Type definitions (9 status enums for type safety)

---

## Features (Current vs Planned)

### ✅ Implemented (Foundation Phase)

**Layout System:**
- AppShell with collapsible sidebar (256px → 64px)
- Sticky header with breadcrumbs, search, notifications, user menu
- Responsive design (desktop-first)
- Dark mode support

**Components:**
- **DataTable:** Sortable, paginated, card view, empty states
- **Forms:** Currency input (VND), quantity input (+/- buttons), date picker (vi-VN)
- **Status Badges:** 13 variants (NEW, IN_PROGRESS, COMPLETED, etc.) with WCAG AA colors
- **UI Primitives:** 18 shadcn/ui components (button, card, dialog, etc.)

**Utilities:**
- Currency formatting: `formatCurrency(1000000)` → "1.000.000 đ"
- Date formatting: `formatDateShort(date)` → "15/01/2026"
- Type-safe status enums (prevents typos, enables autocomplete)

**Demo Pages:**
- `/dashboard` - Stats cards, recent activity
- `/data-table` - DataTable with 8 sample bookings
- `/forms` - Form components showcase
- `/status-badges` - Status badge variants

### ⏳ Planned (Feature Development)

**8 CRUD Modules:**
- **Services & Pricing:** Manage catalog, price history
- **Customers & Land:** Profiles, GPS land parcels
- **Bookings:** Create service requests, track status
- **Jobs:** Assign workers/machines, freeze wages
- **Billing:** Aggregate bookings, partial payments, debt tracking
- **Payroll:** Calculate wages, deduct advances
- **Machines:** Inventory, maintenance, ROI reports
- **Dashboard:** Financial summary, alerts, reports

**Backend:**
- PostgreSQL database (13 tables per PRD)
- Prisma ORM (type-safe queries, migrations)
- Authentication (Clerk or NextAuth)
- Next.js API routes or Server Actions

**Advanced Features:**
- Form validation (Zod schemas)
- State management (Zustand, TanStack Query)
- Testing (Vitest, Playwright)
- Deployment (Vercel or Docker)

---

## Development Workflow

### Code Standards

**File Naming:** kebab-case (e.g., `currency-input.tsx`)
**File Size:** <200 lines (refactor if exceeded)
**Imports:** Use `@/` aliases (`@/components`, `@/lib`, `@/types`)
**Components:** Functional, arrow functions, TypeScript strict mode
**Styling:** Tailwind CSS with `cn()` class merger

**Principles:**
- **YAGNI:** Build only what's needed now
- **KISS:** Prefer simple solutions over clever code
- **DRY:** Extract reusable patterns (but don't over-abstract)

See [docs/code-standards.md](./docs/code-standards.md) for full guide.

### Git Workflow

**Commit Format:** `type(scope): message`

Examples:
```
feat(bookings): add booking creation form
fix(currency): handle empty input in parseCurrency
refactor(layout): extract sidebar nav to separate component
```

**Branch Naming:** `type/description`

Examples: `feat/booking-crud`, `fix/currency-formatting`

### Testing (Planned)

**Unit Tests:**
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

**E2E Tests:**
```bash
npm run test:e2e          # Playwright tests
```

---

## Database Schema (Planned)

**13 Tables** across 3 groups:

### Masters (5 tables)
- `Service` - Service catalog (name, unit, current price)
- `Job_Type` - Job types per service (base salary)
- `Worker` - Worker profiles
- `Worker_Weight` - Salary multipliers (worker × job_type)
- `Machine` - Machine inventory (status, purchase date)

### Operations (5 tables)
- `Customer` - Customer profiles
- `Land` - Land parcels (GPS, customer FK)
- `Booking` - Service bookings (captured price snapshot)
- `Job` - Job execution (booking, machine FKs)
- `Job_Worker` - Worker assignments (wage snapshots)

### Financials (3 tables)
- `Bill` - Customer invoices (aggregates bookings)
- `Advance_Payment` - Worker advances
- `Payroll_Sheet` - Worker payroll (aggregates jobs + advances)

**Key Pattern: Snapshot on Creation**
- Booking captures service price at time of creation
- Job_Worker captures base salary & weight at time of job creation
- Prevents historical data drift when prices/wages change

See [docs/system-architecture.md](./docs/system-architecture.md) §Database for full schema.

---

## Business Logic Highlights

### Wage Calculation (Job Workers)

```
Final Wage = Actual Quantity × Base Salary × Worker Weight

Example:
- Worker "Trần Văn B" does 8 hours of "Driver" job
- Base salary: 100,000 VND/hour (from Job_Type)
- Worker weight: 1.2 (from Worker_Weight)
- Final wage: 8 × 100,000 × 1.2 = 960,000 VND

Stored in Job_Worker:
- actual_qty: 8
- applied_base: 100,000  (snapshot)
- applied_weight: 1.2    (snapshot)
- final_pay: 960,000     (snapshot)
```

**Why snapshots?** If base salary changes to 110k next month, old jobs still show 100k (historical accuracy).

### Bill Aggregation (Customer Debt)

```
Bill Total = Σ (Booking.total_amount) for all bookings in bill
Customer Debt = Σ (Bill.total_amount - Bill.total_paid) for all OPEN/PARTIAL bills

Example:
- Bill #1: 3 bookings (1M, 2M, 1.5M) → Total 4.5M
- Customer pays 2M → Bill status PARTIAL_PAID, debt 2.5M
- Customer pays 2.5M → Bill status COMPLETED, debt 0
```

**Business Rule:** Booking can belong to only one bill. Cannot delete bill with PARTIAL_PAID status.

---

## Contributing

### Contribution Workflow

1. Read [docs/code-standards.md](./docs/code-standards.md)
2. Create feature branch: `git checkout -b feat/your-feature`
3. Make changes following standards
4. Run linter: `npm run lint`
5. Commit with conventional format: `feat(scope): message`
6. Push and create pull request

### Pull Request Checklist

- [ ] TypeScript strict mode passes (no `any`)
- [ ] File size <200 lines (or justified)
- [ ] Imports use `@/` aliases
- [ ] Tailwind classes grouped logically
- [ ] WCAG AA contrast ratios (status badges)
- [ ] Vietnamese locale used (dates, currency)
- [ ] No hardcoded strings (use enums/constants)

---

## Roadmap

### Phase 1: Foundation ✅ (Complete - 2026-01-15)
- ✅ Next.js project setup
- ✅ Component library (layout, forms, tables, badges)
- ✅ Type-safe enums
- ✅ Vietnamese localization
- ✅ Demo pages

### Phase 2: Backend & Auth ⏳ (2 weeks)
- ⏳ PostgreSQL + Prisma schema
- ⏳ Authentication (Clerk/NextAuth)
- ⏳ API routes or Server Actions
- ⏳ Database migrations + seeding

### Phase 3: CRUD Modules ⏳ (4 weeks)
- ⏳ Services & Pricing
- ⏳ Customers & Land
- ⏳ Bookings
- ⏳ Jobs with wage snapshots
- ⏳ Billing with partial payments
- ⏳ Payroll with advances
- ⏳ Machines & maintenance

### Phase 4: Reports & Polish ⏳ (2 weeks)
- ⏳ Dashboard with financial summary
- ⏳ Debt/payroll reports
- ⏳ Form validation (Zod)
- ⏳ Error handling, loading states

### Phase 5: Testing & Deployment ⏳ (1 week)
- ⏳ Unit + integration tests
- ⏳ E2E tests (critical flows)
- ⏳ Production deployment
- ⏳ User acceptance testing

---

## Environment Variables (Planned)

Create `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/agrpal"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# OR Authentication (NextAuth)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## FAQ

**Q: Is this production-ready?**
A: Foundation (UI) is complete. Backend (database, API, auth) is planned but not implemented.

**Q: Can I use this for my business?**
A: Not yet. Current version is demo-only (no data persistence). Wait for Phase 2-3 (backend + CRUD).

**Q: Why Vietnamese locale only?**
A: Target market is Vietnamese agricultural services. Internationalization (i18n) can be added later.

**Q: Can I add more users (workers, customers)?**
A: Current design is single admin. Multi-user support (RBAC) can be added in future phases.

**Q: How do I customize colors/branding?**
A: Edit `src/app/globals.css` (CSS variables) and see [Brand Guidelines](./docs/high-level-project-documents/Brand%20Guidelines.md).

---

## License

MIT License - See [LICENSE](./LICENSE) for details.

---

## Support

- 📖 **Documentation:** [docs/](./docs/)
- 🐛 **Issues:** [GitHub Issues](https://github.com/yourusername/agr-pal/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/yourusername/agr-pal/discussions)

---

**Built with ❤️ for Vietnamese agricultural service businesses.**
