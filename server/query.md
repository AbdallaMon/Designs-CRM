

ALTER TABLE Contract
ADD COLUMN isCompleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE Contract
ADD COLUMN isInProgress BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE User MODIFY role ENUM(
    'ADMIN',
    'STAFF',
    'THREE_D_DESIGNER',
    'TWO_D_DESIGNER',
    'TWO_D_EXECUTOR',
    'ACCOUNTANT',
    'SUPER_ADMIN',
    'SUPER_SALES',
    'CONTACT_INITIATOR'
) DEFAULT 'STAFF';

CREATE TABLE CompletedTest (
    id INT AUTO_INCREMENT PRIMARY KEY,
    courseProgressId INT NOT NULL,
    testId INT NOT NULL,
    completedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (courseProgressId) REFERENCES CourseProgress(id)
);

CREATE INDEX idx_courseProgressId ON CompletedTest(courseProgressId);
CREATE INDEX idx_testId ON CompletedTest(testId);
