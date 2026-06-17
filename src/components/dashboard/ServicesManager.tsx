'use client'
import { useState } from 'react'
import { Card, Button, Input, Modal, Badge, showToast } from '@/components/ui'
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react'

// A service/item row works for any business type:
// salon (Facial), coaching (Class 10 Maths), clinic (Consultation), boutique (Silk Saree)
type Service = {
  name: string
  price: number | string
  category?: string
  duration?: string
  details?: string
}

export default function ServicesManager({ services = [], onChange }: { services: Service[]; onChange: (s: Service[]) => void }) {
  const [search, setSearch]   = useState('')
  const [modal,  setModal]    = useState(false)
  const [editIdx,setEditIdx]  = useState<number | null>(null)
  const [form,   setForm]     = useState<Service>({ name: '', price: '', category: '', duration: '', details: '' })

  function openAdd() {
    setForm({ name: '', price: '', category: '', duration: '', details: '' })
    setEditIdx(null)
    setModal(true)
  }
  function openEdit(idx: number) {
    setForm({ ...services[idx] })
    setEditIdx(idx)
    setModal(true)
  }
  function remove(idx: number) {
    const next = services.filter((_, i) => i !== idx)
    onChange(next)
    showToast('Item removed', 'success')
  }
  function save() {
    if (!form.name.trim()) { showToast('Enter a name', 'error'); return }
    if (form.price === '' || isNaN(Number(form.price))) { showToast('Enter a valid price', 'error'); return }
    const clean: Service = {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category?.trim() || '',
      duration: form.duration?.trim() || '',
      details: form.details?.trim() || '',
    }
    const next = editIdx === null ? [...services, clean] : services.map((s, i) => i === editIdx ? clean : s)
    onChange(next)
    setModal(false)
    showToast(editIdx === null ? 'Item added' : 'Item updated', 'success')
  }

  const filtered = services
    .map((s, i) => ({ ...s, _idx: i }))
    .filter(s => {
      if (!search) return true
      const q = search.toLowerCase()
      return s.name.toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q)
    })

  return (
    <Card className="p-5 mb-4">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <Package size={15} className="text-[#00C57A]" />
          <h2 className="text-sm font-semibold text-[#E8EAED]">Services & Prices</h2>
          <Badge variant="default" size="xs">{services.length}</Badge>
        </div>
        <Button size="sm" icon={Plus} onClick={openAdd}>Add</Button>
      </div>

      {/* Search */}
      <div className="mb-3">
        <Input icon={Search} placeholder="Search by name or category..." value={search} onChange={(e: any) => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      {services.length === 0 ? (
        <div className="text-center py-8 text-[#5A6370] text-sm">
          No services yet. Click <strong className="text-[#9AA0AB]">Add</strong> to create your first one.
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-[#5A6370] text-sm">No matches for "{search}"</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                {['Name', 'Category', 'Price', 'Duration', ''].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-[#5A6370] uppercase tracking-wider px-2 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._idx} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[#141618] transition-all">
                  <td className="px-2 py-2.5">
                    <p className="text-sm font-medium text-[#E8EAED]">{s.name}</p>
                    {s.details && <p className="text-xs text-[#5A6370] truncate max-w-[180px]">{s.details}</p>}
                  </td>
                  <td className="px-2 py-2.5">{s.category ? <Badge variant="blue" size="xs">{s.category}</Badge> : <span className="text-xs text-[#5A6370]">—</span>}</td>
                  <td className="px-2 py-2.5 text-sm font-semibold text-[#E8EAED]">₹{Number(s.price).toLocaleString('en-IN')}</td>
                  <td className="px-2 py-2.5 text-xs text-[#9AA0AB]">{s.duration || '—'}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(s._idx)} className="p-1.5 rounded-lg hover:bg-[#1A1D20] text-[#9AA0AB]"><Pencil size={13} /></button>
                      <button onClick={() => remove(s._idx)} className="p-1.5 rounded-lg hover:bg-[rgba(255,90,90,0.1)] text-[#FF5A5A]"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editIdx === null ? 'Add Service / Item' : 'Edit Service / Item'}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Name *" placeholder="Facial / Class 10 Maths / Silk Saree" value={form.name} onChange={(e: any) => setForm(p => ({ ...p, name: e.target.value }))} className="col-span-2" />
          <Input label="Price (₹) *" type="number" placeholder="800" value={form.price} onChange={(e: any) => setForm(p => ({ ...p, price: e.target.value }))} />
          <Input label="Category" placeholder="Skin Care / Class 10 / Sarees" value={form.category} onChange={(e: any) => setForm(p => ({ ...p, category: e.target.value }))} />
          <Input label="Duration (optional)" placeholder="45 min / 1 hr daily" value={form.duration} onChange={(e: any) => setForm(p => ({ ...p, duration: e.target.value }))} className="col-span-2" />
          <Input label="Details (optional)" placeholder="Includes cleanup / Mon-Fri batch / Pure silk" value={form.details} onChange={(e: any) => setForm(p => ({ ...p, details: e.target.value }))} className="col-span-2" />
        </div>
        <div className="flex gap-2 mt-5">
          <Button onClick={save}>{editIdx === null ? 'Add' : 'Save Changes'}</Button>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </Card>
  )
}