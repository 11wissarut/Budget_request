import { useForm } from 'react-hook-form'
import { Auth } from '@/lib/api'
import { setSession } from '@/lib/auth'

export default function Login() {
  const { register, handleSubmit } = useForm<{username:string,password:string}>()
  const onSubmit = async (v:{username:string,password:string}) => {
    try {
      const res = await Auth.login(v.username, v.password) as any
      setSession(res) // เก็บ user + token
      location.href = '/dashboard'
    } catch (e:any) {
      alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    }
  }
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-blue-50 to-white">
      <form onSubmit={handleSubmit(onSubmit)} className="card w-[420px] max-w-[92vw] p-6">
        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold text-blue-800">Budget Request System</div>
          <div className="text-sm text-slate-500">เข้าสู่ระบบ</div>
        </div>
        <div className="space-y-3">
          <div><label className="mb-1 block text-sm text-slate-600">ชื่อผู้ใช้</label><input className="input" {...register('username')} /></div>
          <div><label className="mb-1 block text-sm text-slate-600">รหัสผ่าน</label><input className="input" type="password" {...register('password')} /></div>
          <button className="btn-primary w-full">เข้าสู่ระบบ</button>
        </div>
          </form>
    </div>
  )
}
