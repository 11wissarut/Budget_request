import { useEffect, useState } from 'react'
import { Requests as ReqApi, Stats } from '@/lib/api'
import Charts from '@/components/Charts'
import StatsCards from '@/components/Stats'
import type { BudgetRequest } from '@/types'

export default function Dashboard() {
  const [requests, setRequests] = useState<BudgetRequest[]>([])
  const [stat, setStat] = useState({ total: 0, pending: 0, approved: 0 })
  useEffect(() => { 
    ReqApi.list().then(setRequests)
    Stats.get().then(setStat as any)
  }, [])
  return (
    <div className="space-y-4">
      <StatsCards total={stat.total} pending={stat.pending} approved={stat.approved}/>
      <Charts requests={requests}/>
    </div>
  )
}
