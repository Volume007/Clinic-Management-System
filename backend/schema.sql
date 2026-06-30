CREATE DATABASE IF NOT EXISTS clinic_db;
USE clinic_db;

-- --------------------------------------------------------
-- Table: doctors
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default doctor account (Password: admin123, will be hashed in the app or insert a known bcrypt hash here if needed)
-- Instead of raw password, I'll provide an API endpoint or script to create the first doctor, or insert a known bcrypt hash.
-- Hash for 'admin123' is $2a$10$X... (we will just handle it in the backend if table is empty)

-- --------------------------------------------------------
-- Table: patients
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  mobile_number VARCHAR(15) NOT NULL,
  location VARCHAR(255),
  disease VARCHAR(255),
  visit_date DATE NOT NULL,
  notes TEXT,
  total_bill DECIMAL(10,2) DEFAULT 0.00,
  paid_amount DECIMAL(10,2) DEFAULT 0.00,
  pending_amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- Table: medicines
-- --------------------------------------------------------
-- This table stores inventory. Stock is tracked in units (tablets) for accurate calculation.
-- When creating a medicine, we define how many tablets are in 1 strip.
CREATE TABLE IF NOT EXISTS medicines (
  medicine_id INT AUTO_INCREMENT PRIMARY KEY,
  medicine_name VARCHAR(100) NOT NULL UNIQUE,
  medicine_type ENUM('Tablet', 'Capsule', 'Bottle', 'Injection', 'Tube', 'Packet') NOT NULL,
  pack_size INT NOT NULL,
  pack_unit VARCHAR(50) NOT NULL,
  stock_quantity INT DEFAULT 0,
  stock_added_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- Table: patient_medicines
-- --------------------------------------------------------
-- Stores the medicines given to a patient in a specific visit.
CREATE TABLE IF NOT EXISTS patient_medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medicine_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL, -- Quantity given
  type ENUM('Tablet', 'Strip') NOT NULL, -- How it was given
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id) ON DELETE RESTRICT
);

-- --------------------------------------------------------
-- Table: prescription_items
-- --------------------------------------------------------
-- You mentioned this table, which might be similar to patient_medicines.
-- I'll create it to store text-based prescription lines if needed, 
-- but patient_medicines covers the requirement of dynamically linking medicines.
CREATE TABLE IF NOT EXISTS prescription_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  item_text VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
