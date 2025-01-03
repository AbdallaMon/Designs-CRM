/*
  Warnings:

  - You are about to drop the column `priceWithDiscount` on the `clientlead` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `clientlead` DROP COLUMN `priceWithDiscount`,
    ADD COLUMN `priceWithOutDiscount` DECIMAL(10, 2) NOT NULL DEFAULT 0;
