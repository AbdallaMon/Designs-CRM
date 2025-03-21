ALTER TABLE User MODIFY COLUMN role ENUM(
'ADMIN',
'STAFF',
'THREE_D_DESIGNER',
'TWO_D_DESIGNER',
'TWO_D_EXECUTOR',
'ACCOUNTANT',
'SUPER_ADMIN'
) NOT NULL DEFAULT 'STAFF';

CREATE TABLE UserLog (
id INT AUTO_INCREMENT PRIMARY KEY,
userId INT NOT NULL,
date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Track daily logs
totalMinutes INT NOT NULL DEFAULT 0, -- Track minutes spent

UNIQUE KEY idx_user_date (userId, date), -- Ensure one entry per user per day
INDEX idx_user (userId),
CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

ALTER TABLE User ADD COLUMN hasLogs BOOLEAN DEFAULT FALSE;

ALTER TABLE ClientLead
ADD COLUMN threeDWorkStage ENUM(
'CLIENT_COMMUNICATION',
'DESIGN_STAGE',
'THREE_D_STAGE',
'THREE_D_APPROVAL'
) NULL,
ADD COLUMN twoDWorkStage ENUM(
'DRAWING_PLAN',
'FINAL_DELIVERY'
) NULL;

ALTER TABLE ClientLead
ADD COLUMN threeDDesignerId INT NULL,
ADD COLUMN twoDDesignerId INT NULL,
ADD COLUMN accountantId INT NULL,
ADD CONSTRAINT fk_threeDDesigner FOREIGN KEY (threeDDesignerId) REFERENCES User(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_twoDDesigner FOREIGN KEY (twoDDesignerId) REFERENCES User(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_accountant FOREIGN KEY (accountantId) REFERENCES User(id) ON DELETE SET NULL;

CREATE TABLE ExtraService (
id INT AUTO_INCREMENT PRIMARY KEY,
clientLeadId INT NOT NULL,
price DECIMAL(10,2) NOT NULL,
note TEXT NULL,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (clientLeadId) REFERENCES ClientLead(id) ON DELETE CASCADE
);

ALTER TABLE ClientLead
ADD COLUMN paymentStatus ENUM(
'PENDING',
'PARTIALLY_PAID',
'FULLY_PAID',
'OVERDUE'
) DEFAULT 'PENDING';

CREATE TABLE Payment (
id INT AUTO_INCREMENT PRIMARY KEY,
clientLeadId INT NOT NULL,
status ENUM('PENDING', 'PARTIALLY_PAID', 'FULLY_PAID','OVERDUE') DEFAULT 'PENDING',
amount DECIMAL(10,2) NOT NULL,
amountPaid DECIMAL(10,2) DEFAULT 0,
amountLeft DECIMAL(10,2) NOT NULL,
dueDate DATETIME NOT NULL,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (clientLeadId) REFERENCES ClientLead(id) ON DELETE CASCADE
);

CREATE TABLE Invoice (
id INT AUTO_INCREMENT PRIMARY KEY,
paymentId INT NOT NULL,
issuedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
amount DECIMAL(10,2) NOT NULL,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (paymentId) REFERENCES Payment(id) ON DELETE CASCADE
);

ALTER TABLE Notification
MODIFY COLUMN type ENUM(
'NEW_LEAD',
'LEAD_ASSIGNED',
'LEAD_STATUS_CHANGE',
'LEAD_TRANSFERRED',
'LEAD_UPDATED',
'LEAD_CONTACT',
'NOTE_ADDED',
'NEW_NOTE',
'NEW_FILE',
'CALL_REMINDER_CREATED',
'CALL_REMINDER_STATUS',
'PRICE_OFFER_SUBMITTED',
'PRICE_OFFER_UPDATED',
'FINAL_PRICE_ADDED',
'FINAL_PRICE_CHANGED',
'PAYMENT_ADDED', -- New payment recorded
'PAYMENT_STATUS_UPDATED', -- Payment status updated
'EXTRA_FINAL_PRICE_ADDED', -- Extra final price added
'EXTRA_FINAL_PRICE_EDITED', -- Extra final price edited
'WORK_STAGE_UPDATED', -- Work stage updated for 3D or 2D
'OTHER'
) NOT NULL;

ALTER TABLE Payment
ADD COLUMN paymentReason TEXT NULL;

ALTER TABLE ClientLead
ADD COLUMN threeDAssignedAt DATETIME NULL,
ADD COLUMN twoDAssignedAt DATETIME NULL,
ADD COLUMN accountantAssignedAt DATETIME NULL;

ALTER TABLE Invoice
ADD CONSTRAINT fk_payment_id
FOREIGN KEY (paymentId) REFERENCES Payment(id)
ON DELETE CASCADE;

ALTER TABLE Invoice ADD COLUMN invoiceNumber VARCHAR(20) UNIQUE;

CREATE TABLE UserSubRole (
id INT AUTO_INCREMENT PRIMARY KEY,
userId INT NOT NULL,
subRole ENUM('ADMIN', 'STAFF', 'THREE_D_DESIGNER', 'TWO_D_DESIGNER', 'ACCOUNTANT', 'SUPER_ADMIN') NOT NULL,
UNIQUE (userId, subRole),
FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE BaseEmployeeSalary (
id INT AUTO_INCREMENT PRIMARY KEY,
userId INT NOT NULL,
baseSalary DECIMAL(10, 2) NOT NULL,
taxRate DECIMAL(5, 2) NOT NULL,
baseWorkHours INT NOT NULL,
notes TEXT,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);
CREATE TABLE Outcome (
id INT AUTO_INCREMENT PRIMARY KEY,
type VARCHAR(50) NULL, -- E.g., "Salary", "Rent", "Operational Expense"
amount DECIMAL(10, 2),
description TEXT NULL,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE MonthlySalary (
id INT AUTO_INCREMENT PRIMARY KEY,
userId INT NOT NULL,
baseSalaryId INT NOT NULL,
totalHoursWorked INT NOT NULL,
overtimeHours INT DEFAULT 0,
bonuses DECIMAL(10, 2) DEFAULT 0,
deductions DECIMAL(10, 2) DEFAULT 0,
netSalary DECIMAL(10, 2) NOT NULL,
isFulfilled BOOLEAN DEFAULT FALSE,
paymentDate DATETIME,
outcomeId INT,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
FOREIGN KEY (baseSalaryId) REFERENCES BaseEmployeeSalary(id) ON DELETE CASCADE,
FOREIGN KEY (outcomeId) REFERENCES Outcome(id) ON DELETE SET NULL
);
CREATE TABLE Rent (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(255) NOT NULL,
description TEXT,
amount DECIMAL(10, 2) NOT NULL,
startDate DATETIME NOT NULL,
endDate DATETIME NOT NULL,
renewalDate DATETIME NOT NULL,
notes TEXT,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE OperationalExpenses (
id INT AUTO_INCREMENT PRIMARY KEY,
category VARCHAR(255) NOT NULL,
description TEXT,
amount DECIMAL(10, 2) NOT NULL,
paymentDate DATETIME NOT NULL,
notes TEXT,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE User
ADD COLUMN baseSalaryId INT,
ADD COLUMN monthlySalaryId INT,
ADD FOREIGN KEY (baseSalaryId) REFERENCES BaseEmployeeSalary(id) ON DELETE SET NULL,
ADD FOREIGN KEY (monthlySalaryId) REFERENCES MonthlySalary(id) ON DELETE SET NULL;

ALTER TABLE Payment
DROP COLUMN dueDate,
ADD COLUMN paymentLevel ENUM('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5', 'LEVEL_6', 'LEVEL_7_OR_MORE') NULL;

ALTER TABLE Rent
ADD COLUMN outcomeId INT,
ADD FOREIGN KEY (outcomeId) REFERENCES Outcome(id) ON DELETE SET NULL;

CREATE INDEX idx_user_email ON User(email);
CREATE INDEX idx_monthlySalary_userId ON MonthlySalary(userId);
ALTER TABLE BaseEmployeeSalary
ADD CONSTRAINT UNIQUE (userId);

ALTER TABLE BaseEmployeeSalary
ADD CONSTRAINT fk_userId FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE;

ALTER TABLE Payment
MODIFY COLUMN paymentLevel VARCHAR(255) NULL;

ALTER TABLE BaseEmployeeSalary
DROP COLUMN taxRate,
ADD COLUMN taxAmount DECIMAL(10, 2) DEFAULT 0;

-- Step 1: Drop the old tables (if they exist)
DROP TABLE IF EXISTS Rent;
DROP TABLE IF EXISTS OperationalExpenses;
DROP TABLE IF EXISTS RentPeriod;

-- Step 2: Recreate the Rent table with the new structure
CREATE TABLE Rent (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(255) NOT NULL,
description TEXT,
notes TEXT,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Step 3: Recreate the RentPeriod table with the new structure and relation to Rent
CREATE TABLE RentPeriod (
id INT AUTO_INCREMENT PRIMARY KEY,
rentId INT,
startDate DATETIME,
endDate DATETIME,
amount DECIMAL(10, 2),
isPaid BOOLEAN DEFAULT FALSE,
notes TEXT,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
outcomeId INT,
FOREIGN KEY (rentId) REFERENCES Rent(id),
FOREIGN KEY (outcomeId) REFERENCES Outcome(id) ON DELETE SET NULL
);

-- Step 4: Recreate the OperationalExpenses table with the new structure and optional Outcome relation
CREATE TABLE OperationalExpenses (
id INT AUTO_INCREMENT PRIMARY KEY,
category VARCHAR(255) NOT NULL,
description TEXT,
amount DECIMAL(10, 2),
paymentDate DATETIME,
paymentStatus VARCHAR(50) DEFAULT 'PENDING',
notes TEXT,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
outcomeId INT,
FOREIGN KEY (outcomeId) REFERENCES Outcome(id) ON DELETE SET NULL
);

-- Step 1: Modify the Outcome table by adding new columns
ALTER TABLE Outcome
ADD COLUMN rentPeriods INT NULL,  
ADD COLUMN operationalExpenses INT NULL;

ALTER TABLE Outcome
ADD COLUMN monthlySalaries INT NULL;

// dublicate
-- Step 2: Optionally, add foreign key constraints if needed
ALTER TABLE Outcome
ADD CONSTRAINT fk_rent_period FOREIGN KEY (rentPeriods) REFERENCES RentPeriod(id);

ALTER TABLE Outcome
ADD CONSTRAINT fk_operational_expense FOREIGN KEY (operationalExpenses) REFERENCES OperationalExpenses(id);

CREATE INDEX idx_monthly_salaries ON Outcome (monthlySalaries);

ALTER TABLE Outcome
ADD CONSTRAINT fk_monthly_salaries FOREIGN KEY (monthlySalaries) REFERENCES MonthlySalary(id);

error here

-- Add the twoDExacuterId field to the ClientLead table
ALTER TABLE `ClientLead`
ADD COLUMN `twoDExacuterId` INT NULL;

-- Add the twoDExacuterAssignedAt timestamp
ALTER TABLE `ClientLead`
ADD COLUMN `twoDExacuterAssignedAt` DATETIME NULL;

-- Add the twoDExacuterStage enum field
ALTER TABLE `ClientLead`
ADD COLUMN `twoDExacuterStage` ENUM('PROGRESS', 'PRICING', 'ACCEPTED', 'REJECTED') NULL;

-- Add the cost fields
ALTER TABLE `ClientLead`
ADD COLUMN `ourCost` VARCHAR(255) NULL;
ALTER TABLE `ClientLead`
ADD COLUMN `contractorCost` VARCHAR(255) NULL;

-- Add foreign key constraint for twoDExacuterId
ALTER TABLE `ClientLead`
ADD CONSTRAINT `ClientLead_twoDExacuterId_fkey` FOREIGN KEY (`twoDExacuterId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for better performance (optional)
CREATE INDEX `ClientLead_twoDExacuterId_idx` ON `ClientLead` (`twoDExacuterId`);

-- Modify ThreeDWorkStage enum to add three new items
ALTER TABLE `ClientLead` MODIFY COLUMN `threeDWorkStage` ENUM(
'CLIENT_COMMUNICATION',
'DESIGN_STAGE',
'THREE_D_STAGE',
'THREE_D_APPROVAL',
'FIRST_MODIFICATION',
'SECOND_MODIFICATION',
'THIRD_MODIFICATION'
) NULL;

-- Modify TwoDWorkStage enum to add quantity
ALTER TABLE `ClientLead` MODIFY COLUMN `twoDWorkStage` ENUM(
'DRAWING_PLAN',
'FINAL_DELIVERY',
'QUANTITY'
) NULL;

-- Step 1: Make clientLeadId nullable in Note table
ALTER TABLE `Note` MODIFY COLUMN `clientLeadId` INT NULL;

-- Step 2: Add new foreign keys to Note table
ALTER TABLE `Note`
ADD COLUMN `baseEmployeeSalaryId` INT NULL,
ADD COLUMN `rentId` INT NULL,
ADD COLUMN `rentPeriodId` INT NULL,
ADD COLUMN `operationalExpensesId` INT NULL,
ADD COLUMN `paymentId` INT NULL;

-- Step 3: Add indexes for the new foreign keys
CREATE INDEX `Note_baseEmployeeSalaryId_idx` ON `Note` (`baseEmployeeSalaryId`);
CREATE INDEX `Note_rentId_idx` ON `Note` (`rentId`);
CREATE INDEX `Note_rentPeriodId_idx` ON `Note` (`rentPeriodId`);
CREATE INDEX `Note_operationalExpensesId_idx` ON `Note` (`operationalExpensesId`);
CREATE INDEX `Note_paymentId_idx` ON `Note` (`paymentId`);

-- Step 4: Add foreign key constraints
ALTER TABLE `Note`
ADD CONSTRAINT `Note_baseEmployeeSalaryId_fkey` FOREIGN KEY (`baseEmployeeSalaryId`) REFERENCES `BaseEmployeeSalary` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT `Note_rentId_fkey` FOREIGN KEY (`rentId`) REFERENCES `Rent` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT `Note_rentPeriodId_fkey` FOREIGN KEY (`rentPeriodId`) REFERENCES `RentPeriod` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT `Note_operationalExpensesId_fkey` FOREIGN KEY (`operationalExpensesId`) REFERENCES `OperationalExpenses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT `Note_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 2: Remove the `userId` column from the `MonthlySalary` table
ALTER TABLE MonthlySalary DROP FOREIGN KEY monthlysalary_ibfk_1;

ALTER TABLE MonthlySalary
DROP COLUMN userId;
