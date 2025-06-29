-- From clientimagesessionspace
ALTER TABLE clientimagesessionspace DROP FOREIGN KEY clientimagesessionspace_ibfk_1;
ALTER TABLE clientimagesessionspace DROP FOREIGN KEY clientimagesessionspace_ibfk_2;

-- From clientselectedimage
ALTER TABLE clientselectedimage DROP FOREIGN KEY clientselectedimage_ibfk_1;
ALTER TABLE clientselectedimage DROP FOREIGN KEY clientselectedimage_ibfk_2;

-- From note
ALTER TABLE note DROP FOREIGN KEY note_ibfk_3;
ALTER TABLE note DROP FOREIGN KEY note_ibfk_4;

-- From \_clientimagesessiontocolorpattern (many-to-many pivot table)
ALTER TABLE \_clientimagesessiontocolorpattern DROP FOREIGN KEY \_clientimagesessiontocolorpattern_ibfk_1;
ALTER TABLE \_clientimagesessiontocolorpattern DROP FOREIGN KEY \_clientimagesessiontocolorpattern_ibfk_2;

-- From \_colorpatterntoimage (many-to-many pivot table)
ALTER TABLE \_colorpatterntoimage DROP FOREIGN KEY \_colorpatterntoimage_ibfk_1;
ALTER TABLE \_colorpatterntoimage DROP FOREIGN KEY \_colorpatterntoimage_ibfk_2;

-- From \_imagetospace (many-to-many pivot table)
ALTER TABLE \_imagetospace DROP FOREIGN KEY \_imagetospace_ibfk_1;
ALTER TABLE \_imagetospace DROP FOREIGN KEY \_imagetospace_ibfk_2;

-- Drop columns in Note
ALTER TABLE Note
DROP COLUMN imageSessionId,
DROP COLUMN selectedImageId;

-- Drop relation in User
-- If you're storing a relation like JSON or link table, handle accordingly.
-- Otherwise, skip if there's no column.

-- Drop relation in ClientLead
-- If imageSessions used a separate table and not a direct column, skip.

DROP TABLE IF EXISTS
ClientSelectedImage,
ClientImageSessionSpace,
ClientImageSession,
ColorPattern,
Space,
Image;

DROP TABLE IF EXISTS `_ClientImageSessionToColorPattern`;
DROP TABLE IF EXISTS `_ColorPatternToImage`;
DROP TABLE IF EXISTS `_ImageToSpace`;

-- Create the Language table
CREATE TABLE Language (
id INT PRIMARY KEY AUTO_INCREMENT,
code VARCHAR(255) UNIQUE NOT NULL,
name VARCHAR(255) NOT NULL,
isArchived BOOLEAN NOT NULL DEFAULT 0
);

-- Create the Material table
CREATE TABLE Material (
id INT PRIMARY KEY AUTO_INCREMENT,
imageUrl VARCHAR(255),
isArchived BOOLEAN DEFAULT FALSE,
createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Create the Style table
CREATE TABLE Style (
id INT PRIMARY KEY AUTO_INCREMENT,
imageUrl VARCHAR(255),
isArchived BOOLEAN DEFAULT FALSE,
createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Create the ColorPattern table
CREATE TABLE ColorPattern (
id INT PRIMARY KEY AUTO_INCREMENT,
background VARCHAR(255),
`order` INT DEFAULT 0,
isArchived BOOLEAN DEFAULT FALSE,
createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Create the ColorPatternColor table
CREATE TABLE ColorPatternColor (
id INT PRIMARY KEY AUTO_INCREMENT,
colorHex VARCHAR(255) NOT NULL,
isEditableByClient BOOLEAN DEFAULT FALSE,
colorPatternId INT NOT NULL,
FOREIGN KEY (colorPatternId) REFERENCES ColorPattern(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create the Space table
CREATE TABLE Space (
id INT PRIMARY KEY AUTO_INCREMENT,
nameEn VARCHAR(255) NOT NULL,
nameAr VARCHAR(255) NOT NULL,
isArchived BOOLEAN DEFAULT FALSE,
createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Create the PageInfo table
CREATE TABLE PageInfo (
id INT PRIMARY KEY AUTO_INCREMENT,
type ENUM('BEFORE_PATTERN', 'BEFORE_MATERIAL', 'BEFORE_STYLE') NOT NULL,
isArchived BOOLEAN DEFAULT FALSE,
createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

-- Create the Pro table
CREATE TABLE Pro (
id INT PRIMARY KEY AUTO_INCREMENT,
materialId INT,
styleId INT,
FOREIGN KEY (materialId) REFERENCES Material(id) ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY (styleId) REFERENCES Style(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create the Con table
CREATE TABLE Con (
id INT PRIMARY KEY AUTO_INCREMENT,
materialId INT,
styleId INT,
FOREIGN KEY (materialId) REFERENCES Material(id) ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY (styleId) REFERENCES Style(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create the DesignImage table
CREATE TABLE DesignImage (
id INT PRIMARY KEY AUTO_INCREMENT,
imageUrl VARCHAR(255) NOT NULL,
styleId INT NOT NULL,
isArchived BOOLEAN DEFAULT FALSE,
createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
FOREIGN KEY (styleId) REFERENCES Style(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create the DesignImageSpace table (junction table)
CREATE TABLE DesignImageSpace (
id INT PRIMARY KEY AUTO_INCREMENT,
designImageId INT NOT NULL,
spaceId INT NOT NULL,
FOREIGN KEY (designImageId) REFERENCES DesignImage(id) ON DELETE RESTRICT ON UPDATE CASCADE,
FOREIGN KEY (spaceId) REFERENCES Space(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create the TemplateBlock table

CREATE TABLE TemplateBlock (
id INT PRIMARY KEY AUTO_INCREMENT,
type ENUM('COLOR_PATTERN', 'MATERIAL', 'STYLE') NOT NULL,
`order` INT NOT NULL,
showTitle BOOLEAN DEFAULT TRUE,
showImage BOOLEAN DEFAULT TRUE,
showPros BOOLEAN DEFAULT FALSE,
showCons BOOLEAN DEFAULT FALSE,
showColors BOOLEAN DEFAULT FALSE,
showDescription BOOLEAN DEFAULT FALSE,
isArchived BOOLEAN DEFAULT FALSE,
blurValue INT DEFAULT 0 -- Added new column with a default value of 0
);

-- Create the ClientImageSession table
CREATE TABLE ClientImageSession (
id INT PRIMARY KEY AUTO_INCREMENT,
token VARCHAR(255) UNIQUE NOT NULL,
clientLeadId INT NOT NULL,
createdById INT NOT NULL,
selectedSpaceId INT,
colorPatternId INT,
materialId INT,
styleId INT,
customColors JSON,
signatureUrl VARCHAR(255),
submittedAt DATETIME(3),
isArchived BOOLEAN DEFAULT FALSE,
createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
FOREIGN KEY (clientLeadId) REFERENCES ClientLead(id) ON DELETE RESTRICT ON UPDATE CASCADE,
FOREIGN KEY (createdById) REFERENCES User(id) ON DELETE RESTRICT ON UPDATE CASCADE,
FOREIGN KEY (selectedSpaceId) REFERENCES Space(id) ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY (colorPatternId) REFERENCES ColorPattern(id) ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY (materialId) REFERENCES Material(id) ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY (styleId) REFERENCES Style(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create the ClientSelectedImage table
CREATE TABLE ClientSelectedImage (
id INT PRIMARY KEY AUTO_INCREMENT,
imageSessionId INT NOT NULL,
designImageId INT NOT NULL,
createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
FOREIGN KEY (imageSessionId) REFERENCES ClientImageSession(id) ON DELETE RESTRICT ON UPDATE CASCADE,
FOREIGN KEY (designImageId) REFERENCES DesignImage(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 1: Add the columns
ALTER TABLE Note
ADD COLUMN imageSessionId INT,
ADD COLUMN selectedImageId INT;

-- Step 2: Add the foreign key constraints
ALTER TABLE Note
ADD CONSTRAINT fk_note_image_session
FOREIGN KEY (imageSessionId) REFERENCES ClientImageSession(id),
ADD CONSTRAINT fk_note_selected_image
FOREIGN KEY (selectedImageId) REFERENCES ClientSelectedImage(id);

-- Now, create the tables that depend on others, with their columns defined.
CREATE TABLE TextShort (
id INT PRIMARY KEY AUTO_INCREMENT,
text VARCHAR(255) NOT NULL,
languageId INT NOT NULL,
materialId INT,
styleId INT,
colorPatternId INT,
pageInfoId INT,
FOREIGN KEY (languageId) REFERENCES Language(id) ON DELETE RESTRICT ON UPDATE CASCADE,
FOREIGN KEY (materialId) REFERENCES Material(id) ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY (styleId) REFERENCES Style(id) ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY (colorPatternId) REFERENCES ColorPattern(id) ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY (pageInfoId) REFERENCES PageInfo(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE TextLong (
id INT PRIMARY KEY AUTO_INCREMENT,
content TEXT NOT NULL,
languageId INT NOT NULL,
materialId INT,
styleId INT,
colorPatternId INT,
proId INT,
conId INT,
pageInfoId INT,
FOREIGN KEY (languageId) REFERENCES Language(id) ON DELETE RESTRICT ON UPDATE CASCADE,
FOREIGN KEY (materialId) REFERENCES Material(id) ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY (styleId) REFERENCES Style(id) ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY (colorPatternId) REFERENCES ColorPattern(id) ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY (proId) REFERENCES Pro(id) ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY (conId) REFERENCES Con(id) ON DELETE SET NULL ON UPDATE CASCADE,
FOREIGN KEY (pageInfoId) REFERENCES PageInfo(id) ON DELETE SET NULL ON UPDATE CASCADE
);

// extra if text long didnt work by proId and conId

-- Add the proId column
ALTER TABLE `TextLong` ADD COLUMN `proId` INT;

-- Add the conId column
ALTER TABLE `TextLong` ADD COLUMN `conId` INT;

-- Add the foreign key constraint for proId
ALTER TABLE `TextLong` ADD CONSTRAINT `fk_textlong_pro`
FOREIGN KEY (`proId`) REFERENCES `Pro`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add the foreign key constraint for conId
ALTER TABLE `TextLong` ADD CONSTRAINT `fk_textlong_con`
FOREIGN KEY (`conId`) REFERENCES `Con`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add the spaceId column to the TextShort table to link it to the Space model.
ALTER TABLE `TextShort` ADD COLUMN `spaceId` INT;

-- Add the foreign key constraint to establish the relation.
ALTER TABLE `TextShort` ADD CONSTRAINT `fk_textshort_space_title`
FOREIGN KEY (`spaceId`) REFERENCES `Space`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop the old name columns from the Space table.
ALTER TABLE `Space` DROP COLUMN `nameEn`;
ALTER TABLE `Space` DROP COLUMN `nameAr`;
