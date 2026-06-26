import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import UsersPage from './pages/Users'
import CollectorsPage from './pages/Collectors'
import PickupsPage from './pages/Pickups'
import WithdrawalsPage from './pages/Withdrawals'
import BalancePage from './pages/Balance'
import BinsPage from './pages/Bins'
import NotificationsPage from './pages/Notifications'

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Guard><Layout /></Guard>}>
            <Route index element={<Overview />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="collectors" element={<CollectorsPage />} />
            <Route path="pickups" element={<PickupsPage />} />
            <Route path="withdrawals" element={<WithdrawalsPage />} />
            <Route path="balance" element={<BalancePage />} />
            <Route path="bins" element={<BinsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
