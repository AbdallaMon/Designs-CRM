-- 1) إضافة code اختياري في ClientLead + فريد (يسمح بعدة NULLs)
ALTER TABLE `ClientLead`
ADD COLUMN `code` VARCHAR(191) NULL,
ADD UNIQUE KEY `ClientLead_code_key` (`code`);

-- 2) حقول جديدة في Contract: روابط PDF + نوع المشروع + تاريخ كتابة العقد
ALTER TABLE `Contract`
ADD COLUMN `pdfLinkAr` VARCHAR(1024) NULL,
ADD COLUMN `pdfLinkEn` VARCHAR(1024) NULL,
ADD COLUMN `projectType` VARCHAR(191) NULL,
ADD COLUMN `writtenAt` DATETIME NULL;

-- 3) جدول ربط العقد بمشاريع عديدة
CREATE TABLE IF NOT EXISTS `ContractProject` (
`id` INT NOT NULL AUTO_INCREMENT,
`contractId` INT NOT NULL,
`projectId` INT NOT NULL,
`role` VARCHAR(191) NULL,
`createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
UNIQUE KEY `ContractProject_contractId_projectId_key` (`contractId`,`projectId`),
KEY `ContractProject_projectId_idx` (`projectId`),
KEY `ContractProject_contractId_idx` (`contractId`),
CONSTRAINT `ContractProject_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
CONSTRAINT `ContractProject_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) جدول المراحل الجديدة
CREATE TABLE IF NOT EXISTS `ContractStage` (
`id` INT NOT NULL AUTO_INCREMENT,
`contractId` INT NOT NULL,
`title` VARCHAR(191) NOT NULL,
`order` INT NOT NULL,
`deliveryDays` INT NOT NULL,
`deptDeliveryDays` INT NULL,
`projectId` INT NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `ContractStage_contractId_order_key` (`contractId`,`order`),
KEY `ContractStage_projectId_idx` (`projectId`),
KEY `ContractStage_contractId_idx` (`contractId`),
CONSTRAINT `ContractStage_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
CONSTRAINT `ContractStage_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) ENUM لحالات الدفع الجديدة (لو تستخدم MariaDB/MySQL تدعم ENUM محليًا)
-- إن لم ترغب بـ ENUM، اجعلها VARCHAR + CHECK. هنا هنمشي ENUM لتوحيد القيم.
-- ملاحظة: لو ما تحب ENUM على مستوى SQL، تجاهل هذا الجزء واستخدم VARCHAR + CHECK أدناه.
-- سنستخدم جدول بعمود VARCHAR + CHECK لضمان التوافق عبر الإصدارات:

-- (خيار A) عمود VARCHAR مع CHECK:
-- لاحقًا سننشئ الجدول ContractPayment ونضيف CHECK على status.

-- 6) جدول الدفعات الجديدة
CREATE TABLE IF NOT EXISTS `ContractPayment` (
`id` INT NOT NULL AUTO_INCREMENT,
`contractId` INT NOT NULL,
`stageId` INT NULL,
`amount` DECIMAL(12,2) NOT NULL,
`currency` VARCHAR(16) NOT NULL DEFAULT 'AED',
`dueDate` DATETIME NULL,
`status` VARCHAR(16) NOT NULL DEFAULT 'NOT_DUE', -- TRANSFERRED | RECEIVED | DUE | NOT_DUE
`reference` VARCHAR(191) NULL,
`note` TEXT NULL,
`createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
KEY `ContractPayment_contractId_idx` (`contractId`),
KEY `ContractPayment_stageId_idx` (`stageId`),
KEY `ContractPayment_status_dueDate_idx` (`status`,`dueDate`),
CONSTRAINT `ContractPayment_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
CONSTRAINT `ContractPayment_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `ContractStage` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
CONSTRAINT `ContractPayment_status_ck` CHECK (`status` IN ('TRANSFERRED','RECEIVED','DUE','NOT_DUE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7) جدول صور المخططات الخاصة بالعقد
CREATE TABLE IF NOT EXISTS `ContractDrawing` (
`id` INT NOT NULL AUTO_INCREMENT,
`contractId` INT NOT NULL,
`url` VARCHAR(1024) NOT NULL,
`fileName` VARCHAR(255) NULL,
`mimeType` VARCHAR(191) NULL,
`sizeBytes` INT NULL,
`uploadedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
`uploadedById` INT NULL,
PRIMARY KEY (`id`),
KEY `ContractDrawing_contractId_idx` (`contractId`),
CONSTRAINT `ContractDrawing_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8) جدول البنود الخاصة ثنائية اللغة
CREATE TABLE IF NOT EXISTS `ContractSpecialItem` (
`id` INT NOT NULL AUTO_INCREMENT,
`contractId` INT NOT NULL,
`labelAr` VARCHAR(512) NOT NULL,
`labelEn` VARCHAR(512) NULL,
PRIMARY KEY (`id`),
KEY `ContractSpecialItem_contractId_idx` (`contractId`),
CONSTRAINT `ContractSpecialItem_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- انتهى
CREATE TABLE IF NOT EXISTS `SiteUtility` (
`id` INT NOT NULL DEFAULT 1,
`pdfFrame` VARCHAR(1024) NULL,
`pdfHeader` VARCHAR(1024) NULL,
`updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `ContractStage`
ADD COLUMN `startDate` DATETIME NULL,
ADD COLUMN `endDate` DATETIME NULL;

ALTER TABLE `ContractPayment`
ADD COLUMN `projectId` INT NULL,
ADD COLUMN `paymentCondition` VARCHAR(100) NULL,
ADD INDEX `idx_contractpayment_projectId` (`projectId`),
ADD CONSTRAINT `fk_contractpayment_project`
FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`)
ON UPDATE CASCADE
ON DELETE SET NULL;

-- Only after verifying every row has contractId
ALTER TABLE `Project`
ADD COLUMN `contractId` INT NULL,
ADD INDEX `idx_project_contractId` (`contractId`),
ADD CONSTRAINT `fk_project_contract`
FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`)
ON UPDATE CASCADE
ON DELETE SET NULL;

DROP TABLE IF EXISTS `ContractProject`;

ALTER TABLE `ContractStage`
ADD COLUMN `stageStatus`
ENUM('NOT_STARTED','IN_PROGRESS','COMPLETED')
NOT NULL DEFAULT 'NOT_STARTED',
ADD INDEX `idx_contractstage_stageStatus` (`stageStatus`);

ALTER TABLE `Contract`
ADD COLUMN `status` ENUM('IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS';

ALTER TABLE ContractSpecialItem
MODIFY COLUMN labelAr TEXT NOT NULL,
MODIFY COLUMN labelEn TEXT NULL;

ALTER TABLE `Contract`
ADD COLUMN `taxRate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
ADD COLUMN `amount` DECIMAL(12,2),
ADD COLUMN `totalAmount` DECIMAL(12,2)
AS (amount + (amount \* taxRate / 100)) STORED;

ALTER TABLE Contract
ADD COLUMN projectGroupId INT NULL;
ALTER TABLE `Contract`
ADD COLUMN `arToken` VARCHAR(64) NULL,
ADD COLUMN `enToken` VARCHAR(64) NULL;

ALTER TABLE `contract`
ADD INDEX idx_contract_clientLeadId_contractLevel (`clientLeadId`,`contractLevel`),
DROP INDEX `unique_contract_combo`;
