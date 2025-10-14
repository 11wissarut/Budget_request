// หน้าจัดการผู้ใช้ — แสดงเฉพาะ role 'admin'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users as Api } from '@/lib/api';
import { getToken } from '@/lib/auth';

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'planner' })
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const navigate = useNavigate();

  const refresh = () => Api.list().then(setUsers)

  useEffect(() => {
    const fetchData = async () => {
      // ตรวจสอบ token ก่อน
      if (!getToken()) {
        navigate('/login');
        return;
      }

      try {
        const data = await Api.list()
        setUsers(data)
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }
    fetchData()
  }, [navigate])

  const submit = async () => {
    if (!form.name || !form.username) return alert('กรอกข้อมูลให้ครบ');

    // ✅ ตรวจสอบรหัสผ่านเสมอ (ทั้งเพิ่มและแก้ไข)
    if (!form.password) return alert('กรุณากรอกรหัสผ่าน');
    if (form.password !== passwordConfirm) return alert('รหัสผ่านไม่ตรงกัน');
    if (form.password.length < 6) return alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');

    if (editing) {
      await Api.update(editing, form);
      setEditing(null);
    } else {
      await Api.create(form);
    }

    setForm({ name: '', username: '', password: '', role: 'planner' });
    setPasswordConfirm('');
    refresh();
    alert('บันทึกข้อมูลสำเร็จ');
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="mb-3 text-lg font-medium">จัดการผู้ใช้</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <input
            className="input"
            placeholder="ชื่อ-สกุล"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="input"
            placeholder="ชื่อผู้ใช้"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
          <input
            className="input"
            placeholder="รหัสผ่าน"
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <input
            className="input"
            placeholder="ยืนยันรหัสผ่าน"
            type="password"
            value={passwordConfirm}
            onChange={e => setPasswordConfirm(e.target.value)}
          />
          <select
            className="input"
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value="admin">ผู้ดูแลระบบ</option>
            <option value="planner">งานแผน</option>
            <option value="procurement">งานพัสดุ</option>
            <option value="board">กรรมการ/ผู้บริหาร</option>
          </select>
        </div>
        <div className="mt-3">
          <button className="btn-primary" onClick={submit}>
            {editing ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}
          </button>
          {editing && (
            <button
              className="btn-ghost ml-2"
              onClick={() => {
                setEditing(null);
                setForm({ name: '', username: '', password: '', role: 'planner' });
                setPasswordConfirm('');
              }}
            >
              ยกเลิก
            </button>
          )}
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
                    <button
                      className="btn-ghost mr-2"
                      onClick={() => {
                        setEditing(u.id);
                        setForm({
                          name: u.name,
                          username: u.username,
                          password: '',
                          role: u.role
                        });
                        setPasswordConfirm('');
                      }}
                    >
                      แก้ไข
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${u.name}"?`)) {
                          Api.remove(u.id).then(refresh);
                        }
                      }}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
