import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { StatusBadge } from './Overview'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'

const PAGE = 25
const STATUSES = ['ALL', 'PENDING', 'CREATED', 'SUCCESSFUL', 'FAILED', 'EXPIRED']

export default function WithdrawalsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [totals, setTotals] = useState({ successful: 0, pending: 0 })

  useEffect(() => { load() }, [page, status])
  useEffect(() => { loadTotals() }, [])

  async function loadTotals() {
    const { data } = await supabase.from('withdrawals').select('status, amount_fcfa')
    if (!data) return
    setTotals({
      successful: data.filter((w: any) => w.status === 'SUCCESSFUL').reduce((s: number, w: any) => s + w.amount_fcfa, 0),
      pending: data.filter((w: any) => ['PENDING', 'CREATED'].includes(w.status)).reduce((s: number, w: any) => s + w.amount_fcfa, 0),
    })
  }

  async function load() {
    setLoading(true)
    let q = supabase
      .from('withdrawals')
      .select(`
        id, amount_fcfa, points_deducted, phone, medium, status,
        fapshi_trans_id, created_at, completed_at, refunded,
        profiles!withdrawals_user_id_fkey(full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1)

    if (status !== 'ALL') q = q.eq('status', status)

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
          <h1 className="text-2xl font-bold text-slate-800">Withdrawals</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total.toLocaleString()} total transactions</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Total Paid Out</div>
          <div className="text-2xl font-bold text-green-800">{totals.successful.toLocaleString()} FCFA</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Pending Payout</div>
          <div className="text-2xl font-bold text-amber-800">{totals.pending.toLocaleString()} FCFA</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(0) }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              status === s ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['User', 'Amount', 'Points', 'Method', 'Phone', 'Status', 'Refunded', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">No withdrawals found</td></tr>
              ) : rows.map(w => {
                const user = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles
                return (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{user?.full_name ?? '—'}</div>
                      <div className="text-xs text-slate-400">{user?.email}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{w.amount_fcfa.toLocaleString()} FCFA</td>
                    <td className="px-4 py-3 text-slate-500">{w.points_deducted} pts</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{w.medium}</td>
                    <td className="px-4 py-3 text-slate-500">{w.phone}</td>
                    <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                    <td className="px-4 py-3 text-center">{w.refunded ? '✓' : '—'}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{w.created_at?.slice(0, 10)}</td>
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
