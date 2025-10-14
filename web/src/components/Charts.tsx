import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import type { BudgetRequest } from '@/types'

export default function Charts({requests}:{requests:BudgetRequest[]}) {
  const byCategory = Object.values(requests.filter(r => r.status === 'approved').reduce((acc:any, r) => {
    acc[r.category] = acc[r.category] || { name: r.category, amount: 0 }
    acc[r.category].amount += r.approvedAmount || 0
    return acc
  }, {} as Record<string, {name: string, amount: number}>))

  const byStatus = [
    { name: 'Pending', count: requests.filter(r => r.status==='pending').length },
    { name: 'Approved', count: requests.filter(r => r.status==='approved').length },
    { name: 'Rejected', count: requests.filter(r => r.status==='rejected').length },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="card p-4">
        <div className="mb-3 font-medium">สัดส่วนงบประมาณตามหมวดหมู่</div>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <PieChart>
              <Pie dataKey="amount" data={byCategory} outerRadius={90} label>
                {byCategory.map((_, idx) => <Cell key={idx} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card p-4">
        <div className="mb-3 font-medium">จำนวนรายการตามสถานะ</div>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart data={byStatus}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
