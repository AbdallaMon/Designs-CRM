-- 1) New table (if not created yet)
CREATE TABLE `ContractPaymentCondition` (
`id` INT AUTO_INCREMENT PRIMARY KEY,
`conditionType` VARCHAR(255) NOT NULL,
`condition` VARCHAR(255) NOT NULL,
`labelAr` VARCHAR(255) NOT NULL,
`labelEn` VARCHAR(255) NOT NULL,
`createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
UNIQUE KEY `ContractPaymentCondition_unique_business_key`
(`conditionType`,`condition`,`labelAr`,`labelEn`)
);

-- 2) Add FK to payments
ALTER TABLE `ContractPayment`
ADD COLUMN `conditionId` INT NULL,
ADD INDEX `ContractPayment_conditionId_idx` (`conditionId`),
ADD CONSTRAINT `ContractPayment_conditionId_fkey`
FOREIGN KEY (`conditionId`) REFERENCES `ContractPaymentCondition`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Client`
ADD COLUMN `arName` VARCHAR(255) NULL AFTER `name`,
ADD COLUMN `enName` VARCHAR(255) NULL AFTER `arName`;
