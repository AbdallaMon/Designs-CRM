/*
  Warnings:

  - You are about to drop the `contactclient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pricerange` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `contactclient` DROP FOREIGN KEY `ContactClient_clientLeadId_fkey`;

-- DropForeignKey
ALTER TABLE `contactclient` DROP FOREIGN KEY `ContactClient_userId_fkey`;

-- DropForeignKey
ALTER TABLE `pricerange` DROP FOREIGN KEY `PriceRange_clientLeadId_fkey`;

-- DropForeignKey
ALTER TABLE `pricerange` DROP FOREIGN KEY `PriceRange_userId_fkey`;

-- DropTable
DROP TABLE `contactclient`;

-- DropTable
DROP TABLE `pricerange`;

-- CreateTable
CREATE TABLE `PriceOffers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `minPrice` DECIMAL(10, 2) NOT NULL,
    `maxPrice` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PriceOffers_clientLeadId_idx`(`clientLeadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PriceOffers` ADD CONSTRAINT `PriceOffers_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PriceOffers` ADD CONSTRAINT `PriceOffers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
