// ตรวจสอบข้อมูลผู้ใช้ในฐานข้อมูล
import 'dotenv/config'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'budget_request'
}

async function checkUsers() {
  console.log('👥 ตรวจสอบข้อมูลผู้ใช้...')
  console.log('─'.repeat(50))

  try {
    const connection = await mysql.createConnection(dbConfig)
    
    // ดูข้อมูลผู้ใช้ทั้งหมด
    const [users] = await connection.execute('SELECT id, name, username, role FROM users')
    
    if (users.length === 0) {
      console.log('❌ ไม่พบข้อมูลผู้ใช้')
    } else {
      console.log(`✅ พบผู้ใช้ ${users.length} คน:`)
      users.forEach(user => {
        console.log(`   - ${user.username} (${user.name}) - Role: ${user.role}`)
      })
    }
    
    console.log('')
    console.log('🔍 ตรวจสอบรหัสผ่าน...')
    
    // ตรวจสอบรหัสผ่านของ admin
    const [adminUser] = await connection.execute('SELECT username, password_hash FROM users WHERE username = ?', ['admin'])
    
    if (adminUser.length > 0) {
      console.log(`✅ พบผู้ใช้ admin`)
      console.log(`🔑 Password hash: ${adminUser[0].password_hash.substring(0, 20)}...`)
    } else {
      console.log('❌ ไม่พบผู้ใช้ admin')
    }
    
    await connection.end()
    
  } catch (error) {
    console.log('❌ เกิดข้อผิดพลาด:', error.message)
  }
}

checkUsers()
