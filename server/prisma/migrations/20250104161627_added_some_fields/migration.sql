/*
  Warnings:

  - The values [NEW_REMINDER,NEW_LOG] on the enum `Notification_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_clientLeadId_fkey`;

-- AlterTable
ALTER TABLE `notification` MODIFY `type` ENUM('NEW_LEAD', 'LEAD_ASSIGNED', 'LEAD_STATUS_CHANGE', 'LEAD_TRANSFERRED', 'LEAD_UPDATED', 'LEAD_CONTACT', 'NOTE_ADDED', 'FILE_UPLOADED', 'NEW_NOTE', 'NEW_FILE', 'CALL_REMINDER_CREATED', 'CALL_REMINDER_STATUS', 'PRICE_OFFER_SUBMITTED', 'PRICE_OFFER_UPDATED', 'FINAL_PRICE_ADDED', 'FINAL_PRICE_CHANGED', 'OTHER') NOT NULL,
    MODIFY `clientLeadId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
