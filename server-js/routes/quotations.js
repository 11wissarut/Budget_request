import { Router } from 'express';
import multer from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { pool } from '../db.js';
import { authRequired, allowModules } from '../middleware.js';

const router = Router();

// =============================
// 📂 ตั้งค่า multer สำหรับจัดเก็บไฟล์ใบเสนอราคา (quotations)
// =============================
const storage = multer.diskStorage({
  // กำหนดโฟลเดอร์ปลายทางสำหรับเก็บไฟล์
  destination: (req, file, cb) => {
    // แต่ละคำขอ (requestId) จะมีโฟลเดอร์ย่อยของตัวเอง
    const dir = join(process.cwd(), 'uploads', 'quotations', String(req.params.requestId));
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); // ถ้าไม่มีโฟลเดอร์ → สร้างขึ้นมา
    cb(null, dir);
  },
  // ตั้งชื่อไฟล์ โดยผูกกับ vendor_no + timestamp
  filename: (req, file, cb) => {
    const vendorNo = (req.body.vendor_no || '1').toString().replace(/[^0-9]/g,''); 
    cb(null, `vendor${vendorNo}-${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// =============================
// 📌 POST อัปโหลดไฟล์ใบเสนอราคาใหม่
// =============================
router.post('/:requestId/quotations', 
  authRequired,                   // ✅ ต้องล็อกอินก่อน
  allowModules('requests'),       // ✅ ต้องมีสิทธิ์ใช้งานโมดูล "requests"
  upload.array('files', 10),      // รองรับอัปโหลดได้สูงสุด 10 ไฟล์
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { vendor_no, vendor_name, amount } = req.body;
      const files = req.files || [];

      // ถ้าไม่มีไฟล์ส่งมาเลย → แจ้ง error
      if (files.length === 0) return res.status(400).json({ message: 'No files' });

      // เตรียม values สำหรับ insert ลงฐานข้อมูล
      const values = files.map(f => [
        requestId, 
        Number(vendor_no || 1), 
        vendor_name, 
        Number(amount || 0),
        f.path.replace(process.cwd() + require('path').sep,'').replace(/\\/g,'/') // เก็บ path แบบ relative
      ]);

      // บันทึกข้อมูลใบเสนอราคา + path ไฟล์
      await pool.query(
        `INSERT INTO request_quotations (request_id, vendor_no, vendor_name, amount, file_path)
         VALUES ${values.map(()=>'(?,?,?,?,?)').join(',')}`, values.flat()
      );

      res.json({ ok: true });
    } catch (e) { 
      console.error(e); 
      res.status(500).json({ message: 'Upload error' }); 
    }
});

// =============================
// 📌 GET ดึงรายการใบเสนอราคาทั้งหมดของคำขอนี้
// =============================
router.get('/:requestId/quotations', 
  authRequired, 
  allowModules('requests'), 
  async (req, res) => {
    const [rows] = await pool.query(
      `SELECT quotation_id, vendor_no, vendor_name, amount, file_path, created_at
       FROM request_quotations 
       WHERE request_id=? 
       ORDER BY vendor_no ASC, quotation_id ASC`,
       [req.params.requestId]
    );
    res.json(rows);
});

// =============================
// 📌 export router ออกไปใช้งาน
// =============================
export default router;
