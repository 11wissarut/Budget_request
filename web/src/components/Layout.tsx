import { Link, useLocation } from 'react-router-dom'
import { ReactNode, useMemo, useState } from 'react'
import clsx from 'clsx'
import { getUser, setSession, canAccess } from '@/lib/auth'
import type { ModuleKey, Role } from '@/types'

// เมนูถูกวาดตามสิทธิ์ (RBAC)
const items: { to: string; label: string; key: ModuleKey }[] = [
  { to: '/dashboard', label: 'แดชบอร์ด', key: 'dashboard' },
  { to: '/manage-requests', label: 'จัดการคำของบประมาณ', key: 'manage_requests' },
  { to: '/disbursements', label: 'เบิกจ่ายงบประมาณ', key: 'disbursements' },
  { to: '/requests', label: 'พิจารณาคำของบประมาณ', key: 'requests' },
  { to: '/forms/download', label: 'ดาวน์โหลดแบบฟอร์ม', key: 'forms_download' },
  { to: '/forms/submit', label: 'ส่งแบบฟอร์มคำของบ', key: 'forms_submit' },
  { to: '/users', label: 'จัดการผู้ใช้', key: 'users' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const user = getUser()
  const role = (user?.role ?? 'board') as Role
  const [open, setOpen] = useState(true)
  const loc = useLocation()

  const nav = useMemo(() => items.filter(i => canAccess(role, i.key)), [role])

  return (
    <div className="min-h-screen text-slate-800">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-blue-700 text-white shadow-soft">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(!open)} className="btn-ghost text-white">☰</button>
            <Link to="/" className="text-lg font-semibold tracking-wide">Budget Request <span className="opacity-80">System</span></Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm md:inline">สวัสดี, {user?.name ?? 'ผู้ใช้'}</span>
            <button className="btn bg-white/10 hover:bg-white/20" onClick={()=>{ setSession(null); location.href='/login' }}>ออกจากระบบ</button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside className={clsx('col-span-12 md:col-span-3 lg:col-span-2', open ? 'block' : 'hidden md:block')}>
          <nav className="card p-3">
            <div className="mb-2 px-2 text-xs uppercase tracking-wider text-slate-500">เมนู</div>
            <div className="space-y-1">
              {nav.map(i => (
                <Link key={i.to} to={i.to} className={clsx('block rounded-xl px-3 py-2 text-sm hover:bg-blue-50', loc.pathname===i.to && 'bg-blue-50')}>{i.label}</Link>
              ))}
            </div>
          </nav>
        </aside>

        {/* Content */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10">{children}</main>
      </div>
    </div>
  )
}
