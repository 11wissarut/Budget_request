# 🚀 Quick Start - รันโปรเจกต์ BRM RBAC บนเครื่องใหม่

## 📦 ขั้นตอนการ Save และ Deploy

### 1. การสร้าง ZIP File (บนเครื่องต้นทาง)

#### วิธีที่ 1: ใช้ Windows Explorer
1. เปิด File Explorer ไปที่โฟลเดอร์ `brm-rbac-fullstack`
2. **ลบโฟลเดอร์ที่ไม่จำเป็นก่อน:**
   - ลบ `node_modules` ทุกโฟลเดอร์
   - ลบ `server-js/uploads/*` (ไฟล์ที่อัปโหลด)
   - ลบไฟล์ `.env` (ถ้ามี)
3. คลิกขวาที่โฟลเดอร์ `brm-rbac-fullstack`
4. เลือก "Send to" → "Compressed (zipped) folder"
5. ตั้งชื่อไฟล์: `brm-rbac-fullstack.zip`

#### วิธีที่ 2: ใช้ Command Line
```bash
# ไปที่โฟลเดอร์แม่
cd ..

# สร้าง ZIP (ยกเว้นไฟล์ที่ไม่จำเป็น)
powershell Compress-Archive -Path "brm-rbac-fullstack" -DestinationPath "brm-rbac-fullstack.zip" -Force
```

### 2. การติดตั้งบนเครื่องใหม่

#### ขั้นตอนที่ 1: ติดตั้งโปรแกรมที่จำเป็น

**A. Node.js และ npm**
1. ไปที่ https://nodejs.org/
2. ดาวน์โหลด LTS version
3. ติดตั้งตามขั้นตอน
4. ทดสอบ:
```bash
node --version
npm --version
```

**B. MySQL Database**
1. ดาวน์โหลด MySQL จาก https://dev.mysql.com/downloads/mysql/
2. หรือติดตั้ง XAMPP จาก https://www.apachefriends.org/
3. ทดสอบ:
```bash
mysql --version
```

#### ขั้นตอนที่ 2: แตกไฟล์และติดตั้ง

**A. แตกไฟล์ ZIP**
1. คัดลอกไฟล์ `brm-rbac-fullstack.zip` ไปเครื่องใหม่
2. คลิกขวา → "Extract All" หรือ "Extract Here"
3. เข้าไปในโฟลเดอร์ `brm-rbac-fullstack`

**B. รันสคริปต์ติดตั้งอัตโนมัติ**

**สำหรับ Windows:**
```cmd
# ดับเบิลคลิกไฟล์
start.bat

# หรือเปิด Command Prompt และรัน
start.bat
```

**สำหรับ Linux/Mac:**
```bash
# เปิด Terminal ในโฟลเดอร์โปรเจกต์
chmod +x start.sh
./start.sh
```

#### ขั้นตอนที่ 3: ตั้งค่าฐานข้อมูล (ถ้าสคริปต์ไม่ทำให้)

**A. สร้างฐานข้อมูล**
```bash
# เข้าสู่ MySQL
mysql -u root -p

# สร้างฐานข้อมูล
CREATE DATABASE brm_rbac;
EXIT;
```

**B. ตั้งค่า Environment**
```bash
cd server-js
cp .env.example .env
```

แก้ไขไฟล์ `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=brm_rbac
PORT=4002
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

**C. สร้างตารางและข้อมูล**
```bash
npm run reset-db
```

## 🎯 การรันระบบ

### วิธีที่ 1: รันทั้งหมดพร้อมกัน
```bash
npm run dev
```

### วิธีที่ 2: รันทีละส่วน
```bash
# Terminal 1: Backend
cd server-js
npm run dev

# Terminal 2: React Frontend
cd web
npm run dev

# Terminal 3: JavaScript Frontend
cd web-js
npm start
```

## 🌐 เข้าใช้งานระบบ

เปิดเบราว์เซอร์และไปที่:
- **React Frontend**: http://localhost:5173
- **JavaScript Frontend**: http://localhost:3001
- **Backend API**: http://localhost:4002

## 👥 ข้อมูลล็อกอิน

| Username | Password | บทบาท |
|----------|----------|--------|
| admin | admin | ผู้ดูแลระบบ |
| planner | planner | งานแผน |
| procurement | procurement | งานพัสดุ |
| board | board | กรรมการ |

## 🔧 แก้ไขปัญหาที่พบบ่อย

### ปัญหา: ไม่สามารถติดตั้ง npm packages
**วิธีแก้:**
```bash
# ลบ node_modules และ package-lock.json
rm -rf node_modules package-lock.json  # Linux/Mac
rmdir /s node_modules & del package-lock.json  # Windows

# ติดตั้งใหม่
npm install
```

### ปัญหา: Port ถูกใช้งานแล้ว
**วิธีแก้:**
```bash
# ตรวจสอบ process ที่ใช้ port
netstat -ano | findstr :4002  # Windows
lsof -i :4002                 # Linux/Mac

# ปิด process หรือเปลี่ยน port ในไฟล์ .env
```

### ปัญหา: ไม่สามารถเชื่อมต่อฐานข้อมูล
**วิธีแก้:**
1. ตรวจสอบ MySQL service ทำงานอยู่
2. ตรวจสอบข้อมูลใน `.env` ให้ถูกต้อง
3. ทดสอบการเชื่อมต่อ:
```bash
cd server-js
npm run check-db
```

### ปัญหา: หน้าเว็บไม่แสดง
**วิธีแก้:**
1. ตรวจสอบว่า Backend ทำงานอยู่ (http://localhost:4002)
2. ตรวจสอบ Console ในเบราว์เซอร์หา error
3. ลองรีเฟรชหน้าเว็บ

## 🧪 ทดสอบระบบ

```bash
# ทดสอบ API
cd server-js
npm run test-api

# ทดสอบการอนุมัติ
npm run test-approval

# ตรวจสอบฐานข้อมูล
npm run check-structure
```

## 📞 ขอความช่วยเหลือ

หากยังมีปัญหา:
1. อ่านไฟล์ `SETUP.md` สำหรับรายละเอียดเพิ่มเติม
2. อ่านไฟล์ `DEPLOYMENT.md` สำหรับการ deploy
3. ตรวจสอบ log ใน terminal หา error message
