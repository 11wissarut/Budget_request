import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Requests } from '@/lib/api';
import { getToken } from '@/lib/auth';
import Stats from '@/components/Stats';
import BudgetDetailTable from '@/components/BudgetDetailTable';
import type { BudgetRequest } from '@/types';

// 💡 สถิติรวมสำหรับการ์ดบนแดชบอร์ด
interface StatsData {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  construction: number;
  equipment: number;
}

// 💡 รูปแบบข้อมูลที่จะแสดงในตารางรายละเอียด
interface DetailedRequest extends BudgetRequest {
  // ฟิลด์เสริมเพื่อแสดงผลบนตาราง
  totalDisbursed: number;     // ยอดที่ถูกเบิกจ่ายไปแล้ว (มาจาก total_disbursed ของ backend)
  remainingBalance: number;   // ยอดคงเหลือ = approved_amount - totalDisbursed (ถ้าไม่มี approved_amount ให้เป็น 0)
  created_by_name?: string;   // ชื่อผู้สร้างคำขอ (ถ้ามี)
}

// อัปเดตตามที่ผู้ใช้ต้องการล่าสุด
const CATEGORIES = ['ค่าวัสดุและสิ่งก่อสร้าง', 'ครุภัณฑ์', 'ค่าสาธารณูปโภค', 'ค่าจ้างชั่วคราว'];

export default function Dashboard() {
  // สถานะสถิติ + รายการคำขอ + สถานะโหลด
  const [stats, setStats] = useState<StatsData>({
    total: 0, pending: 0, approved: 0, rejected: 0, construction: 0, equipment: 0
  });
  const [requests, setRequests] = useState<DetailedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_BASE ?? 'http://localhost:4002';

  useEffect(() => {
    // ถ้าไม่มี token ให้เด้งไปหน้า login
    if (!getToken()) {
      navigate('/login');
      return;
    }

    // ฟังก์ชันโหลดข้อมูลทั้งสถิติและรายการคำขอ
    const fetchData = () => {
      setIsLoading(true);

      Promise.all([
        api('/api/stats'),   // ดึงสถิติรวม
        Requests.list()      // ดึงรายการคำขอทั้งหมด (เราปรับ backend ให้ใส่ total_disbursed มาด้วยแล้ว)
      ])
      .then(([statsData, requestsData]) => {
        setStats(statsData);

        // ✅ แปลงข้อมูลจาก backend → โครงที่ UI ใช้
        const mapped: DetailedRequest[] = (requestsData ?? []).map((r: any) => {
          const approvedAmount = Number(r.approved_amount ?? 0);
          const totalDisbursed = Number(r.total_disbursed ?? 0);
          const remainingBalance = Math.max(approvedAmount - totalDisbursed, 0);

          return {
            id: r.id,
            title: r.title,
            category: r.category,
            fiscal_year: r.fiscal_year,
            total_amount: r.total_amount,
            approved_amount: r.approved_amount,
            approval_note: r.approval_note,
            status: r.status,
            created_at: r.created_at,
            created_by: r.created_by,
            totalDisbursed,              
            remainingBalance,            
            created_by_name: r.created_by_name,
          };
        });

        setRequests(mapped);
      })
      .catch(error => {
        console.error('Failed to fetch dashboard data:', error);
        alert('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
      })
      .finally(() => {
        setIsLoading(false);
      });
    };

    fetchData();
    window.addEventListener('focus', fetchData);
    return () => window.removeEventListener('focus', fetchData);
  }, [navigate]);

  const fiscalYears = useMemo(() => {
    const years = new Set(requests.map(r => r.fiscal_year));
    return ['all', ...Array.from(years).sort((a, b) => b - a)];
  }, [requests]);

  // ปุ่มออกรายงานคำขอ PDF
  const handleExportRequestPDF = () => {
    const params = new URLSearchParams({
      fiscal_year: selectedYear,
      category: selectedCategory,
    });
    const reportUrl = `${BASE_URL}/api/analytics/report/pdf?${params.toString()}`;
    window.open(reportUrl, '_blank');
  };

  // ปุ่มออกรายงานการเบิกจ่าย PDF
  const handleExportDisbursementPDF = () => {
    const params = new URLSearchParams({
      fiscal_year: selectedYear,
      category: selectedCategory,
    });
    const reportUrl = `${BASE_URL}/api/analytics/report/disbursement/pdf?${params.toString()}`;
    window.open(reportUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">ภาพรวมคำขอทั้งหมด</h2>
        
        <div className="flex items-center gap-2">
          {/* Filters */}
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(e.target.value)}
            className="select select-bordered select-xs"
          >
            {fiscalYears.map(year => (
              <option key={year} value={year}>
                {year === 'all' ? 'ทุกปีงบประมาณ' : year}
              </option>
            ))}
          </select>

          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
            className="select select-bordered select-xs"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Report Buttons */}
          <button onClick={handleExportRequestPDF} className="btn btn-secondary btn-xs">รายงานคำขอ</button>
          <button onClick={handleExportDisbursementPDF} className="btn btn-accent btn-xs">รายงานการเบิกจ่าย</button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-24 flex justify-center items-center">Loading...</div>
      ) : (
        <>
          <Stats
            total={stats.total}
            pending={stats.pending}
            approved={stats.approved}
            rejected={stats.rejected}
            construction={stats.construction}
            equipment={stats.equipment}
          />
          <BudgetDetailTable requests={requests} />
        </>
      )}
    </div>
  );
}
