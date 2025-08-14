import { useState, useEffect } from 'react'
import { getToken, getUser } from '@/lib/auth'

export default function FormsSubmit() {
  const [budgetForm, setBudgetForm] = useState({
    title: '',
    category: '',
    fiscalYear: '',
    amount: '',
    note: '',
    file: null as File | null
  })

  const user = getUser()

  // ตรวจสอบการล็อกอิน
  useEffect(() => {
    if (!user) {
      alert('กรุณาล็อกอินก่อนเข้าใช้งาน')
      window.location.href = '/login'
    }
  }, [user])

  async function handleBudgetSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!budgetForm.title || !budgetForm.category || !budgetForm.fiscalYear || !budgetForm.amount) {
      return alert('กรุณากรอกข้อมูลให้ครบถ้วน')
    }

    try {
      const formData = new FormData()
      formData.append('title', budgetForm.title)
      formData.append('category', budgetForm.category)
      formData.append('fiscalYear', budgetForm.fiscalYear)
      formData.append('amount', budgetForm.amount)
      formData.append('note', budgetForm.note)
      if (budgetForm.file) {
        formData.append('file', budgetForm.file)
      }

      // ใช้ fetch โดยตรงเพราะต้องส่ง FormData
      const token = getToken()
      if (!token) {
        alert('กรุณาล็อกอินก่อนส่งคำของบ')
        return
      }

      const response = await fetch('http://localhost:4002/api/requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        alert('ส่งคำของบประมาณเรียบร้อยแล้ว')
        setBudgetForm({
          title: '',
          category: '',
          fiscalYear: '',
          amount: '',
          note: '',
          file: null
        })
      } else {
        const error = await response.text()
        alert('เกิดข้อผิดพลาด: ' + error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('เกิดข้อผิดพลาดในการส่งข้อมูล')
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="mb-3 text-lg font-medium">ส่งคำของบประมาณ</div>
        {user && (
          <div className="mb-4 text-sm text-gray-600">
            ผู้ใช้: {user.name} ({user.username}) | บทบาท: {user.role}
          </div>
        )}
        <form onSubmit={handleBudgetSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อรายการ</label>
              <input
                type="text"
                className="input"
                placeholder="เช่น ซื้อคอมพิวเตอร์"
                value={budgetForm.title}
                onChange={e => setBudgetForm({...budgetForm, title: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
              <select
                className="input"
                value={budgetForm.category}
                onChange={e => setBudgetForm({...budgetForm, category: e.target.value})}
                required
              >
                <option value="">เลือกหมวดหมู่</option>
                <option value="ครุภัณฑ์">ครุภัณฑ์</option>
                <option value="ก่อสร้าง">ก่อสร้าง</option>
                <option value="วัสดุ">วัสดุ</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ปีงบประมาณ</label>
              <select
                className="input"
                value={budgetForm.fiscalYear}
                onChange={e => setBudgetForm({...budgetForm, fiscalYear: e.target.value})}
                required
              >
                <option value="">เลือกปีงบประมาณ</option>
                <option value="2567">2567</option>
                <option value="2568">2568</option>
                <option value="2569">2569</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนเงิน (บาท)</label>
              <input
                type="number"
                className="input"
                placeholder="0"
                min="1"
                value={budgetForm.amount}
                onChange={e => setBudgetForm({...budgetForm, amount: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">หมายเหตุ (ไม่บังคับ)</label>
            <textarea
              className="input"
              rows={3}
              placeholder="รายละเอียดเพิ่มเติม..."
              value={budgetForm.note}
              onChange={e => setBudgetForm({...budgetForm, note: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ไฟล์แนบ (ไม่บังคับ)</label>
            <input
              type="file"
              className="input"
              accept=".pdf,.doc,.docx,.odt,.rtf,.txt,.xls,.xlsx,.ods,.csv,.ppt,.pptx,.odp,.html,.htm,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp,.zip,.rar,.7z"
              onChange={e => setBudgetForm({...budgetForm, file: e.target.files?.[0] || null})}
            />
            <p className="text-sm text-gray-500 mt-1">รองรับไฟล์: เอกสาร, สเปรดชีต, งานนำเสนอ, รูปภาพ, ไฟล์บีบอัด (ขนาดไม่เกิน 10MB)</p>
          </div>
          <button type="submit" className="btn-primary w-full">
            ส่งคำของบประมาณ
          </button>
        </form>
      </div>


    </div>
  )
}
