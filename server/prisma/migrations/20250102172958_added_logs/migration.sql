/*
  Warnings:

  - The values [CALLl_REMINDER_STATUS] on the enum `Log_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `log` MODIFY `type` ENUM('LEAD_CREATED', 'LEAD_ASSIGNED', 'LEAD_STATUS_CHANGED', 'NOTE_ADDED', 'FILE_UPLOADED', 'LEAD_TRANSFERRED', 'LEAD_CONTACT', 'CALL_REMINDER_STATUS', 'OTHER') NOT NULL;
