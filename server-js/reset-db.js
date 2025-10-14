import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// --- Database Configuration ---
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'budget_request',
  charset: 'utf8mb4',
};

// --- SQL Schema Definitions ---
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const createBudgetRequestsTable = `
CREATE TABLE IF NOT EXISTS budget_requests (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  fiscal_year INT NOT NULL,
  category ENUM('EQUIPMENT', 'CONSTRUCTION') NOT NULL,
  construction_type ENUM('IMPROVEMENT', 'NEW_CONSTRUCTION') NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  approved_amount DECIMAL(15, 2) NULL,
  approval_note TEXT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  note TEXT,
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const createEquipmentDetailsTable = `
CREATE TABLE IF NOT EXISTS equipment_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(50) NOT NULL,
  equipment_type ENUM('BUILDING', 'REPLACEMENT', 'EFFICIENCY') NOT NULL,
  quantity INT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  price_per_unit DECIMAL(15, 2) NOT NULL,
  FOREIGN KEY (request_id) REFERENCES budget_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const createQuotationsTable = `
CREATE TABLE IF NOT EXISTS quotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(50) NOT NULL,
  vendor_index INT NOT NULL COMMENT 'ลำดับใบเสนอราคา เช่น 1, 2, 3',
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES budget_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const createDownloadableFormsTable = `
CREATE TABLE IF NOT EXISTS downloadable_forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const createDisbursementsTable = `
CREATE TABLE IF NOT EXISTS disbursements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(50) NOT NULL,
  disbursed_amount DECIMAL(15, 2) NOT NULL,
  disbursed_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(50),
  FOREIGN KEY (request_id) REFERENCES budget_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function seedData(pool) {
  console.log('🔄 Seeding data...');
  const hash = (plain) => bcrypt.hashSync(plain, 10);

  const users = [
    ['user-admin', 'ผู้ดูแลระบบ', 'admin', hash('1234'), 'admin'],
    ['user-planner', 'งานแผน', 'planner', hash('1234'), 'planner'],
    ['user-proc', 'งานพัสดุ', 'procurement', hash('1234'), 'procurement'],
    ['user-board', 'ผู้บริหาร', 'board', hash('1234'), 'board'],
  ];
  await pool.query('INSERT INTO users (id, name, username, password_hash, role) VALUES ?', [users]);
  console.log('✅ Users seeded.');

  const reqId1 = 'req-equip-001';
  await pool.query(
    "INSERT INTO budget_requests (id, title, fiscal_year, category, total_amount, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [reqId1, 'จัดซื้อคอมพิวเตอร์สำหรับห้องเรียน', 2568, 'EQUIPMENT', 150000.00, 'PENDING', 'user-planner']
  );
  await pool.query(
    "INSERT INTO equipment_details (request_id, equipment_type, quantity, unit, price_per_unit) VALUES (?, ?, ?, ?, ?)",
    [reqId1, 'REPLACEMENT', 10, 'เครื่อง', 15000.00]
  );
  await pool.query(
    "INSERT INTO quotations (request_id, vendor_index, file_name, file_path) VALUES (?, ?, ?, ?), (?, ?, ?, ?)",
    [
      reqId1, 1, 'quotation-vendor1.pdf', 'uploads/quotations/req-equip-001-q1.pdf',
      reqId1, 2, 'quotation-vendor2.pdf', 'uploads/quotations/req-equip-001-q2.pdf'
    ]
  );

  const reqId2 = 'req-construct-001';
  await pool.query(
    "INSERT INTO budget_requests (id, title, fiscal_year, category, total_amount, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [reqId2, 'ก่อสร้างอาคารอเนกประสงค์', 2568, 'CONSTRUCTION', 5500000.00, 'PENDING', 'user-planner']
  );
  await pool.query(
    "INSERT INTO quotations (request_id, vendor_index, file_name, file_path) VALUES (?, ?, ?, ?)",
    [reqId2, 1, 'construction-quote-vendor1.pdf', 'uploads/quotations/req-construct-001-q1.pdf']
  );

  const reqId3 = 'req-equip-002';
  await pool.query(
    "INSERT INTO budget_requests (id, title, fiscal_year, category, total_amount, approved_amount, approval_note, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [reqId3, 'จัดซื้อโปรเจคเตอร์', 2567, 'EQUIPMENT', 60000.00, 55000.00, 'อนุมัติตามความเหมาะสม', 'APPROVED', 'user-planner']
  );
  await pool.query(
    "INSERT INTO equipment_details (request_id, equipment_type, quantity, unit, price_per_unit) VALUES (?, ?, ?, ?, ?)",
    [reqId3, 'EFFICIENCY', 2, 'เครื่อง', 30000.00]
  );
  console.log('✅ Budget requests and details seeded.');

  const forms = [
    ['แบบฟอร์มคำขอทั่วไป', 'form-general.pdf', 'uploads/forms/form-general.pdf'],
    ['แบบฟอร์มจัดซื้อจัดจ้าง', 'form-procurement.pdf', 'uploads/forms/form-procurement.pdf']
  ];
  await pool.query('INSERT INTO downloadable_forms (title, file_name, file_path) VALUES ?', [forms]);
  console.log('✅ Downloadable forms seeded.');

  console.log('🎉 Database seeding completed successfully!');
}

async function main() {
  let pool;
  try {
    const connectionForDbCreation = await mysql.createConnection({ ...dbConfig, database: null });
    console.log(`🔄 Ensuring database "${dbConfig.database}" exists...`);
    await connectionForDbCreation.query(`CREATE DATABASE IF NOT EXISTS 
${dbConfig.database}
 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connectionForDbCreation.end();
    console.log(`✅ Database "${dbConfig.database}" is ready.`);

    pool = mysql.createPool(dbConfig);

    console.log('🔄 Preparing tables...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
    await pool.query('DROP TABLE IF EXISTS quotations;');
    await pool.query('DROP TABLE IF EXISTS equipment_details;');
    await pool.query('DROP TABLE IF EXISTS budget_requests;');
    await pool.query('DROP TABLE IF EXISTS disbursements;');
    await pool.query('DROP TABLE IF EXISTS downloadable_forms;');
    await pool.query('DROP TABLE IF EXISTS users;');
    console.log('✅ Old tables dropped.');

    await pool.query(createUsersTable);
    await pool.query(createBudgetRequestsTable);
    await pool.query(createEquipmentDetailsTable);
    await pool.query(createQuotationsTable);
    await pool.query(createDownloadableFormsTable);
    await pool.query(createDisbursementsTable);
    console.log('✅ New tables created.');
    
    await pool.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✅ Foreign key checks re-enabled.');

    await seedData(pool);

  } catch (error) {
    console.error('❌ An error occurred during database reset:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('✅ Connection pool closed.');
    }
  }
}

main();