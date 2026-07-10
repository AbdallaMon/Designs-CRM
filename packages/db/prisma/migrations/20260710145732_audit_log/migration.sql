-- CreateTable
CREATE TABLE `ActionAuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actorUserId` INTEGER NOT NULL,
    `actorRole` VARCHAR(48) NULL,
    `module` VARCHAR(48) NOT NULL,
    `action` VARCHAR(64) NOT NULL,
    `entityType` VARCHAR(48) NULL,
    `entityId` INTEGER NULL,
    `clientLeadId` INTEGER NULL,
    `summary` VARCHAR(255) NULL,
    `detail` JSON NULL,
    `ip` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ActionAuditLog_actorUserId_idx`(`actorUserId`),
    INDEX `ActionAuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `ActionAuditLog_clientLeadId_idx`(`clientLeadId`),
    INDEX `ActionAuditLog_module_action_idx`(`module`, `action`),
    INDEX `ActionAuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
