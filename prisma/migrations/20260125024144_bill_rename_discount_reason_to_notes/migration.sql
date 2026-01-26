/*
  Warnings:

  - You are about to drop the column `discount_reason` on the `bills` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bills" DROP COLUMN "discount_reason",
ADD COLUMN     "notes" TEXT;
