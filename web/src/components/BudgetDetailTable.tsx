import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BudgetRequest } from '../types';
import SearchBar from './SearchBar';

// 📌 ขยาย type ของ BudgetRequest ให้มีข้อมูลเพิ่มเติมสำหรับตาราง
interface DetailedRequest extends BudgetRequest {
  totalDisbursed: number;       // ✅ ยอดเงินที่เบิกจ่ายแล้ว
  created_by_name?: string;     // ✅ ชื่อผู้สร้างคำขอ
}

// 📌 ฟังก์ชันแปลงจำนวนเงินให้อยู่ในรูปแบบสกุลเงินไทย (THB)
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '-';
  return Number(amount).toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
};

// 📌 ฟังก์ชันกำหนด UI ของสถานะ (Status) เช่น สีและข้อความ
const getStatusUI = (status: BudgetRequest['status']) => {
  switch (status) {
    case 'pending':
      return { text: 'รออนุมัติ', cls: 'text-blue-900 bg-blue-200' };
    case 'approved':
      return { text: 'อนุมัติแล้ว', cls: 'text-green-900 bg-green-200' };
    case 'rejected':
      return { text: 'ไม่อนุมัติ', cls: 'text-red-900 bg-red-200' };
    case 'partially_disbursed':
      return { text: 'เบิกจ่ายบางส่วน', cls: 'text-yellow-900 bg-yellow-200' };
    case 'disbursed':
      return { text: 'เบิกจ่ายครบแล้ว', cls: 'text-gray-900 bg-gray-200' };
    default:
      return { text: status, cls: 'text-gray-900 bg-gray-200' };
  }
};

// 📌 คอมโพเนนต์แสดงตารางรายละเอียดคำขอ
const BudgetDetailTable = ({ requests }: { requests: DetailedRequest[] }) => {
  const [searchTerm, setSearchTerm] = useState('');  // ✅ ค่าค้นหา
  const navigate = useNavigate();

  // ✅ กรองข้อมูลคำขอที่ตรงกับคำค้นหา
  const filteredRequests = useMemo(() => {
    return requests.filter(req =>
      req.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mt-6">
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-4">รายละเอียดงบประมาณ</h3>
        {/* 🔍 กล่องค้นหา */}
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              {/* ✅ ส่วนหัวของตาราง */}
              <th className="px-3 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">ชื่อโครงการ</th>
              <th className="px-3 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">ประเภทงบ</th>
              <th className="px-3 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">ปีงบประมาณ</th>
              <th className="px-3 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">หน่วยงาน</th>
              <th className="px-3 py-3 border-b-2 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase">วงเงินที่ขอ</th>
              <th className="px-3 py-3 border-b-2 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase">วงเงินที่อนุมัติ</th>
              <th className="px-3 py-3 border-b-2 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase">ผลต่าง</th>
              <th className="px-3 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">สถานะ</th>
              <th className="px-3 py-3 border-b-2 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase">วันที่สร้าง</th>
              <th className="px-3 py-3 border-b-2 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase">เบิกจ่ายแล้ว</th>
              <th className="px-3 py-3 border-b-2 bg-gray-100 text-right text-xs font-semibold text-gray-600 uppercase">คงเหลือ</th>
            </tr>
          </thead>

          <tbody>
            {filteredRequests.map((req) => {
              // ✅ คำนวณตัวเลขที่เกี่ยวข้อง
              const requested = Number(req.total_amount || 0);      // วงเงินที่ขอ
              const approved = Number(req.approved_amount || 0);    // วงเงินที่อนุมัติ
              const disbursed = Number(req.totalDisbursed || 0);    // ยอดเบิกจ่ายแล้ว
              const difference = approved - requested;              // ผลต่างระหว่างอนุมัติ - ขอ
              const remaining = approved - disbursed;               // คงเหลือ = อนุมัติ - เบิกแล้ว
              const { text, cls } = getStatusUI(req.status);        // ดึงสถานะ + สีแสดงผล

              return (
                <tr key={req.id} className="hover:bg-gray-50">
                  {/* ✅ ข้อมูลแต่ละคอลัมน์ */}
                  <td className="px-3 py-4 border-b text-sm">{req.title}</td>
                  <td className="px-3 py-4 border-b text-sm">{req.category}</td>
                  <td className="px-3 py-4 border-b text-sm">{req.fiscal_year}</td>
                  <td className="px-3 py-4 border-b text-sm">{req.created_by_name || 'N/A'}</td>
                  <td className="px-3 py-4 border-b text-sm text-right">{formatCurrency(requested)}</td>
                  <td className="px-3 py-4 border-b text-sm text-right">{formatCurrency(approved)}</td>
                  <td className="px-3 py-4 border-b text-sm text-right">{formatCurrency(difference)}</td>
                  <td className="px-3 py-4 border-b text-sm">
                    <span className={`px-2 py-1 rounded-full font-semibold ${cls}`}>
                      {text}
                    </span>
                  </td>
                  <td className="px-3 py-4 border-b text-sm">{new Date(req.created_at).toLocaleDateString('th-TH')}</td>
                  <td className="px-3 py-4 border-b text-sm text-right">{formatCurrency(disbursed)}</td>
                  <td className="px-3 py-4 border-b text-sm text-right font-semibold">{formatCurrency(remaining)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetDetailTable;
