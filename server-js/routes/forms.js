import { Router } from 'express';
import multer from 'multer';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';
import { pool } from '../db.js';

// 📌 auth middleware (ตอนนี้ข้ามไปก่อน แต่สามารถเพิ่มกลับมาได้ทีหลัง)
const router = Router();

// ==================
// 📂 ตั้งค่า Multer สำหรับอัปโหลดไฟล์ฟอร์ม
// ==================
const storage = multer.diskStorage({
  // กำหนดโฟลเดอร์เก็บไฟล์
  destination: (req, file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'forms');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); // ถ้าโฟลเดอร์ยังไม่มี → สร้างใหม่
    cb(null, dir);
  },
  // ตั้งชื่อไฟล์ (timestamp + ชื่อไฟล์ที่ sanitize แล้ว)
  filename: (req, file, cb) => {
    const originalname = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'); // ลบตัวอักษรพิเศษออก
    cb(null, `${Date.now()}-${originalname}`);
  }
});
const upload = multer({ storage });

// ==================
// 📌 ดึงรายการฟอร์มทั้งหมด (GET /)
// ==================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM downloadable_forms ORDER BY created_at DESC');
    res.json(rows); // ส่งข้อมูลรายการฟอร์มทั้งหมดกลับไป
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลฟอร์ม' });
  }
});

// ==================
// 📌 อัปโหลดฟอร์มใหม่ (POST /)
// ==================
router.post('/', upload.single('file'), async (req, res) => {
  const { title } = req.body; // ชื่อฟอร์ม
  const file = req.file; // ไฟล์ที่อัปโหลดเข้ามา

  // ตรวจสอบ input
  if (!title || !file) {
    return res.status(400).json({ message: 'ต้องระบุชื่อและไฟล์ฟอร์ม' });
  }

  // เก็บ path และชื่อไฟล์
  const file_path = file.path.replace(process.cwd(), '').replace(/\\/g, '/'); // ทำ path ให้ relative
  const file_name = file.originalname;

  try {
    // บันทึกข้อมูลฟอร์มลงฐานข้อมูล
    const [result] = await pool.query(
      'INSERT INTO downloadable_forms (title, file_name, file_path) VALUES (?, ?, ?)',
      [title, file_name, file_path]
    );
    res.status(201).json({ message: 'อัปโหลดฟอร์มเรียบร้อยแล้ว', id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกฟอร์มลงฐานข้อมูล' });
  }
});

// ==================
// 📌 ลบฟอร์ม (DELETE /:id)
// ==================
router.delete('/:id', async (req, res) => {
    const { id } = req.params; // รับค่า id ฟอร์มจาก URL เช่น /123
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. ค้นหาพาธไฟล์จากฐานข้อมูลก่อนลบ record
        const [rows] = await connection.query('SELECT file_path FROM downloadable_forms WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบฟอร์มที่ต้องการลบ' });
        }
        const filePath = rows[0].file_path;

        // 2. ลบ record ออกจากฐานข้อมูล
        await connection.query('DELETE FROM downloadable_forms WHERE id = ?', [id]);

        // 3. ลบไฟล์จริงจากเครื่อง
        if (filePath) {
            const absolutePath = resolve(process.cwd(), filePath.substring(1)); // ลบ "/" หน้าแรกออกแล้วทำให้เป็น absolute path
            if (existsSync(absolutePath)) {
                unlinkSync(absolutePath); // ลบไฟล์จริง
            }
        }

        await connection.commit();
        res.json({ message: 'ลบฟอร์มเรียบร้อยแล้ว' });

    } catch (e) {
        await connection.rollback();
        console.error(e);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบฟอร์ม' });
    } finally {
        connection.release(); // ปล่อย connection คืน
    }
});

export default router;
