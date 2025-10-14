#!/usr/bin/env node

// สคริปต์ setup อัตโนมัติสำหรับโปรเจกต์ BRM RBAC
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 เริ่มต้นการติดตั้งโปรเจกต์ BRM RBAC')
console.log('═'.repeat(50))

function runCommand(command, cwd = process.cwd()) {
  try {
    console.log(`📁 ${cwd}`)
    console.log(`⚡ ${command}`)
    execSync(command, { cwd, stdio: 'inherit' })
    return true
  } catch (error) {
    console.error(`❌ เกิดข้อผิดพลาด: ${error.message}`)
    return false
  }
}

function checkFile(filePath) {
  return fs.existsSync(filePath)
}

function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination)
    console.log(`✅ คัดลอก ${source} → ${destination}`)
    return true
  } catch (error) {
    console.error(`❌ ไม่สามารถคัดลอกไฟล์ได้: ${error.message}`)
    return false
  }
}

async function main() {
  const projectRoot = process.cwd()
  
  // 1. ตรวจสอบ Node.js และ npm
  console.log('\n1️⃣ ตรวจสอบ Node.js และ npm...')
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim()
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
    console.log(`✅ Node.js: ${nodeVersion}`)
    console.log(`✅ npm: ${npmVersion}`)
  } catch (error) {
    console.error('❌ กรุณาติดตั้ง Node.js และ npm ก่อน')
    process.exit(1)
  }

  // 2. ตรวจสอบ MySQL
  console.log('\n2️⃣ ตรวจสอบ MySQL...')
  try {
    const mysqlVersion = execSync('mysql --version', { encoding: 'utf8' }).trim()
    console.log(`✅ MySQL: ${mysqlVersion}`)
  } catch (error) {
    console.log('⚠️ ไม่พบ MySQL ในระบบ')
    console.log('📝 กรุณาติดตั้ง MySQL และสร้างฐานข้อมูล budget_request')
  }

  // 3. ติดตั้ง Backend
  console.log('\n3️⃣ ติดตั้ง Backend (server-js)...')
  const serverPath = path.join(projectRoot, 'server-js')
  
  if (!checkFile(serverPath)) {
    console.error('❌ ไม่พบโฟลเดอร์ server-js')
    process.exit(1)
  }

  if (!runCommand('npm install', serverPath)) {
    console.error('❌ การติดตั้ง Backend ไม่สำเร็จ')
    process.exit(1)
  }

  // 4. ตั้งค่าไฟล์ .env
  console.log('\n4️⃣ ตั้งค่าไฟล์ Environment...')
  const envExample = path.join(serverPath, '.env.example')
  const envFile = path.join(serverPath, '.env')
  
  if (checkFile(envExample) && !checkFile(envFile)) {
    copyFile(envExample, envFile)
    console.log('📝 กรุณาแก้ไขไฟล์ .env ให้ตรงกับการตั้งค่าฐานข้อมูลของคุณ')
  } else if (checkFile(envFile)) {
    console.log('✅ ไฟล์ .env มีอยู่แล้ว')
  }

  // 5. ติดตั้ง React Frontend
  console.log('\n5️⃣ ติดตั้ง React Frontend (web)...')
  const webPath = path.join(projectRoot, 'web')
  
  if (checkFile(webPath)) {
    if (!runCommand('npm install', webPath)) {
      console.error('❌ การติดตั้ง React Frontend ไม่สำเร็จ')
    }
  } else {
    console.log('⚠️ ไม่พบโฟลเดอร์ web')
  }

  // 6. ติดตั้ง JavaScript Frontend
  console.log('\n6️⃣ ติดตั้ง JavaScript Frontend (web-js)...')
  const webJsPath = path.join(projectRoot, 'web-js')
  
  if (checkFile(webJsPath)) {
    if (!runCommand('npm install', webJsPath)) {
      console.error('❌ การติดตั้ง JavaScript Frontend ไม่สำเร็จ')
    }
  } else {
    console.log('⚠️ ไม่พบโฟลเดอร์ web-js')
  }

  // 7. สรุปผล
  console.log('\n🎉 การติดตั้งเสร็จสิ้น!')
  console.log('═'.repeat(50))
  console.log('📋 ขั้นตอนต่อไป:')
  console.log('1. แก้ไขไฟล์ server-js/.env ให้ตรงกับการตั้งค่าฐานข้อมูล')
  console.log('2. สร้างฐานข้อมูล: CREATE DATABASE budget_request;')
  console.log('3. รันคำสั่ง: cd server-js && npm run reset-db')
  console.log('4. เริ่มต้นเซิร์ฟเวอร์: npm run dev')
  console.log('')
  console.log('🌐 URL สำหรับเข้าใช้งาน:')
  console.log('- Backend API: http://localhost:4002')
  console.log('- React Frontend: http://localhost:5173')
  console.log('- JavaScript Frontend: http://localhost:3001')
  console.log('')
  console.log('👥 ข้อมูลล็อกอิน: admin/admin, planner/planner, procurement/procurement, board/board')
}

main().catch(console.error)
