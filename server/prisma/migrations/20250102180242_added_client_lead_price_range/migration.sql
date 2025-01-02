-- CreateTable
CREATE TABLE `PriceRange` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `minPrice` DECIMAL(10, 2) NOT NULL,
    `maxPrice` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PriceRange_clientLeadId_idx`(`clientLeadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PriceRange` ADD CONSTRAINT `PriceRange_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PriceRange` ADD CONSTRAINT `PriceRange_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
