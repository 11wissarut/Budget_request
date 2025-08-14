# 🚀 คู่มือ Deploy โปรเจกต์ BRM RBAC

## 📋 การเตรียมไฟล์สำหรับ Deploy

### 1. ไฟล์ที่ต้องคัดลอกไปเครื่องใหม่
```
brm-rbac-fullstack/
├── server-js/          # Backend (ทั้งโฟลเดอร์)
├── web/               # React Frontend (ทั้งโฟลเดอร์)
├── web-js/            # JavaScript Frontend (ทั้งโฟลเดอร์)
├── test-api.js        # ไฟล์ทดสอบ
├── test-approval.js   # ไฟล์ทดสอบ
├── setup.js           # สคริปต์ติดตั้งอัตโนมัติ
├── start.bat          # สำหรับ Windows
├── start.sh           # สำหรับ Linux/Mac
├── package.json       # การตั้งค่าโปรเจกต์
├── SETUP.md           # คู่มือติดตั้ง
├── README.md          # คู่มือใช้งาน
├── DEPLOYMENT.md      # คู่มือนี้
└── .gitignore         # Git ignore rules
```

### 2. ไฟล์ที่ไม่ต้องคัดลอก
- `node_modules/` (ทุกโฟลเดอร์)
- `.env` (ไฟล์การตั้งค่าเฉพาะเครื่อง)
- `uploads/` (ไฟล์ที่อัปโหลด)
- `*.log` (ไฟล์ log)

## 💾 วิธีการคัดลอกโปรเจกต์

### วิธีที่ 1: ใช้ Git (แนะนำ)
```bash
# บนเครื่องต้นทาง
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repository-url>
git push -u origin main

# บนเครื่องปลายทาง
git clone <your-repository-url>
cd brm-rbac-fullstack
```

### วิธีที่ 2: คัดลอกไฟล์โดยตรง
1. คัดลอกโฟลเดอร์ทั้งหมด (ยกเว้น `node_modules`)
2. ส่งผ่าน USB, Cloud Storage, หรือ Network
3. วางไฟล์ในเครื่องปลายทาง

### วิธีที่ 3: สร้าง ZIP file
```bash
# สร้าง ZIP (ยกเว้น node_modules)
zip -r brm-rbac-fullstack.zip . -x "*/node_modules/*" "*.log" ".env"
```

## 🖥️ การติดตั้งบนเครื่องใหม่

### วิธีที่ 1: ใช้สคริปต์อัตโนมัติ (แนะนำ)

#### Windows:
```cmd
# ดับเบิลคลิกไฟล์
start.bat

# หรือรันใน Command Prompt
start.bat
```

#### Linux/Mac:
```bash
# ให้สิทธิ์ execute
chmod +x start.sh

# รันสคริปต์
./start.sh
```

### วิธีที่ 2: ติดตั้งแบบ Manual

#### 1. ติดตั้ง Dependencies
```bash
# ติดตั้งทั้งหมดพร้อมกัน
npm run setup

# หรือติดตั้งทีละส่วน
cd server-js && npm install
cd ../web && npm install
cd ../web-js && npm install
```

#### 2. ตั้งค่าฐานข้อมูล
```bash
# สร้างฐานข้อมูล
mysql -u root -p
CREATE DATABASE brm_rbac;
EXIT;

# ตั้งค่า Environment
cd server-js
cp .env.example .env
# แก้ไขไฟล์ .env

# สร้างตารางและข้อมูล
npm run reset-db
```

#### 3. เริ่มต้นระบบ
```bash
# เริ่มทั้งหมดพร้อมกัน
npm run dev

# หรือเริ่มทีละส่วน
cd server-js && npm run dev     # Terminal 1
cd web && npm run dev           # Terminal 2
cd web-js && npm start          # Terminal 3
```

## 🌐 การตั้งค่าสำหรับ Production

### 1. ตั้งค่า Environment Variables
```bash
# ในไฟล์ server-js/.env
NODE_ENV=production
PORT=4002
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-strong-password
DB_NAME=brm_rbac
JWT_SECRET=your-super-secret-jwt-key-very-long-and-complex
```

### 2. Build React สำหรับ Production
```bash
cd web
npm run build
```

### 3. ใช้ Process Manager (PM2)
```bash
# ติดตั้ง PM2
npm install -g pm2

# เริ่มต้น Backend
cd server-js
pm2 start src/index.js --name "brm-backend"

# ตรวจสอบสถานะ
pm2 status
pm2 logs brm-backend
```

### 4. ตั้งค่า Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/web/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 การแก้ไขปัญหา

### ปัญหา: Port ถูกใช้งานแล้ว
```bash
# ตรวจสอบ process ที่ใช้ port
netstat -ano | findstr :4002  # Windows
lsof -i :4002                 # Linux/Mac

# ปิด process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Linux/Mac
```

### ปัญหา: ไม่สามารถเชื่อมต่อฐานข้อมูล
1. ตรวจสอบ MySQL service ทำงานอยู่
2. ตรวจสอบข้อมูลใน `.env`
3. ตรวจสอบ firewall settings
4. ทดสอบการเชื่อมต่อ: `npm run check-db`

### ปัญหา: Frontend ไม่สามารถเรียก API
1. ตรวจสอบ CORS settings
2. ตรวจสอบ URL ใน frontend code
3. ตรวจสอบ network connectivity

## 📊 การ Monitor ระบบ

### ตรวจสอบ Logs
```bash
# Backend logs
cd server-js
npm run dev  # ดู logs ใน console

# PM2 logs
pm2 logs brm-backend
```

### ตรวจสอบ Health
```bash
# ทดสอบ API
curl http://localhost:4002/api/health

# ทดสอบฐานข้อมูล
cd server-js
npm run check-db
```

## 🔒 Security Checklist

- [ ] เปลี่ยน JWT_SECRET เป็นค่าที่ซับซ้อน
- [ ] ใช้ HTTPS ใน production
- [ ] ตั้งค่า firewall ให้เหมาะสม
- [ ] อัปเดต dependencies เป็นเวอร์ชันล่าสุด
- [ ] ตั้งค่า rate limiting
- [ ] สำรองข้อมูลฐานข้อมูลเป็นประจำ
