// เชื่อมต่อ MySQL ด้วย mysql2 และสร้างตารางถ้ายังไม่มี
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

// การตั้งค่าการเชื่อมต่อ MySQL (HeidiSQL)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'brm_rbac',
  charset: 'utf8mb4'
}

// สร้าง connection pool
export const pool = mysql.createPool(dbConfig)

// ฟังก์ชันเชื่อมต่อและสร้างตาราง (สำหรับ HeidiSQL)
export async function initDatabase() {
  try {
    console.log('🔄 กำลังเชื่อมต่อฐานข้อมูล brm_rbac...')

    // ทดสอบการเชื่อมต่อ
    try {
      const [result] = await pool.execute('SELECT DATABASE() as db_name')
      console.log(`✅ เชื่อมต่อฐานข้อมูล "${result[0].db_name}" สำเร็จ`)
    } catch (error) {
      console.log('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้')
      console.log('💡 กรุณาตรวจสอบ:')
      console.log('   - MySQL Server เปิดอยู่หรือไม่')
      console.log('   - ฐานข้อมูล brm_rbac มีอยู่ใน HeidiSQL หรือไม่')
      console.log('   - ข้อมูลการเชื่อมต่อใน .env ถูกต้องหรือไม่')
      throw error
    }

    // สร้างตารางแบบง่ายๆ
    console.log('🔄 กำลังสร้างตาราง...')

    // ตาราง users
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    // ตาราง requests
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS requests (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        fiscalYear INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        approvedAmount DECIMAL(15,2) NULL,
        note TEXT,
        approvalNote TEXT,
        fileName VARCHAR(255),
        fileUrl VARCHAR(500),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    // ตาราง submissions
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS submissions (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        note TEXT,
        fileName VARCHAR(255) NOT NULL,
        filePath VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    console.log('✅ สร้างตารางสำเร็จ')
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message)
    console.log('\n💡 วิธีแก้ไข:')
    console.log('1. เปิด XAMPP และ Start MySQL')
    console.log('2. เปิด phpMyAdmin (http://localhost/phpmyadmin)')
    console.log('3. สร้างฐานข้อมูลชื่อ "brm_rbac"')
    console.log('4. รันโปรแกรมใหม่อีกครั้ง')
    throw error
  }
}

// ฟังก์ชัน seed ข้อมูลเริ่มต้น (ถ้ายังไม่มีผู้ใช้เลย)
export async function seedIfEmpty() {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as c FROM users')
    const count = rows[0].c

    if (count === 0) {
      const hash = (plain) => bcrypt.hashSync(plain, 10) // แฮชรหัสผ่าน

      // เริ่ม transaction
      const connection = await pool.getConnection()
      await connection.beginTransaction()

      try {
        // เพิ่มผู้ใช้
        const users = [
          ['u1', 'ผู้ดูแลระบบ', 'admin', hash('1234'), 'admin'],
          ['u2', 'งานแผน', 'planner', hash('1234'), 'planner'],
          ['u3', 'งานพัสดุ', 'procurement', hash('1234'), 'procurement'],
          ['u4', 'กรรมการ/ผู้บริหาร', 'board', hash('1234'), 'board'],
        ]

        for (const user of users) {
          await connection.execute(
            'INSERT INTO users (id, name, username, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            user
          )
        }

        // เพิ่มคำขอตัวอย่าง
        const now = new Date()
        const requests = [
          ['r1', 'จัดซื้อคอมพิวเตอร์ห้องปฏิบัติการ', 'ครุภัณฑ์', 2568, 350000, 'pending', now],
          ['r2', 'ปรับปรุงอาคารเรียน', 'ก่อสร้าง', 2568, 1200000, 'approved', now]
        ]

        for (const request of requests) {
          await connection.execute(
            'INSERT INTO requests (id, title, category, fiscalYear, amount, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            request
          )
        }

        await connection.commit()
        console.log('Seed data inserted successfully')
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    }
  } catch (error) {
    console.error('Error seeding data:', error)
    throw error
  }
}

// Helper functions สำหรับ MySQL
export const dbGet = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params)
    return rows[0] || null
  } catch (error) {
    console.error('Database GET error:', error)
    throw error
  }
}

export const dbAll = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params)
    return rows
  } catch (error) {
    console.error('Database ALL error:', error)
    throw error
  }
}

export const dbRun = async (sql, params = []) => {
  try {
    const [result] = await pool.execute(sql, params)
    return result
  } catch (error) {
    console.error('Database RUN error:', error)
    throw error
  }
}
