'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { parseInput, type Parsed } from '@/lib/parseCustomers'
import { Modal, Button, Select, showToast } from '@/components/ui'
import { Upload, ClipboardList, FileText, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function ImportCustomersModal({ open, onClose, onImported }: any) {
  const [step, setStep]         = useState<'input' | 'preview' | 'result'>('input')
  const [tab, setTab]           = useState<'upload' | 'paste'>('upload')
  const [paste, setPaste]       = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [parsed, setParsed]     = useState<Parsed | null>(null)
  const [nameCol, setNameCol]   = useState(0)
  const [phoneCol, setPhoneCol] = useState(1)
  const [importing, setImporting] = useState(false)
  const [result, setResult]     = useState<any>(null)

  function reset()  { setStep('input'); setTab('upload'); setPaste(''); setParsed(null); setResult(null) }
  function close()  { reset(); onClose() }

  // Re-open should always start at the input step. Without this, a modal that
  // was closed via the backdrop (which doesn't call reset()) reopens on the
  // previous `'result'` state — the user sees stale numbers from last import.
  useEffect(() => { if (open) reset() }, [open])

  function handleText(text: string) {
    const p = parseInput(text)
    if (!p || !p.rows.length) { showToast('No rows found — check the file or text and try again.', 'error'); return }
    setParsed(p); setNameCol(p.nameCol); setPhoneCol(p.phoneCol); setStep('preview')
  }
  async function onFile(file?: File) {
    if (!file) return
    try { handleText(await file.text()) }
    catch { showToast('Could not read that file', 'error') }
  }

  async function doImport() {
    if (!parsed) return
    let rows = parsed.rows.map(r => ({ name: (r[nameCol] || '').trim(), phone: (r[phoneCol] || '').trim() }))
    const capped = rows.length > 5000
    if (capped) rows = rows.slice(0, 5000)
    setImporting(true)
    const { data, error } = await api.importCustomers(rows)
    setImporting(false)
    if (error) { showToast(error, 'error'); return }
    if (capped) showToast('Only the first 5,000 rows were imported', 'info')
    setResult(data); setStep('result'); onImported?.()
  }

  const preview = parsed ? parsed.rows.slice(0, 5) : []
  const colOptions = parsed
    ? parsed.columns.map((c, i) => ({ value: String(i), label: `${c}${parsed.rows[0]?.[i] ? ` — e.g. ${parsed.rows[0][i]}` : ''}` }))
    : []

  return (
    <Modal open={open} onClose={close} title="Import customers" size="lg">
      {/* ── Step 1: input ── */}
      {step === 'input' && (
        <div>
          <div className="inline-flex p-1 bg-[#141618] rounded-xl border border-[rgba(255,255,255,0.06)] mb-4">
            {[['upload', 'Upload CSV', Upload], ['paste', 'Paste list', ClipboardList]].map(([v, l, Ic]: any) => (
              <button key={v} onClick={() => setTab(v)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${tab === v ? 'bg-[#1A1D20] text-[#E8EAED]' : 'text-[#5A6370]'}`}>
                <Ic size={13} /> {l}
              </button>
            ))}
          </div>

          {tab === 'upload' ? (
            <label
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files?.[0]) }}
              className={`flex flex-col items-center justify-center gap-2 py-10 rounded-xl border border-dashed cursor-pointer transition-all ${dragOver ? 'border-[#00C57A] bg-[rgba(0,197,122,0.05)]' : 'border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.2)]'}`}>
              <div className="w-11 h-11 rounded-xl bg-[#141618] flex items-center justify-center"><FileText size={20} className="text-[#00C57A]" /></div>
              <p className="text-sm text-[#E8EAED]">Drop a CSV here, or <span className="text-[#00C57A]">browse</span></p>
              <p className="text-xs text-[#5A6370]">Any export with name + phone columns works</p>
              <input type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={e => { onFile(e.target.files?.[0]); e.currentTarget.value = '' }} />
            </label>
          ) : (
            <div>
              <textarea value={paste} onChange={e => setPaste(e.target.value)} rows={7}
                placeholder={'Paste rows, e.g.\nPriya Sharma, 9876543210\nRahul 9812345678\nMegha\t9900112233'}
                className="w-full bg-[#141618] border border-[rgba(255,255,255,0.08)] rounded-xl px-3.5 py-3 text-sm text-[#E8EAED] outline-none focus:border-[rgba(0,197,122,0.5)] font-mono" />
              <div className="flex justify-end mt-3">
                <Button onClick={() => handleText(paste)} disabled={!paste.trim()}>Parse list</Button>
              </div>
            </div>
          )}
          <p className="text-xs text-[#5A6370] mt-4">Only name & phone are used. Duplicates and invalid numbers are handled automatically — you'll see a summary before anything sticks.</p>
        </div>
      )}

      {/* ── Step 2: preview + mapping ── */}
      {step === 'preview' && parsed && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-[#E8EAED] font-medium">{parsed.rows.length.toLocaleString('en-IN')} rows detected</span>
            <span className="text-xs text-[#5A6370]">· {parsed.hasHeader ? 'header row found' : 'no header — guessed by content'}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Select label="Name column" value={String(nameCol)} onChange={(e: any) => setNameCol(Number(e.target.value))} options={colOptions} />
            <Select label="Phone column" value={String(phoneCol)} onChange={(e: any) => setPhoneCol(Number(e.target.value))} options={colOptions} />
          </div>
          {nameCol === phoneCol && (
            <p className="text-xs text-[#FFA040] mb-3 flex items-center gap-1.5"><AlertTriangle size={12} /> Name and phone point to the same column — pick different columns.</p>
          )}

          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden mb-5">
            <table className="w-full">
              <thead><tr className="bg-[#141618]">
                <th className="text-left text-xs font-medium text-[#5A6370] uppercase tracking-wider px-4 py-2.5">Name</th>
                <th className="text-left text-xs font-medium text-[#5A6370] uppercase tracking-wider px-4 py-2.5">Phone</th>
              </tr></thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="border-t border-[rgba(255,255,255,0.04)]">
                    <td className="px-4 py-2.5 text-sm text-[#E8EAED]">{r[nameCol] || <span className="text-[#5A6370]">(will use phone)</span>}</td>
                    <td className="px-4 py-2.5 text-sm text-[#9AA0AB] font-mono">{r[phoneCol] || <span className="text-[#FF5A5A]">(missing)</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep('input')}>Back</Button>
            <Button onClick={doImport} loading={importing} disabled={nameCol === phoneCol}>Import {parsed.rows.length.toLocaleString('en-IN')} rows</Button>
          </div>
        </div>
      )}

      {/* ── Step 3: result ── */}
      {step === 'result' && result && (
        <div>
          <div className="flex flex-col items-center text-center py-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(0,197,122,0.1)] flex items-center justify-center mb-3"><CheckCircle2 size={24} className="text-[#00C57A]" /></div>
            <p className="text-lg font-semibold text-[#E8EAED] font-[Syne]">Imported {result.imported.toLocaleString('en-IN')} customer{result.imported === 1 ? '' : 's'}</p>
            <p className="text-sm text-[#5A6370] mt-1">
              {result.skippedDuplicate > 0 && `${result.skippedDuplicate} skipped (already existed)`}
              {result.skippedDuplicate > 0 && result.skippedInvalid > 0 && ' · '}
              {result.skippedInvalid > 0 && `${result.skippedInvalid} skipped (invalid phone)`}
              {result.skippedDuplicate === 0 && result.skippedInvalid === 0 && 'All rows imported cleanly'}
            </p>
          </div>

          {result.invalidRows?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-medium text-[#9AA0AB] mb-2">Rows we couldn't import ({result.invalidRows.length}{result.skippedInvalid > result.invalidRows.length ? ` of ${result.skippedInvalid}` : ''}) — fix and re-upload:</p>
              <div className="rounded-xl border border-[rgba(255,255,255,0.06)] max-h-44 overflow-y-auto">
                {result.invalidRows.map((r: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                    <AlertTriangle size={12} className="text-[#FFA040] flex-shrink-0" />
                    <span className="text-xs text-[#E8EAED] flex-1 truncate">{r.name || <span className="text-[#5A6370]">(no name)</span>}</span>
                    <span className="text-xs text-[#9AA0AB] font-mono">{r.phone || '(blank)'}</span>
                    <span className="text-xs text-[#5A6370] w-24 text-right">{r.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={reset}>Import another</Button>
            <Button onClick={close}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
