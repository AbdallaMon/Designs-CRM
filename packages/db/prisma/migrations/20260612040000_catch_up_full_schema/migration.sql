-- AlterTable
ALTER TABLE `CallReminder` ADD COLUMN `notified` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Client` ADD COLUMN `arName` VARCHAR(255) NULL,
    ADD COLUMN `contactAgreement` BOOLEAN NULL,
    ADD COLUMN `contactInitialPriceAgreement` BOOLEAN NULL,
    ADD COLUMN `enName` VARCHAR(255) NULL,
    ADD COLUMN `lastSeenAt` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `ClientLead` ADD COLUMN `accountantAssignedAt` DATETIME(0) NULL,
    ADD COLUMN `accountantId` INTEGER NULL,
    ADD COLUMN `bookingRequestStatus` ENUM('IN_PROGRESS', 'SUBMITTED') NOT NULL DEFAULT 'IN_PROGRESS',
    ADD COLUMN `bookingSubmittedAt` DATETIME(3) NULL,
    ADD COLUMN `clientDescription` TEXT NULL,
    ADD COLUMN `code` VARCHAR(191) NULL,
    ADD COLUMN `commissionCleared` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `contractorCost` VARCHAR(255) NULL,
    ADD COLUMN `country` VARCHAR(255) NULL,
    ADD COLUMN `decisionMaker` VARCHAR(255) NULL,
    ADD COLUMN `discoverySource` ENUM('TIKTOK', 'TV', 'FACEBOOK', 'YOUTUBE', 'GOOGLE', 'INSTAGRAM', 'INTERIOR_MAGAZINE_SITE', 'REFERRAL', 'OTHER') NULL,
    ADD COLUMN `finalizedDate` DATETIME(0) NULL,
    ADD COLUMN `hasArchitecturalPlan` VARCHAR(255) NULL,
    ADD COLUMN `initialConsult` BOOLEAN NULL DEFAULT true,
    ADD COLUMN `leadType` ENUM('NORMAL', 'CONVERTED') NOT NULL DEFAULT 'NORMAL',
    ADD COLUMN `location` VARCHAR(255) NULL,
    ADD COLUMN `ourCost` VARCHAR(255) NULL,
    ADD COLUMN `paymentSessionId` VARCHAR(255) NULL,
    ADD COLUMN `paymentStatus` ENUM('PENDING', 'PARTIALLY_PAID', 'FULLY_PAID', 'OVERDUE') NULL DEFAULT 'PENDING',
    ADD COLUMN `personality` ENUM('EXPRESSIVE', 'ANALYTICAL', 'INTROVERTED', 'DRIVER') NULL,
    ADD COLUMN `previousLeadId` INTEGER NULL,
    ADD COLUMN `previousWork` TEXT NULL,
    ADD COLUMN `priceNote` TEXT NULL,
    ADD COLUMN `projectStage` VARCHAR(255) NULL,
    ADD COLUMN `projectType` VARCHAR(255) NULL,
    ADD COLUMN `serviceType` VARCHAR(255) NULL,
    ADD COLUMN `stateOfTheProject` TEXT NULL,
    ADD COLUMN `stripieMetadata` LONGTEXT NULL,
    ADD COLUMN `telegramLink` VARCHAR(255) NULL,
    ADD COLUMN `timeToContact` DATETIME(0) NULL,
    MODIFY `emirate` enum('DUBAI','ABU_DHABI','SHARJAH','AJMAN','UMM_AL_QUWAIN','RAS_AL_KHAIMAH','FUJAIRAH','KHOR_FAKKAN','OUTSIDE') NULL,
    MODIFY `status` enum('NEW','IN_PROGRESS','INTERESTED','NEEDS_IDENTIFIED','NEGOTIATING','REJECTED','FINALIZED','CONVERTED','ON_HOLD','ARCHIVED','LEADEXCHANGE') NOT NULL DEFAULT 'NEW';

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
    MODIFY `content` text NULL,
    MODIFY `clientLeadId` int(11) NULL;

-- AlterTable
ALTER TABLE `Notification` MODIFY `type` enum('NEW_LEAD','LEAD_ASSIGNED','LEAD_STATUS_CHANGE','LEAD_TRANSFERRED','LEAD_UPDATED','LEAD_CONTACT','NOTE_ADDED','NEW_NOTE','NEW_FILE','CALL_REMINDER_CREATED','CALL_REMINDER_STATUS','PRICE_OFFER_SUBMITTED','PRICE_OFFER_UPDATED','FINAL_PRICE_ADDED','FINAL_PRICE_CHANGED','PAYMENT_ADDED','PAYMENT_STATUS_UPDATED','EXTRA_FINAL_PRICE_ADDED','EXTRA_FINAL_PRICE_EDITED','WORK_STAGE_UPDATED','OTHER','TEST_FINISHED','ATTEMPT_PASSED','ATTEMPT_FAILED','NEW_ATTEMPT_CREATED','NEW_ATTEMPT_ADDED','NEW_CHAT_MESSAGE','CHAT_MENTION','CHAT_ROOM_CREATED','CHAT_MEMBER_ADDED','CHAT_CALL_INCOMING','CHAT_CALL_MISSED','LEAD_CREATED','LEAD_SUBMITTED','LEAD_STATUS_CHANGED','TELEGRAM_REAUTH_NEEDED') NOT NULL;

-- AlterTable
ALTER TABLE `PriceOffers` ADD COLUMN `isAccepted` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `note` TEXT NULL,
    MODIFY `minPrice` decimal(10,2) NULL,
    MODIFY `maxPrice` decimal(10,2) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `allowEmailing` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `allowNotification` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `baseSalaryId` INTEGER NULL,
    ADD COLUMN `googleAccessToken` LONGTEXT NULL,
    ADD COLUMN `googleCalendarId` VARCHAR(191) NULL,
    ADD COLUMN `googleEmail` VARCHAR(255) NULL,
    ADD COLUMN `googleRefreshToken` LONGTEXT NULL,
    ADD COLUMN `googleTokenExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `hasLogs` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isSuperSales` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastSeenAt` DATETIME(0) NULL,
    ADD COLUMN `maxLeadCountPerDay` INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN `maxLeadsCounts` INTEGER NULL DEFAULT 50,
    ADD COLUMN `monthlySalaryId` INTEGER NULL,
    ADD COLUMN `notAllowedCountries` LONGTEXT NULL,
    ADD COLUMN `profilePicture` LONGTEXT NULL,
    ADD COLUMN `telegramUsername` VARCHAR(255) NULL,
    MODIFY `role` enum('ADMIN','STAFF','THREE_D_DESIGNER','TWO_D_DESIGNER','TWO_D_EXECUTOR','ACCOUNTANT','SUPER_ADMIN','SUPER_SALES','CONTACT_INITIATOR') NULL DEFAULT 'STAFF';

-- CreateTable
CREATE TABLE `Answer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `response` TEXT NOT NULL,
    `sessionQuestionId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `sessionQuestionId`(`sessionQuestionId` ASC),
    INDEX `userId`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Assignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `projectId` INTEGER NULL,
    `type` VARCHAR(255) NULL,
    `role` ENUM('ADMIN', 'STAFF', 'THREE_D_DESIGNER', 'TWO_D_DESIGNER', 'TWO_D_EXECUTOR', 'ACCOUNTANT', 'SUPER_ADMIN') NOT NULL DEFAULT 'THREE_D_DESIGNER',
    `assignedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Assignment_projectId_idx`(`projectId` ASC),
    INDEX `Assignment_userId_idx`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutoAssignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AutoAssignment_userId_idx`(`userId` ASC),
    UNIQUE INDEX `AutoAssignment_userId_type_key`(`userId` ASC, `type` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AvailableDay` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(0) NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_available_day_userId`(`userId` ASC),
    UNIQUE INDEX `unique_user_date`(`userId` ASC, `date` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AvailableSlot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startTime` DATETIME(0) NOT NULL,
    `endTime` DATETIME(0) NOT NULL,
    `availableDayId` INTEGER NOT NULL,
    `isBooked` BOOLEAN NOT NULL DEFAULT false,
    `meetingReminderId` INTEGER NULL,
    `userTimezone` VARCHAR(100) NULL,

    INDEX `fk_slot_dayId`(`availableDayId` ASC),
    UNIQUE INDEX `meetingReminderId`(`meetingReminderId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BaseEmployeeSalary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `baseSalary` DECIMAL(10, 2) NOT NULL,
    `baseWorkHours` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `taxAmount` DECIMAL(10, 2) NULL DEFAULT 0.00,

    UNIQUE INDEX `userId`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BaseQuestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `questionTypeId` INTEGER NOT NULL,
    `title` TEXT NOT NULL,
    `order` INTEGER NULL DEFAULT 0,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `isArchived` BOOLEAN NOT NULL DEFAULT false,

    INDEX `questionTypeId`(`questionTypeId` ASC),
    PRIMARY KEY (`id` ASC)
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

    INDEX `Call_initiatorId_idx`(`initiatorId` ASC),
    INDEX `Call_roomId_idx`(`roomId` ASC),
    INDEX `Call_status_idx`(`status` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CallParticipant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `callId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `clientId` INTEGER NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leftAt` DATETIME(3) NULL,

    INDEX `CallParticipant_callId_idx`(`callId` ASC),
    INDEX `CallParticipant_clientId_idx`(`clientId` ASC),
    INDEX `CallParticipant_userId_idx`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Certificate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `isApproved` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fileUrl` TEXT NULL,

    INDEX `courseId`(`courseId` ASC),
    INDEX `userId`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatAttachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `fileUrl` VARCHAR(500) NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `fileSize` INTEGER NULL,
    `fileMimeType` VARCHAR(100) NULL,
    `thumbnailUrl` VARCHAR(500) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `content` TEXT NULL,

    INDEX `ChatAttachment_messageId_idx`(`messageId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatBookmark` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `clientId` INTEGER NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatBookmark_clientId_idx`(`clientId` ASC),
    UNIQUE INDEX `ChatBookmark_messageId_clientId_key`(`messageId` ASC, `clientId` ASC),
    INDEX `ChatBookmark_messageId_idx`(`messageId` ASC),
    UNIQUE INDEX `ChatBookmark_messageId_userId_key`(`messageId` ASC, `userId` ASC),
    INDEX `ChatBookmark_userId_idx`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `clientId` INTEGER NULL,
    `role` ENUM('ADMIN', 'MODERATOR', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `isMuted` BOOLEAN NOT NULL DEFAULT false,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `lastReadAt` DATETIME(3) NULL,
    `notifyOnReply` BOOLEAN NOT NULL DEFAULT true,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leftAt` DATETIME(3) NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `ChatMember_clientId_idx`(`clientId` ASC),
    UNIQUE INDEX `ChatMember_roomId_clientId_key`(`roomId` ASC, `clientId` ASC),
    INDEX `ChatMember_roomId_idx`(`roomId` ASC),
    INDEX `ChatMember_roomId_leftAt_idx`(`roomId` ASC, `leftAt` ASC),
    UNIQUE INDEX `ChatMember_roomId_userId_key`(`roomId` ASC, `userId` ASC),
    INDEX `ChatMember_userId_idx`(`userId` ASC),
    INDEX `ChatMember_userId_leftAt_idx`(`userId` ASC, `leftAt` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMention` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `clientId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatMention_clientId_idx`(`clientId` ASC),
    UNIQUE INDEX `ChatMention_messageId_clientId_key`(`messageId` ASC, `clientId` ASC),
    INDEX `ChatMention_messageId_idx`(`messageId` ASC),
    UNIQUE INDEX `ChatMention_messageId_userId_key`(`messageId` ASC, `userId` ASC),
    INDEX `ChatMention_userId_idx`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `senderId` INTEGER NULL,
    `senderClient` INTEGER NULL,
    `type` ENUM('TEXT', 'FILE', 'IMAGE', 'VOICE', 'VIDEO', 'SYSTEM') NOT NULL,
    `content` TEXT NULL,
    `fileUrl` VARCHAR(500) NULL,
    `fileName` VARCHAR(255) NULL,
    `fileSize` INTEGER NULL,
    `fileMimeType` VARCHAR(100) NULL,
    `replyToId` INTEGER NULL,
    `forwardedFromId` INTEGER NULL,
    `isEdited` BOOLEAN NOT NULL DEFAULT false,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ChatMessage_createdAt_idx`(`createdAt` ASC),
    INDEX `ChatMessage_forwardedFromId_idx`(`forwardedFromId` ASC),
    INDEX `ChatMessage_replyToId_idx`(`replyToId` ASC),
    INDEX `ChatMessage_roomId_createdAt_idx`(`roomId` ASC, `createdAt` ASC),
    INDEX `ChatMessage_roomId_idx`(`roomId` ASC),
    INDEX `ChatMessage_roomId_isDeleted_idx`(`roomId` ASC, `isDeleted` ASC),
    INDEX `ChatMessage_senderClient_idx`(`senderClient` ASC),
    INDEX `ChatMessage_senderId_createdAt_idx`(`senderId` ASC, `createdAt` ASC),
    INDEX `ChatMessage_senderId_idx`(`senderId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatPinnedMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `messageId` INTEGER NOT NULL,
    `pinnedById` INTEGER NULL,
    `pinnedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ChatPinnedMessage_messageId_key`(`messageId` ASC),
    INDEX `ChatPinnedMessage_pinnedById_idx`(`pinnedById` ASC),
    INDEX `ChatPinnedMessage_roomId_idx`(`roomId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatReaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `clientId` INTEGER NULL,
    `emoji` VARCHAR(10) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatReaction_clientId_idx`(`clientId` ASC),
    UNIQUE INDEX `ChatReaction_messageId_clientId_emoji_key`(`messageId` ASC, `clientId` ASC, `emoji` ASC),
    INDEX `ChatReaction_messageId_idx`(`messageId` ASC),
    UNIQUE INDEX `ChatReaction_messageId_userId_emoji_key`(`messageId` ASC, `userId` ASC, `emoji` ASC),
    INDEX `ChatReaction_userId_idx`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatReadReceipt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `memberId` INTEGER NOT NULL,
    `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatReadReceipt_memberId_idx`(`memberId` ASC),
    INDEX `ChatReadReceipt_messageId_idx`(`messageId` ASC),
    UNIQUE INDEX `ChatReadReceipt_messageId_memberId_key`(`messageId` ASC, `memberId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatRoom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('STAFF_TO_STAFF', 'PROJECT_GROUP', 'CLIENT_TO_STAFF', 'STAFF_GROUP', 'GROUP') NOT NULL,
    `name` VARCHAR(255) NULL,
    `avatarUrl` VARCHAR(500) NULL,
    `projectId` INTEGER NULL,
    `clientLeadId` INTEGER NULL,
    `allowFiles` BOOLEAN NOT NULL DEFAULT true,
    `allowCalls` BOOLEAN NOT NULL DEFAULT true,
    `isChatEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `allowChatForMembers` BOOLEAN NOT NULL DEFAULT false,
    `allowMeetings` BOOLEAN NOT NULL DEFAULT false,
    `chatAccessToken` VARCHAR(255) NULL,

    INDEX `ChatRoom_clientLeadId_idx`(`clientLeadId` ASC),
    INDEX `ChatRoom_createdById_idx`(`createdById` ASC),
    INDEX `ChatRoom_projectId_idx`(`projectId` ASC),
    INDEX `ChatRoom_type_idx`(`type` ASC),
    UNIQUE INDEX `uq_chatroom_chatAccessToken`(`chatAccessToken` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatRoomProject` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `projectId` INTEGER NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatRoomProject_projectId_idx`(`projectId` ASC),
    INDEX `ChatRoomProject_roomId_idx`(`roomId` ASC),
    UNIQUE INDEX `ChatRoomProject_roomId_projectId_key`(`roomId` ASC, `projectId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatScheduledMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `senderId` INTEGER NULL,
    `content` TEXT NOT NULL,
    `fileUrl` VARCHAR(500) NULL,
    `scheduledFor` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `sentMessageId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatScheduledMessage_roomId_scheduledFor_idx`(`roomId` ASC, `scheduledFor` ASC),
    INDEX `ChatScheduledMessage_senderId_idx`(`senderId` ASC),
    INDEX `ChatScheduledMessage_status_idx`(`status` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `isGlobal` BOOLEAN NOT NULL DEFAULT false,
    `category` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ChatTemplate_isGlobal_idx`(`isGlobal` ASC),
    INDEX `ChatTemplate_userId_idx`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatTypingStatus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memberId` INTEGER NOT NULL,
    `isTyping` BOOLEAN NOT NULL DEFAULT false,
    `lastTyping` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChatTypingStatus_memberId_idx`(`memberId` ASC),
    UNIQUE INDEX `ChatTypingStatus_memberId_key`(`memberId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientImageSession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(255) NOT NULL,
    `clientLeadId` INTEGER NOT NULL,
    `createdById` INTEGER NOT NULL,
    `colorPatternId` INTEGER NULL,
    `styleId` INTEGER NULL,
    `customColors` LONGTEXT NULL,
    `signatureUrl` VARCHAR(255) NULL,
    `submittedAt` DATETIME(3) NULL,
    `isArchived` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sessionStatus` ENUM('INITIAL', 'PREVIEW_COLOR_PATTERN', 'SELECTED_COLOR_PATTERN', 'PREVIEW_MATERIAL', 'SELECTED_MATERIAL', 'PREVIEW_STYLE', 'SELECTED_STYLE', 'PREVIEW_IMAGES', 'SELECTED_IMAGES', 'PDF_GENERATED', 'SUBMITTED') NULL DEFAULT 'INITIAL',
    `pdfUrl` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,

    INDEX `clientLeadId`(`clientLeadId` ASC),
    INDEX `colorPatternId`(`colorPatternId` ASC),
    INDEX `createdById`(`createdById` ASC),
    INDEX `styleId`(`styleId` ASC),
    UNIQUE INDEX `token`(`token` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientImageSessionToSpace` (
    `clientImageSessionId` INTEGER NOT NULL,
    `spaceId` INTEGER NOT NULL,

    INDEX `spaceId`(`spaceId` ASC),
    PRIMARY KEY (`clientImageSessionId` ASC, `spaceId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientLeadUpdate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('IN_PROGRESS', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdById` INTEGER NOT NULL,
    `clientLeadId` INTEGER NOT NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `department` VARCHAR(255) NOT NULL DEFAULT 'STAFF',
    `isDone` BOOLEAN NOT NULL DEFAULT false,

    INDEX `clientLeadId`(`clientLeadId` ASC),
    INDEX `createdById`(`createdById` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientSelectedImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageSessionId` INTEGER NOT NULL,
    `designImageId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `designImageId`(`designImageId` ASC),
    INDEX `imageSessionId`(`imageSessionId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ColorPattern` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `background` VARCHAR(255) NULL,
    `order` INTEGER NULL DEFAULT 0,
    `isArchived` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `templateId` INTEGER NULL,
    `isFullWidth` BOOLEAN NULL DEFAULT false,
    `imageUrl` VARCHAR(255) NULL,

    INDEX `fk_colorpattern_template`(`templateId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ColorPatternColor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `colorHex` VARCHAR(255) NOT NULL,
    `isEditableByClient` BOOLEAN NULL DEFAULT false,
    `colorPatternId` INTEGER NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `colorPatternId`(`colorPatternId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Commission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `leadId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `amountPaid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `isCleared` BOOLEAN NOT NULL DEFAULT false,
    `commissionReason` VARCHAR(255) NOT NULL DEFAULT 'Finalized Lead Commission',

    INDEX `leadId`(`leadId` ASC),
    INDEX `userId`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompletedLesson` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseProgressId` INTEGER NOT NULL,
    `lessonId` INTEGER NOT NULL,
    `completedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `courseProgressId`(`courseProgressId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompletedTest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseProgressId` INTEGER NOT NULL,
    `testId` INTEGER NOT NULL,
    `completedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_courseProgressId`(`courseProgressId` ASC),
    INDEX `idx_testId`(`testId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Con` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `materialId` INTEGER NULL,
    `styleId` INTEGER NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `materialId`(`materialId` ASC),
    INDEX `styleId`(`styleId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contract` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `contractLevel` ENUM('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5', 'LEVEL_6', 'LEVEL_7') NOT NULL,
    `title` VARCHAR(255) NULL,
    `startDate` DATETIME(0) NULL,
    `endDate` DATETIME(0) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `purpose` VARCHAR(255) NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `isInProgress` BOOLEAN NOT NULL DEFAULT false,
    `pdfLinkAr` VARCHAR(1024) NULL,
    `pdfLinkEn` VARCHAR(1024) NULL,
    `signatureUrl` TEXT NULL,
    `handWrittenSignatureUrl` TEXT NULL,
    `projectType` VARCHAR(191) NULL,
    `writtenAt` DATETIME(0) NULL,
    `status` ENUM('IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
    `taxRate` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `amount` DECIMAL(12, 2) NULL,
    `totalAmount` DECIMAL(12, 2) NULL,
    `projectGroupId` INTEGER NULL,
    `arToken` VARCHAR(64) NULL,
    `enToken` VARCHAR(64) NULL,
    `sessionStatus` ENUM('INITIAL', 'SIGNING', 'REGISTERED') NOT NULL DEFAULT 'INITIAL',
    `enTitle` VARCHAR(191) NULL,

    INDEX `idx_contract_clientLeadId`(`clientLeadId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractDrawing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contractId` INTEGER NOT NULL,
    `url` VARCHAR(1024) NOT NULL,
    `fileName` VARCHAR(255) NULL,
    `mimeType` VARCHAR(191) NULL,
    `sizeBytes` INTEGER NULL,
    `uploadedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `uploadedById` INTEGER NULL,

    INDEX `ContractDrawing_contractId_idx`(`contractId` ASC),
    PRIMARY KEY (`id` ASC)
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

    INDEX `ContractLevelClauseTemplate_contractUtilityId_idx`(`contractUtilityId` ASC),
    INDEX `ContractLevelClauseTemplate_level_idx`(`level` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractPayment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contractId` INTEGER NOT NULL,
    `stageId` INTEGER NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `amountLost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `amountReceived` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `currency` VARCHAR(16) NOT NULL DEFAULT 'AED',
    `dueDate` DATETIME(0) NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'NOT_DUE',
    `reference` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `projectId` INTEGER NULL,
    `paymentCondition` VARCHAR(100) NULL,
    `conditionId` INTEGER NULL,

    INDEX `ContractPayment_conditionId_idx`(`conditionId` ASC),
    INDEX `ContractPayment_contractId_idx`(`contractId` ASC),
    INDEX `ContractPayment_stageId_idx`(`stageId` ASC),
    INDEX `ContractPayment_status_dueDate_idx`(`status` ASC, `dueDate` ASC),
    INDEX `idx_contractpayment_projectId`(`projectId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractPaymentCondition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conditionType` VARCHAR(191) NOT NULL,
    `condition` VARCHAR(191) NOT NULL,
    `labelAr` VARCHAR(191) NOT NULL,
    `labelEn` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ContractPaymentCondition_unique_business_key`(`conditionType` ASC, `condition` ASC, `labelAr` ASC, `labelEn` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractSpecialClauseTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contractUtilityId` INTEGER NOT NULL,
    `textAr` TEXT NOT NULL,
    `textEn` TEXT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `ContractSpecialClauseTemplate_contractUtilityId_idx`(`contractUtilityId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractSpecialItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contractId` INTEGER NOT NULL,
    `labelAr` TEXT NOT NULL,
    `labelEn` TEXT NULL,

    INDEX `ContractSpecialItem_contractId_idx`(`contractId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractStage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contractId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `deliveryDays` INTEGER NOT NULL,
    `deptDeliveryDays` INTEGER NULL,
    `projectId` INTEGER NULL,
    `startDate` DATETIME(0) NULL,
    `endDate` DATETIME(0) NULL,
    `stageStatus` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'NOT_STARTED',

    INDEX `ContractStage_contractId_idx`(`contractId` ASC),
    UNIQUE INDEX `ContractStage_contractId_order_key`(`contractId` ASC, `order` ASC),
    INDEX `ContractStage_projectId_idx`(`projectId` ASC),
    INDEX `idx_contractstage_stageStatus`(`stageStatus` ASC),
    PRIMARY KEY (`id` ASC)
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

    INDEX `ContractStageClauseTemplate_contractUtilityId_idx`(`contractUtilityId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContractUtility` (
    `id` INTEGER NOT NULL,
    `obligationsPartyOneAr` TEXT NOT NULL,
    `obligationsPartyOneEn` TEXT NOT NULL,
    `obligationsPartyTwoAr` TEXT NOT NULL,
    `obligationsPartyTwoEn` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` TEXT NULL,
    `isPublished` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseProgress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `courseId`(`courseId` ASC),
    INDEX `userId`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseRole` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `role` ENUM('ADMIN', 'STAFF', 'THREE_D_DESIGNER', 'TWO_D_DESIGNER', 'TWO_D_EXECUTOR', 'ACCOUNTANT', 'SUPER_ADMIN') NOT NULL,

    INDEX `courseId`(`courseId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliverySchedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NULL,
    `name` VARCHAR(255) NULL,
    `deliveryAt` DATETIME(0) NOT NULL,
    `meetingReminderId` INTEGER NULL,
    `createdById` INTEGER NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `stageId` INTEGER NULL,

    UNIQUE INDEX `DeliverySchedule_stageId_key`(`stageId` ASC),
    INDEX `idx_DeliverySchedule_createdById`(`createdById` ASC),
    INDEX `idx_DeliverySchedule_deliveryAt`(`deliveryAt` ASC),
    INDEX `idx_DeliverySchedule_meetingReminderId`(`meetingReminderId` ASC),
    INDEX `idx_DeliverySchedule_projectId`(`projectId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DesignImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageUrl` VARCHAR(255) NOT NULL,
    `styleId` INTEGER NOT NULL,
    `isArchived` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `styleId`(`styleId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DesignImageSpace` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `designImageId` INTEGER NOT NULL,
    `spaceId` INTEGER NOT NULL,

    INDEX `designImageId`(`designImageId` ASC),
    INDEX `spaceId`(`spaceId` ASC),
    PRIMARY KEY (`id` ASC)
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
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_DriveAcl_nodeId`(`nodeId` ASC),
    INDEX `idx_DriveAcl_userId`(`userId` ASC),
    UNIQUE INDEX `uq_DriveAcl_node_user`(`nodeId` ASC, `userId` ASC),
    PRIMARY KEY (`id` ASC)
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
    `deletedAt` DATETIME(0) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_DriveNode_isDeleted`(`isDeleted` ASC),
    INDEX `idx_DriveNode_ownerId`(`ownerId` ASC),
    INDEX `idx_DriveNode_parentId`(`parentId` ASC),
    INDEX `idx_DriveNode_visibility`(`visibility` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DriveNodeClientLead` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nodeId` INTEGER NOT NULL,
    `clientLeadId` INTEGER NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_DriveNodeClientLead_clientLeadId`(`clientLeadId` ASC),
    INDEX `idx_DriveNodeClientLead_nodeId`(`nodeId` ASC),
    UNIQUE INDEX `uq_DriveNodeClientLead_node_lead`(`nodeId` ASC, `clientLeadId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DriveNodeProject` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nodeId` INTEGER NOT NULL,
    `projectId` INTEGER NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_DriveNodeProject_nodeId`(`nodeId` ASC),
    INDEX `idx_DriveNodeProject_projectId`(`projectId` ASC),
    UNIQUE INDEX `uq_DriveNodeProject_node_project`(`nodeId` ASC, `projectId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DrivePublicShare` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nodeId` INTEGER NOT NULL,
    `createdById` INTEGER NOT NULL,
    `token` VARCHAR(80) NOT NULL,
    `expiresAt` DATETIME(0) NULL,
    `isRevoked` BOOLEAN NOT NULL DEFAULT false,
    `revokedAt` DATETIME(0) NULL,
    `passwordHash` VARCHAR(255) NULL,
    `canView` BOOLEAN NOT NULL DEFAULT true,
    `canDownload` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_DrivePublicShare_createdById`(`createdById` ASC),
    INDEX `idx_DrivePublicShare_nodeId`(`nodeId` ASC),
    UNIQUE INDEX `uq_DrivePublicShare_token`(`token` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExtraService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `clientLeadId`(`clientLeadId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FetchedTelegramMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `messageId` INTEGER NULL,
    `fetchedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_clientLeadId`(`clientLeadId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FixedData` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `createdAt` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentId` INTEGER NOT NULL,
    `issuedDate` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `amount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `invoiceNumber` VARCHAR(20) NULL,

    INDEX `fk_payment_id`(`paymentId` ASC),
    UNIQUE INDEX `invoiceNumber`(`invoiceNumber` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Language` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `code`(`code` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lesson` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `duration` INTEGER NULL,
    `order` INTEGER NULL DEFAULT 0,
    `isPreviewable` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `mustUploadHomework` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `uniq_course_order`(`courseId` ASC, `order` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonAccess` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `lessonId` INTEGER NOT NULL,
    `grantedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_lessonaccess_lesson`(`lessonId` ASC),
    UNIQUE INDEX `unique_user_lesson`(`userId` ASC, `lessonId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonHomework` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `lessonId` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `url` TEXT NOT NULL,
    `type` ENUM('VIDEO', 'SUMMARY') NOT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_lessonId`(`lessonId` ASC),
    INDEX `idx_userId`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lessonId` INTEGER NOT NULL,
    `url` LONGTEXT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `lessonId`(`lessonId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonPDF` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lessonId` INTEGER NOT NULL,
    `url` LONGTEXT NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `lessonId`(`lessonId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonVideo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lessonId` INTEGER NOT NULL,
    `url` LONGTEXT NOT NULL,
    `videoType` ENUM('IFRAME', 'URL') NULL DEFAULT 'IFRAME',
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `lessonId`(`lessonId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LessonVideoPdf` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `videoId` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `url` TEXT NOT NULL,
    `uploadedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_video`(`videoId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Material` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageUrl` VARCHAR(255) NULL,
    `isArchived` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `templateId` INTEGER NULL,

    INDEX `fk_material_template`(`templateId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialOnClientImageSession` (
    `clientImageSessionId` INTEGER NOT NULL,
    `materialId` INTEGER NOT NULL,

    INDEX `materialId`(`materialId` ASC),
    PRIMARY KEY (`clientImageSessionId` ASC, `materialId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MeetingReminder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `time` DATETIME(0) NULL,
    `status` ENUM('IN_PROGRESS', 'DONE', 'MISSED') NULL DEFAULT 'IN_PROGRESS',
    `meetingResult` TEXT NULL,
    `reminderReason` TEXT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `adminId` INTEGER NULL,
    `type` ENUM('SALES_MEETING', 'DESIGN_MEETING') NULL,
    `availableSlotId` INTEGER NULL,
    `token` VARCHAR(191) NULL,
    `userTimezone` VARCHAR(100) NULL,
    `notified` BOOLEAN NOT NULL DEFAULT false,
    `notified4h` BOOLEAN NOT NULL DEFAULT false,
    `notified12h` BOOLEAN NOT NULL DEFAULT false,
    `googleEventId` VARCHAR(255) NULL,
    `googleCalendarSynced` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `availableSlotId`(`availableSlotId` ASC),
    INDEX `idx_adminId`(`adminId` ASC),
    INDEX `idx_clientLeadId`(`clientLeadId` ASC),
    INDEX `idx_userId`(`userId` ASC),
    UNIQUE INDEX `token`(`token` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonthlySalary` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `baseSalaryId` INTEGER NOT NULL,
    `totalHoursWorked` INTEGER NOT NULL,
    `overtimeHours` INTEGER NULL DEFAULT 0,
    `bonuses` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `deductions` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `netSalary` DECIMAL(10, 2) NOT NULL,
    `isFulfilled` BOOLEAN NULL DEFAULT false,
    `paymentDate` DATETIME(0) NULL,
    `outcomeId` INTEGER NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `baseSalaryId`(`baseSalaryId` ASC),
    INDEX `outcomeId`(`outcomeId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ObjectionCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `label` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OperationalExpenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `amount` DECIMAL(10, 2) NULL,
    `paymentDate` DATETIME(0) NULL,
    `paymentStatus` VARCHAR(50) NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `outcomeId` INTEGER NULL,

    INDEX `outcomeId`(`outcomeId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Outcome` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(50) NULL,
    `amount` DECIMAL(10, 2) NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `rentPeriods` INTEGER NULL,
    `operationalExpenses` INTEGER NULL,
    `monthlySalaries` INTEGER NULL,

    INDEX `fk_operational_expense`(`operationalExpenses` ASC),
    INDEX `fk_rent_period`(`rentPeriods` ASC),
    INDEX `idx_monthly_salaries`(`monthlySalaries` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PageInfo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('BEFORE_PATTERN', 'BEFORE_MATERIAL', 'BEFORE_STYLE') NOT NULL,
    `isArchived` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `unique_type`(`type` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'PARTIALLY_PAID', 'FULLY_PAID', 'OVERDUE') NULL DEFAULT 'PENDING',
    `amount` DECIMAL(10, 2) NOT NULL,
    `amountPaid` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `amountLeft` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `paymentReason` TEXT NULL,
    `paymentLevel` VARCHAR(255) NULL,

    INDEX `clientLeadId`(`clientLeadId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `materialId` INTEGER NULL,
    `styleId` INTEGER NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `materialId`(`materialId` ASC),
    INDEX `styleId`(`styleId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `deliveryTime` DATETIME(3) NULL,
    `priority` ENUM('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH') NOT NULL DEFAULT 'MEDIUM',
    `area` DECIMAL(10, 2) NULL,
    `startedAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'STAFF', 'THREE_D_DESIGNER', 'TWO_D_DESIGNER', 'TWO_D_EXECUTOR', 'ACCOUNTANT', 'SUPER_ADMIN') NULL DEFAULT 'THREE_D_DESIGNER',
    `groupTitle` VARCHAR(255) NOT NULL DEFAULT 'Initial Project',
    `groupId` INTEGER NOT NULL DEFAULT 1,
    `isModification` BOOLEAN NOT NULL DEFAULT false,
    `notified7Days` BOOLEAN NULL DEFAULT false,
    `notified3Days` BOOLEAN NULL DEFAULT false,
    `notified2Days` BOOLEAN NULL DEFAULT false,
    `notified1Day` BOOLEAN NULL DEFAULT false,
    `contractId` INTEGER NULL,

    INDEX `Project_clientLeadId_idx`(`clientLeadId` ASC),
    INDEX `Project_groupId_idx`(`groupId` ASC),
    INDEX `idx_project_contractId`(`contractId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `name`(`name` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RentPeriod` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rentId` INTEGER NULL,
    `startDate` DATETIME(0) NULL,
    `endDate` DATETIME(0) NULL,
    `amount` DECIMAL(10, 2) NULL,
    `isPaid` BOOLEAN NULL DEFAULT false,
    `notes` TEXT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `outcomeId` INTEGER NULL,

    INDEX `outcomeId`(`outcomeId` ASC),
    INDEX `rentId`(`rentId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SalesStage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `stage` ENUM('INITIAL_CONTACT', 'SOCIAL_MEDIA_CHECK', 'WHATSAPP_QA', 'MEETING_BOOKED', 'CLIENT_INFO_UPLOADED', 'CONSULTATION_BOOKED', 'FOLLOWUP_AFTER_MEETING', 'HANDLE_OBJECTIONS', 'DEAL_CLOSED', 'AFTER_SALES_FOLLOWUP') NOT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `clientLead_stage_unique`(`clientLeadId` ASC, `stage` ASC),
    INDEX `idx_clientLeadId`(`clientLeadId` ASC),
    INDEX `idx_userId`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SelectedAnswer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userAnswerId` INTEGER NOT NULL,
    `value` VARCHAR(255) NOT NULL,
    `order` INTEGER NULL,

    INDEX `userAnswerId`(`userAnswerId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SessionQuestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `questionTypeId` INTEGER NOT NULL,
    `title` TEXT NOT NULL,
    `isCustom` BOOLEAN NULL DEFAULT false,
    `clientLeadId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `order` INTEGER NULL DEFAULT 0,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `clientLeadId`(`clientLeadId` ASC),
    INDEX `questionTypeId`(`questionTypeId` ASC),
    INDEX `userId`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SharedUpdate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `updateId` INTEGER NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `isArchived` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `excludeFromSearch` BOOLEAN NOT NULL DEFAULT false,

    INDEX `updateId`(`updateId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteUtility` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `pdfFrame` VARCHAR(1024) NULL,
    `pdfHeader` VARCHAR(1024) NULL,
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `introPage` VARCHAR(191) NULL,
    `pageTitle` VARCHAR(191) NULL,
    `pdfSignaturePart` VARCHAR(191) NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Space` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `isArchived` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Style` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageUrl` VARCHAR(255) NULL,
    `isArchived` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `templateId` INTEGER NULL,

    INDEX `fk_style_template`(`templateId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'TODO',
    `priority` ENUM('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH') NOT NULL DEFAULT 'MEDIUM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `projectId` INTEGER NULL,
    `userId` INTEGER NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `createdById` INTEGER NULL,
    `clientLeadId` INTEGER NULL,
    `updatedAt` DATETIME(0) NULL,

    INDEX `FK_Task_ClientLead`(`clientLeadId` ASC),
    INDEX `FK_Task_CreatedBy`(`createdById` ASC),
    INDEX `Task_projectId_idx`(`projectId` ASC),
    INDEX `Task_userId_idx`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TelegramChannel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `channelLink` VARCHAR(255) NOT NULL,
    `channelId` BIGINT NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `accessHash` BIGINT NOT NULL,

    UNIQUE INDEX `channelId`(`channelId` ASC),
    UNIQUE INDEX `clientLeadId`(`clientLeadId` ASC),
    PRIMARY KEY (`id` ASC)
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
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TelegramConnection_isActive_idx`(`isActive` ASC),
    UNIQUE INDEX `TelegramConnection_name_key`(`name` ASC),
    INDEX `TelegramConnection_updatedByUserId_idx`(`updatedByUserId` ASC),
    PRIMARY KEY (`id` ASC)
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
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `blurValue` INTEGER NOT NULL DEFAULT 0,
    `customStyle` LONGTEXT NULL,
    `overlayOpacity` FLOAT NULL DEFAULT 0,
    `equalDimensions` BOOLEAN NULL DEFAULT false,
    `showOverlay` BOOLEAN NULL DEFAULT false,
    `backgroundImage` TEXT NULL,
    `overlayColor` VARCHAR(50) NULL,
    `padding` VARCHAR(50) NULL,
    `paddingX` VARCHAR(50) NULL,
    `paddingY` VARCHAR(50) NULL,
    `borderRadius` VARCHAR(50) NULL,
    `colorSize` INTEGER NULL,
    `layout` LONGTEXT NULL,
    `colorsLayout` VARCHAR(100) NOT NULL DEFAULT 'vertical',

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Test` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NULL,
    `type` ENUM('LESSON', 'FINAL', 'PRACTICE', 'PLACEMENT') NULL DEFAULT 'LESSON',
    `courseId` INTEGER NULL,
    `lessonId` INTEGER NULL,
    `attemptLimit` INTEGER NULL DEFAULT 2,
    `certificateApprovedByAdmin` BOOLEAN NULL DEFAULT false,
    `timeLimit` INTEGER NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,

    INDEX `courseId`(`courseId` ASC),
    INDEX `lessonId`(`lessonId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestAttempt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `testId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `score` FLOAT NULL,
    `passed` BOOLEAN NULL DEFAULT false,
    `attemptCount` INTEGER NULL DEFAULT 0,
    `attemptLimit` INTEGER NULL DEFAULT 2,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `startTime` DATETIME(0) NULL,
    `endTime` DATETIME(0) NULL,
    `timePassed` INTEGER NULL,

    INDEX `testId`(`testId` ASC),
    INDEX `userId`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestChoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `questionId` INTEGER NOT NULL,
    `text` VARCHAR(255) NOT NULL,
    `value` VARCHAR(255) NOT NULL,
    `isCorrect` BOOLEAN NULL DEFAULT false,
    `order` INTEGER NULL,

    INDEX `questionId`(`questionId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestQuestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `testId` INTEGER NOT NULL,
    `type` ENUM('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TRUE_FALSE', 'TEXT', 'ORDERING') NOT NULL,
    `question` TEXT NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 1,

    INDEX `testId`(`testId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TextLong` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `languageId` INTEGER NOT NULL,
    `materialId` INTEGER NULL,
    `styleId` INTEGER NULL,
    `colorPatternId` INTEGER NULL,
    `pageInfoId` INTEGER NULL,
    `proId` INTEGER NULL,
    `conId` INTEGER NULL,

    INDEX `colorPatternId`(`colorPatternId` ASC),
    INDEX `fk_textlong_pro`(`proId` ASC),
    INDEX `languageId`(`languageId` ASC),
    INDEX `materialId`(`materialId` ASC),
    INDEX `pageInfoId`(`pageInfoId` ASC),
    INDEX `styleId`(`styleId` ASC),
    PRIMARY KEY (`id` ASC)
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

    INDEX `colorPatternId`(`colorPatternId` ASC),
    INDEX `fk_textshort_space_title`(`spaceId` ASC),
    INDEX `languageId`(`languageId` ASC),
    INDEX `materialId`(`materialId` ASC),
    INDEX `pageInfoId`(`pageInfoId` ASC),
    INDEX `styleId`(`styleId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserAnswer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attemptId` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,
    `textAnswer` TEXT NULL,
    `isApproved` BOOLEAN NOT NULL DEFAULT false,

    INDEX `attemptId`(`attemptId` ASC),
    INDEX `questionId`(`questionId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `totalMinutes` INTEGER NOT NULL DEFAULT 0,
    `description` TEXT NULL,

    INDEX `idx_user`(`userId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSubRole` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `subRole` ENUM('ADMIN', 'STAFF', 'THREE_D_DESIGNER', 'TWO_D_DESIGNER', 'ACCOUNTANT', 'SUPER_ADMIN') NOT NULL,

    UNIQUE INDEX `userId`(`userId` ASC, `subRole` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VersaModel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientLeadId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `categoryId` INTEGER NULL,
    `vId` INTEGER NULL,
    `eId` INTEGER NULL,
    `rId` INTEGER NULL,
    `sId` INTEGER NULL,
    `aId` INTEGER NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `aId`(`aId` ASC),
    INDEX `categoryId`(`categoryId` ASC),
    INDEX `clientLeadId`(`clientLeadId` ASC),
    UNIQUE INDEX `eId`(`eId` ASC),
    UNIQUE INDEX `rId`(`rId` ASC),
    UNIQUE INDEX `sId`(`sId` ASC),
    INDEX `userId`(`userId` ASC),
    UNIQUE INDEX `vId`(`vId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VersaStep` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(255) NULL,
    `question` TEXT NULL,
    `answer` TEXT NULL,
    `clientResponse` TEXT NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ClientLead_code_key` ON `ClientLead`(`code` ASC);

-- CreateIndex
CREATE INDEX `fk_accountant` ON `ClientLead`(`accountantId` ASC);

-- CreateIndex
CREATE INDEX `IDX_Invoice_Notes` ON `Note`(`invoiceId` ASC);

-- CreateIndex
CREATE INDEX `Note_baseEmployeeSalaryId_idx` ON `Note`(`baseEmployeeSalaryId` ASC);

-- CreateIndex
CREATE INDEX `Note_notedUserId_idx` ON `Note`(`notedUserId` ASC);

-- CreateIndex
CREATE INDEX `Note_operationalExpensesId_idx` ON `Note`(`operationalExpensesId` ASC);

-- CreateIndex
CREATE INDEX `Note_paymentId_idx` ON `Note`(`paymentId` ASC);

-- CreateIndex
CREATE INDEX `Note_rentId_idx` ON `Note`(`rentId` ASC);

-- CreateIndex
CREATE INDEX `Note_rentPeriodId_idx` ON `Note`(`rentPeriodId` ASC);

-- CreateIndex
CREATE INDEX `Note_taskId_idx` ON `Note`(`taskId` ASC);

-- CreateIndex
CREATE INDEX `commissionId` ON `Note`(`commissionId` ASC);

-- CreateIndex
CREATE INDEX `contractId_index` ON `Note`(`contractId` ASC);

-- CreateIndex
CREATE INDEX `fk_note_image_session` ON `Note`(`imageSessionId` ASC);

-- CreateIndex
CREATE INDEX `fk_note_selected_image` ON `Note`(`selectedImageId` ASC);

-- CreateIndex
CREATE INDEX `idx_Note_deliveryScheduleId` ON `Note`(`deliveryScheduleId` ASC);

-- CreateIndex
CREATE INDEX `idx_salesStageId` ON `Note`(`salesStageId` ASC);

-- CreateIndex
CREATE INDEX `sharedUpdateId` ON `Note`(`sharedUpdateId` ASC);

-- CreateIndex
CREATE INDEX `updateId` ON `Note`(`updateId` ASC);

-- CreateIndex
CREATE INDEX `baseSalaryId` ON `User`(`baseSalaryId` ASC);

-- CreateIndex
CREATE INDEX `monthlySalaryId` ON `User`(`monthlySalaryId` ASC);

-- AddForeignKey
ALTER TABLE `Answer` ADD CONSTRAINT `Answer_ibfk_1` FOREIGN KEY (`sessionQuestionId`) REFERENCES `SessionQuestion`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Answer` ADD CONSTRAINT `Answer_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutoAssignment` ADD CONSTRAINT `AutoAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AvailableDay` ADD CONSTRAINT `fk_available_day_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `AvailableSlot` ADD CONSTRAINT `fk_slot_day` FOREIGN KEY (`availableDayId`) REFERENCES `AvailableDay`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `AvailableSlot` ADD CONSTRAINT `fk_slot_meetingReminder` FOREIGN KEY (`meetingReminderId`) REFERENCES `MeetingReminder`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `BaseEmployeeSalary` ADD CONSTRAINT `BaseEmployeeSalary_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `BaseEmployeeSalary` ADD CONSTRAINT `fk_userId` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `BaseQuestion` ADD CONSTRAINT `BaseQuestion_ibfk_1` FOREIGN KEY (`questionTypeId`) REFERENCES `QuestionType`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Call` ADD CONSTRAINT `Call_initiatorId_fkey` FOREIGN KEY (`initiatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Call` ADD CONSTRAINT `Call_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CallParticipant` ADD CONSTRAINT `CallParticipant_callId_fkey` FOREIGN KEY (`callId`) REFERENCES `Call`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CallParticipant` ADD CONSTRAINT `CallParticipant_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CallParticipant` ADD CONSTRAINT `CallParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ChatAttachment` ADD CONSTRAINT `ChatAttachment_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ChatMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatBookmark` ADD CONSTRAINT `ChatBookmark_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatBookmark` ADD CONSTRAINT `ChatBookmark_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ChatMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatBookmark` ADD CONSTRAINT `ChatBookmark_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMember` ADD CONSTRAINT `ChatMember_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMember` ADD CONSTRAINT `ChatMember_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMember` ADD CONSTRAINT `ChatMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMention` ADD CONSTRAINT `ChatMention_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMention` ADD CONSTRAINT `ChatMention_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ChatMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMention` ADD CONSTRAINT `ChatMention_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_forwardedFromId_fkey` FOREIGN KEY (`forwardedFromId`) REFERENCES `ChatMessage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_replyToId_fkey` FOREIGN KEY (`replyToId`) REFERENCES `ChatMessage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_senderClient_fkey` FOREIGN KEY (`senderClient`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatPinnedMessage` ADD CONSTRAINT `ChatPinnedMessage_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ChatMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatPinnedMessage` ADD CONSTRAINT `ChatPinnedMessage_pinnedById_fkey` FOREIGN KEY (`pinnedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatPinnedMessage` ADD CONSTRAINT `ChatPinnedMessage_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatReaction` ADD CONSTRAINT `ChatReaction_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatReaction` ADD CONSTRAINT `ChatReaction_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ChatMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatReaction` ADD CONSTRAINT `ChatReaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatReadReceipt` ADD CONSTRAINT `ChatReadReceipt_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `ChatMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatReadReceipt` ADD CONSTRAINT `ChatReadReceipt_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ChatMessage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatRoom` ADD CONSTRAINT `ChatRoom_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatRoom` ADD CONSTRAINT `ChatRoom_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatRoom` ADD CONSTRAINT `ChatRoom_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatRoomProject` ADD CONSTRAINT `ChatRoomProject_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatRoomProject` ADD CONSTRAINT `ChatRoomProject_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatScheduledMessage` ADD CONSTRAINT `ChatScheduledMessage_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatScheduledMessage` ADD CONSTRAINT `ChatScheduledMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatTemplate` ADD CONSTRAINT `ChatTemplate_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatTypingStatus` ADD CONSTRAINT `ChatTypingStatus_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `ChatMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientImageSession` ADD CONSTRAINT `ClientImageSession_ibfk_1` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientImageSession` ADD CONSTRAINT `ClientImageSession_ibfk_2` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientImageSession` ADD CONSTRAINT `ClientImageSession_ibfk_4` FOREIGN KEY (`colorPatternId`) REFERENCES `ColorPattern`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientImageSession` ADD CONSTRAINT `ClientImageSession_ibfk_6` FOREIGN KEY (`styleId`) REFERENCES `Style`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientImageSessionToSpace` ADD CONSTRAINT `ClientImageSessionToSpace_ibfk_1` FOREIGN KEY (`clientImageSessionId`) REFERENCES `ClientImageSession`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ClientImageSessionToSpace` ADD CONSTRAINT `ClientImageSessionToSpace_ibfk_2` FOREIGN KEY (`spaceId`) REFERENCES `Space`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ClientLead` ADD CONSTRAINT `fk_accountant` FOREIGN KEY (`accountantId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ClientLeadUpdate` ADD CONSTRAINT `ClientLeadUpdate_ibfk_1` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ClientLeadUpdate` ADD CONSTRAINT `ClientLeadUpdate_ibfk_2` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ClientSelectedImage` ADD CONSTRAINT `ClientSelectedImage_ibfk_1` FOREIGN KEY (`imageSessionId`) REFERENCES `ClientImageSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientSelectedImage` ADD CONSTRAINT `ClientSelectedImage_ibfk_2` FOREIGN KEY (`designImageId`) REFERENCES `DesignImage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ColorPattern` ADD CONSTRAINT `fk_colorpattern_template` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ColorPatternColor` ADD CONSTRAINT `ColorPatternColor_ibfk_1` FOREIGN KEY (`colorPatternId`) REFERENCES `ColorPattern`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_ibfk_2` FOREIGN KEY (`leadId`) REFERENCES `ClientLead`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `CompletedLesson` ADD CONSTRAINT `CompletedLesson_ibfk_1` FOREIGN KEY (`courseProgressId`) REFERENCES `CourseProgress`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `CompletedTest` ADD CONSTRAINT `CompletedTest_ibfk_1` FOREIGN KEY (`courseProgressId`) REFERENCES `CourseProgress`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Con` ADD CONSTRAINT `Con_ibfk_1` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Con` ADD CONSTRAINT `Con_ibfk_2` FOREIGN KEY (`styleId`) REFERENCES `Style`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contract` ADD CONSTRAINT `Contract_ibfk_1` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ContractDrawing` ADD CONSTRAINT `ContractDrawing_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractLevelClauseTemplate` ADD CONSTRAINT `ContractLevelClauseTemplate_contractUtilityId_fkey` FOREIGN KEY (`contractUtilityId`) REFERENCES `ContractUtility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractPayment` ADD CONSTRAINT `ContractPayment_conditionId_fkey` FOREIGN KEY (`conditionId`) REFERENCES `ContractPaymentCondition`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractPayment` ADD CONSTRAINT `ContractPayment_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractPayment` ADD CONSTRAINT `ContractPayment_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `ContractStage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractPayment` ADD CONSTRAINT `fk_contractpayment_project` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractSpecialClauseTemplate` ADD CONSTRAINT `ContractSpecialClauseTemplate_contractUtilityId_fkey` FOREIGN KEY (`contractUtilityId`) REFERENCES `ContractUtility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractSpecialItem` ADD CONSTRAINT `ContractSpecialItem_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractStage` ADD CONSTRAINT `ContractStage_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractStage` ADD CONSTRAINT `ContractStage_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContractStageClauseTemplate` ADD CONSTRAINT `ContractStageClauseTemplate_contractUtilityId_fkey` FOREIGN KEY (`contractUtilityId`) REFERENCES `ContractUtility`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseProgress` ADD CONSTRAINT `CourseProgress_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `CourseProgress` ADD CONSTRAINT `CourseProgress_ibfk_2` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `CourseRole` ADD CONSTRAINT `CourseRole_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `DeliverySchedule` ADD CONSTRAINT `DeliverySchedule_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `ContractStage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliverySchedule` ADD CONSTRAINT `fk_DeliverySchedule_createdBy` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliverySchedule` ADD CONSTRAINT `fk_DeliverySchedule_meeting` FOREIGN KEY (`meetingReminderId`) REFERENCES `MeetingReminder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeliverySchedule` ADD CONSTRAINT `fk_DeliverySchedule_project` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DesignImage` ADD CONSTRAINT `DesignImage_ibfk_1` FOREIGN KEY (`styleId`) REFERENCES `Style`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DesignImageSpace` ADD CONSTRAINT `DesignImageSpace_ibfk_1` FOREIGN KEY (`designImageId`) REFERENCES `DesignImage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DesignImageSpace` ADD CONSTRAINT `DesignImageSpace_ibfk_2` FOREIGN KEY (`spaceId`) REFERENCES `Space`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DriveAcl` ADD CONSTRAINT `fk_DriveAcl_node` FOREIGN KEY (`nodeId`) REFERENCES `DriveNode`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `DriveAcl` ADD CONSTRAINT `fk_DriveAcl_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `DriveNode` ADD CONSTRAINT `fk_DriveNode_owner` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `DriveNode` ADD CONSTRAINT `fk_DriveNode_parent` FOREIGN KEY (`parentId`) REFERENCES `DriveNode`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `DriveNodeClientLead` ADD CONSTRAINT `fk_DriveNodeClientLead_lead` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `DriveNodeClientLead` ADD CONSTRAINT `fk_DriveNodeClientLead_node` FOREIGN KEY (`nodeId`) REFERENCES `DriveNode`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `DriveNodeProject` ADD CONSTRAINT `fk_DriveNodeProject_node` FOREIGN KEY (`nodeId`) REFERENCES `DriveNode`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `DriveNodeProject` ADD CONSTRAINT `fk_DriveNodeProject_project` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `DrivePublicShare` ADD CONSTRAINT `fk_DrivePublicShare_createdBy` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `DrivePublicShare` ADD CONSTRAINT `fk_DrivePublicShare_node` FOREIGN KEY (`nodeId`) REFERENCES `DriveNode`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ExtraService` ADD CONSTRAINT `ExtraService_ibfk_1` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `FetchedTelegramMessage` ADD CONSTRAINT `fk_clientLeadId` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_ibfk_1` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `fk_payment_id` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Lesson` ADD CONSTRAINT `Lesson_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `LessonAccess` ADD CONSTRAINT `fk_lessonaccess_lesson` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `LessonAccess` ADD CONSTRAINT `fk_lessonaccess_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `LessonHomework` ADD CONSTRAINT `fk_lessonhomework_lesson` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `LessonHomework` ADD CONSTRAINT `fk_lessonhomework_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `LessonLink` ADD CONSTRAINT `LessonLink_ibfk_1` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `LessonPDF` ADD CONSTRAINT `LessonPDF_ibfk_1` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `LessonVideo` ADD CONSTRAINT `LessonVideo_ibfk_1` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `LessonVideoPdf` ADD CONSTRAINT `fk_video` FOREIGN KEY (`videoId`) REFERENCES `LessonVideo`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `fk_material_template` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `MaterialOnClientImageSession` ADD CONSTRAINT `MaterialOnClientImageSession_ibfk_1` FOREIGN KEY (`clientImageSessionId`) REFERENCES `ClientImageSession`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `MaterialOnClientImageSession` ADD CONSTRAINT `MaterialOnClientImageSession_ibfk_2` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `MeetingReminder` ADD CONSTRAINT `fk_admin_user` FOREIGN KEY (`adminId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `MeetingReminder` ADD CONSTRAINT `fk_meeting_clientLead` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `MeetingReminder` ADD CONSTRAINT `fk_meeting_slot` FOREIGN KEY (`availableSlotId`) REFERENCES `AvailableSlot`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `MeetingReminder` ADD CONSTRAINT `fk_meeting_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `MonthlySalary` ADD CONSTRAINT `MonthlySalary_ibfk_2` FOREIGN KEY (`baseSalaryId`) REFERENCES `BaseEmployeeSalary`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `MonthlySalary` ADD CONSTRAINT `MonthlySalary_ibfk_3` FOREIGN KEY (`outcomeId`) REFERENCES `Outcome`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `FK_Invoice_Notes` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_baseEmployeeSalaryId_fkey` FOREIGN KEY (`baseEmployeeSalaryId`) REFERENCES `BaseEmployeeSalary`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_ibfk_1` FOREIGN KEY (`updateId`) REFERENCES `ClientLeadUpdate`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_ibfk_2` FOREIGN KEY (`sharedUpdateId`) REFERENCES `SharedUpdate`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_notedUserId_fkey` FOREIGN KEY (`notedUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_operationalExpensesId_fkey` FOREIGN KEY (`operationalExpensesId`) REFERENCES `OperationalExpenses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_rentId_fkey` FOREIGN KEY (`rentId`) REFERENCES `Rent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_rentPeriodId_fkey` FOREIGN KEY (`rentPeriodId`) REFERENCES `RentPeriod`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `fk_Note_DeliverySchedule` FOREIGN KEY (`deliveryScheduleId`) REFERENCES `DeliverySchedule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `fk_note_commission` FOREIGN KEY (`commissionId`) REFERENCES `Commission`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `fk_note_contract` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `fk_note_image_session` FOREIGN KEY (`imageSessionId`) REFERENCES `ClientImageSession`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `fk_note_salesStage` FOREIGN KEY (`salesStageId`) REFERENCES `SalesStage`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `fk_note_selected_image` FOREIGN KEY (`selectedImageId`) REFERENCES `ClientSelectedImage`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `OperationalExpenses` ADD CONSTRAINT `OperationalExpenses_ibfk_1` FOREIGN KEY (`outcomeId`) REFERENCES `Outcome`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Outcome` ADD CONSTRAINT `fk_monthly_salaries` FOREIGN KEY (`monthlySalaries`) REFERENCES `MonthlySalary`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Outcome` ADD CONSTRAINT `fk_operational_expense` FOREIGN KEY (`operationalExpenses`) REFERENCES `OperationalExpenses`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Outcome` ADD CONSTRAINT `fk_rent_period` FOREIGN KEY (`rentPeriods`) REFERENCES `RentPeriod`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_ibfk_1` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Pro` ADD CONSTRAINT `Pro_ibfk_1` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pro` ADD CONSTRAINT `Pro_ibfk_2` FOREIGN KEY (`styleId`) REFERENCES `Style`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_clientLeadId_fkey` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `fk_project_contract` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RentPeriod` ADD CONSTRAINT `RentPeriod_ibfk_1` FOREIGN KEY (`rentId`) REFERENCES `Rent`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `RentPeriod` ADD CONSTRAINT `RentPeriod_ibfk_2` FOREIGN KEY (`outcomeId`) REFERENCES `Outcome`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `SalesStage` ADD CONSTRAINT `fk_salesStage_clientLead` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `SalesStage` ADD CONSTRAINT `fk_salesStage_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `SelectedAnswer` ADD CONSTRAINT `SelectedAnswer_ibfk_1` FOREIGN KEY (`userAnswerId`) REFERENCES `UserAnswer`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `SessionQuestion` ADD CONSTRAINT `SessionQuestion_ibfk_1` FOREIGN KEY (`questionTypeId`) REFERENCES `QuestionType`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `SessionQuestion` ADD CONSTRAINT `SessionQuestion_ibfk_2` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `SessionQuestion` ADD CONSTRAINT `SessionQuestion_ibfk_3` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `SharedUpdate` ADD CONSTRAINT `SharedUpdate_ibfk_1` FOREIGN KEY (`updateId`) REFERENCES `ClientLeadUpdate`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Style` ADD CONSTRAINT `fk_style_template` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `FK_Task_ClientLead` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `FK_Task_CreatedBy` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TelegramChannel` ADD CONSTRAINT `TelegramChannel_ibfk_1` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `TelegramConnection` ADD CONSTRAINT `TelegramConnection_updatedByUserId_fkey` FOREIGN KEY (`updatedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Test` ADD CONSTRAINT `Test_ibfk_1` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Test` ADD CONSTRAINT `Test_ibfk_2` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `TestAttempt` ADD CONSTRAINT `TestAttempt_ibfk_1` FOREIGN KEY (`testId`) REFERENCES `Test`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `TestAttempt` ADD CONSTRAINT `TestAttempt_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `TestChoice` ADD CONSTRAINT `TestChoice_ibfk_1` FOREIGN KEY (`questionId`) REFERENCES `TestQuestion`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `TestQuestion` ADD CONSTRAINT `TestQuestion_ibfk_1` FOREIGN KEY (`testId`) REFERENCES `Test`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `TextLong` ADD CONSTRAINT `TextLong_ibfk_1` FOREIGN KEY (`languageId`) REFERENCES `Language`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextLong` ADD CONSTRAINT `TextLong_ibfk_2` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextLong` ADD CONSTRAINT `TextLong_ibfk_3` FOREIGN KEY (`styleId`) REFERENCES `Style`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextLong` ADD CONSTRAINT `TextLong_ibfk_4` FOREIGN KEY (`colorPatternId`) REFERENCES `ColorPattern`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextLong` ADD CONSTRAINT `TextLong_ibfk_5` FOREIGN KEY (`pageInfoId`) REFERENCES `PageInfo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextLong` ADD CONSTRAINT `fk_textlong_pro` FOREIGN KEY (`proId`) REFERENCES `Pro`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextShort` ADD CONSTRAINT `TextShort_ibfk_1` FOREIGN KEY (`languageId`) REFERENCES `Language`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextShort` ADD CONSTRAINT `TextShort_ibfk_2` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextShort` ADD CONSTRAINT `TextShort_ibfk_3` FOREIGN KEY (`styleId`) REFERENCES `Style`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextShort` ADD CONSTRAINT `TextShort_ibfk_4` FOREIGN KEY (`colorPatternId`) REFERENCES `ColorPattern`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextShort` ADD CONSTRAINT `TextShort_ibfk_5` FOREIGN KEY (`pageInfoId`) REFERENCES `PageInfo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TextShort` ADD CONSTRAINT `fk_textshort_space_title` FOREIGN KEY (`spaceId`) REFERENCES `Space`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_ibfk_1` FOREIGN KEY (`baseSalaryId`) REFERENCES `BaseEmployeeSalary`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_ibfk_2` FOREIGN KEY (`monthlySalaryId`) REFERENCES `MonthlySalary`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `UserAnswer` ADD CONSTRAINT `UserAnswer_ibfk_1` FOREIGN KEY (`attemptId`) REFERENCES `TestAttempt`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `UserAnswer` ADD CONSTRAINT `UserAnswer_ibfk_2` FOREIGN KEY (`questionId`) REFERENCES `TestQuestion`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `UserLog` ADD CONSTRAINT `fk_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `UserSubRole` ADD CONSTRAINT `UserSubRole_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_ibfk_1` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_ibfk_3` FOREIGN KEY (`categoryId`) REFERENCES `ObjectionCategory`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_ibfk_4` FOREIGN KEY (`vId`) REFERENCES `VersaStep`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_ibfk_5` FOREIGN KEY (`eId`) REFERENCES `VersaStep`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_ibfk_6` FOREIGN KEY (`rId`) REFERENCES `VersaStep`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_ibfk_7` FOREIGN KEY (`sId`) REFERENCES `VersaStep`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `VersaModel` ADD CONSTRAINT `VersaModel_ibfk_8` FOREIGN KEY (`aId`) REFERENCES `VersaStep`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

