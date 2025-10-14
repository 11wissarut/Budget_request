// server-js/routes/requests.js
import { Router } from 'express';
import multer from 'multer';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { pool } from '../src/db.js';
import { randomUUID } from 'crypto';
import { authRequired } from '../src/auth.js'; // ✅ ใช้ JWT ดึง req.user

const router = Router();

const CAN_APPROVE_ROLES = new Set(['admin', 'board', 'planner']);
const CAN_WRITE_ROLES = new Set(['admin', 'planner', 'procurement']); // board = read-only

// สร้าง id สำหรับคำขอใหม่
const generateRequestId = (req, _res, next) => {
  req.id = `req-${randomUUID()}`;
  next();
};

// ตั้งค่า multer เก็บไฟล์ใบเสนอราคา/ไฟล์ประกอบ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = file.fieldname === 'attachments' ? 'attachments' : 'quotations';
    const dir = join(process.cwd(), 'uploads', uploadDir, req.id || req.params.id);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// helper: แปลง path เป็น absolute
const toAbs = (p) => {
  if (!p) return null;
  return join(process.cwd(), '.' + (p.startsWith('/') ? p : '/' + p));
};

/** ---------- helpers: auth/ownership ---------- */
async function getRequestRow(id, conn = pool) {
  const [rows] = await conn.query('SELECT id, created_by, status FROM budget_requests WHERE id=?', [id]);
  return rows[0] || null;
}
function deny(res, code = 403, msg = 'forbidden') {
  return res.status(code).json({ message: msg });
}
/**
 * สิทธิ์แก้ไข:
 * - admin / planner: แก้ได้ทุกคำขอ
 * - procurement: แก้ได้เฉพาะคำขอที่ "ตัวเองสร้าง" และสถานะต้อง pending
 * - board: ห้ามแก้
 */
function canModifyRequest(role, userId, row) {
  if (!row) return false;
  const status = (row.status || '').toLowerCase();
  if (role === 'admin' || role === 'planner') return true;
  if (role === 'procurement') return row.created_by === userId && status === 'pending';
  return false; // board / อื่นๆ
}

/** ---------- READ endpoints ---------- */

// GET all requests (มี total_disbursed & remaining_balance)
router.get('/', authRequired, async (_req, res) => {
  try {
    const [requests] = await pool.query(`
      SELECT 
        br.*,
        u.name AS created_by_name,
        COALESCE(d_sum.total_disbursed, 0) AS total_disbursed,
        GREATEST(COALESCE(br.approved_amount,0) - COALESCE(d_sum.total_disbursed,0), 0) AS remaining_balance
      FROM budget_requests br
      LEFT JOIN users u ON br.created_by = u.id
      LEFT JOIN (
        SELECT request_id, SUM(disbursed_amount) AS total_disbursed
        FROM disbursements
        GROUP BY request_id
      ) AS d_sum ON br.id = d_sum.request_id
      ORDER BY br.created_at DESC
    `);

    for (let r of requests) {
      if (r.category === 'EQUIPMENT') {
        const [details] = await pool.query('SELECT * FROM equipment_details WHERE request_id = ?', [r.id]);
        r.details = details[0] || null;
      }
      const [quotations] = await pool.query(
        'SELECT id, file_name, file_path, vendor_index FROM quotations WHERE request_id = ? ORDER BY vendor_index ASC',
        [r.id]
      );
      const [attachments] = await pool.query(
        'SELECT id, file_name, file_path FROM attachments WHERE request_id = ?',
        [r.id]
      );

      r.quotations = quotations.map(q => ({
        id: q.id,
        fileName: q.file_name,
        filePath: q.file_path,
        vendorIndex: q.vendor_index
      }));
      r.attachments = attachments.map(a => ({
        id: a.id,
        fileName: a.file_name,
        filePath: a.file_path
      }));
    }

    res.json(requests);
  } catch (e) {
    console.error('Error in GET /requests:', e);
    res.status(500).json({ message: 'Error fetching requests' });
  }
});

// GET list for disbursement
router.get('/for-disbursement', authRequired, async (_req, res) => {
  try {
    const [requests] = await pool.query(`
      SELECT
        br.id, br.title, br.fiscal_year, br.approved_amount, br.status,
        COALESCE(d_sum.total_disbursed, 0) AS total_disbursed,
        GREATEST(COALESCE(br.approved_amount,0) - COALESCE(d_sum.total_disbursed,0), 0) AS remaining_balance
      FROM budget_requests br
      LEFT JOIN (
        SELECT request_id, SUM(disbursed_amount) AS total_disbursed
        FROM disbursements
        GROUP BY request_id
      ) AS d_sum ON br.id = d_sum.request_id
      WHERE br.status IN ('approved', 'partially_disbursed', 'disbursed')
      ORDER BY br.created_at DESC
    `);
  res.json(requests);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error fetching requests for disbursement' });
  }
});

// GET single request
router.get('/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        br.*,
        u.name AS created_by_name,
        COALESCE(d_sum.total_disbursed, 0) AS total_disbursed,
        GREATEST(COALESCE(br.approved_amount,0) - COALESCE(d_sum.total_disbursed,0), 0) AS remaining_balance
      FROM budget_requests br
      LEFT JOIN users u ON br.created_by = u.id
      LEFT JOIN (
        SELECT request_id, SUM(disbursed_amount) AS total_disbursed
        FROM disbursements
        WHERE request_id = ?
        GROUP BY request_id
      ) AS d_sum ON br.id = d_sum.request_id
      WHERE br.id = ?
      LIMIT 1
    `, [id, id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Request not found' });
    const request = rows[0];

    if (request.category === 'EQUIPMENT') {
      const [details] = await pool.query('SELECT * FROM equipment_details WHERE request_id = ? LIMIT 1',[id]);
      request.details = details?.[0] || null;
    }

    const [quotations]  = await pool.query(
      'SELECT id,file_name,file_path,vendor_index FROM quotations WHERE request_id = ? ORDER BY vendor_index ASC',[id]
    );
    const [attachments] = await pool.query(
      'SELECT id,file_name,file_path FROM attachments WHERE request_id = ?', [id]
    );
    const [disbursements] = await pool.query(
      'SELECT id, request_id, disbursed_amount, disbursed_date, note, created_by, created_at FROM disbursements WHERE request_id = ? ORDER BY disbursed_date DESC',
      [id]
    );
    for (const d of (disbursements || [])) {
      const [das] = await pool.query(
        'SELECT id, file_name, file_path FROM disbursement_attachments WHERE disbursement_id = ?',
        [d.id]
      );
      d.attachments = das || [];
    }

    request.quotations    = (quotations  || []).map(q => ({ id:q.id, fileName:q.file_name, filePath:q.file_path, vendorIndex:q.vendor_index }));
    request.attachments   = (attachments || []).map(a => ({ id:a.id, fileName:a.file_name, filePath:a.file_path }));
    request.disbursements = disbursements || [];

    res.json(request);
  } catch (e) {
    console.error('GET /api/requests/:id error:', e?.sqlMessage || e);
    res.status(500).json({ message: 'Error fetching request', error: e?.sqlMessage || String(e) });
  }
});

/** ---------- WRITE endpoints (ตรวจสิทธิ์) ---------- */

// POST สร้างคำขอ
router.post(
  '/',
  authRequired,
  (req, res, next) => {
    if (!CAN_WRITE_ROLES.has((req.user?.role || '').toLowerCase())) return deny(res);
    next();
  },
  generateRequestId,
  upload.fields([
    { name: 'quotations', maxCount: 10 },
    { name: 'attachments', maxCount: 10 },
  ]),
  async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { 
        title, fiscal_year, category, total_amount, note,
        construction_type,
        equipment_type, quantity, unit, price_per_unit
      } = req.body;

      const requestId = req.id;

      const budgetRequest = {
        id: requestId,
        title,
        fiscal_year: parseInt(fiscal_year),
        category,
        total_amount: parseFloat(total_amount),
        note,
        created_by: req.user?.id || 'user-planner'
      };

      if (category === 'CONSTRUCTION') {
        budgetRequest.construction_type = construction_type;
      }

      await connection.query('INSERT INTO budget_requests SET ?', budgetRequest);

      if (category === 'EQUIPMENT') {
        if (!equipment_type || !quantity || !unit || !price_per_unit) {
          throw new Error('Missing equipment details');
        }
        const equipmentDetails = {
          request_id: requestId,
          equipment_type,
          quantity: parseInt(quantity),
          unit,
          price_per_unit: parseFloat(price_per_unit)
        };
        await connection.query('INSERT INTO equipment_details SET ?', equipmentDetails);
      }

      // ใบเสนอราคา
      const quotationFiles = req.files?.quotations || [];
      if (quotationFiles.length > 0) {
        const quotationValues = quotationFiles.map((file, i) => {
          const decodedFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
          const filePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
          return [ requestId, i + 1, decodedFilename, filePath ];
        });
        await connection.query(
          'INSERT INTO quotations (request_id, vendor_index, file_name, file_path) VALUES ?',
          [quotationValues]
        );
      }

      // ไฟล์ประกอบ
      const attachmentFiles = req.files?.attachments || [];
      if (attachmentFiles.length > 0) {
        const attachmentValues = attachmentFiles.map(file => {
          const decodedFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
          const filePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
          return [ requestId, decodedFilename, filePath ];
        });
        await connection.query(
          'INSERT INTO attachments (request_id, file_name, file_path) VALUES ?',
          [attachmentValues]
        );
      }

      await connection.commit();
      res.status(201).json({ message: 'Request created successfully', id: requestId });

    } catch (e) {
      await connection.rollback();
      console.error(e);
      res.status(500).json({ message: 'Failed to create request', error: e.message });
    } finally {
      connection.release();
    }
  }
);

// ✅ PUT อนุมัติ — วงเงินอนุมัติห้ามเกินวงเงินที่ขอ
router.put('/:id/approve', authRequired, async (req, res) => {
  const role = (req.user?.role || '').toLowerCase();
  if (!CAN_APPROVE_ROLES.has(role)) return deny(res);

  const { id } = req.params;
  const rawAmount = req.body?.approvedAmount;
  const approvalNote = req.body?.approvalNote ?? null;

  // แปลงและตรวจค่าที่กรอก
  const approvedAmount = Number.parseFloat(rawAmount);
  if (!Number.isFinite(approvedAmount) || approvedAmount < 0) {
    return res.status(400).json({ message: 'วงเงินอนุมัติต้องเป็นตัวเลขและไม่ติดลบ' });
  }

  try {
    // ดึง “วงเงินที่ขอ”
    const [rows] = await pool.query(
      'SELECT total_amount FROM budget_requests WHERE id = ? LIMIT 1',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบคำขอ' });

    const requestedTotal = Number(rows[0].total_amount || 0);

    // ✅ ตรวจ: อนุมัติห้ามเกินที่ขอ
    if (approvedAmount > requestedTotal + 0.000001) {
      return res.status(400).json({
        message: `วงเงินอนุมัติห้ามเกินวงเงินที่ขอ (${requestedTotal.toLocaleString('th-TH')} บาท)`
      });
    }

    // ผ่านเงื่อนไข → อัปเดตเป็นอนุมัติ
    await pool.query(
      'UPDATE budget_requests SET status = ?, approved_amount = ?, approval_note = ? WHERE id = ?',
      ['approved', approvedAmount, approvalNote, id]
    );
    res.json({ message: 'อนุมัติคำขอสำเร็จ' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error approving request' });
  }
});

// PUT reject
router.put('/:id/reject', authRequired, async (req, res) => {
  const role = (req.user?.role || '').toLowerCase();
  if (!CAN_APPROVE_ROLES.has(role)) return deny(res);

  const { id } = req.params;
  try {
    await pool.query('UPDATE budget_requests SET status = ? WHERE id = ?', ['rejected', id]);
    res.json({ message: 'Request rejected successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error rejecting request' });
  }
});

// PUT update (re-upload) — ตรวจเจ้าของกรณี procurement
router.put(
  '/:id',
  authRequired,
  upload.fields([
    { name: 'quotations', maxCount: 10 },
    { name: 'attachments', maxCount: 10 },
  ]),
  async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // ตรวจสิทธิ์ตามเจ้าของ/บทบาท
      const row = await getRequestRow(id, connection);
      const role = (req.user?.role || '').toLowerCase();
      const uid  = req.user?.id || '';
      if (!canModifyRequest(role, uid, row)) {
        await connection.rollback();
        return deny(res);
      }

      const { 
        title, fiscal_year, category, total_amount, note,
        equipment_type, quantity, unit, price_per_unit
      } = req.body;

      // แปลงตัวเลขกัน NaN
      const totalAmt = Number.parseFloat(total_amount);
      const fy = Number.parseInt(fiscal_year);
      if (!Number.isFinite(totalAmt) || !Number.isFinite(fy)) {
        await connection.rollback();
        return res.status(400).json({ message: 'ข้อมูลตัวเลขไม่ถูกต้อง' });
      }

      const budgetRequest = {
        title,
        fiscal_year: fy,
        category,
        total_amount: totalAmt,
        note
      };
      await connection.query('UPDATE budget_requests SET ? WHERE id = ?', [budgetRequest, id]);

      // equipment (ปรับตามหมวด)
      await connection.query('DELETE FROM equipment_details WHERE request_id = ?', [id]);
      if (category === 'EQUIPMENT') {
        if (!equipment_type || !quantity || !unit || !price_per_unit) {
          throw new Error('Missing equipment details');
        }
        const equipmentDetails = {
          request_id: id,
          equipment_type,
          quantity: parseInt(quantity),
          unit,
          price_per_unit: parseFloat(price_per_unit)
        };
        await connection.query('INSERT INTO equipment_details SET ?', equipmentDetails);
      }

      // หมายเหตุ: ถ้า “ไม่อัปโหลดไฟล์ใหม่” จะคงไฟล์เดิมไว้ (เราไม่ลบของเก่า)
      // → จึง "ลบไฟล์เดิม" เฉพาะกรณีที่แนบไฟล์ใหม่เข้ามาเท่านั้น

      // ใบเสนอราคา
      const quotationFiles = req.files?.quotations || [];
      if (quotationFiles.length > 0) {
        // ลบไฟล์/แถวเก่าก่อน
        const [oldQuotations] = await connection.query('SELECT file_path FROM quotations WHERE request_id = ?', [id]);
        for (const q of oldQuotations) {
          const fp = toAbs(q.file_path);
          try { if (fp && existsSync(fp)) unlinkSync(fp); } catch {}
        }
        await connection.query('DELETE FROM quotations WHERE request_id = ?', [id]);

        // แทรกไฟล์ใหม่
        const quotationValues = quotationFiles.map((file, i) => {
          const decodedFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
          const filePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
          return [ id, i + 1, decodedFilename, filePath ];
        });
        await connection.query(
          'INSERT INTO quotations (request_id, vendor_index, file_name, file_path) VALUES ?',
          [quotationValues]
        );
      }

      // ไฟล์ประกอบ
      const attachmentFiles = req.files?.attachments || [];
      if (attachmentFiles.length > 0) {
        // ลบไฟล์/แถวเก่าก่อน
        const [oldAttachments] = await connection.query('SELECT file_path FROM attachments WHERE request_id = ?', [id]);
        for (const a of oldAttachments) {
          const fp = toAbs(a.file_path);
          try { if (fp && existsSync(fp)) unlinkSync(fp); } catch {}
        }
        await connection.query('DELETE FROM attachments WHERE request_id = ?', [id]);

        // แทรกไฟล์ใหม่
        const attachmentValues = attachmentFiles.map(file => {
          const decodedFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');
          const filePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
          return [ id, decodedFilename, filePath ];
        });
        await connection.query(
          'INSERT INTO attachments (request_id, file_name, file_path) VALUES ?',
          [attachmentValues]
        );
      }

      await connection.commit();
      res.status(200).json({ message: 'Request updated successfully', id });

    } catch (e) {
      await connection.rollback();
      console.error(e);
      res.status(500).json({ message: 'Failed to update request', error: e.message });
    } finally {
      connection.release();
    }
  }
);

// DELETE คำขอ
router.delete('/:id', authRequired, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    // ตรวจสิทธิ์ก่อน
    const row = await getRequestRow(id, connection);
    const role = (req.user?.role || '').toLowerCase();
    const uid  = req.user?.id || '';
    if (!canModifyRequest(role, uid, row)) {
      await connection.rollback();
      return deny(res);
    }

    // ลบไฟล์/เรคอร์ด quotations
    const [qFiles] = await connection.query('SELECT file_path FROM quotations WHERE request_id = ?', [id]);
    for (const q of qFiles) {
      const fp = toAbs(q.file_path);
      try { if (fp && existsSync(fp)) unlinkSync(fp); } catch {}
    }
    await connection.query('DELETE FROM quotations WHERE request_id = ?', [id]);

    // ลบไฟล์/เรคอร์ด attachments
    const [aFiles] = await connection.query('SELECT file_path FROM attachments WHERE request_id = ?', [id]);
    for (const a of aFiles) {
      const fp = toAbs(a.file_path);
      try { if (fp && existsSync(fp)) unlinkSync(fp); } catch {}
    }
    await connection.query('DELETE FROM attachments WHERE request_id = ?', [id]);

    // ลบ disbursement attachments -> disbursements (ถ้ามี)
    const [disbs] = await connection.query('SELECT id FROM disbursements WHERE request_id = ?', [id]);
    if (disbs.length > 0) {
      const ids = disbs.map(d => d.id);
      const [das] = await connection.query(
        'SELECT file_path FROM disbursement_attachments WHERE disbursement_id IN (?)',
        [ids]
      );
      for (const f of das) {
        const fp = toAbs(f.file_path);
        try { if (fp && existsSync(fp)) unlinkSync(fp); } catch {}
      }
      await connection.query('DELETE FROM disbursement_attachments WHERE disbursement_id IN (?)', [ids]);
      await connection.query('DELETE FROM disbursements WHERE request_id = ?', [id]);
    }

    // ลบรายละเอียดอุปกรณ์ (ถ้ามี)
    await connection.query('DELETE FROM equipment_details WHERE request_id = ?', [id]);

    // ลบแม่
    await connection.query('DELETE FROM budget_requests WHERE id = ?', [id]);

    await connection.commit();
    return res.status(204).send();
  } catch (e) {
    await connection.rollback();
    console.error('DELETE /api/requests error:', e);
    if (e?.code === 'ER_ROW_IS_REFERENCED_2' || e?.errno === 1451) {
      return res.status(409).json({ message: 'Cannot delete: related records exist' });
    }
    return res.status(500).json({ message: 'Failed to delete request', error: e.message });
  } finally {
    connection.release();
  }
});

export default router;
