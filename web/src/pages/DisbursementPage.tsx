import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Requests } from '../lib/api';
import type { BudgetRequest } from '../types';
import SearchBar from '../components/SearchBar';

// 📌 ประเภทข้อมูลที่ใช้สำหรับแสดงในตารางเบิกจ่าย
type DisbursementRequest =
  Pick<BudgetRequest, 'id' | 'title' | 'fiscalYear' | 'approvedAmount' | 'status'>
  & { totalDisbursed: number };

// 📌 ฟังก์ชันแปลงจำนวนเงินให้อยู่ในรูปแบบสกุลเงินไทย
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '-';
  return Number(amount).toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
};

// 📌 ฟังก์ชันกำหนด UI ของสถานะ
//   - approved = อนุมัติแล้ว
//   - partially_disbursed = เบิกบางส่วน
//   - disbursed = เบิกครบแล้ว
const getStatusUI = (status: BudgetRequest['status']) => {
  switch (status) {
    case 'approved':
      return { text: 'อนุมัติแล้ว', cls: 'text-green-900 bg-green-200' };
    case 'partially_disbursed':
      return { text: 'เบิกจ่ายบางส่วน', cls: 'text-yellow-900 bg-yellow-200' };
    case 'disbursed':
      return { text: 'เบิกจ่ายครบแล้ว', cls: 'text-gray-900 bg-gray-200' };
    default:
      return { text: status, cls: 'text-gray-900 bg-gray-200' };
  }
};

// 📌 ฟังก์ชันแปลงข้อมูลจาก API ให้ตรงกับ DisbursementRequest
const normalizeRow = (d: any): DisbursementRequest => ({
  id: d.id,
  title: d.title,
  fiscalYear: d.fiscalYear ?? d.fiscal_year ?? '-',
  approvedAmount: d.approvedAmount != null ? Number(d.approvedAmount) :
                   d.approved_amount != null ? Number(d.approved_amount) : null,
  status: (d.status ?? 'approved').toString(),
  totalDisbursed: Number(d.totalDisbursed ?? d.total_disbursed ?? 0),
});

export default function DisbursementPage() {
  // ✅ state หลัก
  const [requests, setRequests] = useState<DisbursementRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // ✅ โหลดข้อมูลจาก API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await Requests.getForDisbursement();
        setRequests((data ?? []).map(normalizeRow));
        setError(null);
      } catch (err: any) {
        setError(err.message || 'โหลดข้อมูลไม่สำเร็จ');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData(); // โหลดครั้งแรกตอนเปิดหน้า

    // 📌 โหลดใหม่ทุกครั้งเมื่อผู้ใช้กลับมาที่หน้า (focus)
    window.addEventListener('focus', fetchData);
    return () => {
      window.removeEventListener('focus', fetchData);
    };
  }, []);

  // ✅ กรองข้อมูลตามคำค้นหา (searchTerm)
  const filteredRequests = requests.filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      {/* หัวข้อหน้า */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">รายการเบิกจ่ายงบประมาณ</h1>
      </div>

      {/* กล่องค้นหา */}
      <div className="mb-4">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </div>

      {/* แสดงสถานะการโหลด/ผิดพลาด */}
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* ตารางรายการเบิกจ่าย */}
      {!loading && !error && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ชื่อรายการ</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ปีงบประมาณ</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">ยอดอนุมัติ</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">เบิกจ่ายแล้ว</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">คงเหลือ</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">สถานะ</th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  // 📌 คำนวณยอด
                  const approved = Number(req.approvedAmount || 0);   // ยอดอนุมัติ
                  const disbursed = Number(req.totalDisbursed || 0); // เบิกแล้ว
                  const remaining = approved - disbursed;            // คงเหลือ

                  // 📌 ดึง UI ของสถานะ
                  const { text, cls } = getStatusUI(req.status);

                  // 📌 เงื่อนไขว่าสามารถเบิกเพิ่มได้ไหม
                  const canDisburse =
                    remaining > 0.001 && (req.status === 'approved' || req.status === 'partially_disbursed');

                  return (
                    <tr
                      key={req.id}
                      onClick={() => navigate(`/disbursements/${req.id}`)} // 👉 คลิกที่แถวเพื่อไปหน้าแบบฟอร์ม
                      className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <p className="text-gray-900 whitespace-no-wrap">{req.title}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <p className="text-gray-900 whitespace-no-wrap">{req.fiscalYear}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                        <p className="text-gray-900 whitespace-no-wrap">{formatCurrency(approved)}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                        <p className="text-gray-900 whitespace-no-wrap">{formatCurrency(disbursed)}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right font-semibold">
                        <p className="text-gray-900 whitespace-no-wrap">{formatCurrency(remaining)}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <span className={`relative inline-block px-3 py-1 font-semibold leading-tight rounded-full ${cls}`}>
                          <span className="relative">{text}</span>
                        </span>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                        <span className="text-indigo-600 font-semibold">
                          {canDisburse ? 'เบิกจ่าย / ดูรายละเอียด' : 'ดูรายละเอียด'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
