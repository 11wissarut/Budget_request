// ตรวจสอบโครงสร้างฐานข้อมูลทั้งหมด
import 'dotenv/config'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'brm_rbac'
}

async function checkDatabaseStructure() {
  console.log('🔍 ตรวจสอบโครงสร้างฐานข้อมูล')
  console.log('─'.repeat(60))

  try {
    const connection = await mysql.createConnection(dbConfig)
    
    // ดูตารางทั้งหมด
    console.log('📋 ตารางทั้งหมดในฐานข้อมูล:')
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME || 'brm_rbac'])
    
    tables.forEach(table => {
      console.log(`  📄 ${table.TABLE_NAME} (${table.TABLE_ROWS} แถว, ${Math.round(table.DATA_LENGTH/1024)}KB)`)
    })
    
    console.log('')
    
    // ตรวจสอบโครงสร้างแต่ละตาราง
    for (const table of tables) {
      console.log(`🔧 โครงสร้างตาราง: ${table.TABLE_NAME}`)
      console.log('─'.repeat(40))
      
      const [columns] = await connection.execute(`
        SELECT 
          COLUMN_NAME, 
          DATA_TYPE, 
          IS_NULLABLE, 
          COLUMN_DEFAULT,
          COLUMN_KEY,
          EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_NAME || 'brm_rbac', table.TABLE_NAME])
      
      columns.forEach(col => {
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'
        const key = col.COLUMN_KEY ? ` [${col.COLUMN_KEY}]` : ''
        const extra = col.EXTRA ? ` ${col.EXTRA}` : ''
        const defaultVal = col.COLUMN_DEFAULT !== null ? ` DEFAULT ${col.COLUMN_DEFAULT}` : ''
        
        console.log(`  ${col.COLUMN_NAME.padEnd(20)} ${col.DATA_TYPE.padEnd(15)} ${nullable}${defaultVal}${key}${extra}`)
      })
      
      // ดูข้อมูลตัวอย่าง
      if (table.TABLE_ROWS > 0) {
        console.log(`\n📊 ข้อมูลตัวอย่าง (5 แถวแรก):`)
        try {
          const [sampleData] = await connection.execute(`SELECT * FROM ${table.TABLE_NAME} LIMIT 5`)
          if (sampleData.length > 0) {
            console.log(`  จำนวนแถว: ${sampleData.length}`)
            console.log(`  คอลัมน์: ${Object.keys(sampleData[0]).join(', ')}`)
          }
        } catch (error) {
          console.log(`  ไม่สามารถดึงข้อมูลตัวอย่างได้: ${error.message}`)
        }
      }
      
      console.log('')
    }
    
    // ตรวจสอบ indexes
    console.log('🔑 Indexes ทั้งหมด:')
    const [indexes] = await connection.execute(`
      SELECT 
        TABLE_NAME, 
        INDEX_NAME, 
        COLUMN_NAME, 
        NON_UNIQUE
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `, [process.env.DB_NAME || 'brm_rbac'])
    
    const indexGroups = {}
    indexes.forEach(idx => {
      const key = `${idx.TABLE_NAME}.${idx.INDEX_NAME}`
      if (!indexGroups[key]) {
        indexGroups[key] = {
          table: idx.TABLE_NAME,
          name: idx.INDEX_NAME,
          unique: idx.NON_UNIQUE === 0,
          columns: []
        }
      }
      indexGroups[key].columns.push(idx.COLUMN_NAME)
    })
    
    Object.values(indexGroups).forEach(idx => {
      const type = idx.unique ? 'UNIQUE' : 'INDEX'
      console.log(`  ${idx.table}.${idx.name} (${type}): ${idx.columns.join(', ')}`)
    })
    
    console.log('')
    
    // สรุปสถานะ
    console.log('📈 สรุปสถานะฐานข้อมูล:')
    console.log('─'.repeat(40))
    
    // ตรวจสอบตารางที่จำเป็น
    const requiredTables = ['users', 'requests', 'submissions']
    const existingTables = tables.map(t => t.TABLE_NAME)
    
    requiredTables.forEach(tableName => {
      if (existingTables.includes(tableName)) {
        console.log(`✅ ตาราง ${tableName}: มีอยู่`)
      } else {
        console.log(`❌ ตาราง ${tableName}: ไม่มี`)
      }
    })
    
    // ตรวจสอบคอลัมน์สำคัญในตาราง requests
    if (existingTables.includes('requests')) {
      const [requestColumns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'requests'
      `, [process.env.DB_NAME || 'brm_rbac'])
      
      const requestColumnNames = requestColumns.map(col => col.COLUMN_NAME)
      const requiredRequestColumns = [
        'id', 'title', 'category', 'fiscalYear', 'amount', 
        'approvedAmount', 'note', 'approvalNote', 'fileName', 
        'fileUrl', 'status', 'createdAt'
      ]
      
      console.log('\n🔍 ตรวจสอบคอลัมน์ตาราง requests:')
      requiredRequestColumns.forEach(colName => {
        if (requestColumnNames.includes(colName)) {
          console.log(`✅ คอลัมน์ ${colName}: มีอยู่`)
        } else {
          console.log(`❌ คอลัมน์ ${colName}: ไม่มี`)
        }
      })
    }
    
    await connection.end()
    
    console.log('')
    console.log('🎉 ตรวจสอบเสร็จสิ้น!')
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message)
  }
}

checkDatabaseStructure()
