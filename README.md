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

### 2. Backend
cd server
npm install
npm start
```

### 3. Frontend 

cd web
npm install
npm run dev
```



## 🌐 การเข้าใช้งาน

- **Backend API**: http://localhost:4002
- **React Frontend**: http://localhost:5173
- **JavaScript Frontend**: http://localhost:3001
