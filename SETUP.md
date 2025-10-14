# 🚀 คู่มือติดตั้งโปรเจกต์ BRM RBAC บนเครื่องใหม่

## 📋 สิ่งที่ต้องติดตั้งก่อน

### 1. Node.js และ npm
- ดาวน์โหลดและติดตั้ง Node.js จาก: https://nodejs.org/
- แนะนำเวอร์ชัน LTS (Long Term Support)
- ตรวจสอบการติดตั้ง:
```bash
node --version
npm --version
```

### 2. MySQL Database
- ดาวน์โหลดและติดตั้ง MySQL จาก: https://dev.mysql.com/downloads/mysql/
- หรือใช้ XAMPP/WAMP/MAMP ที่มี MySQL รวมอยู่
- ตรวจสอบการติดตั้ง:
```bash
mysql --version
```

### 3. Git (ไม่บังคับ)
- ดาวน์โหลดจาก: https://git-scm.com/
- สำหรับ clone โปรเจกต์

## 🗄️ การตั้งค่าฐานข้อมูล

### 1. เข้าสู่ MySQL
```bash
mysql -u root -p
```

### 2. สร้างฐานข้อมูล
```sql
CREATE DATABASE budget_request;
EXIT;
```

### 3. สร้างผู้ใช้ฐานข้อมูล (ไม่บังคับ)
```sql
CREATE USER 'brm_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON budget_request.* TO 'brm_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 📁 การติดตั้งโปรเจกต์

### 1. คัดลอกโปรเจกต์
```bash
# ถ้าใช้ Git
git clone <repository-url>
cd brm-rbac-fullstack

# หรือคัดลอกโฟลเดอร์ทั้งหมด
```

### 2. ติดตั้ง Backend (server-js)
```bash
cd server-js
npm install
```

### 3. ตั้งค่าไฟล์ Environment
```bash
# คัดลอกไฟล์ตัวอย่าง
cp .env.example .env

# แก้ไขไฟล์ .env
# ใส่ข้อมูลฐานข้อมูลที่ถูกต้อง
```

### 4. สร้างตารางและข้อมูลเริ่มต้น
```bash
npm run reset-db
```

### 5. ทดสอบ Backend
```bash
npm run dev
```
ควรเห็นข้อความ: `API listening at http://localhost:4002`

### 6. ติดตั้ง React Frontend
```bash
# เปิด Terminal ใหม่
cd ../web
npm install
npm run dev
```
ควรเห็นข้อความ: `Local: http://localhost:5173`

### 7. ติดตั้ง JavaScript Frontend
```bash
# เปิด Terminal ใหม่
cd ../web-js
npm install
npm start
```
ควรเห็นข้อความ: `Server running at http://localhost:3001`

## 🌐 การเข้าใช้งาน

- **Backend API**: http://localhost:4002
- **React Frontend**: http://localhost:5173
- **JavaScript Frontend**: http://localhost:3001

## 👥 ข้อมูลล็อกอิน

| Username | Password | บทบาท |
|----------|----------|--------|
| admin | admin | ผู้ดูแลระบบ |
| planner | planner | งานแผน |
| procurement | procurement | งานพัสดุ |
| board | board | กรรมการ |

## 🔧 การแก้ไขปัญหาที่พบบ่อย

### ปัญหา: ไม่สามารถเชื่อมต่อฐานข้อมูลได้
**วิธีแก้:**
1. ตรวจสอบว่า MySQL ทำงานอยู่
2. ตรวจสอบข้อมูลใน `.env` ให้ถูกต้อง
3. ตรวจสอบว่าฐานข้อมูล `budget_request` ถูกสร้างแล้ว

### ปัญหา: Port ถูกใช้งานแล้ว
**วิธีแก้:**
1. เปลี่ยน PORT ในไฟล์ `.env`
2. หรือปิดโปรแกรมที่ใช้ port นั้นอยู่

### ปัญหา: npm install ไม่สำเร็จ
**วิธีแก้:**
1. ลบโฟลเดอร์ `node_modules`
2. ลบไฟล์ `package-lock.json`
3. รัน `npm install` ใหม่

## 🧪 การทดสอบระบบ

### ทดสอบ API
```bash
cd server-js
npm run test-api
```

### ทดสอบการอนุมัติ
```bash
npm run test-approval
```

### ตรวจสอบฐานข้อมูล
```bash
npm run check-db
npm run check-users
npm run check-structure
```

## 📦 การ Deploy

### สำหรับ Production
1. เปลี่ยน `NODE_ENV=production` ในไฟล์ `.env`
2. เปลี่ยน `JWT_SECRET` เป็นค่าที่ซับซ้อนกว่า
3. ตั้งค่า reverse proxy (nginx/apache)
4. ใช้ process manager (PM2)

### Build React สำหรับ Production
```bash
cd web
npm run build
```

## 📞 การขอความช่วยเหลือ

หากพบปัญหาในการติดตั้ง:
1. ตรวจสอบ log ใน terminal
2. ตรวจสอบไฟล์ `.env` ให้ถูกต้อง
3. ตรวจสอบว่า MySQL ทำงานปกติ
4. ลองรัน `npm run check-db` เพื่อตรวจสอบการเชื่อมต่อ
