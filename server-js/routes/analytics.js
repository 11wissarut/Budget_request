import { Router } from 'express'
import { pool } from '../../db.js'
import PDFDocument from 'pdfkit'
import path from 'node:path'
import fs from 'node:fs'

const router = Router()
const THB = n => Number(n || 0).toLocaleString('th-TH', { style: 'currency', currency: 'THB' })

/* ---------- Header helpers: ป้องกันชื่อไฟล์ภาษาไทยพัง ---------- */
function encodeRFC5987(str) {
  return encodeURIComponent(str)
    .replace(/['()]/g, escape)
    .replace(/\*/g, '%2A')
}
function setPDFHeaders(res, baseFilenameWithoutExt) {
  const safe = String(baseFilenameWithoutExt).replace(/[\/\\]/g, '-').trim()
  const asciiFallback = safe.replace(/[^\x20-\x7E]/g, '_') || 'report'
  const utf8 = encodeRFC5987(safe)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${asciiFallback}.pdf"; filename*=UTF-8''${utf8}.pdf`
  )
}

/* ---------- Font ---------- */
function registerThaiFonts(doc){
  const dir  = path.join(process.cwd(), 'fonts')
  const reg  = path.join(dir, 'Kanit-Regular.ttf')
  const bold = path.join(dir, 'Kanit-Bold.ttf')
  let REG = 'Helvetica', BOLD = 'Helvetica-Bold'
  if (fs.existsSync(bold)) { doc.registerFont('Kanit-Bold', bold); BOLD = 'Kanit-Bold' }
  if (fs.existsSync(reg))  { doc.registerFont('Kanit', reg);      REG  = 'Kanit' }
  else { REG = BOLD }
  return { REG, BOLD }
}

/* ---------- Table ---------- */
function drawTable(doc, {x, y, header, rows, widths, pageTop=60, pageBottom=40, fontNormal='Helvetica', fontBold='Helvetica-Bold'}) {
  const H = 24, R = 20
  let cy = y
  doc.font(fontBold).fontSize(9)
  let cx = x
  header.forEach((h,i)=>{
    doc.rect(cx,cy,widths[i],H).fillAndStroke('#F4F6F8','#E5E7EB')
    doc.fillColor('#111827').text(h.text, cx+5, cy+6, {
      width: widths[i]-10, align: h.align||'left', lineBreak:false, ellipsis:true
    })
    cx += widths[i]
  })
  cy += H

  doc.font(fontNormal).fontSize(8.2).fillColor('#111827')
  for (const row of rows){
    if (cy + R > doc.page.height - pageBottom){
      doc.addPage()
      cx = x
      doc.font(fontBold).fontSize(9)
      header.forEach((h,i)=>{
        doc.rect(cx,pageTop,widths[i],H).fillAndStroke('#F8FAFC','#E5E7EB')
        doc.fillColor('#111827').text(h.text, cx+5, pageTop+6, {
          width: widths[i]-10, align: h.align||'left', lineBreak:false, ellipsis:true
        })
        cx += widths[i]
      })
      doc.font(fontNormal).fontSize(8.2).fillColor('#111827')
      cy = pageTop + H
    }
    cx = x
    row.forEach((cell,i)=>{
      doc.rect(cx,cy,widths[i],R).stroke('#E5E7EB')
      doc.text(String(cell ?? ''), cx+5, cy+4, {
        width: widths[i]-10, align: header[i].align||'left', lineBreak:false, ellipsis:true
      })
      cx += widths[i]
    })
    cy += R
  }
  return cy
}

/* ---------- Filters ---------- */
// ไทย -> code
const CATEGORY_MAP = {
  'อุปกรณ์': 'EQUIPMENT',
  'ครุภัณฑ์': 'EQUIPMENT',

  'ก่อสร้าง': 'CONSTRUCTION',
  'สิ่งก่อสร้าง': 'CONSTRUCTION',
  'ค่าใช้จ่ายและสิ่งก่อสร้าง': 'CONSTRUCTION',
  'ค่าวัสดุและสิ่งก่อสร้าง': 'CONSTRUCTION',

  'ชั่วคราว': 'TEMPORARY_PAY',
  'ค่าแรงชั่วคราว': 'TEMPORARY_PAY',
  'ค่าจ้างชั่วคราว': 'TEMPORARY_PAY',

  // ✅ เพิ่มสาธารณูปโภค
  'ค่าสาธารณูปโภค': 'UTILITIES',
  'สาธารณูปโภค': 'UTILITIES',
}
const KNOWN_CATEGORIES = new Set(['EQUIPMENT', 'CONSTRUCTION', 'TEMPORARY_PAY', 'UTILITIES'])

const normalizeCategory = (s) => {
  if (!s) return null
  const raw = String(s).trim()
  if (CATEGORY_MAP[raw]) return CATEGORY_MAP[raw]         // ไทยตรงตัว
  const up = raw.toUpperCase().replace(/\s+/g, '_')       // อังกฤษพิมพ์เล็ก/ช่องว่าง
  if (KNOWN_CATEGORIES.has(up)) return up
  const compact = up.replace(/[^A-Z_]/g, '')              // ล้างตัวอักษรแปลกๆ
  if (KNOWN_CATEGORIES.has(compact)) return compact
  return null // ถ้าไม่รู้จักให้ตัดทิ้ง => จะไม่เอาไปกรอง
}

const parseMultiParam = (val) => {
  if (!val || String(val).toLowerCase() === 'all') return []
  if (Array.isArray(val)) return val.map(String)
  const s = String(val).trim()
  try { const arr = JSON.parse(s); if (Array.isArray(arr)) return arr.map(String) } catch {}
  return s.split(',').map(v => v.trim()).filter(Boolean)
}
const parseFiscalYears = (val) => {
  const parts = parseMultiParam(val)
  if (!parts.length){
    const s = String(val||'').trim()
    const m = s.match(/^(\d{4})\s*-\s*(\d{4})$/)
    if (m){ const a=+m[1], b=+m[2]; const lo=Math.min(a,b), hi=Math.max(a,b)
      return Array.from({length:hi-lo+1}, (_,i)=>String(lo+i)) }
  }
  return parts.map(x=>String(x).replace(/[^\d]/g,'')).filter(Boolean)
}
const parseCategories = (val) => {
  const arr = parseMultiParam(val)
  const normalized = arr.map(normalizeCategory).filter(Boolean)
  return normalized
}

/* ---------- Construction ---------- */
const isConstructionBudget = cat => String(cat||'').toUpperCase()==='CONSTRUCTION'
const mapConstructionSubtype = raw=>{
  const t = String(raw||'').trim()
  if (!t) return '-'
  const th = t.replace(/\s+/g,''); const lower = t.toLowerCase()
  if (th==='ปรับปรุง') return 'IMPROVEMENT'
  if (th==='ก่อสร้างใหม่') return 'NEW CONSTRUCTION'
  if (lower.includes('improve')) return 'IMPROVEMENT'
  if (lower==='new construction' || (lower.includes('new') && lower.includes('construct'))) return 'NEW CONSTRUCTION'
  return t.toUpperCase()
}

/* ================== รายงานคำของบ ================== */
router.get('/report/pdf', async (req,res)=>{
  const fiscalYears = parseFiscalYears(req.query.fiscal_year)
  const categories  = parseCategories(req.query.category)
  const createdBy   = (req.query.created_by && req.query.created_by !== 'all') ? String(req.query.created_by) : null

  try {
    // เตรียมข้อมูลก่อน (ยังไม่ set header/pipe)
    let sql = `
      SELECT br.id AS req_key, br.title, br.category, br.fiscal_year,
             br.total_amount, br.approved_amount, br.status, br.created_at,
             br.construction_type,
             u.name AS created_by_name
      FROM budget_requests br
      LEFT JOIN users u ON u.id = br.created_by
      WHERE 1=1`
    const params = []

    if (fiscalYears.length === 1) { sql+=' AND br.fiscal_year=?'; params.push(fiscalYears[0]) }
    else if (fiscalYears.length > 1){ sql+=' AND br.fiscal_year IN (?)'; params.push(fiscalYears) }

    if (createdBy){ sql+=' AND br.created_by=?'; params.push(createdBy) }

    if (categories.length === 1) { sql+=' AND br.category=?'; params.push(categories[0]) }
    else if (categories.length > 1){ sql+=' AND br.category IN (?)'; params.push(categories) }

    sql += ' ORDER BY br.fiscal_year DESC, br.created_at DESC'
    const [rows] = await pool.query(sql, params)

    // รายละเอียดอุปกรณ์ของแต่ละคำของบ
    const ids = rows.map(r=>r.req_key)
    const detailsMap = new Map()
    if (ids.length){
      const [details] = await pool.query(
        `SELECT request_id, equipment_type, quantity, unit, price_per_unit
         FROM budget_request.equipment_details
         WHERE request_id IN (?)`, [ids]
      )
      for (const d of details){
        if (!detailsMap.has(d.request_id)) detailsMap.set(d.request_id, [])
        detailsMap.get(d.request_id).push(d)
      }
    }

    // ตั้ง header PDF (รองรับชื่อไฟล์ไทย)
    const fileName = `budget_report_${(fiscalYears.join('-')||'all')}_${(categories.join('+')||'all')}`
    setPDFHeaders(res, fileName)

    const doc = new PDFDocument({ size:'A4', layout:'landscape', margin:36 })
    const { REG, BOLD } = registerThaiFonts(doc)
    doc.pipe(res)

    // Header รายงาน
    doc.font(BOLD).fontSize(22).text('รายงานคำของบประมาณ', { align:'center' })
    doc.moveDown(0.5)
    doc.font(REG).fontSize(11)
      .text(`จำนวนรายการทั้งหมด: ${rows.length} รายการ`)
    if (fiscalYears.length) doc.text(`ปีงบประมาณ: ${fiscalYears.join(', ')}`)
    if (categories.length)  doc.text(`ประเภทงบ: ${categories.join(', ')}`)
    doc.moveDown(0.2)

    // ตาราง
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const startX = doc.page.margins.left
    const startY = 120
    const COL = {
      title:0.16, category:0.12, fy:0.07, requested:0.10, approved:0.12,
      diff:0.10, eq_type:0.13, eq_qty:0.06, eq_unit:0.06, eq_price:0.09
    }
    const sumP = Object.values(COL).reduce((a,b)=>a+b,0)
    Object.keys(COL).forEach(k=>COL[k]/=sumP)
    const widths = [
      pageWidth*COL.title, pageWidth*COL.category, pageWidth*COL.fy,
      pageWidth*COL.requested, pageWidth*COL.approved, pageWidth*COL.diff,
      pageWidth*COL.eq_type, pageWidth*COL.eq_qty, pageWidth*COL.eq_unit, pageWidth*COL.eq_price,
    ]
    const header = [
      {text:'ชื่อโครงการ'}, {text:'หมวด'}, {text:'ปีงบฯ', align:'center'},
      {text:'วงเงินที่ขอ', align:'right'}, {text:'วงเงินที่อนุมัติ', align:'right'},
      {text:'ผลต่าง', align:'right'}, {text:'ประเภท'},
      {text:'จำนวน', align:'right'}, {text:'หน่วย', align:'center'}, {text:'ราคา/หน่วย', align:'right'}
    ]
    const trim = (s,n)=>{ const t=String(s||''); return t.length>n ? t.slice(0,n-1)+'…' : t }

    const body = rows.map(r=>{
      const req = +r.total_amount||0
      const appr= +r.approved_amount||0
      const diff= appr ? (appr-req) : 0
      const items = detailsMap.get(r.req_key)||[]
      const first = items[0]||{}
      const more  = items.length>1 ? ` (+${items.length-1})` : ''

      let type
      if (isConstructionBudget(r.category)){
        const chosen = r.construction_type || first.equipment_type || ''
        type = mapConstructionSubtype(chosen)
      } else {
        const raw = (first.equipment_type ?? '').toString().trim()
        type = raw ? `${raw}${more}` : (items.length ? `- ${more}` : '-')
      }

      const qty   = first?.quantity!=null ? Number(first.quantity).toLocaleString('th-TH') : '-'
      const unit  = first?.unit ?? '-'
      const price = first?.price_per_unit!=null ? THB(first.price_per_unit) : '-'

      return [
        trim(r.title,70), trim(r.category||'-',20), r.fiscal_year||'-',
        THB(req), appr ? THB(appr) : '-', appr ? THB(diff) : '-',
        trim(type,40), qty, unit, price
      ]
    })

    let y = drawTable(doc, {
      x:startX, y:startY, header, rows:body, widths,
      pageTop:60, pageBottom:50, fontNormal:REG, fontBold:BOLD
    })

    // สรุปรวม
    const sumReq  = rows.reduce((s,r)=>s+(+r.total_amount||0),0)
    const sumAppr = rows.reduce((s,r)=>s+(+r.approved_amount||0),0)
    const sumDiff = sumAppr - sumReq

    if (y + 120 > doc.page.height - 40) { doc.addPage(); y = 60 }
    doc.moveTo(startX, y+12).lineTo(startX + pageWidth, y+12).stroke('#E5E7EB')
    doc.font(BOLD).fontSize(12).text('สรุปรวมทั้งหมด', startX, y+22)
    doc.font(REG).fontSize(11)

    const labelX = startX, valueX = startX + pageWidth - 200, gap = 20
    y += 50
    ;[
      ['วงเงินที่ขอรวม', THB(sumReq)],
      ['วงเงินที่อนุมัติรวม', THB(sumAppr)],
      ['ผลต่างรวม', THB(sumDiff)],
    ].forEach(([k,v])=>{ doc.text(k, labelX, y); doc.text(v, valueX, y, { width:200, align:'right' }); y+=gap })

    doc.end()
  } catch (e) {
    console.error('PDF generation error:', e)
    if (!res.headersSent) {
      res.status(500).json({ message:'Error generating PDF report', error: e.message })
    } else {
      try { res.end() } catch {}
    }
  }
})

/* ================== รายงานการเบิกจ่าย ================== */
router.get('/report/disbursement/pdf', async (req,res)=>{
  const fiscalYears = parseFiscalYears(req.query.fiscal_year)
  const categories  = parseCategories(req.query.category)

  try {
    let sql = `
      SELECT 
        d.id, d.disbursed_date, d.note, d.disbursed_amount,
        br.id AS request_id, br.title AS request_title, br.fiscal_year, br.category, br.approved_amount,
        u.name AS created_by_name
      FROM disbursements d
      LEFT JOIN budget_requests br ON br.id = d.request_id
      LEFT JOIN users u ON u.id = br.created_by
      WHERE 1=1`
    const params = []
    if (fiscalYears.length === 1) { sql+=' AND br.fiscal_year=?'; params.push(fiscalYears[0]) }
    else if (fiscalYears.length > 1){ sql+=' AND br.fiscal_year IN (?)'; params.push(fiscalYears) }
    if (categories.length === 1) { sql+=' AND br.category=?'; params.push(categories[0]) }
    else if (categories.length > 1){ sql+=' AND br.category IN (?)'; params.push(categories) }
    sql += ' ORDER BY br.id, d.disbursed_date ASC'
    const [rows] = await pool.query(sql, params)

    const fileName = `disbursement_report_${(fiscalYears.join('-')||'all')}_${(categories.join('+')||'all')}`
    setPDFHeaders(res, fileName)

    const doc = new PDFDocument({ size:'A4', layout:'landscape', margin:36 })
    const { REG, BOLD } = registerThaiFonts(doc)
    doc.pipe(res)

    doc.font(BOLD).fontSize(22).text('รายงานการเบิกจ่ายงบประมาณ', { align:'center' })
    doc.moveDown(0.5)
    doc.font(REG).fontSize(11)
      .text(`จำนวนรายการทั้งหมด: ${rows.length} รายการ`)
    if (fiscalYears.length) doc.text(`ปีงบประมาณ: ${fiscalYears.join(', ')}`)
    if (categories.length)  doc.text(`หมวดหมู่: ${categories.join(', ')}`)
    doc.moveDown(0.2)

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const startX = doc.page.margins.left
    const startY = doc.y + 10
    const widths = [
      pageWidth*0.1, pageWidth*0.25, pageWidth*0.15, pageWidth*0.1,
      pageWidth*0.1, pageWidth*0.1, pageWidth*0.1, pageWidth*0.1
    ]
    const header = [
      {text:'วันที่เบิกจ่าย', align:'center'},
      {text:'โครงการ'},
      {text:'รายละเอียดการเบิกจ่าย'},
      {text:'งบอนุมัติ', align:'right'},
      {text:'เบิกจ่าย', align:'right'},
      {text:'คงเหลือ', align:'right'},
      {text:'หมวดหมู่', align:'center'},
      {text:'ผู้ขอ'},
    ]

    const body = []
    let currentProjectId = null
    let cumulativeDisbursed = 0
    for (const r of rows) {
      if (r.request_id !== currentProjectId) {
        cumulativeDisbursed = 0
        currentProjectId = r.request_id
      }
      const approved = Number(r.approved_amount || 0)
      const paid     = Number(r.disbursed_amount || 0)
      cumulativeDisbursed += paid
      const remaining = approved - cumulativeDisbursed
      body.push([
        new Date(r.disbursed_date).toLocaleDateString('th-TH'),
        r.request_title || '-', r.note || '-',
        THB(approved), THB(paid), THB(remaining),
        r.category || '-', r.created_by_name || '-',
      ])
    }

    let y = drawTable(doc, {
      x:startX, y:startY, header, rows:body, widths,
      pageTop:60, pageBottom:50, fontNormal:REG, fontBold:BOLD
    })

    const totalDisbursedAmount = rows.reduce((s,r)=>s+Number(r.disbursed_amount||0),0)
    const projectApproved = new Map()
    rows.forEach(r=>{ if(!projectApproved.has(r.request_id)) projectApproved.set(r.request_id, Number(r.approved_amount||0)) })
    const totalApprovedAmount = Array.from(projectApproved.values()).reduce((s,v)=>s+v,0)
    const totalRemainingAmount = totalApprovedAmount - totalDisbursedAmount

    if (y + 120 > doc.page.height - 40) { doc.addPage(); y = 60 }
    doc.moveTo(startX, y+12).lineTo(startX + pageWidth, y+12).stroke('#E5E7EB')
    doc.font(BOLD).fontSize(12).text('สรุปรวมทั้งหมด (ตามตัวกรอง)', startX, y+22)
    doc.font(REG).fontSize(11)

    const labelX = startX, valueX = startX + pageWidth - 200, gap = 20
    y += 50
    ;[
      ['ยอดอนุมัติรวม', THB(totalApprovedAmount)],
      ['ยอดเบิกจ่ายรวม', THB(totalDisbursedAmount)],
      ['ยอดคงเหลือรวม', THB(totalRemainingAmount)],
    ].forEach(([k,v])=>{ doc.text(k, labelX, y); doc.text(v, valueX, y, { width:200, align:'right' }); y+=gap })

    doc.end()
  } catch (e) {
    console.error('Disbursement PDF generation error:', e)
    if (!res.headersSent) {
      res.status(500).json({ message:'Error generating disbursement PDF report', error: e.message })
    } else {
      try { res.end() } catch {}
    }
  }
})

export default router
