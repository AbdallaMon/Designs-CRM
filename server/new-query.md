ALTER TABLE `Note`
ADD COLUMN `invoiceId` INT;

ALTER TABLE `Note`
ADD CONSTRAINT `FK_Invoice_Notes`
FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`);

CREATE INDEX `IDX_Invoice_Notes` ON `Note`(`invoiceId`);

ALTER TABLE `Note`
MODIFY COLUMN `content` TEXT NULL;

ALTER TABLE `Note`
ADD COLUMN `attachment` TEXT NULL;

ALTER TABLE `User` ADD COLUMN `notAllowedCountries` JSON NULL;
ALTER TABLE PriceOffers
ADD COLUMN isAccepted BOOLEAN DEFAULT FALSE;

ALTER TABLE UserLog DROP INDEX idx_user_date;

ALTER TABLE UserLog ADD COLUMN description TEXT;
ALTER TABLE UserLog MODIFY COLUMN description TEXT NULL;
