import { Router } from 'express';
import { pool } from '../../db.js';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const router = Router();

// ✅ ลบไฟล์แนบ (Attachment) ตาม ID ที่ระบุ
router.delete('/:id', async (req, res) => {
  const { id } = req.params; // ดึง id ของไฟล์แนบจาก URL เช่น /attachments/123
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction(); // เริ่ม transaction เพื่อความปลอดภัยของข้อมูล

    // 1. ค้นหาไฟล์แนบจากฐานข้อมูลเพื่อหาพาธไฟล์
    const [rows] = await connection.query('SELECT file_path FROM attachments WHERE id = ?', [id]);
    if (rows.length === 0) {
      // ถ้าไม่พบไฟล์แนบ → ตอบกลับ 404
      return res.status(404).json({ message: 'ไม่พบไฟล์แนบที่ต้องการลบ' });
    }
    const attachment = rows[0];

    // 2. ลบไฟล์จริงออกจากเครื่อง (filesystem)
    if (attachment.file_path) {
      const fullPath = join(process.cwd(), attachment.file_path); // path เต็มของไฟล์
      if (existsSync(fullPath)) {
        unlinkSync(fullPath); // ลบไฟล์ออก
      }
    }

    // 3. ลบข้อมูลไฟล์แนบออกจากฐานข้อมูล
    await connection.query('DELETE FROM attachments WHERE id = ?', [id]);

    await connection.commit(); // ยืนยันการทำงาน (commit)
    res.status(200).json({ message: 'ลบไฟล์แนบเรียบร้อยแล้ว' });

  } catch (e) {
    await connection.rollback(); // ถ้ามี error → ยกเลิกการทำงาน (rollback)
    console.error('เกิดข้อผิดพลาดในการลบไฟล์แนบ:', e);
    res.status(500).json({ message: 'ไม่สามารถลบไฟล์แนบได้', error: e.message });
  } finally {
    connection.release(); // ปล่อย connection คืน
  }
});

export default router;
