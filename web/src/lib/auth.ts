import type { User, ModuleKey, Role } from '@/types'
import { RoleAccess } from '@/types'

// จัดเก็บ user + token ไว้ใน localStorage
export type Session = { user: User, token: string }
const KEY = 'brm_session'
export function setSession(s: Session | null){ if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY) }
export function getSession(): Session | null { try { const raw = localStorage.getItem(KEY); return raw? JSON.parse(raw) : null } catch { return null } }
export function getUser(){ return getSession()?.user ?? null }
export function getToken(){ return getSession()?.token ?? '' }

// เช็คว่าสิทธิ์เข้าถึงโมดูลได้หรือไม่
export function canAccess(role: Role, module: ModuleKey){ return new Set(RoleAccess[role] || []).has(module) }
