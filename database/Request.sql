-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.4.32-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for budget_request
DROP DATABASE IF EXISTS `budget_request`;
CREATE DATABASE IF NOT EXISTS `budget_request` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `budget_request`;

-- Dumping structure for table budget_request.attachments
DROP TABLE IF EXISTS `attachments`;
CREATE TABLE IF NOT EXISTS `attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table budget_request.attachments: ~0 rows (approximately)
DELETE FROM `attachments`;

-- Dumping structure for table budget_request.budget_requests
DROP TABLE IF EXISTS `budget_requests`;
CREATE TABLE IF NOT EXISTS `budget_requests` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `fiscal_year` int(11) NOT NULL,
  `category` enum('EQUIPMENT','CONSTRUCTION','UTILITIES','TEMPORARY_PAY') NOT NULL,
  `construction_type` enum('IMPROVEMENT','NEW_CONSTRUCTION') DEFAULT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `approved_amount` decimal(15,2) DEFAULT NULL,
  `approval_note` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'PENDING',
  `note` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `budget_requests_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table budget_request.budget_requests: ~0 rows (approximately)
DELETE FROM `budget_requests`;

-- Dumping structure for table budget_request.categories
DROP TABLE IF EXISTS `categories`;
CREATE TABLE IF NOT EXISTS `categories` (
  `category_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table budget_request.categories: ~0 rows (approximately)
DELETE FROM `categories`;

-- Dumping structure for table budget_request.departents
DROP TABLE IF EXISTS `departents`;
CREATE TABLE IF NOT EXISTS `departents` (
  `department_id` int(11) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table budget_request.departents: ~0 rows (approximately)
DELETE FROM `departents`;

-- Dumping structure for table budget_request.disbursements
DROP TABLE IF EXISTS `disbursements`;
CREATE TABLE IF NOT EXISTS `disbursements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` varchar(50) NOT NULL,
  `disbursed_amount` decimal(15,2) NOT NULL,
  `disbursed_date` date NOT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `disbursements_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `budget_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `disbursements_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table budget_request.disbursements: ~0 rows (approximately)
DELETE FROM `disbursements`;

-- Dumping structure for table budget_request.disbursement_attachments
DROP TABLE IF EXISTS `disbursement_attachments`;
CREATE TABLE IF NOT EXISTS `disbursement_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `disbursement_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_disb_att_disbursement_id` (`disbursement_id`),
  CONSTRAINT `fk_disb_att_disb` FOREIGN KEY (`disbursement_id`) REFERENCES `disbursements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table budget_request.disbursement_attachments: ~0 rows (approximately)
DELETE FROM `disbursement_attachments`;

-- Dumping structure for table budget_request.equipment_details
DROP TABLE IF EXISTS `equipment_details`;
CREATE TABLE IF NOT EXISTS `equipment_details` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `request_id` varchar(40) NOT NULL,
  `equipment_type` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit` varchar(64) NOT NULL,
  `price_per_unit` decimal(18,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  CONSTRAINT `fk_equip_req` FOREIGN KEY (`request_id`) REFERENCES `budget_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table budget_request.equipment_details: ~0 rows (approximately)
DELETE FROM `equipment_details`;

-- Dumping structure for table budget_request.forms
DROP TABLE IF EXISTS `forms`;
CREATE TABLE IF NOT EXISTS `forms` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table budget_request.forms: ~1 rows (approximately)
DELETE FROM `forms`;
INSERT INTO `forms` (`id`, `title`, `file_name`, `file_path`, `created_at`) VALUES
	('0afc3f42-4dd0-4c5f-ac7d-1b556667d89a', 'ewq', 'ทดสอบ.docx', '760a378163f9d6fd41abcf95d8792462', '2025-10-01 09:26:44');

-- Dumping structure for table budget_request.quotations
DROP TABLE IF EXISTS `quotations`;
CREATE TABLE IF NOT EXISTS `quotations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` varchar(50) NOT NULL,
  `vendor_index` int(11) NOT NULL COMMENT 'ลำดับใบเสนอราคา เช่น 1, 2, 3',
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  CONSTRAINT `quotations_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `budget_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table budget_request.quotations: ~0 rows (approximately)
DELETE FROM `quotations`;

-- Dumping structure for table budget_request.submissions
DROP TABLE IF EXISTS `submissions`;
CREATE TABLE IF NOT EXISTS `submissions` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `note` text DEFAULT NULL,
  `fileName` varchar(255) NOT NULL,
  `filePath` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table budget_request.submissions: ~0 rows (approximately)
DELETE FROM `submissions`;

-- Dumping structure for table budget_request.users
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table budget_request.users: ~4 rows (approximately)
DELETE FROM `users`;
INSERT INTO `users` (`id`, `name`, `username`, `password_hash`, `role`, `created_at`) VALUES
	('user-admin', 'ผู้ดูแลระบบ', 'admin', '$2a$10$jyEuOI4NbcgK4Sqxel/Nou1/am7AgHv.qtvswFFY/bysR3UxcyXFm', 'admin', '2025-09-24 13:10:22'),
	('user-board', 'ผู้บริหาร', 'board', '$2a$10$71clMYnEA7HOlWObKI484ulG/lkWfQrU6RqJp/acEuQmhu.uAjXgq', 'board', '2025-09-24 13:10:22'),
	('user-planner', 'งานแผน', 'planner', '$2a$10$zEgJYQBiG6LCdcXrovAd4.xwPCc3bFrKymf/thqhS1EvqPNJ6PFEC', 'planner', '2025-09-24 13:10:22'),
	('user-proc', 'งานพัสดุ', 'procurement', '$2a$10$dbENh4doc3ef2VIgGZdh/eWwPMKrco2gd3NzcDmKVXkIa7YOVEavW', 'procurement', '2025-09-24 13:10:22');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
