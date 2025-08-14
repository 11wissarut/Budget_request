// สคริปต์ตรวจสอบฐานข้อมูลง่ายๆ
import 'dotenv/config'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'brm_rbac'
}

async function checkDatabase() {
  console.log('🔍 ตรวจสอบการเชื่อมต่อฐานข้อมูล...')
  console.log(`📍 Host: ${dbConfig.host}`)
  console.log(`👤 User: ${dbConfig.user}`)
  console.log(`🗄️  Database: ${dbConfig.database}`)
  console.log('─'.repeat(50))

  try {
    // ทดสอบการเชื่อมต่อ
    const connection = await mysql.createConnection(dbConfig)
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ!')

    // ตรวจสอบตาราง
    const [tables] = await connection.execute('SHOW TABLES')
    console.log(`📊 พบตาราง ${tables.length} ตาราง:`)
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`)
    })

    // ตรวจสอบข้อมูลผู้ใช้
    try {
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM users')
      console.log(`👥 มีผู้ใช้ ${users[0].count} คน`)
    } catch (error) {
      console.log('⚠️  ยังไม่มีข้อมูลผู้ใช้')
    }

    await connection.end()
    console.log('✅ ฐานข้อมูลพร้อมใช้งาน!')

  } catch (error) {
    console.log('❌ เกิดข้อผิดพลาด:')
    console.log(`   ${error.message}`)
    console.log('')
    console.log('💡 วิธีแก้ไข:')
    console.log('1. ตรวจสอบว่า MySQL Server เปิดอยู่')
    console.log('2. ตรวจสอบว่าฐานข้อมูล brm_rbac มีอยู่ใน HeidiSQL')
    console.log('3. ตรวจสอบการตั้งค่าใน .env (host, port, user, password)')
    console.log('4. ตรวจสอบว่า user มีสิทธิ์เข้าถึงฐานข้อมูล brm_rbac')
  }
}

checkDatabase()
