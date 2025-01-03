-- DropForeignKey
ALTER TABLE `file` DROP FOREIGN KEY `File_userId_fkey`;

-- DropForeignKey
ALTER TABLE `log` DROP FOREIGN KEY `Log_userId_fkey`;

-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_userId_fkey`;

-- DropIndex
DROP INDEX `File_userId_fkey` ON `file`;

-- AlterTable
ALTER TABLE `file` MODIFY `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `log` MODIFY `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `notification` MODIFY `userId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `File` ADD CONSTRAINT `File_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Log` ADD CONSTRAINT `Log_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
