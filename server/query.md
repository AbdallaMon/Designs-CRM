-- Image Table
CREATE TABLE Image (
id INT AUTO_INCREMENT PRIMARY KEY,
url TEXT NOT NULL,
isArchived BOOLEAN DEFAULT FALSE,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Space Table
CREATE TABLE Space (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(255) NOT NULL,
avatarUrl TEXT,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ColorPattern Table
CREATE TABLE ColorPattern (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(255) NOT NULL,
avatarUrl TEXT,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ClientImageSession Table
CREATE TABLE ClientImageSession (
id INT AUTO_INCREMENT PRIMARY KEY,
clientLeadId INT NOT NULL,
userId INT,
token VARCHAR(255) NOT NULL UNIQUE,
sessionStatus ENUM('IN_PROGRESS', 'DONE') DEFAULT 'IN_PROGRESS',
signature TEXT,
pdfUrl TEXT,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (clientLeadId) REFERENCES ClientLead(id) ON DELETE CASCADE,
FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL
);

-- ClientImageSessionSpace (many-to-many session ↔ space)
CREATE TABLE ClientImageSessionSpace (
id INT AUTO_INCREMENT PRIMARY KEY,
sessionId INT NOT NULL,
spaceId INT NOT NULL,
FOREIGN KEY (sessionId) REFERENCES ClientImageSession(id) ON DELETE CASCADE,
FOREIGN KEY (spaceId) REFERENCES Space(id) ON DELETE CASCADE
);

-- ClientSelectedImage (many-to-many session ↔ image)
CREATE TABLE ClientSelectedImage (
id INT AUTO_INCREMENT PRIMARY KEY,
sessionId INT NOT NULL,
imageId INT NOT NULL,
FOREIGN KEY (sessionId) REFERENCES ClientImageSession(id) ON DELETE CASCADE,
FOREIGN KEY (imageId) REFERENCES Image(id) ON DELETE CASCADE
);

-- Join Table: Image <-> Space (generated from Prisma many-to-many)
CREATE TABLE \_ImageToSpace (
A INT NOT NULL,
B INT NOT NULL,
PRIMARY KEY (A, B),
FOREIGN KEY (A) REFERENCES Image(id) ON DELETE CASCADE,
FOREIGN KEY (B) REFERENCES Space(id) ON DELETE CASCADE
);

-- Join Table: Image <-> ColorPattern (generated from Prisma many-to-many)
CREATE TABLE \_ColorPatternToImage (
A INT NOT NULL,
B INT NOT NULL,
PRIMARY KEY (A, B),
FOREIGN KEY (A) REFERENCES ColorPattern(id) ON DELETE CASCADE,
FOREIGN KEY (B) REFERENCES Image(id) ON DELETE CASCADE
);

-- Join Table: ClientImageSession <-> ColorPattern (preferred patterns)
CREATE TABLE \_ClientImageSessionToColorPattern (
A INT NOT NULL,
B INT NOT NULL,
PRIMARY KEY (A, B),
FOREIGN KEY (A) REFERENCES ClientImageSession(id) ON DELETE CASCADE,
FOREIGN KEY (B) REFERENCES ColorPattern(id) ON DELETE CASCADE
);

-- Extend Notes with relations to session and selected image
ALTER TABLE Note
ADD COLUMN imageSessionId INT,
ADD COLUMN selectedImageId INT,
ADD INDEX idx_imageSessionId (imageSessionId),
ADD INDEX idx_selectedImageId (selectedImageId),
ADD FOREIGN KEY (imageSessionId) REFERENCES ClientImageSession(id) ON DELETE SET NULL,
ADD FOREIGN KEY (selectedImageId) REFERENCES ClientSelectedImage(id) ON DELETE SET NULL;
