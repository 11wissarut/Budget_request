import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'budget_request',
  charset: 'utf8mb4',
};

const createUsersTable = `
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

async function main() {
  let pool;
  try {
    // Connect to server and recreate the database
    const conn = await mysql.createConnection({ ...dbConfig, database: null });
    console.log(`🔄 Dropping database 
${dbConfig.database}
 if it exists...`);
    await conn.query(`DROP DATABASE IF EXISTS 
${dbConfig.database}
;`);
    console.log(`✅ Database 
${dbConfig.database}
 dropped.`);
    console.log(`🔄 Creating database 
${dbConfig.database}
...`);
    await conn.query(`CREATE DATABASE 
${dbConfig.database}
 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Database 
${dbConfig.database}
 created.`);
    await conn.end();

    // Connect to the newly created database
    pool = mysql.createPool(dbConfig);
    console.log('🔄 Creating table users...');
    await pool.query(createUsersTable);
    console.log('✅ Table users created successfully!');

  } catch (error) {
    console.error('❌ An error occurred:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

main();