export default function SearchBar({value, onChange}:{value:string, onChange:(v:string)=>void}) {
  return (
    <div className="card flex items-center gap-2 p-2">
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <span className="text-slate-500">🔍</span>
        <input className="w-full outline-none" placeholder="Search…" value={value} onChange={(e)=>onChange(e.target.value)}/>
      </div>
      <button className="btn-ghost">⚙️</button>
    </div>
  )
}
