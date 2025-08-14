// รีเซ็ตฐานข้อมูล - ลบตารางและสร้างใหม่
import 'dotenv/config'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'brm_rbac'
}

async function resetDatabase() {
  console.log('🔄 รีเซ็ตฐานข้อมูล...')
  console.log('─'.repeat(50))

  try {
    const connection = await mysql.createConnection(dbConfig)
    
    console.log('🗑️ ลบตารางเก่า...')
    
    // ลบตารางทั้งหมด
    await connection.execute('DROP TABLE IF EXISTS submissions')
    await connection.execute('DROP TABLE IF EXISTS requests')
    await connection.execute('DROP TABLE IF EXISTS users')
    
    console.log('✅ ลบตารางเก่าเรียบร้อย')
    
    console.log('🔨 สร้างตารางใหม่...')
    
    // สร้างตาราง users
    await connection.execute(`
      CREATE TABLE users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    
    // สร้างตาราง requests
    await connection.execute(`
      CREATE TABLE requests (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        fiscalYear INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        note TEXT,
        fileName VARCHAR(255),
        fileUrl VARCHAR(500),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    
    // สร้างตาราง submissions
    await connection.execute(`
      CREATE TABLE submissions (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        note TEXT,
        fileName VARCHAR(255) NOT NULL,
        fileUrl VARCHAR(500) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    
    console.log('✅ สร้างตารางใหม่เรียบร้อย')
    
    // สร้างผู้ใช้เริ่มต้น
    console.log('👥 สร้างผู้ใช้เริ่มต้น...')

    const bcrypt = (await import('bcryptjs')).default
    
    const users = [
      {
        id: 'admin-001',
        name: 'ผู้ดูแลระบบ',
        username: 'admin',
        password: 'admin',
        role: 'admin'
      },
      {
        id: 'planner-001',
        name: 'งานแผน',
        username: 'planner',
        password: 'planner',
        role: 'planner'
      },
      {
        id: 'procurement-001',
        name: 'งานพัสดุ',
        username: 'procurement',
        password: 'procurement',
        role: 'procurement'
      },
      {
        id: 'board-001',
        name: 'กรรมการ/ผู้บริหาร',
        username: 'board',
        password: 'board',
        role: 'board'
      }
    ]
    
    for (const user of users) {
      const passwordHash = bcrypt.hashSync(user.password, 10)
      
      await connection.execute(
        'INSERT INTO users (id, name, username, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.name, user.username, passwordHash, user.role]
      )
      
      console.log(`✅ สร้างผู้ใช้: ${user.username}`)
    }
    
    await connection.end()
    
    console.log('')
    console.log('🎉 รีเซ็ตฐานข้อมูลเสร็จสิ้น!')
    console.log('📋 ข้อมูลล็อกอิน:')
    console.log('─'.repeat(30))
    users.forEach(user => {
      console.log(`${user.username.padEnd(12)} | รหัสผ่าน: ${user.password}`)
    })
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message)
  }
}

resetDatabase()
