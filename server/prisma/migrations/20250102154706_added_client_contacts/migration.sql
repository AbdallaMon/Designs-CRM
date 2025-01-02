-- CreateTable
CREATE TABLE `ContactClient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `time` DATETIME(3) NOT NULL,
    `contactResult` TEXT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ContactClient` ADD CONSTRAINT `ContactClient_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactClient` ADD CONSTRAINT `ContactClient_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
