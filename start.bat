@echo off
echo 🚀 เริ่มต้นระบบ BRM RBAC
echo ═══════════════════════════════════════

echo 📦 ติดตั้ง dependencies...
call npm install

echo 🗄️ ตรวจสอบฐานข้อมูล...
cd server-js
call npm run check-db
if errorlevel 1 (
    echo ❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้
    echo 📝 กรุณาตรวจสอบการตั้งค่าใน server-js/.env
    pause
    exit /b 1
)

echo 🌐 เริ่มต้นเซิร์ฟเวอร์...
start "Backend Server" cmd /k "npm run dev"

timeout /t 3 /nobreak > nul

cd ..\web
echo ⚛️ เริ่มต้น React Frontend...
start "React Frontend" cmd /k "npm run dev"

cd ..\web-js
echo 🌐 เริ่มต้น JavaScript Frontend...
start "JavaScript Frontend" cmd /k "npm start"

cd ..
echo ✅ ระบบเริ่มต้นเรียบร้อยแล้ว!
echo.
echo 🌐 URL สำหรับเข้าใช้งาน:
echo - Backend API: http://localhost:4002
echo - React Frontend: http://localhost:5173
echo - JavaScript Frontend: http://localhost:3001
echo.
echo 👥 ข้อมูลล็อกอิน:
echo - admin/admin (ผู้ดูแลระบบ)
echo - planner/planner (งานแผน)
echo - procurement/procurement (งานพัสดุ)
echo - board/board (กรรมการ)
echo.
pause
