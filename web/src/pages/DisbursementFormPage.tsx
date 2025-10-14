import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Requests, api } from '../lib/api';
import { getUser } from '../lib/auth';
import type { BudgetRequest } from '../types';

// 📌 ฟังก์ชันแปลงตัวเลขเป็นสกุลเงินไทย (THB)
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '-';
  return Number(amount).toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
};

// 📌 URL ของ API (กำหนดจาก ENV ถ้าไม่มีให้ใช้ localhost)
const BASE_URL = import.meta.env.VITE_API_BASE ?? 'http://localhost:4002';

// 📌 ฟังก์ชันดาวน์โหลดไฟล์แนบ
const downloadFile = async (filePath: string, fileName: string) => {
  const token = localStorage.getItem('token');
  const res = await fetch(
    `${BASE_URL}/api/download?path=${encodeURIComponent(filePath)}&filename=${encodeURIComponent(fileName)}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);

  // สร้าง blob เพื่อดาวน์โหลดไฟล์
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
};

// 📌 ประเภทข้อมูล UIRequest สำหรับแสดงในฟอร์ม
type UIRequest = {
  id: string;
  title: string;
  fiscalYear: number | string;
  approvedAmount: number | null;
  status: BudgetRequest['status'];
  disbursements: Array<{
    id: string;
    disbursedAmount: number;
    disbursedDate: string;
    note?: string | null;
    attachments?: { id: any; fileName: string; filePath: string }[];
  }>;
};

// 📌 แปลงข้อมูลจาก API ให้ตรงกับ UIRequest
const normalizeRequest = (d: any): UIRequest => ({
  id: d.id,
  title: d.title,
  fiscalYear: d.fiscalYear ?? d.fiscal_year ?? '-',
  approvedAmount:
    d.approvedAmount != null ? Number(d.approvedAmount) :
    d.approved_amount != null ? Number(d.approved_amount) : null,
  status: String(d.status ?? 'pending'),
  disbursements: Array.isArray(d.disbursements)
    ? d.disbursements.map((x: any) => {
        const rawDate = x.disbursedDate ?? x.disbursed_date ?? '';
        const iso = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();
        return {
          id: x.id,
          disbursedAmount: Number(x.disbursedAmount ?? x.disbursed_amount ?? 0),
          disbursedDate: iso,
          note: x.note ?? x.remark ?? null,
          attachments: Array.isArray(x.attachments)
            ? x.attachments.map((a: any) => ({
                id: a.id,
                fileName: a.fileName ?? a.file_name,
                filePath: a.filePath ?? a.file_path,
              }))
            : [],
        };
      })
    : [],
});

// 📌 คอมโพเนนต์หลัก: หน้าแบบฟอร์มบันทึกการเบิกจ่าย
export default function DisbursementFormPage() {
  const { id } = useParams<{ id: string }>(); // ดึง requestId จาก URL
  const navigate = useNavigate();
  const user = getUser(); // ดึงข้อมูลผู้ใช้จาก JWT

  // ✅ state หลัก
  const [request, setRequest] = useState<UIRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ state สำหรับฟอร์ม
  const [disbursedAmount, setDisbursedAmount] = useState('');
  const [disbursedDate, setDisbursedDate] = useState(new Date().toISOString().slice(0, 10)); // default วันนี้
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  // ✅ คำนวณยอดรวมเบิกจ่ายแล้ว + ยอดคงเหลือ
  const { totalDisbursed, remainingBalance } = useMemo(() => {
    if (!request) return { totalDisbursed: 0, remainingBalance: 0 };
    const total = (request.disbursements || []).reduce(
      (sum, d) => sum + Number(d.disbursedAmount || 0),
      0
    );
    const remaining = Number(request.approvedAmount || 0) - total;
    return { totalDisbursed: total, remainingBalance: remaining };
  }, [request]);

  // ✅ ตรวจสอบสิทธิ์การเบิกจ่าย
  const status = (request?.status || '').toLowerCase();
  const canDisburse = ['approved', 'partially_disbursed'].includes(status); // อนุมัติ/เบิกบางส่วน
  const fullyDisbursed = status === 'disbursed' || remainingBalance <= 0;   // เบิกครบแล้ว

  // ✅ โหลดข้อมูลคำขอจาก API
  useEffect(() => {
    if (!id) {
      setError('ไม่พบรหัสคำขอ (Request ID)');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const raw = await Requests.get(id);
        setRequest(normalizeRequest(raw));
        setError(null);
      } catch (err: any) {
        setError(err.message || 'ดึงข้อมูลคำขอล้มเหลว');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ✅ เซ็ตค่าเริ่มต้นของจำนวนเงินให้เท่ากับยอดคงเหลือ
  useEffect(() => {
    if (remainingBalance > 0) {
      setDisbursedAmount(String(remainingBalance));
    } else {
      setDisbursedAmount('');
    }
  }, [remainingBalance]);

  // ✅ จัดการไฟล์แนบ
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // ✅ ฟังก์ชันส่งฟอร์มบันทึกการเบิกจ่าย
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) {
      setError('เกิดข้อผิดพลาด ไม่พบข้อมูลผู้ใช้หรือคำขอ');
      return;
    }
    if (!canDisburse || fullyDisbursed) {
      setError('ไม่สามารถบันทึกการเบิกจ่ายได้ในสถานะปัจจุบัน');
      return;
    }

    const amount = parseFloat(disbursedAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('กรุณากรอกจำนวนเงินที่ถูกต้อง');
      return;
    }
    if (amount > remainingBalance + 0.001) {
      setError(`จำนวนเงินเกินยอดคงเหลือ (${formatCurrency(remainingBalance)})`);
      return;
    }

    setSubmitting(true);
    setError(null);

    // สร้าง FormData สำหรับส่งไฟล์ไป API
    const formData = new FormData();
    formData.append('requestId', id);
    formData.append('disbursedAmount', String(amount));
    formData.append('disbursedDate', disbursedDate);
    formData.append('note', note);
    formData.append('userId', user.id);
    attachments.forEach(file => formData.append('attachments', file));

    try {
      await api('/api/disbursements', { method: 'POST', body: formData });
      alert('บันทึกการเบิกจ่ายเรียบร้อย');
      navigate('/disbursements');
    } catch (err: any) {
      setError(err.message || 'บันทึกการเบิกจ่ายล้มเหลว');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ ส่วน UI แสดงสถานะการโหลด/ผิดพลาด
  if (loading) return <p>กำลังโหลดข้อมูล...</p>;
  if (error && !request) return <p className="text-red-500">Error: {error}</p>;
  if (!request) return <p>ไม่พบคำขอ</p>;

  // ✅ กำหนดข้อความเตือนตามสถานะ
  let blockMsg: string | null = null;
  if (status === 'pending') blockMsg = 'คำขอยังไม่อนุมัติ ไม่สามารถเบิกจ่ายได้';
  else if (status === 'rejected') blockMsg = 'คำขอนี้ถูกปฏิเสธ ไม่สามารถเบิกจ่ายได้';
  else if (fullyDisbursed) blockMsg = 'เบิกจ่ายครบแล้ว ไม่สามารถบันทึกเพิ่มได้';

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* ✅ ด้านซ้าย: รายละเอียดคำขอ + ประวัติการเบิกจ่าย */}
      <div className="md:col-span-1 space-y-6">
        {/* รายละเอียดคำขอ */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">รายละเอียดคำขอ</h2>
          <p><strong>ชื่อรายการ:</strong> {request.title}</p>
          <p><strong>ปีงบประมาณ:</strong> {request.fiscalYear}</p>
        </div>

        {/* สรุปยอด */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">สรุปยอด</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>ยอดอนุมัติ:</span> <span className="font-medium">{formatCurrency(request.approvedAmount)}</span></div>
            <div className="flex justify-between"><span>เบิกแล้ว:</span> <span className="font-medium text-red-600">{formatCurrency(totalDisbursed)}</span></div>
            <hr className="my-1"/>
            <div className="flex justify-between font-bold"><span>คงเหลือ:</span> <span>{formatCurrency(remainingBalance)}</span></div>
          </div>
        </div>

        {/* ประวัติการเบิกจ่าย */}
        {request.disbursements.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">ประวัติการเบิกจ่าย</h3>
            <ul className="space-y-3 text-sm">
              {request.disbursements.map(d => (
                <li key={d.id} className="flex justify-between border-b pb-2">
                  <div>
                    <span className="block">{new Date(d.disbursedDate).toLocaleDateString('th-TH')}</span>
                    {d.note && <span className="text-xs text-gray-500">- {d.note}</span>}
                    
                    {/* ไฟล์แนบ */}
                    {d.attachments && d.attachments.length > 0 && (
                      <div className="mt-1 space-x-2">
                        {d.attachments.map(a => (
                          <button
                            key={a.id}
                            onClick={async () => {
                              try { await downloadFile(a.filePath, a.fileName); }
                              catch (e:any) { alert('ดาวน์โหลดไฟล์ไม่สำเร็จ: ' + (e?.message ?? '')); }
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            📄 {a.fileName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="font-medium">{formatCurrency(d.disbursedAmount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ✅ ด้านขวา: ฟอร์มบันทึกการเบิกจ่าย */}
      <div className="md:col-span-2">
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">บันทึกการเบิกจ่ายงบประมาณ</h2>

          {blockMsg && (
            <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              {blockMsg}
            </p>
          )}

          {/* ฟิลด์: จำนวนเงิน */}
          <div className="mb-4">
            <label htmlFor="disbursedAmount" className="block text-gray-700 text-sm font-bold mb-2">
              จำนวนเงินที่เบิกจ่าย (บาท)
            </label>
            <input
              id="disbursedAmount"
              type="number"
              step="0.01"
              value={disbursedAmount}
              onChange={(e) => setDisbursedAmount(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
              required
              disabled={!canDisburse || fullyDisbursed}
            />
          </div>

          {/* ฟิลด์: วันที่เบิก */}
          <div className="mb-4">
            <label htmlFor="disbursedDate" className="block text-gray-700 text-sm font-bold mb-2">วันที่เบิกจ่าย</label>
            <input
              id="disbursedDate"
              type="date"
              value={disbursedDate}
              onChange={(e) => setDisbursedDate(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
              required
              disabled={!canDisburse || fullyDisbursed}
            />
          </div>

          {/* ฟิลด์: หมายเหตุ */}
          <div className="mb-6">
            <label htmlFor="note" className="block text-gray-700 text-sm font-bold mb-2">หมายเหตุ</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
              rows={3}
              disabled={!canDisburse || fullyDisbursed}
            />
          </div>

          {/* ฟิลด์: แนบไฟล์ */}
          <div className="mb-6">
            <label htmlFor="attachments" className="block text-gray-700 text-sm font-bold mb-2">ไฟล์ประกอบ (ถ้ามี)</label>
            {attachments.length > 0 && (
              <div className="space-y-2 mb-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                    <span className="text-sm">{file.name}</span>
                    <button type="button" onClick={() => removeAttachment(index)} className="text-red-500 hover:text-red-700 text-xs">ลบ</button>
                  </div>
                ))}
              </div>
            )}
            <input
              id="attachments"
              type="file"
              multiple
              onChange={handleAttachmentChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
              disabled={!canDisburse || fullyDisbursed}
            />
          </div>

          {/* แสดง error */}
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

          {/* ปุ่ม action */}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={submitting || remainingBalance <= 0 || !canDisburse || fullyDisbursed}
              title={!canDisburse || fullyDisbursed ? 'ไม่สามารถบันทึกได้ในสถานะปัจจุบัน' : undefined}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกการเบิกจ่าย'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/disbursements')}
              className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
