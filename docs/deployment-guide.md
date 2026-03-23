# Deployment Guide

## 1. Environment Setup

### Development Environment

#### Prerequisites
- Node.js 20+ LTS
- npm 10+ (or yarn/pnpm/bun)
- Git
- PostgreSQL 15+ (for local development, optional — use Supabase dev)
- VS Code + ESLint extension (recommended)

#### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/agr-pal.git
cd agr-pal

# Install dependencies
npm install

# Create .env.local (development)
cp .env.example .env.local
```

#### Development Variables (.env.local)
```bash
# Database (Supabase dev instance or local PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/agrpal_dev"

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<random-32-char-hex>"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Start Development Server
```bash
npm run dev
# Open http://localhost:3000
# Auth enabled: use /api/setup-admin to create first admin (one-time)
```

#### Generate NextAuth Secret
```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Copy output to NEXTAUTH_SECRET
```

---

### Staging Environment (Vercel Preview)

Staging uses a **Supabase staging database** deployed via Vercel Preview deployments.

#### Vercel Setup
1. **Connect GitHub repository** to Vercel
   - Go to vercel.com → New Project
   - Import this repository
   - Select Next.js framework

2. **Environment Variables** (Vercel Dashboard → Settings → Environment Variables)
   - Add for `Preview` and `Production` deployments:
     ```
     DATABASE_URL=postgresql://...
     NEXTAUTH_URL=https://<preview>.vercel.app
     NEXTAUTH_SECRET=<same-as-production>
     NEXT_PUBLIC_APP_URL=https://<preview>.vercel.app
     ```

3. **Deploy Preview**
   - Push to any branch except `main`
   - Vercel auto-deploys PR preview
   - Test at `https://<branch-name>.vercel.app`

#### Database Seeding (Staging)
```bash
# From local machine, connected to staging DB
DATABASE_URL=<staging-supabase-url> npx prisma db seed

# Or run migrations
DATABASE_URL=<staging-supabase-url> npx prisma migrate deploy
```

---

### Production Environment (Vercel + Supabase)

Production uses **Supabase PostgreSQL** (managed) + **Vercel** (serverless hosting).

#### Supabase Production Setup

1. **Create Project**
   - Go to supabase.com → New Project
   - Region: Closest to target market (e.g., Singapore for Southeast Asia)
   - Password: Strong (stored securely in password manager)
   - Tier: Pro ($25/month) or pay-as-you-go

2. **Extract Connection String**
   - Supabase Dashboard → Project Settings → Database → Connection Pooling
   - Copy "Connection string" (with password)
   - Format: `postgresql://postgres:<password>@<host>:<port>/postgres`

3. **Initial Migration**
   ```bash
   DATABASE_URL="<supabase-connection-string>" npx prisma migrate deploy
   ```

4. **Seed Production Data**
   ```bash
   DATABASE_URL="<supabase-connection-string>" npx prisma db seed
   ```

5. **Enable Backups**
   - Supabase Dashboard → Settings → Backups
   - Enable daily backups (default: 30-day retention)
   - Enable point-in-time recovery (optional, $20/month)

#### Vercel Production Setup

1. **Add Production Environment Variables**
   - Vercel Dashboard → Settings → Environment Variables
   - Add for `Production` only:
     ```
     DATABASE_URL=<supabase-prod-url>
     NEXTAUTH_URL=https://yourapp.com
     NEXTAUTH_SECRET=<generated-secret>
     NEXT_PUBLIC_APP_URL=https://yourapp.com
     ```

2. **Custom Domain**
   - Vercel Dashboard → Settings → Domains
   - Add custom domain (e.g., `agr-pal.yourcompany.com`)
   - Update DNS records (CNAME or A record per Vercel instructions)
   - SSL auto-configured (Let's Encrypt)

3. **Production Deployment**
   ```bash
   # Push to main branch (default)
   git push origin main

   # Vercel auto-builds & deploys
   # Verify at https://yourapp.com
   ```

---

## 2. Prisma Migration Workflow

### Development Workflow

#### 1. Modify Schema
```bash
# Edit prisma/schema.prisma
# Example: Add field to Customer model
model Customer {
  id        String    @id @default(cuid())
  name      String
  phone     String?
  address   String?
  email     String?  # NEW FIELD
  created_at DateTime @default(now())
}
```

#### 2. Create Migration
```bash
npx prisma migrate dev --name add_email_to_customer

# Prompts: Review migration, apply to dev DB
# Generates: prisma/migrations/20260323_add_email_to_customer/migration.sql
# Updates: prisma/schema.prisma
```

#### 3. Verify Changes
```bash
# Prisma Studio (interactive DB explorer)
npx prisma studio

# or Query directly
npm run db:query "SELECT * FROM customers LIMIT 5;"
```

#### 4. Commit Changes
```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(schema): add email field to Customer"
git push origin feat/add-customer-email
```

### Production Workflow

#### 1. Test Migration in Staging
```bash
# Deploy to staging environment first
git push origin feat/add-customer-email

# Vercel builds & deploys preview
# Manually test with staging DB
```

#### 2. Merge to Main
```bash
# Create PR, get approval
git checkout main && git pull
git merge feat/add-customer-email
git push origin main

# Vercel auto-deploys to production
```

#### 3. Apply Migration to Production
```bash
# CI/CD Pipeline (or manual if needed)
DATABASE_URL=<prod-supabase-url> npx prisma migrate deploy

# Verify migration applied
npx prisma migrate status --version=<migration-name>
```

### Rollback Strategy

#### Rollback Last Migration
```bash
# Only in development (destructive)
npx prisma migrate resolve --rolled-back <migration-name>

# Production: Create new migration to undo (non-destructive)
npx prisma migrate dev --name revert_email_field
# Manually write migration to DROP COLUMN email
```

---

## 3. Seeding Data

### Seed Script Setup

#### Create Seed Script
```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Create admin user
  const admin = await db.user.create({
    data: {
      email: "admin@agrpal.com",
      name: "Admin",
      password_hash: await bcrypt.hash("admin123", 10), // Change in production
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // 2. Create machine types
  const harvester = await db.machineType.create({
    data: {
      name: "Máy cắt lúa",
      description: "Máy cắt và bao đóng lúa",
    },
  });
  console.log("✅ Machine type created:", harvester.name);

  // 3. Create job types
  const driver = await db.job_Type.create({
    data: {
      machine_type_id: harvester.id,
      name: "Tài xế",
      default_base_salary: 500000,
    },
  });
  console.log("✅ Job type created:", driver.name);

  // 4. Create services
  const harvesting = await db.service.create({
    data: {
      name: "Cắt lúa",
      unit: "công",
      price: 2000000,
    },
  });
  console.log("✅ Service created:", harvesting.name);

  // 5. Create sample customer
  const customer = await db.customer.create({
    data: {
      name: "Nông dân Trần",
      phone: "0912345678",
      address: "Xã Tân Tiến, Hữu Lương, Hà Tĩnh",
    },
  });
  console.log("✅ Customer created:", customer.name);

  // 6. Create sample land
  const land = await db.land.create({
    data: {
      customer_id: customer.id,
      name: "Thửa đất 1",
      gps_lat: 18.3557,
      gps_lng: 105.7894,
    },
  });
  console.log("✅ Land created:", land.name);

  console.log("✨ Seeding complete!");
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
```

#### Register Seed Script
```json
// package.json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

#### Run Seed
```bash
# Development
npx prisma db seed

# Production (with env variables)
DATABASE_URL=<prod-url> npx prisma db seed
```

---

## 4. Build & Deployment

### Build Locally
```bash
npm run build

# Check build output
ls -la .next/

# Verify no TypeScript errors
npm run type-check
```

### Build in Vercel (Automatic)

Vercel automatically:
1. **Detects** Next.js project
2. **Builds** with `npm run build`
3. **Deploys** to Edge Network
4. **Caches** dependencies

#### Build Settings (Vercel Dashboard)
- Framework: Next.js
- Build Command: `next build`
- Output Directory: `.next`
- Install Command: `npm install`

### Deployment Checks

Before deploying to production:

```bash
# 1. Lint check
npm run lint

# 2. Type check
npm run type-check

# 3. Test (when available)
npm run test

# 4. Build verification
npm run build

# 5. Database migration status
DATABASE_URL=<target-url> npx prisma migrate status

# 6. Environment variables (verify all set in Vercel)
echo "DATABASE_URL: ${DATABASE_URL}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL}"
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}"
```

---

## 5. Environment Variables Reference

### Development (.env.local)
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/agrpal_dev"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<openssl-generated>"

# Public (visible to frontend)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Staging (.env.staging / Vercel Preview)
```bash
# Database (Supabase staging)
DATABASE_URL="postgresql://postgres:<password>@<host>.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="https://<branch>.vercel.app"
NEXTAUTH_SECRET="<same-secret>"

# Public
NEXT_PUBLIC_APP_URL="https://<branch>.vercel.app"
```

### Production (.env.production / Vercel Production)
```bash
# Database (Supabase production)
DATABASE_URL="postgresql://postgres:<password>@<prod-host>.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="https://yourapp.com"
NEXTAUTH_SECRET="<generated-secret>"

# Public
NEXT_PUBLIC_APP_URL="https://yourapp.com"
```

### Notes
- **NEVER commit .env files** to Git (add to .gitignore)
- **DATABASE_URL:** Use connection pooling URL for Supabase (not direct connection)
- **NEXTAUTH_SECRET:** Must be same across environments (users won't be logged out on redeploy)

---

## 6. Monitoring & Troubleshooting

### Vercel Monitoring

#### Logs
- Vercel Dashboard → Deployments → Select deployment → Logs
- Shows: build errors, runtime errors, function duration

#### Metrics
- Vercel Dashboard → Analytics
- Shows: request count, response time, error rate

#### Environment Variables Issues
```bash
# Verify variables are set
curl https://yourapp.com/api/health

# Check in server action (logs to Vercel)
export async function checkEnv() {
  console.log("DB URL:", process.env.DATABASE_URL ? "✅" : "❌");
  console.log("NEXTAUTH URL:", process.env.NEXTAUTH_URL);
}
```

### Supabase Monitoring

#### Database Status
- Supabase Dashboard → Project → Health
- Shows: connections, query performance, storage usage

#### Logs
- Supabase Dashboard → Database → Logs
- Shows: SQL queries, slow queries, connection errors

#### Backups
- Supabase Dashboard → Settings → Backups
- View backup history, restore from backup

### Common Issues

#### Issue: "Error: Cannot find module 'prisma'"
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

#### Issue: "NEXTAUTH_SECRET is invalid"
```bash
# Solution: Regenerate and update
openssl rand -base64 32

# Update in Vercel Dashboard → Environment Variables
# Re-deploy application
```

#### Issue: "Database connection timeout"
```bash
# Solution: Check connection string
# Supabase Dashboard → Project Settings → Database → Connection Pooling
# Copy connection string with pooling mode

# Test connection locally
psql <connection-string>
```

#### Issue: "TypeScript error in production build"
```bash
# Solution: Check strict mode
npm run type-check

# Fix errors or use // @ts-ignore (last resort)
# Commit and re-deploy
```

---

## 7. Backup & Recovery

### Supabase Automated Backups

Supabase automatically creates:
- **Daily backups:** 30-day retention
- **Hourly snapshots:** For point-in-time recovery (Pro tier)
- **Before migration:** Auto-backup before each deploy

#### Manual Backup
```bash
# Export database to SQL file
pg_dump <connection-string> > backup-$(date +%Y%m%d).sql

# Compress for storage
gzip backup-*.sql

# Store in S3 or cloud storage
aws s3 cp backup-*.sql.gz s3://my-backups/agr-pal/
```

#### Restore from Backup
1. **Via Supabase UI:**
   - Dashboard → Settings → Backups
   - Select backup date
   - Click "Restore"
   - Confirm (will overwrite current data)

2. **Via pg_restore:**
   ```bash
   pg_restore -h <host> -U postgres -d postgres backup.sql
   ```

### Data Export (For Migration)

```bash
# Export specific table
psql <connection-string> -c "COPY customers TO STDOUT" > customers.csv

# Export all tables as SQL
pg_dump <connection-string> > full-backup.sql
```

---

## 8. Security Checklist

Before production deployment:

- [ ] **Environment Variables**
  - [ ] NEXTAUTH_SECRET is strong (32 bytes)
  - [ ] DATABASE_URL uses connection pooling
  - [ ] No secrets in code (grep for hardcoded passwords)
  - [ ] .env files in .gitignore

- [ ] **Authentication**
  - [ ] NextAuth Credentials Provider working
  - [ ] Bcrypt password hashing enabled (10+ rounds)
  - [ ] Session middleware protecting routes
  - [ ] CSRF protection enabled (NextAuth default)

- [ ] **Database**
  - [ ] Row-Level Security (RLS) policies (if multi-user in future)
  - [ ] No test data in production
  - [ ] Backups tested & verified
  - [ ] Database user has least privilege (no superuser for app)

- [ ] **Frontend**
  - [ ] No API keys exposed in client code
  - [ ] All forms validated with Zod
  - [ ] Error messages don't leak sensitive info
  - [ ] HTTPS enforced (Vercel default)

- [ ] **Monitoring**
  - [ ] Error tracking configured (Sentry, LogRocket)
  - [ ] Performance monitoring enabled
  - [ ] Uptime monitoring (UptimeRobot, Pingdom)
  - [ ] Alerts configured for errors

---

## 9. Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build -- --analyze

# Output: bundle analysis in .next/static
```

### Image Optimization
```typescript
// Use Next.js Image for optimized images
import Image from "next/image";

<Image
  src="/logo.png"
  alt="Logo"
  width={100}
  height={100}
  priority // For above-the-fold images
/>
```

### Database Query Optimization
```typescript
// Use Prisma include for eager loading
const bookings = await db.booking.findMany({
  include: {
    customer: true, // Avoid N+1 queries
    land: true,
    bill: true,
  },
});
```

### Caching Strategy
```typescript
// Use TanStack Query with stale time
useQuery({
  queryKey: ["customers"],
  queryFn: listCustomers,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

## 10. Disaster Recovery Plan

### Recovery Time Objective (RTO)
- **Target:** <1 hour recovery time
- **Method:** Restore from Supabase backup or re-deploy code

### Recovery Point Objective (RPO)
- **Target:** <1 day data loss
- **Method:** Daily backups (Supabase managed)

### Recovery Steps

1. **Database Corruption/Failure:**
   - Go to Supabase Dashboard → Settings → Backups
   - Select backup from last known good state
   - Click "Restore"
   - Verify data integrity
   - Notify users of temporary outage

2. **Code Deployment Failure:**
   - Go to Vercel Dashboard → Deployments
   - Find last successful deployment
   - Click "Rollback to this deployment"
   - Verify application loads
   - Investigate and fix code issue

3. **Complete Service Loss:**
   - Export database from Supabase backup to SQL
   - Create new Supabase project
   - Restore from SQL dump
   - Update Vercel environment variables
   - Re-deploy application

---

**Version:** 1.0 | **Last Updated:** 2026-03-23 | **Owner:** DevOps Lead
