import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Bell, Send } from 'lucide-react'

export default function NotificationsPage() {
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('info')
  const [sendAll, setSendAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function send() {
    if (!title.trim() || !body.trim()) return
    setLoading(true)
    setResult(null)

    try {
      if (sendAll) {
        const { data: users } = await supabase.from('profiles').select('id')
        if (!users?.length) { setResult({ ok: false, msg: 'No users found.' }); setLoading(false); return }
        const rows = users.map(u => ({ user_id: u.id, type, title, body }))
        const { error } = await supabase.from('notifications').insert(rows)
        if (error) throw error
        setResult({ ok: true, msg: `Sent to ${users.length} users.` })
      } else {
        if (!email.trim()) { setResult({ ok: false, msg: 'Enter a user email.' }); setLoading(false); return }
        const { data: profile } = await supabase
          .from('profiles').select('id, full_name').eq('email', email.trim()).single()
        if (!profile) { setResult({ ok: false, msg: 'User not found.' }); setLoading(false); return }
        const { error } = await supabase.from('notifications')
          .insert({ user_id: profile.id, type, title, body })
        if (error) throw error
        setResult({ ok: true, msg: `Sent to ${profile.full_name}.` })
      }
      setTitle('')
      setBody('')
      setEmail('')
    } catch (err: any) {
      setResult({ ok: false, msg: err.message ?? 'Failed to send.' })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Send Notification</h1>
        <p className="text-sm text-slate-500 mt-0.5">Push an in-app notification to a user or all users</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {/* Target */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Recipient</label>
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => setSendAll(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                !sendAll ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Specific user
            </button>
            <button
              onClick={() => setSendAll(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                sendAll ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              All users
            </button>
          </div>
          {!sendAll && (
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          )}
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
          <div className="flex gap-2">
            {['info', 'success', 'warning', 'promo'].map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition-colors ${
                  type === t ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
          <input
            type="text"
            placeholder="Notification title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
          <textarea
            placeholder="Notification body…"
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={4}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {result && (
          <div className={`text-sm rounded-lg px-4 py-3 ${
            result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {result.msg}
          </div>
        )}

        <button
          onClick={send}
          disabled={loading || !title.trim() || !body.trim()}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          <Send size={16} />
          {loading ? 'Sending…' : sendAll ? 'Send to all users' : 'Send notification'}
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Bell size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Notifications appear in the user's in-app notification center. They do not send push notifications to devices.
        </p>
      </div>
    </div>
  )
}
