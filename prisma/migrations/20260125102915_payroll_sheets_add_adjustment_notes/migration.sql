-- AlterTable
ALTER TABLE "payroll_sheets" ADD COLUMN     "adjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT;
