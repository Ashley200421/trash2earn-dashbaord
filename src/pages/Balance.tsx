import { useEffect, useRef, useState } from 'react'
import { supabase, authClient } from '../lib/supabase'
import { PlusCircle, TrendingUp, TrendingDown, Wallet, RefreshCw, User } from 'lucide-react'

interface Topup {
  id: string
  amount_fcfa: number
  reference: string | null
  notes: string | null
  created_at: string
  profiles: { full_name: string; email: string } | null
}

export default function BalancePage() {
  const [topups, setTopups] = useState<Topup[]>([])
  const [totalTopups, setTotalTopups] = useState(0)
  const [totalPaidOut, setTotalPaidOut] = useState(0)
  const [pendingPayouts, setPendingPayouts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const amountRef = useRef<HTMLInputElement>(null)
  const refRef    = useRef<HTMLInputElement>(null)
  const notesRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [topupRes, wdRes] = await Promise.all([
      supabase
        .from('admin_topups')
        .select('*, profiles!admin_topups_admin_id_fkey(full_name, email)')
        .order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('status, amount_fcfa'),
    ])

    const t = topupRes.data ?? []
    const w = wdRes.data ?? []

    setTopups(t as Topup[])
    setTotalTopups(t.reduce((s: number, r: any) => s + r.amount_fcfa, 0))
    setTotalPaidOut(w.filter((x: any) => x.status === 'SUCCESSFUL').reduce((s: number, x: any) => s + x.amount_fcfa, 0))
    setPendingPayouts(w.filter((x: any) => ['PENDING', 'CREATED'].includes(x.status)).reduce((s: number, x: any) => s + x.amount_fcfa, 0))
    setLoading(false)
  }

  async function handleTopup(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const amount = parseInt(amountRef.current?.value ?? '0')
    if (!amount || amount <= 0) { setFormError('Enter a valid amount.'); return }

    setSubmitting(true)

    // Get the current admin's user ID from the auth session
    const { data: { session } } = await authClient.auth.getSession()
    if (!session) { setFormError('Session expired. Please sign in again.'); setSubmitting(false); return }

    const { error } = await supabase.from('admin_topups').insert({
      admin_id:    session.user.id,
      amount_fcfa: amount,
      reference:   refRef.current?.value.trim() || null,
      notes:       notesRef.current?.value.trim() || null,
    })

    if (error) {
      setFormError(error.message)
    } else {
      setShowForm(false)
      if (amountRef.current) amountRef.current.value = ''
      if (refRef.current)    refRef.current.value    = ''
      if (notesRef.current)  notesRef.current.value  = ''
      await load()
    }
    setSubmitting(false)
  }

  const balance = totalTopups - totalPaidOut

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Platform Balance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track funds available to pay out user withdrawals</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100">
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            onClick={() => { setShowForm(v => !v); setFormError('') }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <PlusCircle size={16} /> Record Top-up
          </button>
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-xl border p-5 col-span-2 lg:col-span-1 ${balance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className={balance >= 0 ? 'text-green-600' : 'text-red-600'} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>Available Balance</span>
          </div>
          <div className={`text-3xl font-bold ${balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            {balance.toLocaleString()} FCFA
          </div>
          <div className={`text-xs mt-1 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {balance < 0 ? 'Platform is underfunded!' : 'Funds available for withdrawals'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-blue-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Topped Up</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{totalTopups.toLocaleString()} FCFA</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={16} className="text-green-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid Out</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{totalPaidOut.toLocaleString()} FCFA</div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Pending Payouts</span>
          </div>
          <div className="text-2xl font-bold text-amber-800">{pendingPayouts.toLocaleString()} FCFA</div>
          <div className="text-xs text-amber-600 mt-1">Reserved for pending withdrawals</div>
        </div>
      </div>

      {/* Top-up form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Record Platform Top-up</h2>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">{formError}</div>
          )}
          <form onSubmit={handleTopup} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (FCFA) *</label>
              <input
                ref={amountRef}
                type="number"
                min="1"
                required
                placeholder="e.g. 50000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Reference</label>
              <input
                ref={refRef}
                type="text"
                placeholder="Bank transfer ref, MoMo ID, etc."
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                ref={notesRef}
                rows={2}
                placeholder="Optional notes…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg"
              >
                {submitting ? 'Saving…' : 'Record Top-up'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2.5">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">Top-up History</h2>
        </div>
        {loading ? (
          <div className="py-10 text-center text-slate-400">Loading…</div>
        ) : topups.length === 0 ? (
          <div className="py-10 text-center text-slate-400">No top-ups recorded yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Amount', 'Recorded by', 'Reference', 'Notes', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topups.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-green-700 whitespace-nowrap">
                    +{t.amount_fcfa.toLocaleString()} FCFA
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <User size={12} className="text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-700 text-xs">{t.profiles?.full_name ?? '—'}</div>
                        <div className="text-slate-400 text-xs">{t.profiles?.email ?? ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{t.reference ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-400 max-w-xs truncate">{t.notes ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{t.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
