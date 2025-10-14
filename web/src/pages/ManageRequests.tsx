import { useEffect, useMemo, useState } from 'react';
import { Requests } from '@/lib/api';
import { getUser } from '@/lib/auth';
import FormsSubmit from './FormsSubmit';

const BASE_URL = import.meta.env.VITE_API_BASE ?? 'http://localhost:4002';

/* -------------------------------------------------------------------------- */
/*                              ฟังก์ชันดาวน์โหลดไฟล์                           */
/*  - รองรับทั้งใบเสนอราคาและไฟล์ประกอบ                                       */
/*  - ป้องกัน path เพี้ยน และแนบ token ถ้ามี                                  */
/* -------------------------------------------------------------------------- */
const downloadFile = async (filePath: string, fileName: string) => {
  if (!filePath || !fileName) {
    alert('ข้อมูลไฟล์ไม่ครบถ้วน');
    return;
  }
  try {
    const token = localStorage.getItem('token');

    // ถ้า path ไม่ขึ้นต้นด้วย /uploads/ หรือ /static/ ให้เติม /uploads/ ให้เอง
    let correctedPath = filePath;
    if (!filePath.startsWith('/uploads/') && !filePath.startsWith('/static/')) {
      correctedPath = `/uploads/${filePath.replace(/^\/+/, '')}`;
    }

    const res = await fetch(
      `${BASE_URL}/api/download?path=${encodeURIComponent(correctedPath)}&filename=${encodeURIComponent(fileName)}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );

    if (!res.ok) throw new Error(`ไม่สามารถดาวน์โหลดไฟล์ได้ (${res.status})`);

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    alert(`ข้อผิดพลาดในการดาวน์โหลดไฟล์: ${(error as Error).message}`);
  }
};

/* -------------------------------------------------------------------------- */
/*                      ชนิดข้อมูลที่ใช้ในการแสดงผลบน UI                       */
/* -------------------------------------------------------------------------- */
type UIAttachment = { id: number | string; filePath: string; fileName: string };
type UIQuotation = { id: number | string; filePath: string; fileName: string };

type UIRequest = {
  id: string;
  title: string;
  category?: string | null;
  fiscalYear: number | string;
  amount: number;
  approvedAmount?: number | null;
  approval_note?: string | null;
  quotations?: UIQuotation[];
  attachments?: UIAttachment[];
  status: string;
  createdAt: string;
  createdBy?: string;    // ชื่อผู้สร้าง (สำหรับแสดงผล)
  createdById?: string;  // ไว้เช็คสิทธิ์เจ้าของรายการ
  note?: string | null;
};

/* -------------------------------------------------------------------------- */
/*                                  คอมโพเนนต์                                 */
/*  - แสดงตาราง “คำขอประมาณ”                                                   */
/*  - กรองด้วยคีย์เวิร์ด                                                       */
/*  - ตรวจสิทธิ์การแก้ไข/ลบต่อแถว (RBAC + เจ้าของ)                            */
/*  - เปิดโมดัลเพื่อแก้ไข                                                       */
/* -------------------------------------------------------------------------- */
export default function ManageRequests() {
  const [rows, setRows] = useState<UIRequest[]>([]);
  const [q, setQ] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);

  // ผู้ใช้ปัจจุบัน (ถ้าไม่ได้ล็อกอิน getUser() อาจคืน null)
  const user = getUser();
  const role = (user?.role || '').toLowerCase();
  const userId = user?.id || '';

  /* ------------------------------ map ข้อมูลจาก API ------------------------------ */
  const normalize = (r: any): UIRequest => ({
    id: String(r.id),
    title: r.title ?? '',
    category: r.category ?? '',
    fiscalYear: r.fiscal_year ?? r.fiscalYear ?? '-',
    amount: Number(r.total_amount ?? r.totalAmount ?? 0),
    approvedAmount:
      r.approved_amount != null ? Number(r.approved_amount) :
      r.approvedAmount != null ? Number(r.approvedAmount) : null,
    status: String(r.status ?? 'pending'),
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString(),
    createdBy: r.created_by_name ?? r.createdByName ?? '',
    createdById: r.created_by ?? r.createdBy ?? '', // ✅ สำคัญสำหรับตรวจสิทธิ์
    note: r.note ?? null,
    quotations: Array.isArray(r.quotations)
      ? r.quotations.map((q: any) => ({
          id: q.id,
          fileName: q.fileName ?? q.file_name ?? 'file',
          filePath: q.filePath ?? q.file_path ?? '',
        }))
      : [],
    attachments: Array.isArray(r.attachments)
      ? r.attachments.map((a: any) => ({
          id: a.id,
          fileName: a.fileName ?? a.file_name ?? 'file',
          filePath: a.filePath ?? a.file_path ?? '',
        }))
      : [],
  });

  /* ------------------------------- โหลดรายการล่าสุด ------------------------------ */
  const refresh = async () => {
    try {
      const data = await Requests.list();
      setRows((data ?? []).map(normalize));
    } catch (e: any) {
      console.error('โหลดคำขอผิดพลาด:', e);
      alert(`ไม่สามารถโหลดรายการได้: ${e?.message ?? 'unknown error'}`);
    }
  };

  useEffect(() => { refresh(); }, []);

  /* ------------------------------- ฟิลเตอร์ค้นหา -------------------------------- */
  const filteredRows = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((r) =>
      (r.title ?? '').toLowerCase().includes(keyword) ||
      (r.category ?? '').toLowerCase().includes(keyword)
    );
  }, [rows, q]);

  /* ----------------------- ตรวจสิทธิ์แก้ไข/ลบต่อ “แต่ละแถว” ---------------------- */
  const canModifyRow = (row: UIRequest) => {
    const status = (row.status ?? '').toLowerCase();
    const isPending = status === 'pending';

    // ไม่ใช่สถานะ pending → ห้ามแก้ไข/ลบ
    if (!isPending) return false;

    // admin / planner → แก้ไข/ลบได้ทุกคำขอที่ยัง pending
    if (role === 'admin' || role === 'planner') return true;

    // procurement → แก้ไข/ลบได้เฉพาะคำขอที่ “ตัวเองสร้าง” และ pending เท่านั้น
    if (role === 'procurement') return row.createdById === userId;

    // board / executive / อื่น ๆ → ห้ามแก้ไข/ลบ
    return false;
  };

  /* --------------------------------- จัดการแก้ไข -------------------------------- */
  const handleEditClick = (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row || !canModifyRow(row)) {
      alert('คุณไม่มีสิทธิ์แก้ไขคำขอนี้');
      return;
    }
    setEditingRequestId(id);
    setIsEditModalOpen(true);
  };

  /* ---------------------------------- จัดการลบ ---------------------------------- */
  const deleteRequest = async (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row || !canModifyRow(row)) {
      alert('คุณไม่มีสิทธิ์ลบคำขอนี้');
      return;
    }
    if (!confirm('แน่ใจว่าต้องการลบคำขอนี้?')) return;

    try {
      await Requests.remove(id);
      await refresh();
      alert('ลบคำขอสำเร็จ');
    } catch (error) {
      alert(`ข้อผิดพลาดในการลบ: ${(error as Error).message}`);
    }
  };

  /* ------------------------------- โมดัลแก้ไข/รีเฟรช ------------------------------ */
  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setEditingRequestId(null);
  };
  const handleModalSuccess = () => {
    handleModalClose();
    refresh();
  };

  /* ------------------------------------ UI ------------------------------------- */
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="mb-3 text-lg font-medium">คำขอประมาณ</div>

        {/* กล่องค้นหา */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="ค้นหาคำขอ..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* ตารางรายการ */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">ชื่อรายการ</th>
                <th className="py-2">หมวด</th>
                <th className="py-2">งบประมาณ</th>
                <th className="py-2">วงรวม (บาท)</th>
                <th className="py-2">วงอนุมัติ (บาท)</th>
                <th className="py-2">ใบเสนอราคา</th>
                <th className="py-2">ไฟล์ประกอบ</th>
                <th className="py-2">สถานะ</th>
                <th className="py-2">สร้าง</th>
                <th className="py-2 text-right">การ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => {
                const showActions = canModifyRow(r);
                return (
                  <tr key={r.id} className="border-t">
                    {/* ชื่อรายการ */}
                    <td className="py-2">{r.title}</td>

                    {/* หมวด */}
                    <td className="py-2">{r.category}</td>

                    {/* ปีงบประมาณ */}
                    <td className="py-2">{r.fiscalYear}</td>

                    {/* วงเงินที่ขอ */}
                    <td className="py-2">
                      <span className="text-blue-600 font-medium">
                        {Number(r.amount || 0).toLocaleString('th-TH')} บาท
                      </span>
                    </td>

                    {/* วงเงินอนุมัติ */}
                    <td className="py-2">
                      {r.approvedAmount != null && r.approvedAmount > 0 ? (
                        <span className="text-green-600 font-medium">
                          {Number(r.approvedAmount).toLocaleString('th-TH')} บาท
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* ใบเสนอราคา */}
                    <td className="py-2">
                      {r.quotations && r.quotations.length > 0 ? (
                        <div className="flex flex-col space-y-1">
                          {r.quotations.map((q, i) => (
                            <button
                              key={`q-${q.id ?? i}`}
                              onClick={() => downloadFile(q.filePath, q.fileName)}
                              className="text-blue-600 hover:text-blue-800 text-xs text-left"
                            >
                              📎 {q.fileName || `ใบเสนอราคา ${i + 1}`}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">ไม่</span>
                      )}
                    </td>

                    {/* ไฟล์ประกอบ */}
                    <td className="py-2">
                      {r.attachments && r.attachments.length > 0 ? (
                        <div className="flex flex-col space-y-1">
                          {r.attachments.map((a, i) => (
                            <button
                              key={`a-${a.id ?? i}`}
                              onClick={() => downloadFile(a.filePath, a.fileName)}
                              className="text-blue-600 hover:text-blue-800 text-xs text-left"
                            >
                              📄 {a.fileName}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">ไม่</span>
                      )}
                    </td>

                    {/* สถานะ */}
                    <td className="py-2">
                      {(r.status ?? '').toLowerCase() === 'approved' ? (
                        <span className="badge badge-success">อนุมัติ</span>
                      ) : (r.status ?? '').toLowerCase() === 'rejected' ? (
                        <span className="badge badge-error">ปฏิเสธ</span>
                      ) : (r.status ?? '').toLowerCase() === 'pending' ? (
                        <span className="badge badge-warning">รอดำเนินการ</span>
                      ) : (r.status ?? '').toLowerCase() === 'partially_disbursed' ? (
                        <span className="badge badge-info">เบิกจ่ายบางส่วน</span>
                      ) : (r.status ?? '').toLowerCase() === 'disbursed' ? (
                        <span className="badge badge-ghost">เบิกจ่ายแล้ว</span>
                      ) : (
                        <span className="badge badge-muted">ไม่ทราบสถานะ</span>
                      )}
                    </td>

                    {/* วันที่สร้าง */}
                    <td className="py-2">
                      {/* กัน invalid date → แสดงเป็น “-” */}
                      {(() => {
                        const d = new Date(r.createdAt);
                        return isNaN(d.getTime())
                          ? '-'
                          : d.toLocaleDateString('th-TH');
                      })()}
                    </td>

                    {/* ปุ่มแก้ไข/ลบ (แสดงเมื่อมีสิทธิ์) */}
                    <td className="py-2 text-right">
                      {showActions ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(r.id)}
                            className="btn-secondary-sm text-blue-600"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => deleteRequest(r.id)}
                            className="btn-danger-sm text-red-600"
                          >
                            ลบ
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* โมดัลแก้ไข */}
      {isEditModalOpen && (
        <FormsSubmit
          requestId={editingRequestId}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
