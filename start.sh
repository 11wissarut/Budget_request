#!/bin/bash

echo "🚀 เริ่มต้นระบบ BRM RBAC"
echo "═══════════════════════════════════════"

echo "📦 ติดตั้ง dependencies..."
npm install

echo "🗄️ ตรวจสอบฐานข้อมูล..."
cd server-js
if ! npm run check-db; then
    echo "❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้"
    echo "📝 กรุณาตรวจสอบการตั้งค่าใน server-js/.env"
    exit 1
fi

echo "🌐 เริ่มต้นเซิร์ฟเวอร์..."
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="Backend Server" -- bash -c "npm run dev; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -title "Backend Server" -e "npm run dev; bash" &
else
    echo "เริ่มต้น Backend ใน background..."
    npm run dev &
fi

sleep 3

cd ../web
echo "⚛️ เริ่มต้น React Frontend..."
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="React Frontend" -- bash -c "npm run dev; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -title "React Frontend" -e "npm run dev; bash" &
else
    echo "เริ่มต้น React ใน background..."
    npm run dev &
fi

cd ../web-js
echo "🌐 เริ่มต้น JavaScript Frontend..."
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="JavaScript Frontend" -- bash -c "npm start; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -title "JavaScript Frontend" -e "npm start; bash" &
else
    echo "เริ่มต้น JavaScript Frontend ใน background..."
    npm start &
fi

cd ..
echo "✅ ระบบเริ่มต้นเรียบร้อยแล้ว!"
echo ""
echo "🌐 URL สำหรับเข้าใช้งาน:"
echo "- Backend API: http://localhost:4002"
echo "- React Frontend: http://localhost:5173"
echo "- JavaScript Frontend: http://localhost:3001"
echo ""
echo "👥 ข้อมูลล็อกอิน:"
echo "- admin/admin (ผู้ดูแลระบบ)"
echo "- planner/planner (งานแผน)"
echo "- procurement/procurement (งานพัสดุ)"
echo "- board/board (กรรมการ)"
echo ""

# รอให้ผู้ใช้กด Enter
read -p "กด Enter เพื่อออก..."
