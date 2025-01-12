/*
  Warnings:

  - You are about to drop the column `consultationType` on the `clientlead` table. All the data in the column will be lost.
  - You are about to drop the column `designItemType` on the `clientlead` table. All the data in the column will be lost.
  - You are about to drop the column `designType` on the `clientlead` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `clientlead` DROP COLUMN `consultationType`,
    DROP COLUMN `designItemType`,
    DROP COLUMN `designType`,
    ADD COLUMN `type` ENUM('ROOM', 'BLUEPRINT', 'CITY_VISIT', 'APARTMENT', 'OCCUPIED_VILLA', 'UNDER_CONSTRUCTION_VILA', 'PART_OF_HOME', 'COMMERCIAL') NOT NULL DEFAULT 'OCCUPIED_VILLA';
