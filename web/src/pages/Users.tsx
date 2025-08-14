// หน้าจัดการผู้ใช้ — แสดงเฉพาะ role 'admin'
import { useEffect, useState } from 'react'
import { Users as Api } from '@/lib/api'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'planner' })
  const [editing, setEditing] = useState<string | null>(null)

  const refresh = () => Api.list().then(setUsers)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await Api.list()
        setUsers(data)
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }
    fetchData()
  }, [])

  const submit = async () => {
    if (!form.name || !form.username || !form.password) return alert('กรอกข้อมูลให้ครบ')
    if (editing) { await Api.update(editing, form); setEditing(null) }
    else { await Api.create(form) }
    setForm({ name: '', username: '', password: '', role: 'planner' }); refresh()
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="mb-3 text-lg font-medium">จัดการผู้ใช้</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input className="input" placeholder="ชื่อ-สกุล" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          <input className="input" placeholder="ชื่อผู้ใช้" value={form.username} onChange={e=>setForm({...form, username:e.target.value})}/>
          <input className="input" placeholder="รหัสผ่าน" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
          <select className="input" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
            <option value="admin">ผู้ดูแลระบบ</option>
            <option value="planner">งานแผน</option>
            <option value="procurement">งานพัสดุ</option>
            <option value="board">กรรมการ/ผู้บริหาร</option>
          </select>
        </div>
        <div className="mt-3">
          <button className="btn-primary" onClick={submit}>{editing ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}</button>
          {editing && <button className="btn-ghost ml-2" onClick={()=>{setEditing(null); setForm({ name:'', username:'', password:'', role:'planner' })}}>ยกเลิก</button>}
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-3 text-lg font-medium">ผู้ใช้ทั้งหมด</div>
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">ชื่อ</th>
                <th className="py-2">ชื่อผู้ใช้</th>
                <th className="py-2">สิทธิ์</th>
                <th className="py-2 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="py-2">{u.name}</td>
                  <td className="py-2">{u.username}</td>
                  <td className="py-2">{u.role}</td>
                  <td className="py-2 text-right">
                    <button className="btn-ghost mr-2" onClick={()=>{setEditing(u.id); setForm({ name: u.name, username: u.username, password: '', role: u.role })}}>แก้ไข</button>
                    <button className="btn-ghost" onClick={async()=>{ await Api.remove(u.id); refresh()}}>ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-slate-500">* รหัสผ่านถูกแฮชบนเซิร์ฟเวอร์ด้วย bcryptjs</div>
      </div>
    </div>
  )
}
