import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Users, Truck, Wallet, Leaf, TrendingUp, Clock } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalCollectors: number
  pendingPickups: number
  completedPickups: number
  totalPointsAwarded: number
  totalWithdrawals: number
  pendingWithdrawals: number
}

interface DailyPickup { date: string; count: number }

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [chart, setChart] = useState<DailyPickup[]>([])
  const [recentPickups, setRecentPickups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [usersRes, pickupsRes, withdrawalsRes, chartRes, recentRes] = await Promise.all([
      supabase.from('profiles').select('id, created_at', { count: 'exact' }),
      supabase.from('pickup_requests').select('status, actual_points', { count: 'exact' }),
      supabase.from('withdrawals').select('status, amount_fcfa', { count: 'exact' }),
      supabase.from('pickup_requests')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .order('created_at', { ascending: true }),
      supabase.from('pickup_requests')
        .select('id, waste_type, address, status, created_at, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const pickups = pickupsRes.data ?? []
    const withdrawals = withdrawalsRes.data ?? []

    // Group chart data by day
    const dayMap: Record<string, number> = {}
    ;(chartRes.data ?? []).forEach((p: any) => {
      const d = p.created_at.slice(0, 10)
      dayMap[d] = (dayMap[d] ?? 0) + 1
    })
    const chartData = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date: date.slice(5), count }))

    setStats({
      totalUsers: usersRes.count ?? 0,
      totalCollectors: 0,
      pendingPickups: pickups.filter(p => p.status === 'PENDING').length,
      completedPickups: pickups.filter(p => p.status === 'COMPLETED').length,
      totalPointsAwarded: pickups.reduce((s, p) => s + (p.actual_points ?? 0), 0),
      totalWithdrawals: withdrawals.filter((w: any) => w.status === 'SUCCESSFUL').reduce((s: number, w: any) => s + w.amount_fcfa, 0),
      pendingWithdrawals: withdrawals.filter((w: any) => w.status === 'PENDING').length,
    })
    setChart(chartData)
    setRecentPickups(recentRes.data ?? [])
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>
  )

  const s = stats!
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">Platform-wide metrics at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="Total Users"          value={s.totalUsers}                              color="bg-blue-500" />
        <StatCard icon={Truck}      label="Pending Pickups"      value={s.pendingPickups}                          color="bg-amber-500" />
        <StatCard icon={TrendingUp} label="Points Awarded"       value={s.totalPointsAwarded.toLocaleString()}     color="bg-green-500" />
        <StatCard icon={Wallet}     label="Withdrawn (FCFA)"     value={s.totalWithdrawals.toLocaleString()}       color="bg-purple-500" />
        <StatCard icon={Leaf}       label="Completed Pickups"    value={s.completedPickups}                        color="bg-emerald-500" />
        <StatCard icon={Clock}      label="Pending Withdrawals"  value={s.pendingWithdrawals}  sub="need attention"  color="bg-red-500" />
      </div>

      {/* Chart */}
      {chart.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Pickups — last 30 days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="green" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#16a34a" fill="url(#green)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent pickups */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">Recent Pickup Requests</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {recentPickups.map(p => (
            <div key={p.id} className="px-5 py-3 flex items-center gap-4 text-sm">
              <span className="w-24 font-medium text-slate-700 capitalize">{p.waste_type}</span>
              <span className="flex-1 text-slate-500 truncate">{p.address}</span>
              <span className="text-xs text-slate-400">{p.created_at.slice(0, 10)}</span>
              <StatusBadge status={p.status} />
            </div>
          ))}
          {recentPickups.length === 0 && (
            <div className="px-5 py-6 text-center text-slate-400 text-sm">No pickups yet</div>
          )}
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING:   'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    COLLECTED: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    SUCCESSFUL:'bg-green-100 text-green-700',
    FAILED:    'bg-red-100 text-red-700',
    CREATED:   'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}
