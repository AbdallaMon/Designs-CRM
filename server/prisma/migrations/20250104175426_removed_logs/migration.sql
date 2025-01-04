/*
  Warnings:

  - The values [FILE_UPLOADED] on the enum `Notification_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `log` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `log` DROP FOREIGN KEY `Log_userId_fkey`;

-- AlterTable
ALTER TABLE `notification` ADD COLUMN `staffId` INTEGER NULL,
    MODIFY `type` ENUM('NEW_LEAD', 'LEAD_ASSIGNED', 'LEAD_STATUS_CHANGE', 'LEAD_TRANSFERRED', 'LEAD_UPDATED', 'LEAD_CONTACT', 'NOTE_ADDED', 'NEW_NOTE', 'NEW_FILE', 'CALL_REMINDER_CREATED', 'CALL_REMINDER_STATUS', 'PRICE_OFFER_SUBMITTED', 'PRICE_OFFER_UPDATED', 'FINAL_PRICE_ADDED', 'FINAL_PRICE_CHANGED', 'OTHER') NOT NULL;

-- DropTable
DROP TABLE `log`;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
