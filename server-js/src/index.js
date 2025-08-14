import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import bcrypt from 'bcryptjs'
import { pool, initDatabase, seedIfEmpty, dbGet, dbAll, dbRun } from './db.js'
import { signToken, authRequired, allowModules } from './auth.js'

const PORT = Number(process.env.PORT || 4001)
const app = express()

// เปิด CORS + parser
app.use(cors({ origin: true }))
app.use(express.json({ limit: '10mb' }))

// Static dirs: แบบฟอร์ม (แจกจ่าย) และไฟล์อัปโหลด
const formsDir = join(process.cwd(), 'public', 'forms')
const uploadsDir = join(process.cwd(), 'uploads')
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })

// Static files with proper headers
app.use('/static/forms', (req, res, next) => {
  res.setHeader('Content-Disposition', 'attachment')
  express.static(formsDir)(req, res, next)
})
app.use('/static/uploads', express.static(uploadsDir))

// ตั้งค่า multer สำหรับรับไฟล์อัปโหลด
const upload = multer({ dest: uploadsDir })

// ฟังก์ชันจำแนกประเภทไฟล์
function getFileType(ext) {
  const documentTypes = ['pdf', 'doc', 'docx', 'odt', 'rtf', 'txt']
  const spreadsheetTypes = ['xls', 'xlsx', 'ods', 'csv']
  const presentationTypes = ['ppt', 'pptx', 'odp']
  const webTypes = ['html', 'htm']
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff', 'tif']
  const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz']

  if (documentTypes.includes(ext)) return 'document'
  if (spreadsheetTypes.includes(ext)) return 'spreadsheet'
  if (presentationTypes.includes(ext)) return 'presentation'
  if (webTypes.includes(ext)) return 'web'
  if (imageTypes.includes(ext)) return 'image'
  if (archiveTypes.includes(ext)) return 'archive'
  return 'other'
}

// เริ่มต้นฐานข้อมูล + seed data
async function startServer() {
  try {
    await initDatabase()
    await seedIfEmpty()
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  }
}

startServer()

// ----------------- AUTH -----------------
// POST /api/auth/login — ล็อกอินและออก token
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body ?? {}
    const row = await dbGet('SELECT id,name,username,password_hash,role FROM users WHERE username=?', [username])
    if (!row) return res.status(401).json({ message: 'Invalid credentials' })
    const ok = bcrypt.compareSync(password || '', row.password_hash)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
    const user = { id: row.id, name: row.name, username: row.username, role: row.role }
    const token = signToken(user)
    res.json({ user, token })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// ----------------- USERS (admin เท่านั้น) -----------------
app.get('/api/users', authRequired, allowModules('users'), async (req, res) => {
  try {
    const rows = await dbAll('SELECT id,name,username,role,password_hash FROM users')
    res.json(rows)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/users', authRequired, allowModules('users'), async (req, res) => {
  try {
    const { name, username, password, role } = req.body ?? {}
    if (!name || !username || !password || !role) return res.status(400).json({ message: 'missing fields' })
    const id = crypto.randomUUID()
    const hash = bcrypt.hashSync(password, 10)
    try {
      await dbRun('INSERT INTO users (id,name,username,password_hash,role) VALUES (?,?,?,?,?)', [id, name, username, hash, role])
    } catch (e) {
      return res.status(400).json({ message: 'username exists' })
    }
    const row = await dbGet('SELECT id,name,username,role,password_hash FROM users WHERE id=?', [id])
    res.status(201).json(row)
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.put('/api/users/:id', authRequired, allowModules('users'), async (req, res) => {
  try {
    const id = req.params.id
    const { name, username, password, role } = req.body ?? {}
    const current = await dbGet('SELECT * FROM users WHERE id=?', [id])
    if (!current) return res.sendStatus(404)
    const hash = password ? bcrypt.hashSync(password, 10) : current.password_hash
    await dbRun('UPDATE users SET name=?, username=?, password_hash=?, role=? WHERE id=?', [name ?? current.name, username ?? current.username, hash, role ?? current.role, id])
    const row = await dbGet('SELECT id,name,username,role,password_hash FROM users WHERE id=?', [id])
    res.json(row)
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.delete('/api/users/:id', authRequired, allowModules('users'), async (req, res) => {
  try {
    const id = req.params.id
    await dbRun('DELETE FROM users WHERE id=?', [id])
    res.sendStatus(204)
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// ----------------- REQUESTS (planner/admin แก้ไขได้, ผู้อื่นดูได้/ซ่อน UI) -----------------
app.get('/api/requests', authRequired, allowModules('dashboard','forms_download','forms_submit','requests','users'), async (req, res) => {
  try {
    // อนุญาตทุก role ที่ login แล้วเข้าถึงแดชบอร์ดได้เพื่ออ่านข้อมูล
    const rows = await dbAll('SELECT * FROM requests ORDER BY createdAt DESC')
    res.json(rows)
  } catch (error) {
    console.error('Get requests error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/requests', authRequired, allowModules('requests'), upload.single('file'), async (req, res) => {
  try {
    const { title, category, fiscalYear, amount, note } = req.body ?? {}
    if (!title || !category || !fiscalYear || !amount) return res.status(400).json({ message: 'missing fields' })

    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()

    let fileName = null
    let fileUrl = null

    if (req.file) {
      fileName = req.file.originalname
      fileUrl = `/static/uploads/${req.file.filename}`
    }

    await dbRun('INSERT INTO requests (id,title,category,fiscalYear,amount,note,fileName,fileUrl,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [id, title, category, Number(fiscalYear), Number(amount), note || '', fileName, fileUrl, 'pending', createdAt])
    const row = await dbGet('SELECT * FROM requests WHERE id=?', [id])
    res.status(201).json(row)
  } catch (error) {
    console.error('Create request error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.put('/api/requests/:id', authRequired, allowModules('requests'), async (req, res) => {
  try {
    const id = req.params.id
    const current = await dbGet('SELECT * FROM requests WHERE id=?', [id])
    if (!current) return res.sendStatus(404)
    const { title, category, fiscalYear, amount, status } = req.body ?? {}
    await dbRun('UPDATE requests SET title=?, category=?, fiscalYear=?, amount=?, status=? WHERE id=?', [
      title ?? current.title,
      category ?? current.category,
      Number(fiscalYear ?? current.fiscalYear),
      Number(amount ?? current.amount),
      status ?? current.status,
      id
    ])
    const row = await dbGet('SELECT * FROM requests WHERE id=?', [id])
    res.json(row)
  } catch (error) {
    console.error('Update request error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.put('/api/requests/:id/approve', authRequired, allowModules('requests'), async (req, res) => {
  try {
    const id = req.params.id
    const { approvedAmount, approvalNote } = req.body

    const current = await dbGet('SELECT * FROM requests WHERE id=?', [id])
    if (!current) return res.sendStatus(404)

    // ใช้วงเงินเดิมถ้าไม่ได้ระบุวงเงินที่อนุมัติ
    const finalApprovedAmount = approvedAmount !== undefined ? approvedAmount : current.amount

    await dbRun(
      'UPDATE requests SET status=?, approvedAmount=?, approvalNote=? WHERE id=?',
      ['approved', finalApprovedAmount, approvalNote || null, id]
    )

    const updated = await dbGet('SELECT * FROM requests WHERE id=?', [id])
    res.json(updated)
  } catch (error) {
    console.error('Approve request error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.put('/api/requests/:id/reject', authRequired, allowModules('requests'), async (req, res) => {
  try {
    const id = req.params.id
    const current = await dbGet('SELECT * FROM requests WHERE id=?', [id])
    if (!current) return res.sendStatus(404)

    await dbRun('UPDATE requests SET status=? WHERE id=?', ['rejected', id])

    const updated = await dbGet('SELECT * FROM requests WHERE id=?', [id])
    res.json(updated)
  } catch (error) {
    console.error('Reject request error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.put('/api/requests/:id/toggle-status', authRequired, allowModules('requests'), async (req, res) => {
  try {
    const id = req.params.id
    const current = await dbGet('SELECT * FROM requests WHERE id=?', [id])
    if (!current) return res.sendStatus(404)

    const newStatus = current.status === 'approved' ? 'pending' : 'approved'
    await dbRun('UPDATE requests SET status=? WHERE id=?', [newStatus, id])

    const updated = await dbGet('SELECT * FROM requests WHERE id=?', [id])
    res.json(updated)
  } catch (error) {
    console.error('Toggle request status error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.delete('/api/requests/:id', authRequired, allowModules('requests'), async (req, res) => {
  try {
    const id = req.params.id
    await dbRun('DELETE FROM requests WHERE id=?', [id])
    res.sendStatus(204)
  } catch (error) {
    console.error('Delete request error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// ----------------- SUBMISSIONS (planner/procurement/admin ส่งได้) -----------------
app.get('/api/submissions', authRequired, allowModules('forms_submit','forms_download','dashboard','requests','users'), async (req, res) => {
  try {
    const rows = await dbAll('SELECT id,name,note,fileName,filePath,createdAt FROM submissions ORDER BY createdAt DESC')
    // ส่งคืน fileUrl เพื่อให้ฝั่งหน้าเว็บดาวน์โหลดได้
    res.json(rows.map((s) => ({ ...s, fileUrl: `/static/uploads/${s.filePath}` })))
  } catch (error) {
    console.error('Get submissions error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/submissions', authRequired, allowModules('forms_submit'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'file required' })
    const { name, note } = req.body
    const id = crypto.randomUUID()
    const item = {
      id,
      name,
      note,
      fileName: req.file.originalname,
      filePath: req.file.filename,
      createdAt: new Date().toISOString()
    }
    await dbRun('INSERT INTO submissions (id,name,note,fileName,filePath,createdAt) VALUES (?,?,?,?,?,?)', [item.id, item.name, item.note ?? null, item.fileName, item.filePath, item.createdAt])
    res.status(201).json({ ...item, fileUrl: `/static/uploads/${item.filePath}` })
  } catch (error) {
    console.error('Create submission error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// ----------------- FORMS (ดาวน์โหลดแบบฟอร์ม) -----------------
app.get('/api/forms', (req, res) => {
  try {
    if (!existsSync(formsDir)) {
      mkdirSync(formsDir, { recursive: true })
    }

    const files = readdirSync(formsDir).filter(name => {
      const ext = name.toLowerCase()
      // Document formats
      const documents = ext.endsWith('.pdf') || ext.endsWith('.doc') || ext.endsWith('.docx') ||
                       ext.endsWith('.odt') || ext.endsWith('.rtf') || ext.endsWith('.txt')
      // Spreadsheet formats
      const spreadsheets = ext.endsWith('.xls') || ext.endsWith('.xlsx') || ext.endsWith('.ods') ||
                          ext.endsWith('.csv')
      // Presentation formats
      const presentations = ext.endsWith('.ppt') || ext.endsWith('.pptx') || ext.endsWith('.odp')
      // Web formats
      const web = ext.endsWith('.html') || ext.endsWith('.htm')
      // Image formats
      const images = ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') ||
                    ext.endsWith('.gif') || ext.endsWith('.bmp') || ext.endsWith('.svg') ||
                    ext.endsWith('.webp') || ext.endsWith('.tiff') || ext.endsWith('.tif')
      // Archive formats
      const archives = ext.endsWith('.zip') || ext.endsWith('.rar') || ext.endsWith('.7z') ||
                      ext.endsWith('.tar') || ext.endsWith('.gz')

      return documents || spreadsheets || presentations || web || images || archives
    })

    const list = files.map((name, idx) => {
      // Remove file extension for display
      const nameWithoutExt = name.replace(/\.(pdf|doc|docx|odt|rtf|txt|xls|xlsx|ods|csv|ppt|pptx|odp|html|htm|jpg|jpeg|png|gif|bmp|svg|webp|tiff|tif|zip|rar|7z|tar|gz)$/i, '')
      const displayName = nameWithoutExt.replace(/-/g, ' ')

      // Get file extension for icon/type
      const ext = name.split('.').pop().toLowerCase()
      const fileType = getFileType(ext)

      return {
        id: `f${idx+1}`,
        name: displayName,
        fileName: name,
        extension: ext.toUpperCase(),
        type: fileType,
        size: '—',
        url: `/static/forms/${name}`
      }
    })

    res.json(list)
  } catch (error) {
    console.error('Error loading forms:', error)
    res.json([])
  }
})

// ----------------- STATS (แสดงการ์ดบนแดชบอร์ด) -----------------
app.get('/api/stats', authRequired, async (req, res) => {
  try {
    const total = (await dbGet('SELECT COUNT(*) as c FROM requests')).c
    const pending = (await dbGet('SELECT COUNT(*) as c FROM requests WHERE status=?', ['pending'])).c
    const approved = (await dbGet('SELECT COUNT(*) as c FROM requests WHERE status=?', ['approved'])).c
    res.json({ total, pending, approved })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/', (_req, res) => res.send('BRM RBAC API OK'))

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => console.log(`API listening at http://localhost:${PORT}`))
