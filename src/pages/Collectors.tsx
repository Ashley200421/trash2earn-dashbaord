import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, UserCheck, UserX } from 'lucide-react'

export default function CollectorsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [promoting, setPromoting] = useState<string | null>(null)

  useEffect(() => { load() }, [search])

  async function load() {
    setLoading(true)
    let q = supabase
      .from('profiles')
      .select('id, full_name, email, phone, created_at, user_stats(total_pickups)')
      .eq('role', 'collector')
      .order('created_at', { ascending: false })

    if (search.trim()) {
      q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data } = await q
    setRows(data ?? [])
    setLoading(false)
  }

  async function demote(userId: string) {
    setPromoting(userId)
    await supabase.from('profiles').update({ role: 'user' }).eq('id', userId)
    await load()
    setPromoting(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Collectors</h1>
          <p className="text-sm text-slate-500 mt-0.5">Users with the collector role</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Name', 'Email', 'Phone', 'Pickups Completed', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">No collectors found</td></tr>
            ) : rows.map(c => {
              const stats = Array.isArray(c.user_stats) ? c.user_stats[0] : c.user_stats
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.full_name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{stats?.total_pickups ?? 0}</td>
                  <td className="px-4 py-3 text-slate-400">{c.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => demote(c.id)}
                      disabled={promoting === c.id}
                      className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      <UserX size={14} />
                      {promoting === c.id ? 'Removing…' : 'Remove role'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Promote section */}
      <PromoteUser onDone={load} />
    </div>
  )
}

function PromoteUser({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function promote() {
    if (!email.trim()) return
    setLoading(true)
    setMsg('')
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'collector' })
      .eq('email', email.trim())
      .select('full_name')
      .single()
    if (error || !data) {
      setMsg('User not found with that email.')
    } else {
      setMsg(`${data.full_name} is now a collector.`)
      setEmail('')
      onDone()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <UserCheck size={18} className="text-green-600" /> Promote user to collector
      </h2>
      <div className="flex gap-3">
        <input
          type="email"
          placeholder="User email…"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={promote}
          disabled={loading || !email.trim()}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {loading ? 'Promoting…' : 'Promote'}
        </button>
      </div>
      {msg && <p className="text-sm mt-2 text-slate-600">{msg}</p>}
    </div>
  )
}
