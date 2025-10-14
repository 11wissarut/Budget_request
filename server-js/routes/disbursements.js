import { Router } from 'express';
import { pool } from '../../db.js';
import multer from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { authMiddleware } from '../auth-middleware.js'; 

const router = Router();

// 📂 กำหนดที่เก็บไฟล์แนบสำหรับการเบิกจ่าย
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = join(process.cwd(), 'uploads', 'disbursements');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); // ถ้าโฟลเดอร์ยังไม่มีให้สร้างใหม่
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // ตั้งชื่อไฟล์ใหม่กันซ้ำ
  }
});
const upload = multer({ storage });

// ✅ สร้างการเบิกจ่ายใหม่
router.post(
  '/',
  authMiddleware,               // ต้องล็อกอินก่อน
  upload.array('attachments', 10), // รองรับไฟล์แนบได้สูงสุด 10 ไฟล์
  async (req, res) => {
    try {
      // 🔒 role board / executive ไม่อนุญาตให้สร้างเบิกจ่าย
      if (['board', 'executive'].includes((req.user?.role || '').toLowerCase())) {
        return res.status(403).json({ message: 'คุณไม่มีสิทธิ์สร้างการเบิกจ่าย' });
      }

      // 📥 รับค่าจาก body
      const {
        requestId,
        disbursedAmount,
        disbursedDate,
        note,
        userId
      } = req.body;

      const requestedDisbursement = parseFloat(disbursedAmount);

      // 📌 ตรวจสอบว่ามีค่าที่จำเป็นครบไหม
      if (!requestId || isNaN(requestedDisbursement) || requestedDisbursement <= 0 || !disbursedDate) {
        return res.status(400).json({
          message: 'กรุณากรอกข้อมูลให้ครบ: requestId, disbursedAmount, disbursedDate'
        });
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // 1️⃣ ดึงข้อมูลคำขอ + ยอดที่อนุมัติ + ยอดเบิกจ่ายปัจจุบัน และ lock แถวนี้ไว้
        const [statusRows] = await connection.query(
          `
          SELECT
            br.approved_amount,
            br.status,
            COALESCE(SUM(d.disbursed_amount), 0) AS total_disbursed
          FROM budget_requests br
          LEFT JOIN disbursements d ON br.id = d.request_id
          WHERE br.id = ?
          GROUP BY br.id
          FOR UPDATE
        `,
          [requestId]
        );

        if (statusRows.length === 0) {
          await connection.rollback();
          return res.status(404).json({ message: 'ไม่พบคำขอที่ต้องการเบิกจ่าย' });
        }

        const { approved_amount, status } = statusRows[0];
        const total_disbursed = parseFloat(statusRows[0].total_disbursed);
        const remainingBalance = parseFloat(approved_amount) - total_disbursed;

        // 2️⃣ เช็กสถานะ ต้องผ่านการอนุมัติแล้วเท่านั้นถึงจะเบิกได้
        if (!['approved', 'partially_disbursed'].includes(status)) {
          await connection.rollback();
          return res.status(400).json({ message: `ไม่สามารถเบิกจ่ายได้ เนื่องจากสถานะปัจจุบันคือ: ${status}` });
        }

        // 3️⃣ ถ้าเบิกครบแล้ว ห้ามเบิกเพิ่ม
        if (status === 'disbursed') {
          await connection.rollback();
          return res.status(400).json({ message: 'คำขอนี้ถูกเบิกจ่ายครบแล้ว' });
        }

        // 4️⃣ ตรวจสอบยอดที่ต้องการเบิก ห้ามเกินยอดคงเหลือ
        if (requestedDisbursement > remainingBalance + 0.001) {
          await connection.rollback();
          return res.status(400).json({
            message: `ยอดที่ต้องการเบิก (${requestedDisbursement}) มากกว่ายอดคงเหลือ (${remainingBalance.toFixed(2)})`
          });
        }

        // 5️⃣ บันทึกข้อมูลการเบิกจ่าย
        const disbursement = {
          request_id: requestId,
          disbursed_amount: requestedDisbursement,
          disbursed_date: disbursedDate,
          note: note || null,
          created_by: userId || req.user.id
        };
        const [insertResult] = await connection.query('INSERT INTO disbursements SET ?', disbursement);
        const disbursementId = insertResult.insertId;

        // 6️⃣ บันทึกไฟล์แนบถ้ามี
        const files = req.files || [];
        if (files.length > 0) {
          const attachmentValues = files.map(file => {
            const decodedFilename = Buffer.from(file.originalname, 'latin1').toString('utf8'); // รองรับชื่อไฟล์ภาษาไทย
            const filePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
            return [disbursementId, decodedFilename, filePath];
          });
          await connection.query(
            'INSERT INTO disbursement_attachments (disbursement_id, file_name, file_path) VALUES ?',
            [attachmentValues]
          );
        }

        // 7️⃣ อัปเดตสถานะคำขอ ถ้าเบิกหมดแล้ว = disbursed ไม่หมด = partially_disbursed
        const newTotalDisbursed = total_disbursed + requestedDisbursement;
        let newStatus = 'partially_disbursed';
        if (newTotalDisbursed >= parseFloat(approved_amount) - 0.001) {
          newStatus = 'disbursed';
        }

        await connection.query('UPDATE budget_requests SET status = ? WHERE id = ?', [newStatus, requestId]);

        await connection.commit();

        // ✅ คืนค่าพร้อมยอดคงเหลือใหม่
        const remainingAfter = parseFloat(approved_amount) - newTotalDisbursed;

        res.status(201).json({ 
          message: 'บันทึกการเบิกจ่ายเรียบร้อย', 
          newStatus, 
          remainingBalance: remainingAfter.toFixed(2) 
        });
      } catch (e) {
        await connection.rollback();
        console.error(e);
        res.status(500).json({ message: 'ไม่สามารถบันทึกการเบิกจ่ายได้', error: e.message });
      }
    } catch (e) {
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ', error: e.message });
    }
  }
);

export default router;
