import { useEffect, useState } from 'react';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts';
export default function DashboardPie(){
  const [year, setYear] = useState(2026);
  const [categoryId, setCategoryId] = useState(0);
  const [data, setData] = useState([]);
  useEffect(()=>{
    (async ()=>{
      const q = new URLSearchParams();
      if (year) q.set('year', year);
      if (categoryId) q.set('category_id', categoryId);
      const r = await fetch('/api/analytics/summary?'+q.toString());
      setData(await r.json());
    })();
  },[year, categoryId]);
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select value={categoryId} onChange={e=>setCategoryId(Number(e.target.value))}>
          <option value="0">ทุกหมวด</option>
          <option value="1">ครุภัณฑ์</option>
          <option value="2">ค่าที่ดินและสิ่งก่อสร้าง 1 ปี</option>
        </select>
        <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))}/>
      </div>
      <div style={{ width:'100%', height:360 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="name" label />
            <Tooltip /><Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}