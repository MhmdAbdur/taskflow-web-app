-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `taskapp`;

-- Select the database
USE `taskapp`;

-- Create the tasks table
CREATE TABLE IF NOT EXISTS `tasks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `text` VARCHAR(255) NOT NULL,
    `category` ENUM('Work', 'Personal', 'Study', 'Academic') DEFAULT 'Personal',
    `priority` ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',
    `completed` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
