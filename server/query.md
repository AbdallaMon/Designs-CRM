CREATE TABLE LessonAccess (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    lessonId INT NOT NULL,
    grantedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_lesson (userId, lessonId),
    CONSTRAINT fk_lessonaccess_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    CONSTRAINT fk_lessonaccess_lesson FOREIGN KEY (lessonId) REFERENCES Lesson(id) ON DELETE CASCADE
);

CREATE TABLE LessonHomework (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    lessonId INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type ENUM('VIDEO', 'SUMMARY') NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_userId (userId),
    INDEX idx_lessonId (lessonId),
    CONSTRAINT fk_lessonhomework_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    CONSTRAINT fk_lessonhomework_lesson FOREIGN KEY (lessonId) REFERENCES Lesson(id) ON DELETE CASCADE
);
