/*
  Warnings:

  - The values [CONVERTED] on the enum `ClientLead_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `clientlead` MODIFY `status` ENUM('NEW', 'IN_PROGRESS', 'CONTACT_INITIATED', 'INTERESTED', 'NEEDS_IDENTIFIED', 'NEGOTIATING', 'REJECTED', 'FINALIZED') NOT NULL DEFAULT 'NEW';
