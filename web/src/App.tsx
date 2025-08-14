import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Requests from './pages/Requests'
import FormsDownload from './pages/FormsDownload'
import FormsSubmit from './pages/FormsSubmit'
import Login from './pages/Login'
import { getUser, canAccess } from './lib/auth'
import type { ModuleKey } from './types'

function Guard({ module, children }: { module: ModuleKey, children: JSX.Element }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (!canAccess(user.role, module)) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const user = getUser()
  const loc = useLocation()
  if (!user && loc.pathname !== '/login') return <Navigate to="/login" replace />
  if (user && loc.pathname === '/login') return <Navigate to="/dashboard" replace />
  return (
    <Routes>
      <Route path="/login" element={<Login/>} />
      <Route path="/dashboard" element={<Layout><Guard module='dashboard'><Dashboard/></Guard></Layout>} />
      <Route path="/users" element={<Layout><Guard module='users'><Users/></Guard></Layout>} />
      <Route path="/requests" element={<Layout><Guard module='requests'><Requests/></Guard></Layout>} />
      <Route path="/forms/download" element={<Layout><Guard module='forms_download'><FormsDownload/></Guard></Layout>} />
      <Route path="/forms/submit" element={<Layout><Guard module='forms_submit'><FormsSubmit/></Guard></Layout>} />
      <Route path="*" element={<Navigate to="/dashboard" replace/>} />
    </Routes>
  )
}
