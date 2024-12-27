-- CreateTable
CREATE TABLE `CallReminder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `time` DATETIME(3) NOT NULL,
    `status` ENUM('IN_PROGRESS', 'DONE', 'MISSED') NOT NULL DEFAULT 'IN_PROGRESS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CallReminder_clientLeadId_idx`(`clientLeadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CallReminder` ADD CONSTRAINT `CallReminder_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
