import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE = 20

export default function UsersPage() {
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [page, search])

  async function load() {
    setLoading(true)
    let q = supabase
      .from('profiles')
      .select('id, full_name, email, phone, level, created_at, user_stats(total_points, total_scans, total_pickups)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1)

    if (search.trim()) {
      q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, count } = await q
    setRows(data ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }

  const totalPages = Math.ceil(total / PAGE)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total.toLocaleString()} total registered users</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Name', 'Email', 'Phone', 'Level', 'Points', 'Scans', 'Pickups', 'Joined'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">No users found</td></tr>
              ) : rows.map(u => {
                const stats = Array.isArray(u.user_stats) ? u.user_stats[0] : u.user_stats
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{u.full_name}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{u.email ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{u.phone ?? '—'}</td>
                    <td className="px-4 py-3"><LevelBadge level={u.level} /></td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{(stats?.total_points ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500">{stats?.total_scans ?? 0}</td>
                    <td className="px-4 py-3 text-slate-500">{stats?.total_pickups ?? 0}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{u.created_at?.slice(0, 10)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Showing {page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} of {total}
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

function LevelBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Beginner:    'bg-slate-100 text-slate-600',
    Intermediate:'bg-blue-100 text-blue-700',
    Advanced:    'bg-purple-100 text-purple-700',
    Expert:      'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[level] ?? 'bg-slate-100 text-slate-600'}`}>
      {level}
    </span>
  )
}
