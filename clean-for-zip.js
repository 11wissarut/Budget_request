#!/usr/bin/env node

// สคริปต์ทำความสะอาดโปรเจกต์ก่อนสร้าง ZIP
const fs = require('fs')
const path = require('path')

console.log('🧹 ทำความสะอาดโปรเจกต์ก่อนสร้าง ZIP')
console.log('═'.repeat(50))

function deleteRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true })
      console.log(`✅ ลบ: ${dirPath}`)
      return true
    } catch (error) {
      console.log(`⚠️ ไม่สามารถลบ: ${dirPath} (${error.message})`)
      return false
    }
  }
  return false
}

function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath)
      console.log(`✅ ลบไฟล์: ${filePath}`)
      return true
    } catch (error) {
      console.log(`⚠️ ไม่สามารถลบไฟล์: ${filePath} (${error.message})`)
      return false
    }
  }
  return false
}

function cleanDirectory(dirPath, pattern) {
  if (!fs.existsSync(dirPath)) return

  try {
    const files = fs.readdirSync(dirPath)
    files.forEach(file => {
      if (file.match(pattern)) {
        const fullPath = path.join(dirPath, file)
        deleteFile(fullPath)
      }
    })
  } catch (error) {
    console.log(`⚠️ ไม่สามารถทำความสะอาดโฟลเดอร์: ${dirPath}`)
  }
}

function main() {
  const projectRoot = process.cwd()
  
  console.log(`📁 โฟลเดอร์โปรเจกต์: ${projectRoot}`)
  console.log('')

  // 1. ลบ node_modules ทุกโฟลเดอร์
  console.log('1️⃣ ลบ node_modules...')
  const nodeModulesPaths = [
    'node_modules',
    'server-js/node_modules',
    'web/node_modules',
    'web-js/node_modules'
  ]
  
  nodeModulesPaths.forEach(p => deleteRecursive(p))

  // 2. ลบไฟล์ .env
  console.log('\n2️⃣ ลบไฟล์ .env...')
  const envFiles = [
    '.env',
    'server-js/.env'
  ]
  
  envFiles.forEach(f => deleteFile(f))

  // 3. ลบไฟล์ที่อัปโหลด
  console.log('\n3️⃣ ลบไฟล์ที่อัปโหลด...')
  const uploadsPath = 'server-js/uploads'
  if (fs.existsSync(uploadsPath)) {
    cleanDirectory(uploadsPath, /^[^.]/); // ลบทุกไฟล์ยกเว้นที่ขึ้นต้นด้วย .
  }

  // 4. ลบไฟล์ log
  console.log('\n4️⃣ ลบไฟล์ log...')
  const logPatterns = [
    /\.log$/,
    /npm-debug\.log/,
    /yarn-debug\.log/,
    /yarn-error\.log/
  ]
  
  function cleanLogs(dir) {
    if (!fs.existsSync(dir)) return
    
    try {
      const files = fs.readdirSync(dir)
      files.forEach(file => {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          cleanLogs(fullPath)
        } else {
          logPatterns.forEach(pattern => {
            if (file.match(pattern)) {
              deleteFile(fullPath)
            }
          })
        }
      })
    } catch (error) {
      // ไม่ต้องแสดง error
    }
  }
  
  cleanLogs('.')

  // 5. ลบไฟล์ build และ dist
  console.log('\n5️⃣ ลบไฟล์ build...')
  const buildPaths = [
    'web/dist',
    'web/build',
    'server-js/dist',
    'server-js/build'
  ]
  
  buildPaths.forEach(p => deleteRecursive(p))

  // 6. ลบไฟล์ cache
  console.log('\n6️⃣ ลบไฟล์ cache...')
  const cachePaths = [
    '.npm',
    '.cache',
    'web/.vite',
    'server-js/.cache'
  ]
  
  cachePaths.forEach(p => deleteRecursive(p))

  // 7. ลบโฟลเดอร์ server เก่า (ถ้ายังมี)
  console.log('\n7️⃣ ลบโฟลเดอร์เก่า...')
  deleteRecursive('server')

  // 8. สรุปผล
  console.log('\n🎉 ทำความสะอาดเสร็จสิ้น!')
  console.log('═'.repeat(50))
  console.log('📦 โปรเจกต์พร้อมสำหรับสร้าง ZIP แล้ว')
  console.log('')
  console.log('📋 ขั้นตอนต่อไป:')
  console.log('1. สร้าง ZIP file จากโฟลเดอร์ทั้งหมด')
  console.log('2. คัดลอก ZIP ไปเครื่องใหม่')
  console.log('3. แตก ZIP และรัน start.bat (Windows) หรือ start.sh (Linux/Mac)')
  console.log('')
  console.log('📁 ไฟล์ที่ควรมีใน ZIP:')
  console.log('- server-js/ (ไม่รวม node_modules)')
  console.log('- web/ (ไม่รวม node_modules)')
  console.log('- web-js/ (ไม่รวม node_modules)')
  console.log('- *.md (คู่มือต่างๆ)')
  console.log('- *.js (สคริปต์ต่างๆ)')
  console.log('- start.bat, start.sh')
  console.log('- package.json')
}

main()
