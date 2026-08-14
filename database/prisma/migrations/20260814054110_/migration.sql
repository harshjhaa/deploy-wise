/*
  Warnings:

  - You are about to drop the column `reservationEnabled` on the `Environment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Environment" DROP COLUMN "reservationEnabled",
ADD COLUMN     "isReserved" BOOLEAN NOT NULL DEFAULT false;
