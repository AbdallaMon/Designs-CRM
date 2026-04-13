-- Telegram connection config table (standalone SQL, outside prisma/migrations)
-- Apply manually in DB if needed.

CREATE TABLE `TelegramConnection` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL DEFAULT 'MAIN',
  `apiId` VARCHAR(191) NULL,
  `apiHash` VARCHAR(191) NULL,
  `sessionString` TEXT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `status` ENUM('CONNECTED', 'DISCONNECTED', 'INVALID_SESSION') NOT NULL DEFAULT 'DISCONNECTED',
  `lastCheckedAt` DATETIME(3) NULL,
  `lastConnectedAt` DATETIME(3) NULL,
  `lastError` TEXT NULL,
  `updatedByUserId` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `TelegramConnection_name_key` (`name`),
  INDEX `TelegramConnection_isActive_idx` (`isActive`),
  INDEX `TelegramConnection_updatedByUserId_idx` (`updatedByUserId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `TelegramConnection`
  ADD CONSTRAINT `TelegramConnection_updatedByUserId_fkey`
  FOREIGN KEY (`updatedByUserId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE `TelegramConnection`
  ADD COLUMN `notifiedOfDisconnection` BOOLEAN NOT NULL DEFAULT false AFTER `lastError`;
ALTER TABLE `TelegramConnection`
  ADD COLUMN `phoneNumber` VARCHAR(20) NULL AFTER `status`;