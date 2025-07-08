CREATE TABLE `SalesStage` (
`id` INT AUTO_INCREMENT PRIMARY KEY,
`clientLeadId` INT NOT NULL,
`userId` INT DEFAULT NULL,
`stage` ENUM(
'INITIAL_CONTACT',
'SOCIAL_MEDIA_CHECK',
'WHATSAPP_QA',
'MEETING_BOOKED',
'CLIENT_INFO_UPLOADED',
'CONSULTATION_BOOKED',
'FOLLOWUP_AFTER_MEETING',
'HANDLE_OBJECTIONS',
'DEAL_CLOSED',
'AFTER_SALES_FOLLOWUP'
) NOT NULL,
`createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
UNIQUE KEY `clientLead_stage_unique` (`clientLeadId`, `stage`),
INDEX `idx_clientLeadId` (`clientLeadId`),
INDEX `idx_userId` (`userId`),
CONSTRAINT `fk_salesStage_clientLead` FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead`(`id`) ON DELETE CASCADE,
CONSTRAINT `fk_salesStage_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL
);

ALTER TABLE `Note`
ADD COLUMN `salesStageId` INT DEFAULT NULL,
ADD INDEX `idx_salesStageId` (`salesStageId`),
ADD CONSTRAINT `fk_note_salesStage` FOREIGN KEY (`salesStageId`) REFERENCES `SalesStage`(`id`) ON DELETE SET NULL;
