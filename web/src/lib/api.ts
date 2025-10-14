// ไคลเอนต์เรียก API — แนบ JWT อัตโนมัติ
import { getToken } from './auth'

const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4002'

// --- Core API Function ---
export async function api(path: string, init?: RequestInit) {
  const token = getToken();
  const headers: Record<string, string> = { ...(init?.headers as any || {}) };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!headers['Accept']) headers['Accept'] = 'application/json';
  if (!(init?.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(BASE + path, { ...init, headers });

  if (!res.ok) {
    const errorText = await res.text();
    let message = res.statusText;
    try {
      const json = JSON.parse(errorText);
      if (json?.message) message = json.message;
      else if (json?.error) message = json.error;
    } catch {
      if (errorText) message = errorText;
    }
    throw new Error(`${res.status} ${message}`.trim());
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

// --- API Modules ---
export const Auth = {
  login: (username:string,password:string) =>
    api('/api/auth/login', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({username,password})
    })
}

export const Users = {
  list: () => api('/api/users'),
  create: (u:any) => api('/api/users', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(u) }),
  update: (id:string, u:any) => api('/api/users/'+id, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(u)}),
  remove: (id:string) => api('/api/users/'+id, { method:'DELETE' }),
}

export const Requests = {
  list: () => api('/api/requests'),
  get: (id: string) => api(`/api/requests/${id}`),
  getForDisbursement: () => api('/api/requests/for-disbursement'),
  create: (r:any) => api('/api/requests', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(r) }),
  update: (id: string, formData: FormData) => api(`/api/requests/${id}`, { method: 'PUT', body: formData }),
  approve: (id: string, approvedAmount: number, approvalNote: string) => api(`/api/requests/${id}/approve`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvedAmount, approvalNote })
  }),
  reject: (id: string) => api(`/api/requests/${id}/reject`, { method: 'PUT' }),
  remove: (id:string) => api('/api/requests/'+id, { method:'DELETE' }),
}

export const Submissions = {
  list: () => api('/api/submissions'),
  upload: (name:string, note:string, file:File) => {
    const fd = new FormData()
    fd.append('name', name)
    if (note) fd.append('note', note)
    fd.append('file', file)
    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = 'Bearer ' + token
    return fetch(BASE + '/api/submissions', { method:'POST', headers, body: fd }).then(async r => {
      if (!r.ok) throw new Error(await r.text() || r.statusText)
      const json = await r.json();
      return json;
    })
  }
}

export const Disbursements = {
  create: (data: {
    requestId: string;
    disbursedAmount: number;
    disbursedDate: string; // YYYY-MM-DD
    note?: string;
    userId: string;
  }) => api('/api/disbursements', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export const Forms = { list: () => api('/api/forms') }
export const Stats = { get: () => api('/api/stats') }
