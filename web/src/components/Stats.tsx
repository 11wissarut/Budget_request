export default function Stats({total,pending,approved}:{total:number,pending:number,approved:number}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="card p-4"><div className="flex items-center justify-between"><div><div className="text-3xl font-semibold text-blue-700">{total}</div><div className="text-sm text-slate-600">Total</div></div><span>📄</span></div></div>
      <div className="card p-4"><div className="flex items-center justify-between"><div><div className="text-3xl font-semibold text-amber-600">{pending}</div><div className="text-sm text-slate-600">Pending</div></div><span>⏳</span></div></div>
      <div className="card p-4"><div className="flex items-center justify-between"><div><div className="text-3xl font-semibold text-emerald-600">{approved}</div><div className="text-sm text-slate-600">Approved</div></div><span>✅</span></div></div>
    </div>
  )
}
