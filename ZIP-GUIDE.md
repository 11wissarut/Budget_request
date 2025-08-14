# 📦 คู่มือการสร้าง ZIP และ Deploy โปรเจกต์

## 🧹 ขั้นตอนที่ 1: ทำความสะอาดโปรเจกต์

### วิธีที่ 1: ใช้สคริปต์อัตโนมัติ (แนะนำ)
```bash
npm run clean
```

### วิธีที่ 2: ทำความสะอาดแบบ Manual
ลบโฟลเดอร์และไฟล์เหล่านี้:
- `node_modules/` (ทุกโฟลเดอร์)
- `server-js/node_modules/`
- `web/node_modules/`
- `web-js/node_modules/`
- `server-js/.env`
- `server-js/uploads/*` (ไฟล์ที่อัปโหลด)
- `*.log` (ไฟล์ log)
- `web/dist/` หรือ `web/build/`

## 📦 ขั้นตอนที่ 2: สร้าง ZIP File

### Windows:
1. คลิกขวาที่โฟลเดอร์ `brm-rbac-fullstack`
2. เลือก "Send to" → "Compressed (zipped) folder"
3. ตั้งชื่อ: `brm-rbac-fullstack.zip`

### Linux/Mac:
```bash
# ไปที่โฟลเดอร์แม่
cd ..

# สร้าง ZIP
zip -r brm-rbac-fullstack.zip brm-rbac-fullstack/ -x "*/node_modules/*" "*/.env" "*/uploads/*" "*.log"
```

### PowerShell (Windows):
```powershell
# ไปที่โฟลเดอร์แม่
cd ..

# สร้าง ZIP
Compress-Archive -Path "brm-rbac-fullstack" -DestinationPath "brm-rbac-fullstack.zip" -Force
```

## 📁 ไฟล์ที่ควรมีใน ZIP

```
brm-rbac-fullstack.zip
├── 📄 README.md
├── 📄 QUICK-START.md          ⭐ สำคัญ!
├── 📄 SETUP.md
├── 📄 DEPLOYMENT.md
├── 📄 ZIP-GUIDE.md
├── 🔧 setup.js
├── 🔧 start.bat               ⭐ สำคัญ!
├── 🔧 start.sh                ⭐ สำคัญ!
├── 📦 package.json
├── 🧪 test-api.js
├── 🧪 test-approval.js
├── 📁 server-js/
│   ├── src/
│   ├── public/
│   ├── uploads/.gitkeep
│   ├── .env.example           ⭐ สำคัญ!
│   ├── package.json
│   └── *.js (สคริปต์ต่างๆ)
├── 📁 web/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── *.config.* (ไฟล์ config)
└── 📁 web-js/
    ├── js/
    ├── index.html
    ├── package.json
    └── server.js
```

## 🚀 ขั้นตอนที่ 3: Deploy บนเครื่องใหม่

### A. ความต้องการของระบบ
- **Node.js** (v16+): https://nodejs.org/
- **MySQL** (v8+): https://dev.mysql.com/downloads/ หรือ XAMPP
- **Git** (ไม่บังคับ): https://git-scm.com/

### B. ขั้นตอนการติดตั้ง

#### 1. แตกไฟล์ ZIP
```bash
# แตกไฟล์ ZIP ไปยังโฟลเดอร์ที่ต้องการ
# เช่น C:\Projects\ หรือ /home/user/projects/
```

#### 2. รันสคริปต์ติดตั้งอัตโนมัติ

**Windows:**
```cmd
# ดับเบิลคลิกไฟล์
start.bat

# หรือเปิด Command Prompt
cd path\to\brm-rbac-fullstack
start.bat
```

**Linux/Mac:**
```bash
cd /path/to/brm-rbac-fullstack
chmod +x start.sh
./start.sh
```

#### 3. ตั้งค่าฐานข้อมูล (ถ้าจำเป็น)

**สร้างฐานข้อมูล:**
```sql
mysql -u root -p
CREATE DATABASE brm_rbac;
EXIT;
```

**ตั้งค่า Environment:**
```bash
cd server-js
cp .env.example .env
# แก้ไขไฟล์ .env ให้ตรงกับการตั้งค่าฐานข้อมูล
```

**สร้างตารางและข้อมูล:**
```bash
npm run reset-db
```

## 🌐 การเข้าใช้งาน

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

### ปัญหา: npm install ไม่สำเร็จ
```bash
# ลบ cache และติดตั้งใหม่
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ปัญหา: ไม่สามารถเชื่อมต่อฐานข้อมูล
1. ตรวจสอบ MySQL service ทำงานอยู่
2. ตรวจสอบข้อมูลใน `server-js/.env`
3. ทดสอบ: `cd server-js && npm run check-db`

### ปัญหา: Port ถูกใช้งานแล้ว
```bash
# Windows
netstat -ano | findstr :4002
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :4002
kill -9 <PID>
```

## 📋 Checklist ก่อนส่ง ZIP

- [ ] รันคำสั่ง `npm run clean`
- [ ] ตรวจสอบว่าไม่มี `node_modules` ใน ZIP
- [ ] ตรวจสอบว่าไม่มีไฟล์ `.env` ใน ZIP
- [ ] ตรวจสอบว่ามีไฟล์ `start.bat` และ `start.sh`
- [ ] ตรวจสอบว่ามีไฟล์ `QUICK-START.md`
- [ ] ตรวจสอบว่ามีไฟล์ `server-js/.env.example`
- [ ] ทดสอบแตก ZIP และรันบนเครื่องอื่น

## 📞 การสนับสนุน

หากผู้ใช้พบปัญหา:
1. อ่าน `QUICK-START.md` ก่อน
2. ตรวจสอบ `SETUP.md` สำหรับรายละเอียด
3. ดู `DEPLOYMENT.md` สำหรับการ deploy แบบ production
