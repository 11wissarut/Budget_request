# 🐙 คำสั่ง Git ที่ใช้บ่อยสำหรับโปรเจกต์ BRM RBAC

## 🚀 การเริ่มต้น (ทำแล้ว)

```bash
# เริ่มต้น Git repository
git init

# เพิ่มไฟล์ทั้งหมด
git add .

# Commit แรก
git commit -m "Initial commit: BRM RBAC Fullstack System"
```

## 🔗 การเชื่อมต่อกับ GitHub

### 1. สร้าง Repository บน GitHub
1. ไปที่ https://github.com/
2. คลิก "New repository"
3. ตั้งชื่อ: `brm-rbac-fullstack`
4. เลือก Public/Private
5. คลิก "Create repository"

### 2. เชื่อมต่อและอัปโหลด
```bash
# เชื่อมต่อกับ GitHub (แทนที่ your-username)
git remote add origin https://github.com/your-username/brm-rbac-fullstack.git

# เปลี่ยน branch เป็น main (ถ้าจำเป็น)
git branch -M main

# อัปโหลดครั้งแรก
git push -u origin main
```

## 📝 การทำงานประจำวัน

### การเพิ่มและ Commit ไฟล์
```bash
# ดูสถานะไฟล์
git status

# เพิ่มไฟล์ทั้งหมด
git add .

# เพิ่มไฟล์เฉพาะ
git add server-js/src/index.js
git add web/src/pages/Login.tsx

# Commit พร้อมข้อความ
git commit -m "feat: เพิ่มระบบล็อกอิน"

# Push ไปยัง GitHub
git push origin main
```

### การดึงการเปลี่ยนแปลงจาก GitHub
```bash
# ดึงการเปลี่ยนแปลงล่าสุด
git pull origin main

# ดึงข้อมูลโดยไม่ merge
git fetch origin
```

## 🌿 การจัดการ Branch

### สร้างและใช้งาน Branch
```bash
# ดู branch ทั้งหมด
git branch

# สร้าง branch ใหม่
git checkout -b feature/user-management

# เปลี่ยน branch
git checkout main
git checkout feature/user-management

# อัปโหลด branch ใหม่
git push -u origin feature/user-management

# ลบ branch (local)
git branch -d feature/user-management

# ลบ branch (remote)
git push origin --delete feature/user-management
```

### Merge Branch
```bash
# เปลี่ยนไป main branch
git checkout main

# Merge branch อื่นเข้ามา
git merge feature/user-management

# Push การเปลี่ยนแปลง
git push origin main
```

## 📋 รูปแบบ Commit Message

### ประเภทของ Commit
```bash
# Feature ใหม่
git commit -m "feat: เพิ่มระบบอนุมัติคำของบประมาณ"

# แก้ไข Bug
git commit -m "fix: แก้ไขปัญหาการเชื่อมต่อฐานข้อมูล"

# ปรับปรุงเอกสาร
git commit -m "docs: อัปเดตคู่มือการติดตั้ง"

# ปรับปรุง UI/UX
git commit -m "style: ปรับปรุงหน้าล็อกอิน"

# Refactor โค้ด
git commit -m "refactor: ปรับปรุงโครงสร้าง API"

# เพิ่มการทดสอบ
git commit -m "test: เพิ่มการทดสอบระบบอนุมัติ"

# อัปเดต dependencies
git commit -m "chore: อัปเดต npm packages"
```

### ตัวอย่าง Commit Message ที่ดี
```bash
# แบบสั้น
git commit -m "feat: เพิ่มการแก้ไขวงเงินในการอนุมัติ"

# แบบยาวพร้อมรายละเอียด
git commit -m "feat: เพิ่มการแก้ไขวงเงินในการอนุมัติ

- เพิ่ม Modal สำหรับแก้ไขวงเงิน
- เพิ่มฟิลด์ approvedAmount ในฐานข้อมูล
- เพิ่มฟิลด์ approvalNote สำหรับหมายเหตุ
- อัปเดต API endpoint /api/requests/:id/approve
- เพิ่มการแสดงวงเงินที่อนุมัติในตาราง"
```

## 🏷️ การจัดการ Tag และ Release

### สร้าง Tag
```bash
# สร้าง tag สำหรับ version
git tag -a v1.0.0 -m "Release version 1.0.0"

# ดู tag ทั้งหมด
git tag

# อัปโหลด tag
git push origin v1.0.0

# อัปโหลด tag ทั้งหมด
git push --tags

# ลบ tag (local)
git tag -d v1.0.0

# ลบ tag (remote)
git push origin --delete v1.0.0
```

## 🔄 การยกเลิกการเปลี่ยนแปลง

### ยกเลิกการเปลี่ยนแปลงที่ยังไม่ได้ commit
```bash
# ยกเลิกการเปลี่ยนแปลงไฟล์เฉพาะ
git checkout -- server-js/src/index.js

# ยกเลิกการเปลี่ยนแปลงทั้งหมด
git checkout -- .

# ยกเลิกการ add
git reset HEAD server-js/src/index.js
git reset HEAD .
```

### ยกเลิก Commit ล่าสุด
```bash
# ยกเลิก commit ล่าสุด (เก็บการเปลี่ยนแปลง)
git reset --soft HEAD~1

# ยกเลิก commit ล่าสุด (ลบการเปลี่ยนแปลง)
git reset --hard HEAD~1

# ยกเลิก commit และ push (ระวัง!)
git reset --hard HEAD~1
git push --force origin main
```

## 📊 การดูประวัติ

### ดู Log
```bash
# ดู commit ล่าสุด
git log

# ดู commit แบบสั้น
git log --oneline

# ดู commit พร้อม graph
git log --graph --oneline

# ดู commit ของไฟล์เฉพาะ
git log server-js/src/index.js

# ดูการเปลี่ยนแปลงใน commit
git show <commit-hash>
```

### ดูความแตกต่าง
```bash
# ดูความแตกต่างที่ยังไม่ได้ commit
git diff

# ดูความแตกต่างของไฟล์เฉพาะ
git diff server-js/src/index.js

# ดูความแตกต่างระหว่าง commit
git diff HEAD~1 HEAD

# ดูความแตกต่างระหว่าง branch
git diff main feature/user-management
```

## 🔧 การแก้ไขปัญหา

### แก้ไข Merge Conflict
```bash
# เมื่อเกิด conflict
git status  # ดูไฟล์ที่ conflict

# แก้ไขไฟล์ที่ conflict แล้ว
git add .
git commit -m "resolve: แก้ไข merge conflict"
```

### แก้ไขปัญหา Push ไม่ได้
```bash
# ถ้า remote มีการเปลี่ยนแปลงใหม่
git pull origin main
# แก้ไข conflict (ถ้ามี)
git push origin main

# หรือใช้ rebase
git pull --rebase origin main
git push origin main
```

## 🔍 คำสั่งตรวจสอบ

### ตรวจสอบสถานะ Repository
```bash
# ดูสถานะไฟล์
git status

# ดู remote repository
git remote -v

# ดู branch ทั้งหมด (local และ remote)
git branch -a

# ดูการตั้งค่า Git
git config --list
```

### ตรวจสอบขนาดและไฟล์
```bash
# ดูขนาด repository
git count-objects -vH

# ดูไฟล์ที่ใหญ่ที่สุด
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sed -n 's/^blob //p' | sort --numeric-sort --key=2 | tail -10
```

## 🎯 Best Practices

### 1. Commit บ่อยๆ แต่มีความหมาย
```bash
# ดี
git commit -m "feat: เพิ่มฟอร์มล็อกอิน"
git commit -m "feat: เพิ่มการตรวจสอบ authentication"
git commit -m "style: ปรับปรุง UI ฟอร์มล็อกอิน"

# ไม่ดี
git commit -m "update"
git commit -m "fix bug"
git commit -m "work in progress"
```

### 2. ใช้ Branch สำหรับ Feature ใหม่
```bash
# สร้าง branch สำหรับ feature
git checkout -b feature/approval-system
# ทำงานใน branch นี้
git commit -m "feat: เพิ่มระบบอนุมัติ"
# Merge กลับไป main เมื่อเสร็จ
git checkout main
git merge feature/approval-system
```

### 3. Pull ก่อน Push เสมอ
```bash
# ก่อน push ให้ pull ก่อน
git pull origin main
git push origin main
```

### 4. ใช้ .gitignore ที่ดี
```bash
# ตรวจสอบว่าไฟล์ถูก ignore หรือไม่
git check-ignore server-js/node_modules/

# ดูไฟล์ที่จะถูก add
git add --dry-run .
```
