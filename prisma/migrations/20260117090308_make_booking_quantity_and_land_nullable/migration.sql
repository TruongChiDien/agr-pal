-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_land_id_fkey";

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "land_id" DROP NOT NULL,
ALTER COLUMN "quantity" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_land_id_fkey" FOREIGN KEY ("land_id") REFERENCES "lands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
