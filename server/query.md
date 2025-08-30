CREATE TABLE `DeliverySchedule` (
`id` INT NOT NULL AUTO_INCREMENT,
`projectId` INT NOT NULL,
`deliveryAt` DATETIME NOT NULL,
`meetingReminderId` INT NULL,
`createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

PRIMARY KEY (`id`),

INDEX `idx_DeliverySchedule_projectId` (`projectId`),
INDEX `idx_DeliverySchedule_meetingReminderId` (`meetingReminderId`),
INDEX `idx_DeliverySchedule_deliveryAt` (`deliveryAt`),

CONSTRAINT `fk_DeliverySchedule_project`
FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`)
ON DELETE CASCADE
ON UPDATE CASCADE,

CONSTRAINT `fk_DeliverySchedule_meeting`
FOREIGN KEY (`meetingReminderId`) REFERENCES `MeetingReminder`(`id`)
ON DELETE SET NULL
ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `Note`
ADD COLUMN `deliveryScheduleId` INT NULL AFTER `salesStageId`,
ADD INDEX `idx_Note_deliveryScheduleId` (`deliveryScheduleId`),
ADD CONSTRAINT `fk_Note_DeliverySchedule`
FOREIGN KEY (`deliveryScheduleId`) REFERENCES `DeliverySchedule`(`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- 2.1 إضافة العمود
ALTER TABLE `DeliverySchedule`
ADD COLUMN `createdById` INT NULL AFTER `meetingReminderId`;

-- 2.2 فهرس للعمود
ALTER TABLE `DeliverySchedule`
ADD INDEX `idx_DeliverySchedule_createdById` (`createdById`);

-- 2.3 مفتاح أجنبي للـ User
ALTER TABLE `DeliverySchedule`
ADD CONSTRAINT `fk_DeliverySchedule_createdBy`
FOREIGN KEY (`createdById`) REFERENCES `User`(`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;
