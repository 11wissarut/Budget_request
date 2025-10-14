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
CREATE DATABASE budget_request;
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
