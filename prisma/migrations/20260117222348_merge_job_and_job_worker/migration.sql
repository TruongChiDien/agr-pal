-- Migration: Merge Job and Job_Worker tables
-- This migration combines job_workers into jobs table (1:1 relationship)

-- Step 1: Add new columns to jobs table (nullable first)
ALTER TABLE "jobs" ADD COLUMN "worker_id" TEXT;
ALTER TABLE "jobs" ADD COLUMN "actual_qty" DECIMAL(10,2);
ALTER TABLE "jobs" ADD COLUMN "applied_base" DECIMAL(12,2);
ALTER TABLE "jobs" ADD COLUMN "applied_weight" DECIMAL(5,2);
ALTER TABLE "jobs" ADD COLUMN "final_pay" DECIMAL(12,2);
ALTER TABLE "jobs" ADD COLUMN "payment_status" TEXT;
ALTER TABLE "jobs" ADD COLUMN "payroll_id" TEXT;

-- Step 2: Migrate data from job_workers to jobs
UPDATE "jobs"
SET
  "worker_id" = jw."worker_id",
  "actual_qty" = jw."actual_qty",
  "applied_base" = jw."applied_base",
  "applied_weight" = jw."applied_weight",
  "final_pay" = jw."final_pay",
  "payment_status" = jw."payment_status",
  "payroll_id" = jw."payroll_id"
FROM "job_workers" jw
WHERE "jobs"."id" = jw."job_id";

-- Step 3: Delete jobs that don't have workers (orphaned jobs)
DELETE FROM "jobs"
WHERE "id" NOT IN (SELECT "job_id" FROM "job_workers");

-- Step 4: Make worker_id and snapshot fields required
ALTER TABLE "jobs" ALTER COLUMN "worker_id" SET NOT NULL;
ALTER TABLE "jobs" ALTER COLUMN "actual_qty" SET NOT NULL;
ALTER TABLE "jobs" ALTER COLUMN "actual_qty" SET DEFAULT 0;
ALTER TABLE "jobs" ALTER COLUMN "applied_base" SET NOT NULL;
ALTER TABLE "jobs" ALTER COLUMN "applied_weight" SET NOT NULL;
ALTER TABLE "jobs" ALTER COLUMN "final_pay" SET NOT NULL;
ALTER TABLE "jobs" ALTER COLUMN "payment_status" SET NOT NULL;
ALTER TABLE "jobs" ALTER COLUMN "payment_status" SET DEFAULT 'PENDING_PAYROLL';

-- Step 5: Add foreign key constraints
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_worker_id_fkey"
  FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "jobs" ADD CONSTRAINT "jobs_payroll_id_fkey"
  FOREIGN KEY ("payroll_id") REFERENCES "payroll_sheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Create indexes for new foreign keys
CREATE INDEX "jobs_worker_id_idx" ON "jobs"("worker_id");
CREATE INDEX "jobs_payment_status_idx" ON "jobs"("payment_status");
CREATE INDEX "jobs_payroll_id_idx" ON "jobs"("payroll_id");

-- Step 7: Drop the job_workers table
DROP TABLE "job_workers";
