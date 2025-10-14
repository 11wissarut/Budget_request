import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs, { existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { pool, initDatabase, seedIfEmpty, dbGet, dbAll, dbRun } from './db.js'
import { signToken, authRequired, allowModules } from './auth.js'
import analyticsRouter from '../routes/analytics.js'
import requestsRouter from '../routes/requests.js'
import disbursementsRouter from '../routes/disbursements.js'
import attachmentsRouter from '../routes/attachments.js'

const PORT = Number(process.env.PORT || 4002)
const app = express()

// เปิด CORS + parser
app.use(cors({ origin: true }))
app.use(express.json({ limit: '10mb' }))

// ใช้ router สำหรับ analytics
app.use('/api/analytics', analyticsRouter)

// Static dirs
const formsDir = path.join(process.cwd(), 'public', 'forms')
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })

// Static files
app.use('/static/forms', (req, res, next) => {
  res.setHeader('Content-Disposition', 'attachment')
  express.static(formsDir)(req, res, next)
})
app.use('/static/uploads', express.static(uploadsDir))

// Download route (fix UTF-8)
app.get('/api/download', (req, res) => {
  try {
    const unsafePath = req.query.path
    const filename = req.query.filename || 'download'

    if (typeof unsafePath !== 'string') {
      return res.status(403).send('Access forbidden')
    }

    let baseDir, relativeFilePath
    if (unsafePath.startsWith('/uploads/')) {
      baseDir = uploadsDir
      relativeFilePath = unsafePath.substring('/uploads/'.length)
    } else if (unsafePath.startsWith('/static/forms/')) {
      baseDir = formsDir
      relativeFilePath = unsafePath.substring('/static/forms/'.length)
    } else {
      return res.status(403).send('Access forbidden')
    }

    const fullPath = path.join(baseDir, path.normalize(relativeFilePath).replace(/^(\.\.[/\\])+/, ''))
    const relativeToBasePath = path.relative(baseDir, fullPath)
    if (relativeToBasePath.startsWith('..') || path.isAbsolute(relativeToBasePath)) {
      return res.status(403).send('Forbidden: Directory traversal detected.')
    }

    if (!existsSync(fullPath)) {
      return res.status(404).send('File not found.')
    }

    res.download(fullPath, filename, (err) => {
      if (err) {
        console.error(`Error downloading file: ${fullPath}`, err)
        if (!res.headersSent) res.status(500).send('Error downloading file.')
      }
    })
  } catch (error) {
    console.error('Download route error:', error)
    res.status(500).send('Internal server error.')
  }
})

// ตั้งค่า multer
const submissionUpload = multer({ dest: uploadsDir })
const formsUpload = multer({ dest: formsDir })

// init DB
async function startServer() {
  try {
    await initDatabase()
    await seedIfEmpty()
    // console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  }
}
startServer()

// ----------------- AUTH -----------------
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

// ----------------- USERS -----------------
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
    } catch {
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

// ----------------- ROUTERS -----------------
app.use('/api/requests', authRequired, requestsRouter)
app.use('/api/disbursements', authRequired, disbursementsRouter)
app.use('/api/attachments', authRequired, attachmentsRouter)

// ----------------- SUBMISSIONS -----------------
app.get('/api/submissions', authRequired, allowModules('forms_submit','forms_download','dashboard','requests','users'), async (req, res) => {
  try {
    const rows = await dbAll('SELECT id,name,note,fileName,filePath,createdAt FROM submissions ORDER BY createdAt DESC')
    res.json(rows.map((s) => ({ ...s, fileUrl: `/static/uploads/${s.filePath}` })))
  } catch (error) {
    console.error('Get submissions error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.post('/api/submissions', authRequired, allowModules('forms_submit'), submissionUpload.single('file'), async (req, res) => {
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

// ----------------- FORMS -----------------
app.get('/api/forms', async (req, res) => {
  try {
    const rows = await dbAll('SELECT id, title, file_name, file_path, created_at FROM forms ORDER BY created_at DESC')
    const list = rows.map(row => ({
      id: row.id,
      title: row.title,
      file_name: row.file_name,
      file_path: `/static/forms/${row.file_path}`,
      created_at: row.created_at
    }))
    res.json(list)
  } catch (error) {
    console.error('Error loading forms:', error)
    res.json([])
  }
})

app.post('/api/forms', authRequired, allowModules('forms_submit'), formsUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'file required' })
    const { title } = req.body
    if (!title) return res.status(400).json({ message: 'title required' })

    const id = crypto.randomUUID()
    const newForm = {
      id,
      title,
      file_name: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
      file_path: req.file.filename,
      created_at: new Date().toISOString()
    }
    await dbRun('INSERT INTO forms (id, title, file_name, file_path, created_at) VALUES (?,?,?,?,?)',
      [newForm.id, newForm.title, newForm.file_name, newForm.file_path, newForm.created_at])
    res.status(201).json({ ...newForm, file_path: `/static/forms/${newForm.file_path}` })
  } catch (error) {
    console.error('Create form error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.delete('/api/forms/:id', authRequired, allowModules('forms_submit'), async (req, res) => {
  try {
    const { id } = req.params
    const form = await dbGet('SELECT file_path FROM forms WHERE id = ?', [id])
    if (!form) return res.status(404).json({ message: 'Form not found' })

    const filePath = path.join(formsDir, form.file_path)
    if (existsSync(filePath)) fs.unlinkSync(filePath)
    await dbRun('DELETE FROM forms WHERE id = ?', [id])
    res.sendStatus(204)
  } catch (error) {
    console.error('Delete form error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// ----------------- STATS -----------------
app.get('/api/stats', authRequired, async (req, res) => {
  try {
    const total = (await dbGet('SELECT COUNT(*) as c FROM budget_requests')).c
    const pending = (await dbGet('SELECT COUNT(*) as c FROM budget_requests WHERE status=?', ['pending'])).c
    const approved = (await dbGet('SELECT COUNT(*) as c FROM budget_requests WHERE status=?', ['approved'])).c
    const rejected = (await dbGet('SELECT COUNT(*) as c FROM budget_requests WHERE status=?', ['rejected'])).c
    const construction = (await dbGet('SELECT COUNT(*) as c FROM budget_requests WHERE category=?', ['CONSTRUCTION'])).c
    const equipment = (await dbGet('SELECT COUNT(*) as c FROM budget_requests WHERE category=?', ['EQUIPMENT'])).c
    res.json({ total, pending, approved, rejected, construction, equipment })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

app.get('/', (_req, res) => res.send('BRM RBAC API OK'))

// start server
app.listen(PORT, () => { /* server started */ });