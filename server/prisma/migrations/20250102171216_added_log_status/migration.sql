-- AlterTable
ALTER TABLE `log` MODIFY `type` ENUM('LEAD_CREATED', 'LEAD_ASSIGNED', 'LEAD_STATUS_CHANGED', 'NOTE_ADDED', 'FILE_UPLOADED', 'LEAD_TRANSFERRED', 'LEAD_CONTACT', 'CALLl_REMINDER_STATUS', 'OTHER') NOT NULL;
