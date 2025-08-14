export type Role = 'admin' | 'planner' | 'procurement' | 'board'
export type User = { id: string; name: string; username: string; role: Role }
export type BudgetRequest = { id: string; title: string; category: string; fiscalYear: number; amount: number; status:'pending'|'approved'|'rejected'; createdAt: string }
export type Submission = { id: string; name: string; note?: string; fileName: string; fileUrl: string; createdAt: string }

export type ModuleKey = 'dashboard' | 'users' | 'requests' | 'forms_download' | 'forms_submit'

// แมพสิทธิ์แบบเดียวกับฝั่ง server
export const RoleAccess: Record<Role, ModuleKey[]> = {
  admin: ['dashboard','users','requests','forms_download','forms_submit'],
  planner: ['dashboard','requests','forms_download','forms_submit'],
  procurement: ['dashboard','forms_download','forms_submit'],
  board: ['dashboard','forms_download'],
}
