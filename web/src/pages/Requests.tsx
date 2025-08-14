import { useState, useMemo, useEffect } from 'react'
import { Requests as Api } from '@/lib/api'
import SearchBar from '@/components/SearchBar'
import { getUser, getToken } from '@/lib/auth'

export default function Requests() {
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<any>(null)
  const [approvedAmount, setApprovedAmount] = useState('')
  const [approvalNote, setApprovalNote] = useState('')
  const user = getUser()
  const role = user?.role || 'board'

  const canEdit = role === 'admin' || role === 'planner'
  const refresh = () => Api.list().then(setRows)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await Api.list()
        setRows(data)
      } catch (error) {
        console.error('Error fetching requests:', error)
      }
    }
    fetchData()
  }, [])

  const filtered = useMemo(()=>rows.filter(r=>[r.title, r.category].join(' ').toLowerCase().includes(q.toLowerCase())), [rows, q])

  const showApproveDialog = (request: any) => {
    setCurrentRequest(request)
    setApprovedAmount(request.amount.toString())
    setApprovalNote('')
    setShowApproveModal(true)
  }

  const hideApproveDialog = () => {
    setShowApproveModal(false)
    setCurrentRequest(null)
    setApprovedAmount('')
    setApprovalNote('')
  }

  const submitApproval = async () => {
    if (!currentRequest) return

    try {
      const token = getToken()
      if (!token) {
        alert('กรุณาล็อกอินก่อนดำเนินการ')
        return
      }

      const response = await fetch(`http://localhost:4002/api/requests/${currentRequest.id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvedAmount: parseFloat(approvedAmount),
          approvalNote: approvalNote
        })
      })

      if (response.ok) {
        hideApproveDialog()
        refresh()
        alert('อนุมัติคำของบเรียบร้อยแล้ว')
      } else {
        alert('เกิดข้อผิดพลาดในการอนุมัติ')
      }
    } catch (error) {
      console.error('Error approving request:', error)
      alert('เกิดข้อผิดพลาดในการอนุมัติ')
    }
  }

  const rejectRequest = async (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะปฏิเสธคำของบนี้?')) {
      try {
        const token = getToken()
        if (!token) {
          alert('กรุณาล็อกอินก่อนดำเนินการ')
          return
        }

        const response = await fetch(`http://localhost:4002/api/requests/${id}/reject`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          refresh()
          alert('ปฏิเสธคำของบเรียบร้อยแล้ว')
        } else {
          alert('เกิดข้อผิดพลาดในการปฏิเสธ')
        }
      } catch (error) {
        console.error('Error rejecting request:', error)
        alert('เกิดข้อผิดพลาดในการปฏิเสธ')
      }
    }
  }

  return (
    <div className="space-y-4">
      <SearchBar value={q} onChange={setQ} />

      <div className="card p-4">
        <div className="mb-3 text-lg font-medium">จัดการคำของบประมาณ</div>
        <div className="text-sm text-slate-500">จัดการและอนุมัติคำของบประมาณที่ส่งเข้ามา</div>
      </div>

      <div className="card p-4">
        <div className="mb-3 text-lg font-medium">รายการคำของบ</div>
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">ชื่อรายการ</th>
                <th className="py-2">หมวด</th>
                <th className="py-2">ปีงบ</th>
                <th className="py-2">วงเงิน (บาท)</th>
                <th className="py-2">วงเงินอนุมัติ</th>
                <th className="py-2">ไฟล์แนบ</th>
                <th className="py-2">สถานะ</th>
                <th className="py-2 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.title}</td>
                  <td className="py-2">{r.category}</td>
                  <td className="py-2">{r.fiscalYear}</td>
                  <td className="py-2">{Number(r.amount).toLocaleString()}</td>
                  <td className="py-2">
                    {r.approvedAmount ? (
                      <span className="text-green-600 font-medium">{Number(r.approvedAmount).toLocaleString()} บาท</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-2">
                    {r.fileUrl ? (
                      <a href={r.fileUrl} download className="text-blue-600 hover:text-blue-800 text-sm">
                        📎 ดาวน์โหลดไฟล์
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">ไม่มีไฟล์</span>
                    )}
                  </td>
                  <td className="py-2">
                    {r.status === 'approved' ? <span className="badge badge-success">อนุมัติ</span> :
                     r.status === 'rejected' ? <span className="badge badge-error">ปฏิเสธ</span> :
                     r.status === 'pending' ? <span className="badge badge-warning">รอดำเนินการ</span> :
                     <span className="badge badge-muted">ไม่ทราบสถานะ</span>}
                  </td>
                  <td className="py-2 text-right">
                    {canEdit ? (
                      <>
                        <button className="btn-ghost mr-2 text-green-600" onClick={()=>showApproveDialog(r)}>อนุมัติ</button>
                        <button className="btn-ghost mr-2 text-red-600" onClick={()=>rejectRequest(r.id)}>ปฏิเสธ</button>
                        <button className="btn-ghost text-gray-600" onClick={async()=>{ await Api.remove(r.id); refresh() }}>ลบ</button>
                      </>
                    ) : <span className="text-xs text-slate-500">อ่านอย่างเดียว</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal สำหรับอนุมัติ */}
      {showApproveModal && currentRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">อนุมัติคำของบประมาณ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อรายการ</label>
                <input
                  type="text"
                  value={currentRequest.title}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วงเงินที่ขอ (บาท)</label>
                <input
                  type="text"
                  value={Number(currentRequest.amount).toLocaleString() + ' บาท'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วงเงินที่อนุมัติ (บาท)</label>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุการอนุมัติ (ไม่บังคับ)</label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="เหตุผลหรือเงื่อนไขการอนุมัติ..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={hideApproveDialog}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={submitApproval}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
