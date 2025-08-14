# 🐙 คู่มือการอัปโหลดโปรเจกต์ขึ้น Git

## 📋 ขั้นตอนการเตรียมโปรเจกต์

### 1. ทำความสะอาดโปรเจกต์
```bash
# ลบไฟล์ที่ไม่จำเป็น
npm run clean
```

### 2. ตรวจสอบไฟล์ .gitignore
ไฟล์ `.gitignore` ควรมีเนื้อหาดังนี้:
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Keep example files
!.env.example

# Database files
*.db
*.sqlite
*.sqlite3

# Uploads
server-js/uploads/*
!server-js/uploads/.gitkeep

# Build outputs
dist/
build/
*.tsbuildinfo

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Temporary files
tmp/
temp/

# Old server folder
server/
```

## 🐙 การสร้าง Repository บน GitHub

### 1. สร้าง Repository ใหม่
1. ไปที่ https://github.com/
2. คลิก "New repository" หรือ "+"
3. ตั้งชื่อ: `brm-rbac-fullstack`
4. เพิ่ม Description: `ระบบจัดการคำของบประมาณแบบ Role-Based Access Control (RBAC)`
5. เลือก **Public** หรือ **Private**
6. ✅ เลือก "Add a README file"
7. ✅ เลือก "Add .gitignore" → Node
8. ✅ เลือก "Choose a license" → MIT License
9. คลิก "Create repository"

### 2. คัดลอก URL ของ Repository
```
https://github.com/your-username/brm-rbac-fullstack.git
```

## 💻 การอัปโหลดโปรเจกต์

### วิธีที่ 1: ใช้ Command Line (แนะนำ)

#### A. เริ่มต้น Git ในโปรเจกต์
```bash
# เข้าไปในโฟลเดอร์โปรเจกต์
cd brm-rbac-fullstack

# เริ่มต้น Git
git init

# เพิ่มไฟล์ทั้งหมด
git add .

# Commit แรก
git commit -m "Initial commit: BRM RBAC Fullstack System"

# เชื่อมต่อกับ GitHub
git remote add origin https://github.com/your-username/brm-rbac-fullstack.git

# อัปโหลดไฟล์
git push -u origin main
```

#### B. หากมี README.md อยู่แล้วบน GitHub
```bash
# ดึงไฟล์จาก GitHub มาก่อน
git pull origin main --allow-unrelated-histories

# แก้ไข conflict (ถ้ามี)
# แล้ว commit และ push ใหม่
git add .
git commit -m "Merge with GitHub repository"
git push origin main
```

### วิธีที่ 2: ใช้ GitHub Desktop

#### A. ติดตั้ง GitHub Desktop
1. ดาวน์โหลดจาก: https://desktop.github.com/
2. ติดตั้งและล็อกอินด้วยบัญชี GitHub

#### B. เพิ่มโปรเจกต์
1. เปิด GitHub Desktop
2. คลิก "Add an Existing Repository from your Hard Drive"
3. เลือกโฟลเดอร์ `brm-rbac-fullstack`
4. คลิก "create a repository"
5. เลือก "Publish repository"
6. ตั้งชื่อ: `brm-rbac-fullstack`
7. เลือก Public/Private
8. คลิก "Publish Repository"

### วิธีที่ 3: ใช้ VS Code

#### A. เปิดโปรเจกต์ใน VS Code
```bash
code brm-rbac-fullstack
```

#### B. ใช้ Source Control
1. คลิกไอคอน Source Control (Ctrl+Shift+G)
2. คลิก "Initialize Repository"
3. เพิ่มไฟล์ทั้งหมด (Stage All Changes)
4. เขียน Commit message: "Initial commit"
5. คลิก "Commit"
6. คลิก "Publish to GitHub"
7. เลือก Public/Private
8. คลิก "Publish"

## 🔧 การจัดการ Branch

### สร้าง Branch สำหรับ Development
```bash
# สร้าง branch ใหม่
git checkout -b development

# อัปโหลด branch ใหม่
git push -u origin development

# สร้าง branch สำหรับ feature
git checkout -b feature/user-management
git push -u origin feature/user-management
```

### โครงสร้าง Branch ที่แนะนำ
```
main                    # Production code
├── development         # Development code
├── feature/xxx         # Feature branches
├── bugfix/xxx          # Bug fix branches
└── hotfix/xxx          # Hotfix branches
```

## 📝 การเขียน Commit Message

### รูปแบบที่แนะนำ
```bash
# Feature
git commit -m "feat: เพิ่มระบบอนุมัติคำของบประมาณ"

# Bug fix
git commit -m "fix: แก้ไขปัญหาการเชื่อมต่อฐานข้อมูล"

# Documentation
git commit -m "docs: อัปเดตคู่มือการติดตั้ง"

# Style
git commit -m "style: ปรับปรุง UI หน้าล็อกอิน"

# Refactor
git commit -m "refactor: ปรับปรุงโครงสร้าง API"

# Test
git commit -m "test: เพิ่มการทดสอบระบบอนุมัติ"
```

## 🏷️ การสร้าง Release

### 1. สร้าง Tag
```bash
# สร้าง tag สำหรับ version
git tag -a v1.0.0 -m "Release version 1.0.0"

# อัปโหลด tag
git push origin v1.0.0

# อัปโหลด tag ทั้งหมด
git push --tags
```

### 2. สร้าง Release บน GitHub
1. ไปที่ Repository บน GitHub
2. คลิก "Releases"
3. คลิก "Create a new release"
4. เลือก Tag: `v1.0.0`
5. ตั้งชื่อ: `BRM RBAC v1.0.0`
6. เขียน Release notes:
```markdown
## 🎉 BRM RBAC Fullstack v1.0.0

### ✨ Features
- ระบบจัดการผู้ใช้และสิทธิ์ (RBAC)
- ระบบส่งคำของบประมาณ
- ระบบอนุมัติ/ปฏิเสธคำของบ
- การแนบไฟล์และดาวน์โหลด
- Frontend 2 เวอร์ชัน (React + Vanilla JS)

### 🛠️ Tech Stack
- Backend: Node.js + Express + MySQL
- Frontend: React + TypeScript + Vite
- Database: MySQL
- Authentication: JWT

### 📦 Installation
ดูคู่มือใน `QUICK-START.md`
```
7. แนบไฟล์ ZIP (ถ้าต้องการ)
8. คลิก "Publish release"

## 🔄 การอัปเดตโปรเจกต์

### การ Push การเปลี่ยนแปลงใหม่
```bash
# ตรวจสอบสถานะ
git status

# เพิ่มไฟล์ที่เปลี่ยนแปลง
git add .

# หรือเพิ่มไฟล์เฉพาะ
git add server-js/src/index.js

# Commit
git commit -m "feat: เพิ่มฟีเจอร์การแก้ไขวงเงิน"

# Push
git push origin main
```

### การดึงการเปลี่ยนแปลงจาก GitHub
```bash
# ดึงการเปลี่ยนแปลงล่าสุด
git pull origin main
```

## 👥 การทำงานร่วมกับทีม

### การ Clone โปรเจกต์
```bash
# Clone repository
git clone https://github.com/your-username/brm-rbac-fullstack.git

# เข้าไปในโฟลเดอร์
cd brm-rbac-fullstack

# ติดตั้ง dependencies
npm run setup

# ตั้งค่าฐานข้อมูล
cd server-js
cp .env.example .env
# แก้ไขไฟล์ .env
npm run reset-db

# เริ่มต้นระบบ
npm run dev
```

### การสร้าง Pull Request
1. สร้าง branch ใหม่: `git checkout -b feature/new-feature`
2. ทำการเปลี่ยนแปลง
3. Commit และ Push: `git push origin feature/new-feature`
4. ไปที่ GitHub และคลิก "Compare & pull request"
5. เขียนรายละเอียดและคลิก "Create pull request"

## 🔒 การตั้งค่า Security

### 1. ป้องกันไฟล์ .env
ตรวจสอบว่าไฟล์ `.env` อยู่ใน `.gitignore` แล้ว

### 2. ใช้ GitHub Secrets สำหรับ CI/CD
1. ไปที่ Settings → Secrets and variables → Actions
2. เพิ่ม secrets:
   - `DB_PASSWORD`
   - `JWT_SECRET`

### 3. ตั้งค่า Branch Protection
1. ไปที่ Settings → Branches
2. เพิ่ม rule สำหรับ `main` branch
3. เลือก "Require pull request reviews"

## 📊 การติดตาม Repository

### GitHub Insights
- **Traffic**: ดูจำนวนผู้เข้าชม
- **Commits**: ดูประวัติการ commit
- **Contributors**: ดูผู้ร่วมพัฒนา

### การใช้ GitHub Issues
1. คลิก "Issues" → "New issue"
2. เลือก template หรือสร้างใหม่
3. เขียนรายละเอียดปัญหา
4. กำหนด Labels, Assignees, Projects

## 🎯 Best Practices

### 1. Commit บ่อยๆ
```bash
# แทนที่จะ commit ใหญ่ๆ
git commit -m "feat: เพิ่มระบบทั้งหมด"

# ควร commit เล็กๆ
git commit -m "feat: เพิ่มหน้าล็อกอิน"
git commit -m "feat: เพิ่ม API authentication"
git commit -m "feat: เพิ่มระบบสิทธิ์ผู้ใช้"
```

### 2. ใช้ .gitignore ที่ดี
- ไม่ commit `node_modules`
- ไม่ commit ไฟล์ `.env`
- ไม่ commit ไฟล์ build

### 3. เขียน README ที่ดี
- คำอธิบายโปรเจกต์
- วิธีการติดตั้ง
- วิธีการใช้งาน
- ข้อมูลการติดต่อ

### 4. ใช้ License ที่เหมาะสม
- MIT License: เหมาะสำหรับ open source
- Apache 2.0: เหมาะสำหรับโปรเจกต์ใหญ่
- GPL: เหมาะสำหรับ copyleft
