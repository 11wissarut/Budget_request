import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Requests as Api } from '@/lib/api';
import SearchBar from '@/components/SearchBar';
import { getUser } from '@/lib/auth';

const BASE_URL = import.meta.env.VITE_API_BASE ?? 'http://localhost:4002';

type UIRequest = {
  id: string;
  title: string;
  category?: string | null;
  fiscalYear: number | string;        // from fiscal_year
  amount: number;                     // from total_amount
  approvedAmount?: number | null;     // from approved_amount
  approvalNote?: string | null;       // from approval_note
  quotations?: { id: any; filePath: string; fileName: string }[];
  attachments?: { id: any; filePath: string; fileName: string }[];
  status: string;
};

export default function Requests() {
  const [rows, setRows] = useState<UIRequest[]>([]);
  const [q, setQ] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<UIRequest | null>(null);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const user = getUser();
  const role = user?.role || 'board';

  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

  // สิทธิ์อนุมัติ
  const canApprove = role === 'admin' || role === 'planner';

  // แปลง snake_case → camelCase
  const normalize = (r: any) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    fiscalYear: r.fiscal_year,
    amount: r.total_amount,
    approvedAmount: r.approved_amount,
    status: r.status,
    createdAt: r.created_at,
    createdBy: r.created_by_name,
    note: r.note,
    quotations: Array.isArray(r.quotations) ? r.quotations.map((q: any) => ({
      id: q.id, fileName: q.fileName || q.file_name, filePath: q.filePath || q.file_path
    })) : [],
    attachments: Array.isArray(r.attachments) ? r.attachments.map((a: any) => ({
      id: a.id, fileName: a.fileName || a.file_name, filePath: a.filePath || a.file_path
    })) : []
  });

  const refresh = () => Api.list().then((data: any[]) => {
    setRows((data ?? []).map(normalize));
  });

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const keywordMatch = q ? [r.title, r.category].join(' ').toLowerCase().includes(q.toLowerCase()) : true;
      const categoryMatch = !categoryFilter || r.category === categoryFilter;
      return keywordMatch && categoryMatch;
    });
  }, [rows, q, categoryFilter]);

  // เปิด modal อนุมัติ
  const showApproveDialog = (request: UIRequest) => {
    if (request.status.toLowerCase() !== 'pending') {
      alert('สามารถอนุมัติได้เฉพาะคำขอรอดำเนินการ');
      return;
    }
    setCurrentRequest(request);
    setApprovedAmount((request.approvedAmount ?? request.amount).toString());
    setApprovalNote(request.approvalNote || '');
    setShowApproveModal(true);
  };
  const hideApproveDialog = () => {
    setShowApproveModal(false);
    setCurrentRequest(null);
    setApprovedAmount('');
    setApprovalNote('');
  };

  // ✅ ตรวจไม่ให้วงเงินอนุมัติเกินวงเงินที่ขอในระดับ UI ก่อนยิง API
  const submitApproval = async () => {
    if (!currentRequest) return;

    const amt = parseFloat(approvedAmount);
    if (!Number.isFinite(amt) || amt < 0) {
      alert('กรุณากรอกวงเงินอนุมัติให้ถูกต้อง');
      return;
    }
    if (amt > Number(currentRequest.amount || 0) + 0.000001) {
      alert(`วงเงินอนุมัติห้ามเกินวงเงินที่ขอ (${Number(currentRequest.amount || 0).toLocaleString('th-TH')} บาท)`);
      return;
    }

    try {
      await Api.approve(currentRequest.id, amt, approvalNote);
      hideApproveDialog();
      refresh();
      alert('อนุมัติคำขอสำเร็จ');
    } catch (error) {
      console.error('Error approving request:', error);
      alert(`ข้อผิดพลาดในการอนุมัติ: ${(error as Error).message}`);
    }
  };

  // ปฏิเสธ
  const rejectRequest = async (id: string) => {
    const request = rows.find(r => r.id === id);
    if (!request || request.status.toLowerCase() !== 'pending') {
      alert('สามารถปฏิเสธได้เฉพาะคำขอรอดำเนินการ');
      return;
    }
    if (confirm('แน่ใจว่าต้องการปฏิเสธคำขอนี้?')) {
      try {
        await Api.reject(id);
        refresh();
        alert('ปฏิเสธคำขอสำเร็จ');
      } catch (error) {
        console.error('Error rejecting request:', error);
        alert(`ข้อผิดพลาดในการปฏิเสธ: ${(error as Error).message}`);
      }
    }
  };

  // ดาวน์โหลดไฟล์ (ใบเสนอราคา/ไฟล์ประกอบ)
  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      let correctedPath = filePath;
      if (!filePath.startsWith('/uploads/') && !filePath.startsWith('/static/')) {
        correctedPath = `/uploads/${filePath}`;
      }
      const response = await fetch(
        `${BASE_URL}/api/download?path=${encodeURIComponent(correctedPath)}&filename=${encodeURIComponent(fileName)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!response.ok) throw new Error(`ไม่สามารถดาวน์โหลดไฟล์ได้ (${response.status})`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = fileName;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert(`ข้อผิดพลาดในการดาวน์โหลดไฟล์: ${(error as Error).message}`);
    }
  };

  return (
    <div className="space-y-4">
      <SearchBar value={q} onChange={setQ} />

      <div className="card p-4">
        <div className="mb-3 text-lg font-medium">รายการคำขอ</div>
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">ชื่อรายการ</th>
                <th className="py-2">หมวด</th>
                <th className="py-2">งบ</th>
                <th className="py-2">วง (บาท)</th>
                <th className="py-2">วงอนุมัติ</th>
                <th className="py-2">ใบเสนอราคา</th>
                <th className="py-2">ไฟล์ประกอบ</th>
                <th className="py-2">สถานะ</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.title}</td>
                  <td className="py-2">{r.category}</td>
                  <td className="py-2">{r.fiscalYear}</td>
                  <td className="py-2">{Number(r.amount || 0).toLocaleString('th-TH')}</td>
                  <td className="py-2">
                    {r.approvedAmount != null ? (
                      <span className="text-green-600 font-medium">
                        {Number(r.approvedAmount).toLocaleString('th-TH')} บาท
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-2">
                    {r.quotations?.length ? (
                      <div className="flex flex-col space-y-1">
                        {r.quotations.map((q, i) => (
                          <button
                            key={`q-${i}`}
                            onClick={() => downloadFile(q.filePath, q.fileName)}
                            className="text-blue-600 hover:text-blue-800 text-xs text-left"
                          >
                            📎 {q.fileName || `ใบเสนอราคา ${i + 1}`}
                          </button>
                        ))}
                      </div>
                    ) : <span className="text-gray-400 text-xs">ไม่</span>}
                  </td>
                  <td className="py-2">
                    {r.attachments?.length ? (
                      <div className="flex flex-col space-y-1">
                        {r.attachments.map((a, i) => (
                          <button
                            key={`a-${i}`}
                            onClick={() => downloadFile(a.filePath, a.fileName)}
                            className="text-blue-600 hover:text-blue-800 text-xs text-left"
                          >
                            📄 {a.fileName}
                          </button>
                        ))}
                      </div>
                    ) : <span className="text-gray-400 text-xs">ไม่</span>}
                  </td>
                  <td className="py-2">
                    {r.status.toLowerCase() === 'approved' ? <span className="badge badge-success">อนุมัติ</span> :
                     r.status.toLowerCase() === 'rejected' ? <span className="badge badge-error">ปฏิเสธ</span> :
                     r.status.toLowerCase() === 'pending' ? <span className="badge badge-warning">รอดำเนินการ</span> :
                     r.status.toLowerCase() === 'partially_disbursed' ? <span className="badge badge-info">เบิกจ่ายบางส่วน</span> :
                     r.status.toLowerCase() === 'disbursed' ? <span className="badge badge-ghost">เบิกจ่ายแล้ว</span> :
                     <span className="badge badge-muted">ไม่ทราบสถานะ</span>}
                  </td>
                  <td className="py-2 text-right">
                    {canApprove && r.status.toLowerCase() === 'pending' ? (
                      <>
                        <button className="btn-ghost mr-2 text-green-600" onClick={()=>showApproveDialog(r)}>อนุมัติ</button>
                        <button className="btn-ghost mr-2 text-red-600" onClick={()=>rejectRequest(r.id)}>ปฏิเสธ</button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal อนุมัติ */}
      {showApproveModal && currentRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">อนุมัติคำขอ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อรายการ</label>
                <input type="text" value={currentRequest.title} readOnly className="w-full px-3 py-2 border rounded-md bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วง (บาท)</label>
                <input
                  type="text"
                  value={Number(currentRequest.amount || 0).toLocaleString('th-TH') + ' บาท'}
                  readOnly
                  className="w-full px-3 py-2 border rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วงอนุมัติ (บาท)</label>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  // ✅ ใส่ max ที่ระดับ input กันพิมพ์เกิน
                  max={currentRequest.amount}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  วงเงินที่ขอ: {Number(currentRequest.amount || 0).toLocaleString('th-TH')} บาท
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุอนุมัติ (ไม่บังคับ)</label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="เงื่อนไข/หมายเหตุการอนุมัติ..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button type="button" onClick={hideApproveDialog} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50">
                ยกเลิก
              </button>
              <button type="button" onClick={submitApproval} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
