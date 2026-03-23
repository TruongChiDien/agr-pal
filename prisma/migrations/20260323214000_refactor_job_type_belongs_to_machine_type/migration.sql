[dotenv@17.3.1] injecting env (6) from .env.local -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING_BILL', 'ADDED_BILL', 'FULLY_PAID');

-- CreateEnum
CREATE TYPE "JobPaymentStatus" AS ENUM ('PENDING_PAYROLL', 'ADDED_PAYROLL', 'FULLY_PAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('OPEN', 'PARTIAL_PAID', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AdvanceStatus" AS ENUM ('UNPROCESSED', 'PROCESSED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('OPEN', 'PARTIAL_PAID', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_types" (
    "id" TEXT NOT NULL,
    "machine_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default_base_salary" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'công',
    "price" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_machine_types" (
    "service_id" TEXT NOT NULL,
    "machine_type_id" TEXT NOT NULL,

    CONSTRAINT "service_machine_types_pkey" PRIMARY KEY ("service_id","machine_type_id")
);

-- CreateTable
CREATE TABLE "workers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "machine_type_id" TEXT NOT NULL,
    "purchase_date" TIMESTAMP(3),
    "status" "MachineStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lands" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gps_lat" DECIMAL(10,7),
    "gps_lng" DECIMAL(10,7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_days" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "land_id" TEXT,
    "amount" DECIMAL(12,2),
    "status" "BookingStatus" NOT NULL DEFAULT 'NEW',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING_BILL',
    "bill_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_bookings" (
    "id" TEXT NOT NULL,
    "work_day_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_machines" (
    "id" TEXT NOT NULL,
    "work_day_id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_machine_workers" (
    "id" TEXT NOT NULL,
    "daily_machine_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "job_type_id" TEXT NOT NULL,
    "applied_base" DECIMAL(12,2) NOT NULL,
    "applied_weight" DECIMAL(5,2) NOT NULL,
    "payment_adjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payroll_id" TEXT,
    "payment_status" "JobPaymentStatus" NOT NULL DEFAULT 'PENDING_PAYROLL',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_machine_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_booking_machines" (
    "id" TEXT NOT NULL,
    "daily_booking_id" TEXT NOT NULL,
    "daily_machine_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_booking_machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "total_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "BillStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "adjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_payments" (
    "id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advance_payments" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "AdvanceStatus" NOT NULL DEFAULT 'UNPROCESSED',
    "payroll_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advance_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_sheets" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "total_wages" DECIMAL(12,2) NOT NULL,
    "total_adv" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "adjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_payable" DECIMAL(12,2) NOT NULL,
    "total_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "PayrollStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_payments" (
    "id" TEXT NOT NULL,
    "payroll_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "brand" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "maintenance_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "job_types_machine_type_id_idx" ON "job_types"("machine_type_id");

-- CreateIndex
CREATE INDEX "machines_machine_type_id_idx" ON "machines"("machine_type_id");

-- CreateIndex
CREATE INDEX "lands_customer_id_idx" ON "lands"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_days_date_key" ON "work_days"("date");

-- CreateIndex
CREATE INDEX "work_days_date_idx" ON "work_days"("date");

-- CreateIndex
CREATE INDEX "bookings_customer_id_idx" ON "bookings"("customer_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_payment_status_idx" ON "bookings"("payment_status");

-- CreateIndex
CREATE INDEX "bookings_bill_id_idx" ON "bookings"("bill_id");

-- CreateIndex
CREATE INDEX "daily_bookings_work_day_id_idx" ON "daily_bookings"("work_day_id");

-- CreateIndex
CREATE INDEX "daily_bookings_booking_id_idx" ON "daily_bookings"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_bookings_work_day_id_booking_id_key" ON "daily_bookings"("work_day_id", "booking_id");

-- CreateIndex
CREATE INDEX "daily_machines_work_day_id_idx" ON "daily_machines"("work_day_id");

-- CreateIndex
CREATE INDEX "daily_machines_machine_id_idx" ON "daily_machines"("machine_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_machines_work_day_id_machine_id_key" ON "daily_machines"("work_day_id", "machine_id");

-- CreateIndex
CREATE INDEX "daily_machine_workers_daily_machine_id_idx" ON "daily_machine_workers"("daily_machine_id");

-- CreateIndex
CREATE INDEX "daily_machine_workers_worker_id_idx" ON "daily_machine_workers"("worker_id");

-- CreateIndex
CREATE INDEX "daily_machine_workers_job_type_id_idx" ON "daily_machine_workers"("job_type_id");

-- CreateIndex
CREATE INDEX "daily_machine_workers_payroll_id_idx" ON "daily_machine_workers"("payroll_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_machine_workers_daily_machine_id_worker_id_key" ON "daily_machine_workers"("daily_machine_id", "worker_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_booking_machines_daily_booking_id_daily_machine_id_key" ON "daily_booking_machines"("daily_booking_id", "daily_machine_id");

-- CreateIndex
CREATE INDEX "bills_customer_id_idx" ON "bills"("customer_id");

-- CreateIndex
CREATE INDEX "bills_status_idx" ON "bills"("status");

-- CreateIndex
CREATE INDEX "bill_payments_bill_id_idx" ON "bill_payments"("bill_id");

-- CreateIndex
CREATE INDEX "bill_payments_payment_date_idx" ON "bill_payments"("payment_date");

-- CreateIndex
CREATE INDEX "advance_payments_worker_id_idx" ON "advance_payments"("worker_id");

-- CreateIndex
CREATE INDEX "advance_payments_status_idx" ON "advance_payments"("status");

-- CreateIndex
CREATE INDEX "advance_payments_payroll_id_idx" ON "advance_payments"("payroll_id");

-- CreateIndex
CREATE INDEX "payroll_sheets_worker_id_idx" ON "payroll_sheets"("worker_id");

-- CreateIndex
CREATE INDEX "payroll_sheets_status_idx" ON "payroll_sheets"("status");

-- CreateIndex
CREATE INDEX "payroll_payments_payroll_id_idx" ON "payroll_payments"("payroll_id");

-- CreateIndex
CREATE INDEX "payroll_payments_payment_date_idx" ON "payroll_payments"("payment_date");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_categories_name_key" ON "maintenance_categories"("name");

-- CreateIndex
CREATE INDEX "maintenance_logs_machine_id_idx" ON "maintenance_logs"("machine_id");

-- CreateIndex
CREATE INDEX "maintenance_logs_category_id_idx" ON "maintenance_logs"("category_id");

-- CreateIndex
CREATE INDEX "maintenance_logs_maintenance_date_idx" ON "maintenance_logs"("maintenance_date");

-- AddForeignKey
ALTER TABLE "job_types" ADD CONSTRAINT "job_types_machine_type_id_fkey" FOREIGN KEY ("machine_type_id") REFERENCES "machine_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_machine_types" ADD CONSTRAINT "service_machine_types_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_machine_types" ADD CONSTRAINT "service_machine_types_machine_type_id_fkey" FOREIGN KEY ("machine_type_id") REFERENCES "machine_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_machine_type_id_fkey" FOREIGN KEY ("machine_type_id") REFERENCES "machine_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lands" ADD CONSTRAINT "lands_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_land_id_fkey" FOREIGN KEY ("land_id") REFERENCES "lands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_bookings" ADD CONSTRAINT "daily_bookings_work_day_id_fkey" FOREIGN KEY ("work_day_id") REFERENCES "work_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_bookings" ADD CONSTRAINT "daily_bookings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_machines" ADD CONSTRAINT "daily_machines_work_day_id_fkey" FOREIGN KEY ("work_day_id") REFERENCES "work_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_machines" ADD CONSTRAINT "daily_machines_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_machine_workers" ADD CONSTRAINT "daily_machine_workers_daily_machine_id_fkey" FOREIGN KEY ("daily_machine_id") REFERENCES "daily_machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_machine_workers" ADD CONSTRAINT "daily_machine_workers_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_machine_workers" ADD CONSTRAINT "daily_machine_workers_job_type_id_fkey" FOREIGN KEY ("job_type_id") REFERENCES "job_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_machine_workers" ADD CONSTRAINT "daily_machine_workers_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "payroll_sheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_booking_machines" ADD CONSTRAINT "daily_booking_machines_daily_booking_id_fkey" FOREIGN KEY ("daily_booking_id") REFERENCES "daily_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_booking_machines" ADD CONSTRAINT "daily_booking_machines_daily_machine_id_fkey" FOREIGN KEY ("daily_machine_id") REFERENCES "daily_machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advance_payments" ADD CONSTRAINT "advance_payments_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "payroll_sheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advance_payments" ADD CONSTRAINT "advance_payments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_sheets" ADD CONSTRAINT "payroll_sheets_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_payments" ADD CONSTRAINT "payroll_payments_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "payroll_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "maintenance_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

