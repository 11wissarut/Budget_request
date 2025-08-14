# BRM RBAC Fullstack

ระบบจัดการคำของบประมาณแบบ Role-Based Access Control (RBAC)

## 🏗️ โครงสร้างโปรเจกต์

```
brm-rbac-fullstack/
├── server-js/       # Backend API (JavaScript + Express + MySQL)
├── web/            # Frontend (React + TypeScript + Vite + Tailwind)
├── web-js/         # Frontend (Vanilla JavaScript + HTML + CSS)
├── test-api.js     # ทดสอบ API
├── test-approval.js # ทดสอบการอนุมัติ
└── README.md
```

## 🚀 การติดตั้งและรัน

### 1. ตั้งค่าฐานข้อมูล MySQL
```sql
CREATE DATABASE brm_rbac;
```

### 2. Backend (JavaScript + MySQL)
```bash
cd server-js
npm install
cp .env.example .env  # แก้ไขการตั้งค่าฐานข้อมูล
npm run reset-db      # สร้างตารางและข้อมูลเริ่มต้น
npm run dev
```

### 3. Frontend React
```bash
cd web
npm install
npm run dev
```

### 4. Frontend JavaScript
```bash
cd web-js
npm install
npm start
```

## 🌐 การเข้าใช้งาน

- **Backend API**: http://localhost:4002
- **React Frontend**: http://localhost:5173
- **JavaScript Frontend**: http://localhost:3001

## 👥 ข้อมูลล็อกอิน

| Username | Password | บทบาท | สิทธิ์ |
|----------|----------|--------|--------|
| `admin` | `admin` | ผู้ดูแลระบบ | ทุกอย่าง |
| `planner` | `planner` | งานแผน | จัดการคำของบ |
| `procurement` | `procurement` | งานพัสดุ | ดูรายการ |
| `board` | `board` | กรรมการ/ผู้บริหาร | ดูรายการ |

## 🎯 ฟีเจอร์หลัก

### 📋 การจัดการคำของบประมาณ
- ✅ ส่งคำของบประมาณ (พร้อมแนบไฟล์)
- ✅ อนุมัติ/ปฏิเสธคำของบ
- ✅ แก้ไขวงเงินที่อนุมัติ
- ✅ เพิ่มหมายเหตุการอนุมัติ
- ✅ ดาวน์โหลดไฟล์แนบ

### 👥 การจัดการผู้ใช้
- ✅ เพิ่ม/แก้ไข/ลบผู้ใช้
- ✅ กำหนดบทบาทและสิทธิ์
- ✅ ระบบล็อกอิน/ล็อกเอาต์

### 🔐 ระบบสิทธิ์ (RBAC)
- ✅ ควบคุมการเข้าถึงตามบทบาท
- ✅ ป้องกันการเข้าถึงที่ไม่ได้รับอนุญาต

## 🛠️ คำสั่งที่เป็นประโยชน์

```bash
# ติดตั้งและเริ่มต้นระบบ
npm run setup                 # ติดตั้ง dependencies ทั้งหมด
npm run dev                   # เริ่มต้นระบบทั้งหมด

# ทำความสะอาดก่อนสร้าง ZIP
npm run clean                 # ลบไฟล์ที่ไม่จำเป็น

# ตรวจสอบฐานข้อมูล
npm run check-db              # ตรวจสอบการเชื่อมต่อ
npm run check-users           # ตรวจสอบผู้ใช้
npm run reset-db              # รีเซ็ตฐานข้อมูล

# ทดสอบระบบ
npm run test                  # ทดสอบ API
npm run test:approval         # ทดสอบการอนุมัติ
```

## 📦 การสร้าง ZIP สำหรับ Deploy

### ขั้นตอนที่ 1: ทำความสะอาด
```bash
npm run clean
```

### ขั้นตอนที่ 2: สร้าง ZIP
- **Windows**: คลิกขวาโฟลเดอร์ → "Send to" → "Compressed folder"
- **Linux/Mac**: `zip -r brm-rbac-fullstack.zip brm-rbac-fullstack/`

### ขั้นตอนที่ 3: Deploy บนเครื่องใหม่
1. แตกไฟล์ ZIP
2. รัน `start.bat` (Windows) หรือ `start.sh` (Linux/Mac)
3. ตั้งค่าฐานข้อมูลตาม `QUICK-START.md`

📖 **อ่านเพิ่มเติม**: `ZIP-GUIDE.md` และ `QUICK-START.md`

## 📊 ฐานข้อมูล

### ตาราง `users`
- ข้อมูลผู้ใช้และบทบาท

### ตาราง `requests`
- คำของบประมาณ
- วงเงินที่ขอและวงเงินที่อนุมัติ
- หมายเหตุการอนุมัติ
- ไฟล์แนบ

### ตาราง `submissions`
- การส่งเอกสารเพิ่มเติม
