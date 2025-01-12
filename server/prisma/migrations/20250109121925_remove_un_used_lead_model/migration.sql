/*
  Warnings:

  - You are about to drop the column `leadId` on the `clientlead` table. All the data in the column will be lost.
  - You are about to drop the `consultation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `design` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `designpricerange` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lead` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `media` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `clientlead` DROP FOREIGN KEY `ClientLead_leadId_fkey`;

-- DropForeignKey
ALTER TABLE `consultation` DROP FOREIGN KEY `Consultation_leadId_fkey`;

-- DropForeignKey
ALTER TABLE `design` DROP FOREIGN KEY `Design_leadId_fkey`;

-- DropForeignKey
ALTER TABLE `designpricerange` DROP FOREIGN KEY `DesignPriceRange_designId_fkey`;

-- DropForeignKey
ALTER TABLE `media` DROP FOREIGN KEY `Media_leadId_fkey`;

-- DropIndex
DROP INDEX `ClientLead_leadId_idx` ON `clientlead`;

-- AlterTable
ALTER TABLE `clientlead` DROP COLUMN `leadId`;

-- DropTable
DROP TABLE `consultation`;

-- DropTable
DROP TABLE `design`;

-- DropTable
DROP TABLE `designpricerange`;

-- DropTable
DROP TABLE `lead`;

-- DropTable
DROP TABLE `media`;
