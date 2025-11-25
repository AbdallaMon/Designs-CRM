<!-- CREATE TABLE `AutoAssignment` (
`id` INT NOT NULL AUTO_INCREMENT,
`userId` INT NOT NULL,
`type` VARCHAR(191) NOT NULL,
`isActive` BOOLEAN NOT NULL DEFAULT 1,
`createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

PRIMARY KEY (`id`),
UNIQUE KEY `AutoAssignment_userId_type_key` (`userId`, `type`),
KEY `AutoAssignment_userId_idx` (`userId`),

CONSTRAINT `AutoAssignment_userId_fkey`
FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
ON DELETE CASCADE
ON UPDATE CASCADE
) DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci; -->

CREATE TABLE `ContractUtility` (
`id` INT NOT NULL,
`obligationsPartyOneAr` TEXT NOT NULL,
`obligationsPartyOneEn` TEXT NOT NULL,
`obligationsPartyTwoAr` TEXT NOT NULL,
`obligationsPartyTwoEn` TEXT NOT NULL,
`updatedAt` DATETIME(3) NOT NULL
DEFAULT CURRENT_TIMESTAMP(3)
ON UPDATE CURRENT_TIMESTAMP(3),
PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ContractStageClauseTemplate` (
`id` INT NOT NULL AUTO_INCREMENT,
`contractUtilityId` INT NOT NULL,

`headingAr` VARCHAR(255) NOT NULL,
`headingEn` VARCHAR(255) NOT NULL,
`titleAr` VARCHAR(255) NOT NULL,
`titleEn` VARCHAR(255) NOT NULL,

`descriptionAr` TEXT NOT NULL,
`descriptionEn` TEXT NOT NULL,

`order` INT NOT NULL DEFAULT 0,

PRIMARY KEY (`id`),
INDEX `ContractStageClauseTemplate_contractUtilityId_idx` (`contractUtilityId`),
CONSTRAINT `ContractStageClauseTemplate_contractUtilityId_fkey`
FOREIGN KEY (`contractUtilityId`)
REFERENCES `ContractUtility`(`id`)
ON DELETE RESTRICT
ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ContractSpecialClauseTemplate` (
`id` INT NOT NULL AUTO_INCREMENT,
`contractUtilityId` INT NOT NULL,

`textAr` TEXT NOT NULL,
`textEn` TEXT NULL,

`order` INT NOT NULL DEFAULT 0,
`isActive` BOOLEAN NOT NULL DEFAULT TRUE,

PRIMARY KEY (`id`),
INDEX `ContractSpecialClauseTemplate_contractUtilityId_idx` (`contractUtilityId`),
CONSTRAINT `ContractSpecialClauseTemplate_contractUtilityId_fkey`
FOREIGN KEY (`contractUtilityId`)
REFERENCES `ContractUtility`(`id`)
ON DELETE RESTRICT
ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ContractLevelClauseTemplate` (
`id` INT NOT NULL AUTO_INCREMENT,
`contractUtilityId` INT NOT NULL,

`level` ENUM(
'LEVEL_1',
'LEVEL_2',
'LEVEL_3',
'LEVEL_4',
'LEVEL_5',
'LEVEL_6',
'LEVEL_7'
) NOT NULL,

`textAr` TEXT NOT NULL,
`textEn` TEXT NULL,

`order` INT NOT NULL DEFAULT 0,
`isActive` BOOLEAN NOT NULL DEFAULT TRUE,

PRIMARY KEY (`id`),
INDEX `ContractLevelClauseTemplate_contractUtilityId_idx` (`contractUtilityId`),
INDEX `ContractLevelClauseTemplate_level_idx` (`level`),
CONSTRAINT `ContractLevelClauseTemplate_contractUtilityId_fkey`
FOREIGN KEY (`contractUtilityId`)
REFERENCES `ContractUtility`(`id`)
ON DELETE RESTRICT
ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
