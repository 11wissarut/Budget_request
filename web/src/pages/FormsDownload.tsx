import { useEffect, useState } from 'react'
import { Forms } from '@/lib/api'

export default function FormsDownload() {
  const [forms, setForms] = useState<any[]>([])
  useEffect(()=>{ Forms.list().then(setForms) }, [])
  return (
    <div className="card p-4">
      <div className="mb-3 text-lg font-medium">แบบฟอร์มดาวน์โหลด</div>
      <ul className="space-y-3">
        {forms.map((f, idx) => (
          <li key={f.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 font-semibold text-blue-700">{idx+1}</div>
              <div><div className="font-medium">{f.name}</div><div className="text-xs text-slate-500">{f.size || ''}</div></div>
            </div>
            <a className="btn-primary" href={f.url} download={f.fileName || f.name}>ดาวน์โหลด</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
