import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { StatusBadge } from './Overview'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE = 25
const STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'COLLECTED', 'COMPLETED', 'CANCELLED']

export default function PickupsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [page, status, search])

  async function load() {
    setLoading(true)
    let q = supabase
      .from('pickup_requests')
      .select(`
        id, waste_type, address, status, scheduled_date, scheduled_time,
        estimated_weight_kg, actual_weight_kg, actual_points, created_at,
        profiles!pickup_requests_user_id_fkey(full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1)

    if (status !== 'ALL') q = q.eq('status', status)
    if (search.trim()) q = q.ilike('address', `%${search}%`)

    const { data, count } = await q
    setRows(data ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }

  const totalPages = Math.ceil(total / PAGE)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pickup Requests</h1>
        <p className="text-sm text-slate-500 mt-0.5">{total.toLocaleString()} total requests</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {/* Status filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(0) }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                status === s
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search address…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['User', 'Waste', 'Address', 'Scheduled', 'Est. kg', 'Actual kg', 'Points', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400">No pickups found</td></tr>
              ) : rows.map(p => {
                const user = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{user?.full_name ?? '—'}</div>
                      <div className="text-xs text-slate-400">{user?.email}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-700">{p.waste_type}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{p.address}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.scheduled_date} {p.scheduled_time}</td>
                    <td className="px-4 py-3 text-slate-500">{p.estimated_weight_kg ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{p.actual_weight_kg ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{p.actual_points ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{p.created_at?.slice(0, 10)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} of {total}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
                className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
