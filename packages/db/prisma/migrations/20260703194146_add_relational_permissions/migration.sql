-- AlterTable
ALTER TABLE `User` ADD COLUMN `currentProfileId` INTEGER NULL;

-- CreateTable
CREATE TABLE `PermissionCode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `module` VARCHAR(64) NOT NULL,
    `label` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PermissionCode_code_key`(`code`),
    INDEX `PermissionCode_module_idx`(`module`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Profile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(64) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `family` VARCHAR(64) NULL,
    `baseRole` ENUM('ADMIN', 'STAFF', 'THREE_D_DESIGNER', 'TWO_D_DESIGNER', 'TWO_D_EXECUTOR', 'ACCOUNTANT', 'SUPER_ADMIN', 'SUPER_SALES', 'CONTACT_INITIATOR') NULL,
    `isAdminTier` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isAssignable` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Profile_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProfilePermission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profileId` INTEGER NOT NULL,
    `permissionCodeId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProfilePermission_permissionCodeId_idx`(`permissionCodeId`),
    UNIQUE INDEX `ProfilePermission_profileId_permissionCodeId_key`(`profileId`, `permissionCodeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `profileId` INTEGER NOT NULL,
    `assignedByUserId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserProfile_profileId_idx`(`profileId`),
    INDEX `UserProfile_assignedByUserId_idx`(`assignedByUserId`),
    UNIQUE INDEX `UserProfile_userId_profileId_key`(`userId`, `profileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthAuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actorUserId` INTEGER NOT NULL,
    `targetUserId` INTEGER NULL,
    `action` VARCHAR(64) NOT NULL,
    `detail` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuthAuditLog_actorUserId_idx`(`actorUserId`),
    INDEX `AuthAuditLog_targetUserId_idx`(`targetUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_currentProfile_fk` FOREIGN KEY (`currentProfileId`) REFERENCES `Profile`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ProfilePermission` ADD CONSTRAINT `ProfilePermission_profile_fk` FOREIGN KEY (`profileId`) REFERENCES `Profile`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ProfilePermission` ADD CONSTRAINT `ProfilePermission_code_fk` FOREIGN KEY (`permissionCodeId`) REFERENCES `PermissionCode`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `UserProfile` ADD CONSTRAINT `UserProfile_user_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `UserProfile` ADD CONSTRAINT `UserProfile_profile_fk` FOREIGN KEY (`profileId`) REFERENCES `Profile`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `UserProfile` ADD CONSTRAINT `UserProfile_assignedby_fk` FOREIGN KEY (`assignedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;
