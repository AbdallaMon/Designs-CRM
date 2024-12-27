/*
  Warnings:

  - Added the required column `userId` to the `CallReminder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `callreminder` ADD COLUMN `callResult` TEXT NULL,
    ADD COLUMN `reminderReason` TEXT NULL,
    ADD COLUMN `userId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `CallReminder_userId_idx` ON `CallReminder`(`userId`);

-- AddForeignKey
ALTER TABLE `CallReminder` ADD CONSTRAINT `CallReminder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
