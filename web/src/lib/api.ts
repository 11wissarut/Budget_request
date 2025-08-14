// ไคลเอนต์เรียก API — แนบ JWT อัตโนมัติ
import { getToken } from './auth'
const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4002'

export async function api(path: string, init?: RequestInit) {
  const token = getToken()
  const headers: Record<string,string> = { ...(init?.headers as any || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(BASE + path, { ...init, headers })
  if (!res.ok) throw new Error(await res.text() || res.statusText)
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') ? res.json() : res.text()
}

export const Auth = {
  login: (username:string,password:string) => api('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username,password}) })
}
export const Users = {
  list: () => api('/api/users'),
  create: (u:any) => api('/api/users', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(u) }),
  update: (id:string, u:any) => api('/api/users/'+id, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(u)}),
  remove: (id:string) => api('/api/users/'+id, { method:'DELETE' }),
}
export const Requests = {
  list: () => api('/api/requests'),
  create: (r:any) => api('/api/requests', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(r) }),
  update: (id:string, r:any) => api('/api/requests/'+id, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(r)}),
  remove: (id:string) => api('/api/requests/'+id, { method:'DELETE' }),
}
export const Submissions = {
  list: () => api('/api/submissions'),
  upload: (name:string, note:string, file:File) => {
    const fd = new FormData()
    fd.append('name', name); if (note) fd.append('note', note); fd.append('file', file)
    return fetch(BASE + '/api/submissions', { method:'POST', headers: { 'Authorization': 'Bearer ' + getToken() }, body: fd }).then(async r => {
      if (!r.ok) throw new Error(await r.text() || r.statusText); return r.json()
    })
  }
}
export const Forms = { list: () => api('/api/forms') }
export const Stats = { get: () => api('/api/stats') }
