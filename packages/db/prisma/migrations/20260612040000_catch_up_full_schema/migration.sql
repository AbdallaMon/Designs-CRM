-- DropForeignKey
ALTER TABLE `Note` DROP FOREIGN KEY `Note_clientLeadId_fkey`;

-- AlterTable
ALTER TABLE `CallReminder` ADD COLUMN `notified` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Client` ADD COLUMN `arName` VARCHAR(255) NULL,
    ADD COLUMN `contactAgreement` BOOLEAN NULL,
    ADD COLUMN `contactInitialPriceAgreement` BOOLEAN NULL,
    ADD COLUMN `enName` VARCHAR(255) NULL,
    ADD COLUMN `lastSeenAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `ClientLead` ADD COLUMN `accountantAssignedAt` DATETIME(3) NULL,
    ADD COLUMN `accountantId` INTEGER NULL,
    ADD COLUMN `bookingRequestStatus` ENUM('IN_PROGRESS', 'SUBMITTED') NOT NULL DEFAULT 'IN_PROGRESS',
    ADD COLUMN `bookingSubmittedAt` DATETIME(3) NULL,
    ADD COLUMN `clientDescription` TEXT NULL,
    ADD COLUMN `code` VARCHAR(191) NULL,
    ADD COLUMN `commissionCleared` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `contractorCost` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `decisionMaker` VARCHAR(255) NULL,
    ADD COLUMN `discoverySource` ENUM('INSTAGRAM', 'TIKTOK', 'TV', 'FACEBOOK', 'YOUTUBE', 'GOOGLE', 'INTERIOR_MAGAZINE_SITE', 'REFERRAL', 'OTHER') NULL,
    ADD COLUMN `finalizedDate` DATETIME(3) NULL,
    ADD COLUMN `hasArchitecturalPlan` VARCHAR(255) NULL,
    ADD COLUMN `initialConsult` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `leadType` ENUM('NORMAL', 'CONVERTED') NOT NULL DEFAULT 'NORMAL',
    ADD COLUMN `location` VARCHAR(255) NULL,
    ADD COLUMN `ourCost` VARCHAR(191) NULL,
    ADD COLUMN `paymentSessionId` VARCHAR(191) NULL,
    ADD COLUMN `paymentStatus` ENUM('PENDING', 'PARTIALLY_PAID', 'FULLY_PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `personality` ENUM('EXPRESSIVE', 'ANALYTICAL', 'INTROVERTED', 'DRIVER') NULL,
    ADD COLUMN `previousLeadId` INTEGER NULL,
    ADD COLUMN `previousWork` TEXT NULL,
    ADD COLUMN `priceNote` TEXT NULL,
    ADD COLUMN `projectStage` VARCHAR(255) NULL,
    ADD COLUMN `projectType` VARCHAR(255) NULL,
    ADD COLUMN `serviceType` VARCHAR(255) NULL,
    ADD COLUMN `stateOfTheProject` TEXT NULL,
    ADD COLUMN `stripieMetadata` JSON NULL,
    ADD COLUMN `telegramLink` VARCHAR(191) NULL,
    ADD COLUMN `timeToContact` DATETIME(3) NULL,
    MODIFY `emirate` ENUM('DUBAI', 'ABU_DHABI', 'SHARJAH', 'AJMAN', 'UMM_AL_QUWAIN', 'RAS_AL_KHAIMAH', 'FUJAIRAH', 'KHOR_FAKKAN', 'OUTSIDE') NULL,
    MODIFY `status` ENUM('NEW', 'IN_PROGRESS', 'INTERESTED', 'NEEDS_IDENTIFIED', 'NEGOTIATING', 'LEADEXCHANGE', 'REJECTED', 'FINALIZED', 'CONVERTED', 'ON_HOLD', 'ARCHIVED') NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE `Note` ADD COLUMN `attachment` TEXT NULL,
    ADD COLUMN `baseEmployeeSalaryId` INTEGER NULL,
    ADD COLUMN `commissionId` INTEGER NULL,
    ADD COLUMN `contractId` INTEGER NULL,
    ADD COLUMN `deliveryScheduleId` INTEGER NULL,
    ADD COLUMN `imageSessionId` INTEGER NULL,
    ADD COLUMN `invoiceId` INTEGER NULL,
    ADD COLUMN `notedUserId` INTEGER NULL,
    ADD COLUMN `operationalExpensesId` INTEGER NULL,
    ADD COLUMN `paymentId` INTEGER NULL,
    ADD COLUMN `rentId` INTEGER NULL,
    ADD COLUMN `rentPeriodId` INTEGER NULL,
    ADD COLUMN `salesStageId` INTEGER NULL,
    ADD COLUMN `selectedImageId` INTEGER NULL,
    ADD COLUMN `sharedUpdateId` INTEGER NULL,
    ADD COLUMN `taskId` INTEGER NULL,
    ADD COLUMN `updateId` INTEGER NULL,
    MODIFY `content` TEXT NULL,
    MODIFY `clientLeadId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('NEW_LEAD', 'LEAD_ASSIGNED', 'LEAD_STATUS_CHANGE', 'LEAD_TRANSFERRED', 'LEAD_UPDATED', 'LEAD_CONTACT', 'NOTE_ADDED', 'NEW_NOTE', 'NEW_FILE', 'CALL_REMINDER_CREATED', 'CALL_REMINDER_STATUS', 'PRICE_OFFER_SUBMITTED', 'PRICE_OFFER_UPDATED', 'FINAL_PRICE_ADDED', 'FINAL_PRICE_CHANGED', 'PAYMENT_ADDED', 'PAYMENT_STATUS_UPDATED', 'EXTRA_FINAL_PRICE_ADDED', 'EXTRA_FINAL_PRICE_EDITED', 'WORK_STAGE_UPDATED', 'OTHER', 'TEST_FINISHED', 'ATTEMPT_PASSED', 'ATTEMPT_FAILED', 'NEW_ATTEMPT_CREATED', 'NEW_ATTEMPT_ADDED', 'NEW_CHAT_MESSAGE', 'CHAT_MENTION', 'CHAT_ROOM_CREATED', 'CHAT_MEMBER_ADDED', 'CHAT_CALL_INCOMING', 'CHAT_CALL_MISSED', 'LEAD_CREATED', 'LEAD_SUBMITTED', 'LEAD_STATUS_CHANGED') NOT NULL;

-- AlterTable
ALTER TABLE `PriceOffers` ADD COLUMN `isAccepted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `note` TEXT NULL,
    MODIFY `minPrice` DECIMAL(10, 2) NULL,
    MODIFY `maxPrice` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `allowEmailing` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `allowNotification` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `googleAccessToken` TEXT NULL,
    ADD COLUMN `googleCalendarId` VARCHAR(191) NULL,
    ADD COLUMN `googleEmail` VARCHAR(255) NULL,
    ADD COLUMN `googleRefreshToken` TEXT NULL,
    ADD COLUMN `googleTokenExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isSuperSales` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastSeenAt` DATETIME(3) NULL,
    ADD COLUMN `maxLeadCountPerDay` INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN `maxLeadsCounts` INTEGER NULL DEFAULT 50,
    ADD COLUMN `notAllowedCountries` JSON NULL,
    ADD COLUMN `profilePicture` TEXT NULL,
    ADD COLUMN `telegramUsername` VARCHAR(191) NULL,
    MODIFY `role` ENUM('ADMIN', 'STAFF', 'THREE_D_DESIGNER', 'TWO_D_DESIGNER', 'TWO_D_EXECUTOR', 'ACCOUNTANT', 'SUPER_ADMIN', 'SUPER_SALES', 'CONTACT_INITIATOR') NOT NULL DEFAULT 'STAFF';

-- CreateTable
CREATE TABLE `SiteUtility` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `pdfFrame` VARCHAR(191) NULL,
    `pdfHeader` VARCHAR(191) NULL,
    `introPage` VARCHAR(191) NULL,
    `pageTitle` VARCHAR(191) NULL,
    `pdfSignaturePart` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractUtility` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `obligationsPartyOneAr` TEXT NOT NULL,
    `obligationsPartyOneEn` TEXT NOT NULL,
    `obligationsPartyTwoAr` TEXT NOT NULL,
    `obligationsPartyTwoEn` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractStageClauseTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contractUtilityId` INTEGER NOT NULL,
    `headingAr` TEXT NOT NULL,
    `headingEn` TEXT NOT NULL,
    `titleAr` TEXT NOT NULL,
    `titleEn` TEXT NOT NULL,
    `descriptionAr` TEXT NOT NULL,
    `descriptionEn` TEXT NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `ContractStageClauseTemplate_contractUtilityId_idx`(`contractUtilityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractSpecialClauseTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contractUtilityId` INTEGER NOT NULL,
    `textAr` TEXT NOT NULL,
    `textEn` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `ContractSpecialClauseTemplate_contractUtilityId_idx`(`contractUtilityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractLevelClauseTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contractUtilityId` INTEGER NOT NULL,
    `level` ENUM('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5', 'LEVEL_6', 'LEVEL_7') NOT NULL,
    `textAr` TEXT NOT NULL,
    `textEn` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `ContractLevelClauseTemplate_contractUtilityId_idx`(`contractUtilityId`),
    INDEX `ContractLevelClauseTemplate_level_idx`(`level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contract` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `sessionStatus` ENUM('INITIAL', 'SIGNING', 'REGISTERED') NOT NULL DEFAULT 'INITIAL',
    `contractLevel` ENUM('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5', 'LEVEL_6', 'LEVEL_7') NOT NULL,
    `purpose` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `enTitle` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `isInProgress` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `projectGroupId` INTEGER NULL,
    `arToken` VARCHAR(64) NULL,
    `enToken` VARCHAR(64) NULL,
    `status` ENUM('IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
    `signatureUrl` TEXT NULL,
    `handWrittenSignatureUrl` TEXT NULL,
    `taxRate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(12, 2) NULL,
    `amount` DECIMAL(12, 2) NULL,
    `pdfLinkAr` VARCHAR(191) NULL,
    `pdfLinkEn` VARCHAR(191) NULL,
    `projectType` VARCHAR(191) NULL,
    `writtenAt` DATETIME(3) NULL,

    UNIQUE INDEX `Contract_arToken_key`(`arToken`),
    UNIQUE INDEX `Contract_enToken_key`(`enToken`),
    INDEX `Contract_clientLeadId_contractLevel_idx`(`clientLeadId`, `contractLevel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractStage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contractId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `deliveryDays` INTEGER NOT NULL,
    `deptDeliveryDays` INTEGER NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `stageStatus` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'NOT_STARTED',
    `projectId` INTEGER NULL,

    INDEX `ContractStage_projectId_idx`(`projectId`),
    INDEX `ContractStage_contractId_idx`(`contractId`),
    UNIQUE INDEX `ContractStage_contractId_order_key`(`contractId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractPayment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contractId` INTEGER NOT NULL,
    `stageId` INTEGER NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `amountLost` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `amountReceived` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'AED',
    `dueDate` DATETIME(3) NULL,
    `status` ENUM('RECEIVED', 'TRANSFERRED', 'DUE', 'NOT_DUE') NOT NULL DEFAULT 'NOT_DUE',
    `reference` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `projectId` INTEGER NULL,
    `paymentCondition` VARCHAR(191) NULL,
    `conditionId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContractPayment_contractId_idx`(`contractId`),
    INDEX `ContractPayment_stageId_idx`(`stageId`),
    INDEX `ContractPayment_status_dueDate_idx`(`status`, `dueDate`),
    INDEX `ContractPayment_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractPaymentCondition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conditionType` VARCHAR(191) NOT NULL,
    `condition` VARCHAR(191) NOT NULL,
    `labelAr` VARCHAR(191) NOT NULL,
    `labelEn` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ContractPaymentCondition_conditionType_condition_labelAr_lab_key`(`conditionType`, `condition`, `labelAr`, `labelEn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractDrawing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contractId` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NULL,
    `mimeType` VARCHAR(191) NULL,
    `sizeBytes` INTEGER NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `uploadedById` INTEGER NULL,

    INDEX `ContractDrawing_contractId_idx`(`contractId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractSpecialItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contractId` INTEGER NOT NULL,
    `labelAr` TEXT NOT NULL,
    `labelEn` TEXT NULL,

    INDEX `ContractSpecialItem_contractId_idx`(`contractId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientLeadUpdate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('IN_PROGRESS', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
    `department` VARCHAR(191) NOT NULL DEFAULT 'STAFF',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `isDone` BOOLEAN NOT NULL DEFAULT false,
    `createdById` INTEGER NOT NULL,
    `clientLeadId` INTEGER NOT NULL,

    INDEX `ClientLeadUpdate_clientLeadId_idx`(`clientLeadId`),
    INDEX `ClientLeadUpdate_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SharedUpdate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `updateId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `excludeFromSearch` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SharedUpdate_updateId_idx`(`updateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SalesStage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `stage` ENUM('INITIAL_CONTACT', 'SOCIAL_MEDIA_CHECK', 'WHATSAPP_QA', 'MEETING_BOOKED', 'CLIENT_INFO_UPLOADED', 'CONSULTATION_BOOKED', 'FOLLOWUP_AFTER_MEETING', 'HANDLE_OBJECTIONS', 'DEAL_CLOSED', 'AFTER_SALES_FOLLOWUP') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SalesStage_clientLeadId_idx`(`clientLeadId`),
    INDEX `SalesStage_userId_idx`(`userId`),
    UNIQUE INDEX `SalesStage_clientLeadId_stage_key`(`clientLeadId`, `stage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TelegramChannel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `channelLink` VARCHAR(191) NOT NULL,
    `channelId` BIGINT NOT NULL,
    `accessHash` BIGINT NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TelegramChannel_clientLeadId_key`(`clientLeadId`),
    UNIQUE INDEX `TelegramChannel_channelId_key`(`channelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TelegramConnection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL DEFAULT 'MAIN',
    `apiId` VARCHAR(191) NULL,
    `apiHash` VARCHAR(191) NULL,
    `sessionString` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('CONNECTED', 'DISCONNECTED', 'INVALID_SESSION') NOT NULL DEFAULT 'DISCONNECTED',
    `phoneNumber` VARCHAR(20) NULL,
    `lastCheckedAt` DATETIME(3) NULL,
    `lastConnectedAt` DATETIME(3) NULL,
    `lastError` TEXT NULL,
    `notifiedOfDisconnection` BOOLEAN NOT NULL DEFAULT false,
    `updatedByUserId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TelegramConnection_isActive_idx`(`isActive`),
    INDEX `TelegramConnection_updatedByUserId_idx`(`updatedByUserId`),
    UNIQUE INDEX `TelegramConnection_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FetchedTelegramMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `messageId` INTEGER NOT NULL,
    `fetchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FetchedTelegramMessage_clientLeadId_idx`(`clientLeadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MeetingReminder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `time` DATETIME(3) NULL,
    `status` ENUM('IN_PROGRESS', 'DONE', 'MISSED') NOT NULL DEFAULT 'IN_PROGRESS',
    `meetingResult` TEXT NULL,
    `reminderReason` TEXT NULL,
    `userId` INTEGER NOT NULL,
    `adminId` INTEGER NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `type` ENUM('SALES_MEETING', 'DESIGN_MEETING') NULL,
    `token` VARCHAR(191) NULL,
    `availableSlotId` INTEGER NULL,
    `userTimezone` VARCHAR(191) NULL,
    `notified` BOOLEAN NOT NULL DEFAULT false,
    `notified4h` BOOLEAN NOT NULL DEFAULT false,
    `notified12h` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `googleEventId` VARCHAR(255) NULL,
    `googleCalendarSynced` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `MeetingReminder_token_key`(`token`),
    UNIQUE INDEX `MeetingReminder_availableSlotId_key`(`availableSlotId`),
    INDEX `MeetingReminder_clientLeadId_idx`(`clientLeadId`),
    INDEX `MeetingReminder_userId_idx`(`userId`),
    INDEX `MeetingReminder_adminId_idx`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliverySchedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NULL,
    `name` VARCHAR(255) NULL,
    `deliveryAt` DATETIME(3) NOT NULL,
    `meetingReminderId` INTEGER NULL,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `stageId` INTEGER NULL,

    UNIQUE INDEX `DeliverySchedule_stageId_key`(`stageId`),
    INDEX `DeliverySchedule_projectId_idx`(`projectId`),
    INDEX `DeliverySchedule_meetingReminderId_idx`(`meetingReminderId`),
    INDEX `DeliverySchedule_deliveryAt_idx`(`deliveryAt`),
    INDEX `DeliverySchedule_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Commission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `leadId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `amountPaid` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isCleared` BOOLEAN NOT NULL DEFAULT false,
    `commissionReason` VARCHAR(255) NOT NULL DEFAULT 'Finalized Lead Commission',

    INDEX `Commission_userId_idx`(`userId`),
    INDEX `Commission_leadId_idx`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupTitle` VARCHAR(255) NOT NULL DEFAULT 'Initial Project',
    `groupId` INTEGER NOT NULL DEFAULT 1,
    `clientLeadId` INTEGER NOT NULL,
    `isModification` BOOLEAN NOT NULL DEFAULT false,
    `contractId` INTEGER NULL,
    `deliveryTime` DATETIME(3) NULL,
    `priority` ENUM('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH') NOT NULL DEFAULT 'MEDIUM',
    `area` DECIMAL(10, 2) NULL,
    `startedAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'STAFF', 'THREE_D_DESIGNER', 'TWO_D_DESIGNER', 'TWO_D_EXECUTOR', 'ACCOUNTANT', 'SUPER_ADMIN', 'SUPER_SALES', 'CONTACT_INITIATOR') NOT NULL DEFAULT 'THREE_D_DESIGNER',
    `notified7Days` BOOLEAN NOT NULL DEFAULT false,
    `notified3Days` BOOLEAN NOT NULL DEFAULT false,
    `notified2Days` BOOLEAN NOT NULL DEFAULT false,
    `notified1Day` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Project_clientLeadId_idx`(`clientLeadId`),
    INDEX `Project_groupId_idx`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'TODO',
    `priority` ENUM('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH') NOT NULL DEFAULT 'MEDIUM',
    `type` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `projectId` INTEGER NULL,
    `userId` INTEGER NULL,
    `clientLeadId` INTEGER NULL,
    `createdById` INTEGER NULL,

    INDEX `Task_projectId_idx`(`projectId`),
    INDEX `Task_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'PARTIALLY_PAID', 'FULLY_PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `amount` DECIMAL(10, 2) NOT NULL,
    `amountPaid` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `amountLeft` DECIMAL(10, 2) NOT NULL,
    `paymentLevel` ENUM('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5', 'LEVEL_6', 'LEVEL_7_OR_MORE') NULL,
    `paymentReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentId` INTEGER NOT NULL,
    `issuedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `invoiceNumber` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Invoice_invoiceNumber_key`(`invoiceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExtraService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutoAssignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AutoAssignment_userId_idx`(`userId`),
    UNIQUE INDEX `AutoAssignment_userId_type_key`(`userId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSubRole` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `subRole` ENUM('ADMIN', 'STAFF', 'THREE_D_DESIGNER', 'TWO_D_DESIGNER', 'TWO_D_EXECUTOR', 'ACCOUNTANT', 'SUPER_ADMIN', 'SUPER_SALES', 'CONTACT_INITIATOR') NOT NULL,

    UNIQUE INDEX `UserSubRole_userId_subRole_key`(`userId`, `subRole`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalMinutes` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,

    INDEX `UserLog_userId_idx`(`userId`),
    UNIQUE INDEX `UserLog_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Assignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `projectId` INTEGER NULL,
    `type` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'STAFF', 'THREE_D_DESIGNER', 'TWO_D_DESIGNER', 'TWO_D_EXECUTOR', 'ACCOUNTANT', 'SUPER_ADMIN', 'SUPER_SALES', 'CONTACT_INITIATOR') NOT NULL DEFAULT 'THREE_D_DESIGNER',
    `assignedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Assignment_userId_idx`(`userId`),
    INDEX `Assignment_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FixedData` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BaseEmployeeSalary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `baseSalary` DECIMAL(10, 2) NOT NULL,
    `taxAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `baseWorkHours` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BaseEmployeeSalary_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonthlySalary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `baseSalaryId` INTEGER NOT NULL,
    `totalHoursWorked` INTEGER NOT NULL,
    `overtimeHours` INTEGER NOT NULL DEFAULT 0,
    `bonuses` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `deductions` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `netSalary` DECIMAL(10, 2) NOT NULL,
    `isFulfilled` BOOLEAN NOT NULL DEFAULT false,
    `paymentDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `outcomeId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RentPeriod` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rentId` INTEGER NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `isPaid` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `outcomeId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OperationalExpenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL,
    `paymentStatus` ENUM('PENDING', 'PARTIALLY_PAID', 'FULLY_PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `outcomeId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Outcome` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(50) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `QuestionType_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BaseQuestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `questionTypeId` INTEGER NOT NULL,
    `title` TEXT NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SessionQuestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `questionTypeId` INTEGER NOT NULL,
    `title` TEXT NOT NULL,
    `isCustom` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NOT NULL DEFAULT 0,
    `clientLeadId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Answer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `response` TEXT NOT NULL,
    `sessionQuestionId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Answer_sessionQuestionId_key`(`sessionQuestionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ObjectionCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VersaModel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `vId` INTEGER NULL,
    `eId` INTEGER NULL,
    `rId` INTEGER NULL,
    `sId` INTEGER NULL,
    `aId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VersaModel_vId_key`(`vId`),
    UNIQUE INDEX `VersaModel_eId_key`(`eId`),
    UNIQUE INDEX `VersaModel_rId_key`(`rId`),
    UNIQUE INDEX `VersaModel_sId_key`(`sId`),
    UNIQUE INDEX `VersaModel_aId_key`(`aId`),
    INDEX `VersaModel_clientLeadId_idx`(`clientLeadId`),
    INDEX `VersaModel_userId_idx`(`userId`),
    INDEX `VersaModel_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VersaStep` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(255) NULL,
    `question` TEXT NULL,
    `answer` TEXT NULL,
    `clientResponse` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AvailableDay` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AvailableDay_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AvailableSlot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `availableDayId` INTEGER NOT NULL,
    `isBooked` BOOLEAN NOT NULL DEFAULT false,
    `userTimezone` VARCHAR(191) NULL,
    `meetingReminderId` INTEGER NULL,

    UNIQUE INDEX `AvailableSlot_meetingReminderId_key`(`meetingReminderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Language` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Language_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TextShort` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `text` VARCHAR(255) NOT NULL,
    `languageId` INTEGER NOT NULL,
    `materialId` INTEGER NULL,
    `styleId` INTEGER NULL,
    `colorPatternId` INTEGER NULL,
    `pageInfoId` INTEGER NULL,
    `spaceId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TextLong` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `languageId` INTEGER NOT NULL,
    `materialId` INTEGER NULL,
    `styleId` INTEGER NULL,
    `colorPatternId` INTEGER NULL,
    `proId` INTEGER NULL,
    `conId` INTEGER NULL,
    `pageInfoId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `materialId` INTEGER NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `styleId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Con` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order` INTEGER NOT NULL DEFAULT 0,
    `materialId` INTEGER NULL,
    `styleId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Material` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageUrl` VARCHAR(191) NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `templateId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Style` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageUrl` VARCHAR(191) NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `templateId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ColorPattern` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `background` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `isFullWidth` BOOLEAN NOT NULL DEFAULT false,
    `templateId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ColorPatternColor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `colorHex` VARCHAR(191) NOT NULL,
    `isEditableByClient` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NOT NULL DEFAULT 0,
    `colorPatternId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DesignImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageUrl` VARCHAR(191) NOT NULL,
    `styleId` INTEGER NOT NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DesignImageSpace` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `designImageId` INTEGER NOT NULL,
    `spaceId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PageInfo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('BEFORE_PATTERN', 'BEFORE_MATERIAL', 'BEFORE_STYLE') NOT NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PageInfo_type_key`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Template` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('COLOR_PATTERN', 'MATERIAL', 'STYLE') NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `showTitle` BOOLEAN NOT NULL DEFAULT true,
    `showImage` BOOLEAN NOT NULL DEFAULT true,
    `showPros` BOOLEAN NOT NULL DEFAULT false,
    `showCons` BOOLEAN NOT NULL DEFAULT false,
    `showColors` BOOLEAN NOT NULL DEFAULT false,
    `showDescription` BOOLEAN NOT NULL DEFAULT false,
    `showOverlay` BOOLEAN NOT NULL DEFAULT true,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `blurValue` INTEGER NOT NULL DEFAULT 0,
    `backgroundImage` TEXT NULL,
    `overlayColor` VARCHAR(50) NULL,
    `overlayOpacity` DOUBLE NULL DEFAULT 0,
    `padding` VARCHAR(50) NULL,
    `paddingX` VARCHAR(50) NULL,
    `paddingY` VARCHAR(50) NULL,
    `borderRadius` VARCHAR(50) NULL,
    `colorSize` INTEGER NULL,
    `equalDimensions` BOOLEAN NULL DEFAULT false,
    `layout` JSON NULL,
    `colorsLayout` VARCHAR(100) NOT NULL DEFAULT 'vertical',
    `customStyle` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Space` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientImageSession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `sessionStatus` ENUM('INITIAL', 'PREVIEW_COLOR_PATTERN', 'SELECTED_COLOR_PATTERN', 'PREVIEW_MATERIAL', 'SELECTED_MATERIAL', 'PREVIEW_STYLE', 'SELECTED_STYLE', 'PREVIEW_IMAGES', 'SELECTED_IMAGES', 'PDF_GENERATED', 'SUBMITTED') NOT NULL DEFAULT 'INITIAL',
    `pdfUrl` VARCHAR(191) NULL,
    `clientLeadId` INTEGER NOT NULL,
    `createdById` INTEGER NOT NULL,
    `colorPatternId` INTEGER NULL,
    `styleId` INTEGER NULL,
    `customColors` JSON NULL,
    `signatureUrl` VARCHAR(191) NULL,
    `submittedAt` DATETIME(3) NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ClientImageSession_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialOnClientImageSession` (
    `clientImageSessionId` INTEGER NOT NULL,
    `materialId` INTEGER NOT NULL,

    PRIMARY KEY (`clientImageSessionId`, `materialId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientSelectedImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageSessionId` INTEGER NOT NULL,
    `designImageId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientImageSessionToSpace` (
    `clientImageSessionId` INTEGER NOT NULL,
    `spaceId` INTEGER NOT NULL,

    PRIMARY KEY (`clientImageSessionId`, `spaceId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` TEXT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseRole` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `role` ENUM('ADMIN', 'STAFF', 'THREE_D_DESIGNER', 'TWO_D_DESIGNER', 'TWO_D_EXECUTOR', 'ACCOUNTANT', 'SUPER_ADMIN', 'SUPER_SALES', 'CONTACT_INITIATOR') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lesson` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `duration` INTEGER NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `mustUploadHomework` BOOLEAN NOT NULL DEFAULT true,
    `isPreviewable` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Lesson_courseId_order_key`(`courseId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonAccess` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `lessonId` INTEGER NOT NULL,
    `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `LessonAccess_userId_lessonId_key`(`userId`, `lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonHomework` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `lessonId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `type` ENUM('VIDEO', 'SUMMARY') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LessonHomework_userId_idx`(`userId`),
    INDEX `LessonHomework_lessonId_idx`(`lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonVideo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lessonId` INTEGER NOT NULL,
    `url` LONGTEXT NOT NULL,
    `videoType` ENUM('IFRAME', 'URL') NOT NULL DEFAULT 'IFRAME',
    `order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonVideoPdf` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `videoId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonPDF` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lessonId` INTEGER NOT NULL,
    `url` LONGTEXT NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lessonId` INTEGER NOT NULL,
    `url` LONGTEXT NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Test` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NULL,
    `type` ENUM('LESSON', 'FINAL', 'PRACTICE', 'PLACEMENT') NOT NULL DEFAULT 'LESSON',
    `courseId` INTEGER NULL,
    `lessonId` INTEGER NULL,
    `certificateApprovedByAdmin` BOOLEAN NOT NULL DEFAULT false,
    `attemptLimit` INTEGER NOT NULL DEFAULT 2,
    `timeLimit` INTEGER NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestQuestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `testId` INTEGER NOT NULL,
    `type` ENUM('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 'TEXT', 'ORDERING') NOT NULL,
    `question` TEXT NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestChoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `questionId` INTEGER NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestAttempt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `testId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `score` DOUBLE NULL,
    `passed` BOOLEAN NOT NULL DEFAULT false,
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `attemptLimit` INTEGER NOT NULL DEFAULT 2,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `startTime` DATETIME(3) NULL,
    `endTime` DATETIME(3) NULL,
    `timePassed` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserAnswer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attemptId` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,
    `textAnswer` TEXT NULL,
    `isApproved` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SelectedAnswer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userAnswerId` INTEGER NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `order` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseProgress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompletedLesson` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseProgressId` INTEGER NOT NULL,
    `lessonId` INTEGER NOT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompletedTest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseProgressId` INTEGER NOT NULL,
    `testId` INTEGER NOT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Certificate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `isApproved` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fileUrl` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatRoom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('STAFF_TO_STAFF', 'PROJECT_GROUP', 'CLIENT_TO_STAFF', 'MULTI_PROJECT', 'GROUP') NOT NULL,
    `name` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `projectId` INTEGER NULL,
    `clientLeadId` INTEGER NULL,
    `allowFiles` BOOLEAN NOT NULL DEFAULT true,
    `allowCalls` BOOLEAN NOT NULL DEFAULT true,
    `allowMeetings` BOOLEAN NOT NULL DEFAULT true,
    `allowChatForMembers` BOOLEAN NOT NULL DEFAULT true,
    `chatAccessToken` VARCHAR(255) NULL,
    `isChatEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ChatRoom_chatAccessToken_key`(`chatAccessToken`),
    INDEX `ChatRoom_type_idx`(`type`),
    INDEX `ChatRoom_projectId_idx`(`projectId`),
    INDEX `ChatRoom_clientLeadId_idx`(`clientLeadId`),
    INDEX `ChatRoom_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `clientId` INTEGER NULL,
    `role` ENUM('ADMIN', 'MODERATOR', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `isMuted` BOOLEAN NOT NULL DEFAULT false,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `lastReadAt` DATETIME(3) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `notifyOnReply` BOOLEAN NOT NULL DEFAULT true,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leftAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatMember_roomId_idx`(`roomId`),
    INDEX `ChatMember_userId_idx`(`userId`),
    INDEX `ChatMember_clientId_idx`(`clientId`),
    INDEX `ChatMember_userId_leftAt_idx`(`userId`, `leftAt`),
    INDEX `ChatMember_roomId_leftAt_idx`(`roomId`, `leftAt`),
    UNIQUE INDEX `ChatMember_roomId_userId_key`(`roomId`, `userId`),
    UNIQUE INDEX `ChatMember_roomId_clientId_key`(`roomId`, `clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `senderId` INTEGER NULL,
    `senderClient` INTEGER NULL,
    `type` ENUM('TEXT', 'FILE', 'IMAGE', 'VOICE', 'VIDEO', 'SYSTEM') NOT NULL,
    `content` TEXT NULL,
    `fileUrl` VARCHAR(191) NULL,
    `fileName` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,
    `fileMimeType` VARCHAR(191) NULL,
    `replyToId` INTEGER NULL,
    `forwardedFromId` INTEGER NULL,
    `isEdited` BOOLEAN NOT NULL DEFAULT false,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ChatMessage_roomId_idx`(`roomId`),
    INDEX `ChatMessage_senderId_idx`(`senderId`),
    INDEX `ChatMessage_senderClient_idx`(`senderClient`),
    INDEX `ChatMessage_replyToId_idx`(`replyToId`),
    INDEX `ChatMessage_forwardedFromId_idx`(`forwardedFromId`),
    INDEX `ChatMessage_createdAt_idx`(`createdAt`),
    INDEX `ChatMessage_roomId_createdAt_idx`(`roomId`, `createdAt`),
    INDEX `ChatMessage_roomId_isDeleted_idx`(`roomId`, `isDeleted`),
    INDEX `ChatMessage_senderId_createdAt_idx`(`senderId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatAttachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `content` TEXT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NULL,
    `fileMimeType` VARCHAR(191) NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatAttachment_messageId_idx`(`messageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatReadReceipt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `memberId` INTEGER NOT NULL,
    `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatReadReceipt_messageId_idx`(`messageId`),
    INDEX `ChatReadReceipt_memberId_idx`(`memberId`),
    UNIQUE INDEX `ChatReadReceipt_messageId_memberId_key`(`messageId`, `memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatTypingStatus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memberId` INTEGER NOT NULL,
    `isTyping` BOOLEAN NOT NULL DEFAULT false,
    `lastTyping` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatTypingStatus_memberId_idx`(`memberId`),
    UNIQUE INDEX `ChatTypingStatus_memberId_key`(`memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatReaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `clientId` INTEGER NULL,
    `emoji` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatReaction_messageId_idx`(`messageId`),
    INDEX `ChatReaction_userId_idx`(`userId`),
    INDEX `ChatReaction_clientId_idx`(`clientId`),
    UNIQUE INDEX `ChatReaction_messageId_userId_emoji_key`(`messageId`, `userId`, `emoji`),
    UNIQUE INDEX `ChatReaction_messageId_clientId_emoji_key`(`messageId`, `clientId`, `emoji`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMention` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `clientId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatMention_messageId_idx`(`messageId`),
    INDEX `ChatMention_userId_idx`(`userId`),
    INDEX `ChatMention_clientId_idx`(`clientId`),
    UNIQUE INDEX `ChatMention_messageId_userId_key`(`messageId`, `userId`),
    UNIQUE INDEX `ChatMention_messageId_clientId_key`(`messageId`, `clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatPinnedMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `messageId` INTEGER NOT NULL,
    `pinnedById` INTEGER NULL,
    `pinnedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ChatPinnedMessage_messageId_key`(`messageId`),
    INDEX `ChatPinnedMessage_roomId_idx`(`roomId`),
    INDEX `ChatPinnedMessage_pinnedById_idx`(`pinnedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatBookmark` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `clientId` INTEGER NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatBookmark_messageId_idx`(`messageId`),
    INDEX `ChatBookmark_userId_idx`(`userId`),
    INDEX `ChatBookmark_clientId_idx`(`clientId`),
    UNIQUE INDEX `ChatBookmark_messageId_userId_key`(`messageId`, `userId`),
    UNIQUE INDEX `ChatBookmark_messageId_clientId_key`(`messageId`, `clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `isGlobal` BOOLEAN NOT NULL DEFAULT false,
    `category` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ChatTemplate_userId_idx`(`userId`),
    INDEX `ChatTemplate_isGlobal_idx`(`isGlobal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatScheduledMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `senderId` INTEGER NULL,
    `content` TEXT NOT NULL,
    `fileUrl` VARCHAR(191) NULL,
    `scheduledFor` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `sentMessageId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatScheduledMessage_roomId_scheduledFor_idx`(`roomId`, `scheduledFor`),
    INDEX `ChatScheduledMessage_status_idx`(`status`),
    INDEX `ChatScheduledMessage_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatRoomProject` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `projectId` INTEGER NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatRoomProject_roomId_idx`(`roomId`),
    INDEX `ChatRoomProject_projectId_idx`(`projectId`),
    UNIQUE INDEX `ChatRoomProject_roomId_projectId_key`(`roomId`, `projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Call` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `type` ENUM('AUDIO', 'VIDEO') NOT NULL,
    `status` ENUM('RINGING', 'ONGOING', 'ENDED', 'MISSED', 'CANCELLED') NOT NULL DEFAULT 'RINGING',
    `initiatorId` INTEGER NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `duration` INTEGER NULL,

    INDEX `Call_roomId_idx`(`roomId`),
    INDEX `Call_initiatorId_idx`(`initiatorId`),
    INDEX `Call_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CallParticipant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `callId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `clientId` INTEGER NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leftAt` DATETIME(3) NULL,

    INDEX `CallParticipant_callId_idx`(`callId`),
    INDEX `CallParticipant_userId_idx`(`userId`),
    INDEX `CallParticipant_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DriveNode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('FOLDER', 'FILE') NOT NULL,
    `visibility` ENUM('PRIVATE', 'PUBLIC') NOT NULL DEFAULT 'PRIVATE',
    `ownerId` INTEGER NOT NULL,
    `parentId` INTEGER NULL,
    `name` VARCHAR(255) NOT NULL,
    `storageProvider` ENUM('LOCAL', 'GDRIVE') NOT NULL DEFAULT 'LOCAL',
    `storageKey` VARCHAR(1024) NULL,
    `mimeType` VARCHAR(120) NULL,
    `sizeBytes` BIGINT NULL DEFAULT 0,
    `checksum` VARCHAR(128) NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DriveNode_ownerId_idx`(`ownerId`),
    INDEX `DriveNode_parentId_idx`(`parentId`),
    INDEX `DriveNode_visibility_idx`(`visibility`),
    INDEX `DriveNode_isDeleted_idx`(`isDeleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DriveAcl` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nodeId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `canView` BOOLEAN NOT NULL DEFAULT true,
    `canUpload` BOOLEAN NOT NULL DEFAULT false,
    `canEdit` BOOLEAN NOT NULL DEFAULT false,
    `canDelete` BOOLEAN NOT NULL DEFAULT false,
    `canShare` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DriveAcl_userId_idx`(`userId`),
    INDEX `DriveAcl_nodeId_idx`(`nodeId`),
    UNIQUE INDEX `DriveAcl_nodeId_userId_key`(`nodeId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DrivePublicShare` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nodeId` INTEGER NOT NULL,
    `createdById` INTEGER NOT NULL,
    `token` VARCHAR(80) NOT NULL,
    `expiresAt` DATETIME(3) NULL,
    `isRevoked` BOOLEAN NOT NULL DEFAULT false,
    `revokedAt` DATETIME(3) NULL,
    `passwordHash` VARCHAR(255) NULL,
    `canView` BOOLEAN NOT NULL DEFAULT true,
    `canDownload` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DrivePublicShare_token_key`(`token`),
    INDEX `DrivePublicShare_nodeId_idx`(`nodeId`),
    INDEX `DrivePublicShare_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DriveNodeProject` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nodeId` INTEGER NOT NULL,
    `projectId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DriveNodeProject_projectId_idx`(`projectId`),
    INDEX `DriveNodeProject_nodeId_idx`(`nodeId`),
    UNIQUE INDEX `DriveNodeProject_nodeId_projectId_key`(`nodeId`, `projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DriveNodeClientLead` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nodeId` INTEGER NOT NULL,
    `clientLeadId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DriveNodeClientLead_clientLeadId_idx`(`clientLeadId`),
    INDEX `DriveNodeClientLead_nodeId_idx`(`nodeId`),
    UNIQUE INDEX `DriveNodeClientLead_nodeId_clientLeadId_key`(`nodeId`, `clientLeadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ClientLead_code_key` ON `ClientLead`(`code`);

-- CreateIndex
CREATE INDEX `Note_taskId_idx` ON `Note`(`taskId`);

-- CreateIndex
CREATE INDEX `Note_baseEmployeeSalaryId_idx` ON `Note`(`baseEmployeeSalaryId`);

-- CreateIndex
CREATE INDEX `Note_rentId_idx` ON `Note`(`rentId`);

-- CreateIndex
CREATE INDEX `Note_rentPeriodId_idx` ON `Note`(`rentPeriodId`);

-- CreateIndex
CREATE INDEX `Note_operationalExpensesId_idx` ON `Note`(`operationalExpensesId`);

-- CreateIndex
CREATE INDEX `Note_paymentId_idx` ON `Note`(`paymentId`);

-- CreateIndex
CREATE INDEX `Note_invoiceId_idx` ON `Note`(`invoiceId`);

-- CreateIndex
CREATE INDEX `Note_commissionId_idx` ON `Note`(`commissionId`);

-- CreateIndex
CREATE INDEX `Note_sharedUpdateId_idx` ON `Note`(`sharedUpdateId`);

-- CreateIndex
CREATE INDEX `Note_updateId_idx` ON `Note`(`updateId`);

-- CreateIndex
CREATE INDEX `Note_imageSessionId_idx` ON `Note`(`imageSessionId`);

-- CreateIndex
CREATE INDEX `Note_selectedImageId_idx` ON `Note`(`selectedImageId`);

-- CreateIndex
CREATE INDEX `Note_contractId_idx` ON `Note`(`contractId`);

-- CreateIndex
CREATE INDEX `Note_salesStageId_idx` ON `Note`(`salesStageId`);

-- CreateIndex
CREATE INDEX `Note_notedUserId_idx` ON `Note`(`notedUserId`);

-- CreateIndex
CREATE INDEX `Note_deliveryScheduleId_idx` ON `Note`(`deliveryScheduleId`);

-- AddForeignKey
ALTER TABLE `ContractStageClauseTemplate` ADD CONSTRAINT `ContractStageClauseTemplate_contractUtilityId_fkey` FOREIGN KEY (`contractUtilityId`) REFERENCES `ContractUtility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractSpecialClauseTemplate` ADD CONSTRAINT `ContractSpecialClauseTemplate_contractUtilityId_fkey` FOREIGN KEY (`contractUtilityId`) REFERENCES `ContractUtility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractLevelClauseTemplate` ADD CONSTRAINT `ContractLevelClauseTemplate_contractUtilityId_fkey` FOREIGN KEY (`contractUtilityId`) REFERENCES `ContractUtility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contract` ADD CONSTRAINT `Contract_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractStage` ADD CONSTRAINT `ContractStage_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractStage` ADD CONSTRAINT `ContractStage_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractPayment` ADD CONSTRAINT `ContractPayment_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractPayment` ADD CONSTRAINT `ContractPayment_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `ContractStage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractPayment` ADD CONSTRAINT `ContractPayment_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractPayment` ADD CONSTRAINT `ContractPayment_conditionId_fkey` FOREIGN KEY (`conditionId`) REFERENCES `ContractPaymentCondition`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractDrawing` ADD CONSTRAINT `ContractDrawing_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractSpecialItem` ADD CONSTRAINT `ContractSpecialItem_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientLeadUpdate` ADD CONSTRAINT `ClientLeadUpdate_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientLeadUpdate` ADD CONSTRAINT `ClientLeadUpdate_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SharedUpdate` ADD CONSTRAINT `SharedUpdate_updateId_fkey` FOREIGN KEY (`updateId`) REFERENCES `ClientLeadUpdate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SalesStage` ADD CONSTRAINT `SalesStage_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SalesStage` ADD CONSTRAINT `SalesStage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TelegramChannel` ADD CONSTRAINT `TelegramChannel_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TelegramConnection` ADD CONSTRAINT `TelegramConnection_updatedByUserId_fkey` FOREIGN KEY (`updatedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientLead` ADD CONSTRAINT `ClientLead_accountantId_fkey` FOREIGN KEY (`accountantId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FetchedTelegramMessage` ADD CONSTRAINT `FetchedTelegramMessage_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MeetingReminder` ADD CONSTRAINT `MeetingReminder_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MeetingReminder` ADD CONSTRAINT `MeetingReminder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MeetingReminder` ADD CONSTRAINT `MeetingReminder_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliverySchedule` ADD CONSTRAINT `DeliverySchedule_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliverySchedule` ADD CONSTRAINT `DeliverySchedule_meetingReminderId_fkey` FOREIGN KEY (`meetingReminderId`) REFERENCES `MeetingReminder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliverySchedule` ADD CONSTRAINT `DeliverySchedule_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliverySchedule` ADD CONSTRAINT `DeliverySchedule_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `ContractStage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExtraService` ADD CONSTRAINT `ExtraService_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutoAssignment` ADD CONSTRAINT `AutoAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSubRole` ADD CONSTRAINT `UserSubRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserLog` ADD CONSTRAINT `UserLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_notedUserId_fkey` FOREIGN KEY (`notedUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_baseEmployeeSalaryId_fkey` FOREIGN KEY (`baseEmployeeSalaryId`) REFERENCES `BaseEmployeeSalary`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_rentId_fkey` FOREIGN KEY (`rentId`) REFERENCES `Rent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_rentPeriodId_fkey` FOREIGN KEY (`rentPeriodId`) REFERENCES `RentPeriod`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_operationalExpensesId_fkey` FOREIGN KEY (`operationalExpensesId`) REFERENCES `OperationalExpenses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_commissionId_fkey` FOREIGN KEY (`commissionId`) REFERENCES `Commission`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_updateId_fkey` FOREIGN KEY (`updateId`) REFERENCES `ClientLeadUpdate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_sharedUpdateId_fkey` FOREIGN KEY (`sharedUpdateId`) REFERENCES `SharedUpdate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_imageSessionId_fkey` FOREIGN KEY (`imageSessionId`) REFERENCES `ClientImageSession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_selectedImageId_fkey` FOREIGN KEY (`selectedImageId`) REFERENCES `ClientSelectedImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_salesStageId_fkey` FOREIGN KEY (`salesStageId`) REFERENCES `SalesStage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_deliveryScheduleId_fkey` FOREIGN KEY (`deliveryScheduleId`) REFERENCES `DeliverySchedule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BaseEmployeeSalary` ADD CONSTRAINT `BaseEmployeeSalary_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MonthlySalary` ADD CONSTRAINT `MonthlySalary_baseSalaryId_fkey` FOREIGN KEY (`baseSalaryId`) REFERENCES `BaseEmployeeSalary`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MonthlySalary` ADD CONSTRAINT `MonthlySalary_outcomeId_fkey` FOREIGN KEY (`outcomeId`) REFERENCES `Outcome`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RentPeriod` ADD CONSTRAINT `RentPeriod_rentId_fkey` FOREIGN KEY (`rentId`) REFERENCES `Rent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RentPeriod` ADD CONSTRAINT `RentPeriod_outcomeId_fkey` FOREIGN KEY (`outcomeId`) REFERENCES `Outcome`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperationalExpenses` ADD CONSTRAINT `OperationalExpenses_outcomeId_fkey` FOREIGN KEY (`outcomeId`) REFERENCES `Outcome`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BaseQuestion` ADD CONSTRAINT `BaseQuestion_questionTypeId_fkey` FOREIGN KEY (`questionTypeId`) REFERENCES `QuestionType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionQuestion` ADD CONSTRAINT `SessionQuestion_questionTypeId_fkey` FOREIGN KEY (`questionTypeId`) REFERENCES `QuestionType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionQuestion` ADD CONSTRAINT `SessionQuestion_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionQuestion` ADD CONSTRAINT `SessionQuestion_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Answer` ADD CONSTRAINT `Answer_sessionQuestionId_fkey` FOREIGN KEY (`sessionQuestionId`) REFERENCES `SessionQuestion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Answer` ADD CONSTRAINT `Answer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ObjectionCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_vId_fkey` FOREIGN KEY (`vId`) REFERENCES `VersaStep`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_eId_fkey` FOREIGN KEY (`eId`) REFERENCES `VersaStep`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_rId_fkey` FOREIGN KEY (`rId`) REFERENCES `VersaStep`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_sId_fkey` FOREIGN KEY (`sId`) REFERENCES `VersaStep`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_aId_fkey` FOREIGN KEY (`aId`) REFERENCES `VersaStep`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AvailableDay` ADD CONSTRAINT `AvailableDay_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AvailableSlot` ADD CONSTRAINT `AvailableSlot_availableDayId_fkey` FOREIGN KEY (`availableDayId`) REFERENCES `AvailableDay`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AvailableSlot` ADD CONSTRAINT `AvailableSlot_meetingReminderId_fkey` FOREIGN KEY (`meetingReminderId`) REFERENCES `MeetingReminder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextShort` ADD CONSTRAINT `TextShort_languageId_fkey` FOREIGN KEY (`languageId`) REFERENCES `Language`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextShort` ADD CONSTRAINT `TextShort_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextShort` ADD CONSTRAINT `TextShort_styleId_fkey` FOREIGN KEY (`styleId`) REFERENCES `Style`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextShort` ADD CONSTRAINT `TextShort_colorPatternId_fkey` FOREIGN KEY (`colorPatternId`) REFERENCES `ColorPattern`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextShort` ADD CONSTRAINT `TextShort_pageInfoId_fkey` FOREIGN KEY (`pageInfoId`) REFERENCES `PageInfo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextShort` ADD CONSTRAINT `TextShort_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `Space`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextLong` ADD CONSTRAINT `TextLong_languageId_fkey` FOREIGN KEY (`languageId`) REFERENCES `Language`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextLong` ADD CONSTRAINT `TextLong_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextLong` ADD CONSTRAINT `TextLong_styleId_fkey` FOREIGN KEY (`styleId`) REFERENCES `Style`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextLong` ADD CONSTRAINT `TextLong_colorPatternId_fkey` FOREIGN KEY (`colorPatternId`) REFERENCES `ColorPattern`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextLong` ADD CONSTRAINT `TextLong_proId_fkey` FOREIGN KEY (`proId`) REFERENCES `Pro`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextLong` ADD CONSTRAINT `TextLong_conId_fkey` FOREIGN KEY (`conId`) REFERENCES `Con`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextLong` ADD CONSTRAINT `TextLong_pageInfoId_fkey` FOREIGN KEY (`pageInfoId`) REFERENCES `PageInfo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pro` ADD CONSTRAINT `Pro_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pro` ADD CONSTRAINT `Pro_styleId_fkey` FOREIGN KEY (`styleId`) REFERENCES `Style`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Con` ADD CONSTRAINT `Con_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Con` ADD CONSTRAINT `Con_styleId_fkey` FOREIGN KEY (`styleId`) REFERENCES `Style`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Style` ADD CONSTRAINT `Style_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ColorPattern` ADD CONSTRAINT `ColorPattern_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ColorPatternColor` ADD CONSTRAINT `ColorPatternColor_colorPatternId_fkey` FOREIGN KEY (`colorPatternId`) REFERENCES `ColorPattern`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DesignImage` ADD CONSTRAINT `DesignImage_styleId_fkey` FOREIGN KEY (`styleId`) REFERENCES `Style`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DesignImageSpace` ADD CONSTRAINT `DesignImageSpace_designImageId_fkey` FOREIGN KEY (`designImageId`) REFERENCES `DesignImage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DesignImageSpace` ADD CONSTRAINT `DesignImageSpace_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `Space`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientImageSession` ADD CONSTRAINT `ClientImageSession_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientImageSession` ADD CONSTRAINT `ClientImageSession_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientImageSession` ADD CONSTRAINT `ClientImageSession_colorPatternId_fkey` FOREIGN KEY (`colorPatternId`) REFERENCES `ColorPattern`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientImageSession` ADD CONSTRAINT `ClientImageSession_styleId_fkey` FOREIGN KEY (`styleId`) REFERENCES `Style`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialOnClientImageSession` ADD CONSTRAINT `MaterialOnClientImageSession_clientImageSessionId_fkey` FOREIGN KEY (`clientImageSessionId`) REFERENCES `ClientImageSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialOnClientImageSession` ADD CONSTRAINT `MaterialOnClientImageSession_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientSelectedImage` ADD CONSTRAINT `ClientSelectedImage_imageSessionId_fkey` FOREIGN KEY (`imageSessionId`) REFERENCES `ClientImageSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientSelectedImage` ADD CONSTRAINT `ClientSelectedImage_designImageId_fkey` FOREIGN KEY (`designImageId`) REFERENCES `DesignImage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientImageSessionToSpace` ADD CONSTRAINT `ClientImageSessionToSpace_clientImageSessionId_fkey` FOREIGN KEY (`clientImageSessionId`) REFERENCES `ClientImageSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientImageSessionToSpace` ADD CONSTRAINT `ClientImageSessionToSpace_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `Space`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseRole` ADD CONSTRAINT `CourseRole_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lesson` ADD CONSTRAINT `Lesson_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonAccess` ADD CONSTRAINT `LessonAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonAccess` ADD CONSTRAINT `LessonAccess_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonHomework` ADD CONSTRAINT `LessonHomework_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonHomework` ADD CONSTRAINT `LessonHomework_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonVideo` ADD CONSTRAINT `LessonVideo_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonVideoPdf` ADD CONSTRAINT `LessonVideoPdf_videoId_fkey` FOREIGN KEY (`videoId`) REFERENCES `LessonVideo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonPDF` ADD CONSTRAINT `LessonPDF_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LessonLink` ADD CONSTRAINT `LessonLink_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Test` ADD CONSTRAINT `Test_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Test` ADD CONSTRAINT `Test_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TestQuestion` ADD CONSTRAINT `TestQuestion_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `Test`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TestChoice` ADD CONSTRAINT `TestChoice_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `TestQuestion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TestAttempt` ADD CONSTRAINT `TestAttempt_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `Test`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TestAttempt` ADD CONSTRAINT `TestAttempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAnswer` ADD CONSTRAINT `UserAnswer_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `TestAttempt`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAnswer` ADD CONSTRAINT `UserAnswer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `TestQuestion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SelectedAnswer` ADD CONSTRAINT `SelectedAnswer_userAnswerId_fkey` FOREIGN KEY (`userAnswerId`) REFERENCES `UserAnswer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseProgress` ADD CONSTRAINT `CourseProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseProgress` ADD CONSTRAINT `CourseProgress_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompletedLesson` ADD CONSTRAINT `CompletedLesson_courseProgressId_fkey` FOREIGN KEY (`courseProgressId`) REFERENCES `CourseProgress`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompletedTest` ADD CONSTRAINT `CompletedTest_courseProgressId_fkey` FOREIGN KEY (`courseProgressId`) REFERENCES `CourseProgress`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatRoom` ADD CONSTRAINT `ChatRoom_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatRoom` ADD CONSTRAINT `ChatRoom_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatRoom` ADD CONSTRAINT `ChatRoom_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMember` ADD CONSTRAINT `ChatMember_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMember` ADD CONSTRAINT `ChatMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMember` ADD CONSTRAINT `ChatMember_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_senderClient_fkey` FOREIGN KEY (`senderClient`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_replyToId_fkey` FOREIGN KEY (`replyToId`) REFERENCES `ChatMessage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_forwardedFromId_fkey` FOREIGN KEY (`forwardedFromId`) REFERENCES `ChatMessage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatAttachment` ADD CONSTRAINT `ChatAttachment_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ChatMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatReadReceipt` ADD CONSTRAINT `ChatReadReceipt_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ChatMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatReadReceipt` ADD CONSTRAINT `ChatReadReceipt_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `ChatMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatTypingStatus` ADD CONSTRAINT `ChatTypingStatus_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `ChatMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatReaction` ADD CONSTRAINT `ChatReaction_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ChatMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatReaction` ADD CONSTRAINT `ChatReaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatReaction` ADD CONSTRAINT `ChatReaction_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMention` ADD CONSTRAINT `ChatMention_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ChatMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMention` ADD CONSTRAINT `ChatMention_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMention` ADD CONSTRAINT `ChatMention_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatPinnedMessage` ADD CONSTRAINT `ChatPinnedMessage_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatPinnedMessage` ADD CONSTRAINT `ChatPinnedMessage_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ChatMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatPinnedMessage` ADD CONSTRAINT `ChatPinnedMessage_pinnedById_fkey` FOREIGN KEY (`pinnedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatBookmark` ADD CONSTRAINT `ChatBookmark_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ChatMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatBookmark` ADD CONSTRAINT `ChatBookmark_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatBookmark` ADD CONSTRAINT `ChatBookmark_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatTemplate` ADD CONSTRAINT `ChatTemplate_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatScheduledMessage` ADD CONSTRAINT `ChatScheduledMessage_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatScheduledMessage` ADD CONSTRAINT `ChatScheduledMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatRoomProject` ADD CONSTRAINT `ChatRoomProject_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatRoomProject` ADD CONSTRAINT `ChatRoomProject_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Call` ADD CONSTRAINT `Call_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Call` ADD CONSTRAINT `Call_initiatorId_fkey` FOREIGN KEY (`initiatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CallParticipant` ADD CONSTRAINT `CallParticipant_callId_fkey` FOREIGN KEY (`callId`) REFERENCES `Call`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CallParticipant` ADD CONSTRAINT `CallParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CallParticipant` ADD CONSTRAINT `CallParticipant_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DriveNode` ADD CONSTRAINT `DriveNode_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DriveNode` ADD CONSTRAINT `DriveNode_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `DriveNode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DriveAcl` ADD CONSTRAINT `DriveAcl_nodeId_fkey` FOREIGN KEY (`nodeId`) REFERENCES `DriveNode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DriveAcl` ADD CONSTRAINT `DriveAcl_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DrivePublicShare` ADD CONSTRAINT `DrivePublicShare_nodeId_fkey` FOREIGN KEY (`nodeId`) REFERENCES `DriveNode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DrivePublicShare` ADD CONSTRAINT `DrivePublicShare_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DriveNodeProject` ADD CONSTRAINT `DriveNodeProject_nodeId_fkey` FOREIGN KEY (`nodeId`) REFERENCES `DriveNode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DriveNodeProject` ADD CONSTRAINT `DriveNodeProject_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DriveNodeClientLead` ADD CONSTRAINT `DriveNodeClientLead_nodeId_fkey` FOREIGN KEY (`nodeId`) REFERENCES `DriveNode`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DriveNodeClientLead` ADD CONSTRAINT `DriveNodeClientLead_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

