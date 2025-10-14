import { Link } from 'react-router-dom';

export default function Stats({total,pending,approved, rejected, construction, equipment}:{total:number,pending:number,approved:number, rejected:number, construction: number, equipment: number}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <div className="card p-4"><div className="flex items-center justify-between"><div><div className="text-3xl font-semibold text-blue-700">{total}</div><div className="text-sm text-slate-600">Total</div></div><span>📄</span></div></div>
      <div className="card p-4"><div className="flex items-center justify-between"><div><div className="text-3xl font-semibold text-amber-600">{pending}</div><div className="text-sm text-slate-600">Pending</div></div><span>⏳</span></div></div>
      <div className="card p-4"><div className="flex items-center justify-between"><div><div className="text-3xl font-semibold text-emerald-600">{approved}</div><div className="text-sm text-slate-600">Approved</div></div><span>✅</span></div></div>
      <div className="card p-4"><div className="flex items-center justify-between"><div><div className="text-3xl font-semibold text-red-600">{rejected}</div><div className="text-sm text-slate-600">Rejected</div></div><span>❌</span></div></div>
      <Link to="/requests?category=CONSTRUCTION" className="card p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between"><div><div className="text-3xl font-semibold text-cyan-600">{construction}</div><div className="text-sm text-slate-600">Construction</div></div><span>🏗️</span></div>
      </Link>
      <Link to="/requests?category=EQUIPMENT" className="card p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between"><div><div className="text-3xl font-semibold text-purple-600">{equipment}</div><div className="text-sm text-slate-600">Equipment</div></div><span>📠</span></div>
      </Link>
    </div>
  )
}
