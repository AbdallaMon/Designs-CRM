/*
  Warnings:

  - The values [CONTACT_INITIATED] on the enum `ClientLead_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `clientlead` MODIFY `status` ENUM('NEW', 'IN_PROGRESS', 'INTERESTED', 'NEEDS_IDENTIFIED', 'NEGOTIATING', 'REJECTED', 'FINALIZED', 'CONVERTED') NOT NULL DEFAULT 'NEW';
