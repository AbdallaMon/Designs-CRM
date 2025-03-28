ALTER TABLE clientLead
ADD COLUMN commissionCleared BOOLEAN DEFAULT FALSE;

CREATE TABLE `WorkStageStatus` (
`id` INT AUTO_INCREMENT PRIMARY KEY,
`clientLeadId` INT NOT NULL,
`stage` ENUM(
'CLIENT_COMMUNICATION',
'DESIGN_STAGE',
'THREE_D_STAGE',
'THREE_D_APPROVAL',
'FIRST_MODIFICATION',
'SECOND_MODIFICATION',
'THIRD_MODIFICATION'
) NOT NULL,
`communicationStatus` BOOLEAN DEFAULT FALSE,
`communicationUpdatedAt` DATETIME NULL,
`designStageStatus` BOOLEAN DEFAULT FALSE,
`designStageUpdatedAt` DATETIME NULL,
`renderStatus` BOOLEAN DEFAULT FALSE,
`renderUpdatedAt` DATETIME NULL,
UNIQUE KEY `unique_clientLead_stage` (`clientLeadId`, `stage`),
FOREIGN KEY (`clientLeadId`) REFERENCES `ClientLead` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
INDEX `idx_clientLeadId` (`clientLeadId`),
INDEX `idx_stage` (`stage`)
)
