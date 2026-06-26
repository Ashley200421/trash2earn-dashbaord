import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import QRCode from 'react-qr-code'
import { PlusCircle, Pencil, Trash2, QrCode, Download, X } from 'lucide-react'

const WASTE_TYPES = ['Plastic', 'Metal', 'Glass', 'Paper', 'Organic', 'Electronics']
const STATUSES = ['Open', 'Closed', 'Full', 'Maintenance']

interface Bin {
  id: string
  code: string
  name: string
  address: string
  area: string | null
  lat: number | null
  lng: number | null
  status: string
  hours: string | null
  types: string[]
  created_at: string
}

type ModalMode = 'add' | 'edit' | 'qr' | null

export default function BinsPage() {
  const [bins, setBins] = useState<Bin[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<Bin | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('bin_locations').select('*').order('created_at', { ascending: false })
    setBins(data ?? [])
    setLoading(false)
  }

  function openAdd() { setSelected(null); setModal('add') }
  function openEdit(bin: Bin) { setSelected(bin); setModal('edit') }
  function openQr(bin: Bin) { setSelected(bin); setModal('qr') }
  function closeModal() { setModal(null); setSelected(null) }

  async function handleDelete(bin: Bin) {
    if (!window.confirm(`Delete bin "${bin.name}"? This cannot be undone.`)) return
    setDeleting(bin.id)
    await supabase.from('bin_locations').delete().eq('id', bin.id)
    await load()
    setDeleting(null)
  }

  const statusColor: Record<string, string> = {
    Open:        'bg-green-100 text-green-700',
    Closed:      'bg-slate-100 text-slate-600',
    Full:        'bg-amber-100 text-amber-700',
    Maintenance: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bin Locations</h1>
          <p className="text-sm text-slate-500 mt-0.5">{bins.length} bins registered</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle size={16} /> Add Bin
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Code', 'Name', 'Address / Area', 'Types', 'Hours', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading…</td></tr>
              ) : bins.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">No bins yet. Add one above.</td></tr>
              ) : bins.map(bin => (
                <tr key={bin.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{bin.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{bin.name}</td>
                  <td className="px-4 py-3 text-slate-500">
                    <div className="truncate max-w-[180px]">{bin.address}</div>
                    {bin.area && <div className="text-xs text-slate-400">{bin.area}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {bin.types.map(t => (
                        <span key={t} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{bin.hours ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[bin.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {bin.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openQr(bin)} title="QR Code"
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-green-600">
                        <QrCode size={16} />
                      </button>
                      <button onClick={() => openEdit(bin)} title="Edit"
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(bin)} title="Delete" disabled={deleting === bin.id}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-red-600 disabled:opacity-40">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      {(modal === 'add' || modal === 'edit') && (
        <BinFormModal
          bin={selected}
          onClose={closeModal}
          onSaved={async () => { closeModal(); await load() }}
        />
      )}

      {/* QR modal */}
      {modal === 'qr' && selected && (
        <QrModal bin={selected} onClose={closeModal} />
      )}
    </div>
  )
}

/* ── Bin form modal ── */
function BinFormModal({ bin, onClose, onSaved }: {
  bin: Bin | null; onClose: () => void; onSaved: () => void
}) {
  const isEdit = !!bin
  const [form, setForm] = useState({
    code:    bin?.code    ?? '',
    name:    bin?.name    ?? '',
    address: bin?.address ?? '',
    area:    bin?.area    ?? '',
    lat:     bin?.lat?.toString()  ?? '',
    lng:     bin?.lng?.toString()  ?? '',
    status:  bin?.status  ?? 'Open',
    hours:   bin?.hours   ?? '',
    types:   bin?.types   ?? [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function toggle(type: string) {
    setForm(f => ({
      ...f,
      types: f.types.includes(type) ? f.types.filter(t => t !== type) : [...f.types, type],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim() || !form.name.trim() || !form.address.trim()) {
      setError('Code, name and address are required.')
      return
    }
    if (form.types.length === 0) { setError('Select at least one waste type.'); return }
    setSaving(true)
    setError('')
    const payload = {
      code:    form.code.trim().toUpperCase(),
      name:    form.name.trim(),
      address: form.address.trim(),
      area:    form.area.trim() || null,
      lat:     form.lat  ? parseFloat(form.lat)  : null,
      lng:     form.lng  ? parseFloat(form.lng)  : null,
      status:  form.status,
      hours:   form.hours.trim() || null,
      types:   form.types,
    }
    const { error: err } = isEdit
      ? await supabase.from('bin_locations').update(payload).eq('id', bin!.id)
      : await supabase.from('bin_locations').insert(payload)
    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <Overlay onClose={onClose}>
      <h2 className="text-lg font-bold text-slate-800 mb-5">{isEdit ? 'Edit Bin' : 'Add New Bin'}</h2>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bin Code *" placeholder="e.g. BIN001" value={form.code}
            onChange={v => setForm(f => ({ ...f, code: v }))} />
          <Field label="Display Name *" placeholder="Smart Bin #001" value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))} />
        </div>
        <Field label="Address *" placeholder="123 Main St, Douala" value={form.address}
          onChange={v => setForm(f => ({ ...f, address: v }))} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Area / Neighbourhood" placeholder="Bonanjo" value={form.area}
            onChange={v => setForm(f => ({ ...f, area: v }))} />
          <Field label="Operating Hours" placeholder="Mon-Sat 8AM-8PM" value={form.hours}
            onChange={v => setForm(f => ({ ...f, hours: v }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitude" placeholder="4.0511" value={form.lat}
            onChange={v => setForm(f => ({ ...f, lat: v }))} type="number" />
          <Field label="Longitude" placeholder="9.7679" value={form.lng}
            onChange={v => setForm(f => ({ ...f, lng: v }))} type="number" />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))}
                className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  form.status === s
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Waste types */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Accepted Waste Types *</label>
          <div className="flex gap-2 flex-wrap">
            {WASTE_TYPES.map(t => (
              <button key={t} type="button" onClick={() => toggle(t)}
                className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  form.types.includes(t)
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>{t}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Bin'}
          </button>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2.5">Cancel</button>
        </div>
      </form>
    </Overlay>
  )
}

/* ── QR modal ── */
function QrModal({ bin, onClose }: { bin: Bin; onClose: () => void }) {
  function downloadQR() {
    const svg = document.getElementById('qr-svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const size = 400
    canvas.width = size
    canvas.height = size + 60
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 20, 20, size - 40, size - 40)
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 16px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(bin.code, size / 2, size + 10)
      ctx.font = '13px system-ui'
      ctx.fillStyle = '#64748b'
      ctx.fillText(bin.name, size / 2, size + 32)
      const link = document.createElement('a')
      link.download = `qr-${bin.code}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <Overlay onClose={onClose} narrow>
      <h2 className="text-lg font-bold text-slate-800 mb-1">{bin.name}</h2>
      <p className="text-sm text-slate-500 mb-5 font-mono">{bin.code}</p>

      <div className="flex justify-center mb-4 p-4 bg-white rounded-xl border border-slate-200">
        <QRCode
          id="qr-svg"
          value={bin.code}
          size={220}
          bgColor="#ffffff"
          fgColor="#0f172a"
        />
      </div>

      <p className="text-xs text-slate-400 text-center mb-5">
        The app scans this QR code to identify bin <strong>{bin.code}</strong> and award points.
      </p>

      <div className="flex gap-3">
        <button
          onClick={downloadQR}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
        >
          <Download size={16} /> Download PNG
        </button>
        <button onClick={onClose} className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">
          Close
        </button>
      </div>
    </Overlay>
  )
}

/* ── Shared helpers ── */
function Overlay({ children, onClose, narrow }: { children: React.ReactNode; onClose: () => void; narrow?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`bg-white rounded-2xl shadow-2xl w-full overflow-y-auto max-h-[90vh] ${narrow ? 'max-w-sm' : 'max-w-xl'}`}>
        <div className="flex justify-end p-4 pb-0">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        step={type === 'number' ? 'any' : undefined}
        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  )
}
