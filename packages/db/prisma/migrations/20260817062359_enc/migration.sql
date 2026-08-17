-- AlterTable
ALTER TABLE `ClientLead` ADD COLUMN `source` VARCHAR(255) NOT NULL DEFAULT 'https://booking.ahmadmobayed.com';

-- CreateTable
CREATE TABLE `TelegramEncryptedCredential` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `telegramConnectionId` INTEGER NOT NULL,
    `ciphertext` LONGTEXT NOT NULL,
    `algorithm` VARCHAR(32) NOT NULL DEFAULT 'AES-256-GCM',
    `keyVersion` INTEGER NOT NULL DEFAULT 1,
    `dataIv` VARCHAR(64) NOT NULL,
    `dataAuthTag` VARCHAR(64) NOT NULL,
    `wrappedDataKey` VARCHAR(128) NOT NULL,
    `keyIv` VARCHAR(64) NOT NULL,
    `keyAuthTag` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TelegramEncryptedCredential_telegramConnectionId_key`(`telegramConnectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoogleEncryptedCredential` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `ciphertext` LONGTEXT NOT NULL,
    `algorithm` VARCHAR(32) NOT NULL DEFAULT 'AES-256-GCM',
    `keyVersion` INTEGER NOT NULL DEFAULT 1,
    `dataIv` VARCHAR(64) NOT NULL,
    `dataAuthTag` VARCHAR(64) NOT NULL,
    `wrappedDataKey` VARCHAR(128) NOT NULL,
    `keyIv` VARCHAR(64) NOT NULL,
    `keyAuthTag` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GoogleEncryptedCredential_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TelegramEncryptedCredential` ADD CONSTRAINT `TelegramEncryptedCredential_telegramConnectionId_fkey` FOREIGN KEY (`telegramConnectionId`) REFERENCES `TelegramConnection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoogleEncryptedCredential` ADD CONSTRAINT `GoogleEncryptedCredential_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
