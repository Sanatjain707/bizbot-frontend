import Papa from 'papaparse'

// Pure, source-agnostic parsing + Name/Phone column detection for customer import.
// Kept free of React so it can be unit-tested directly.

const NAME_KEYS  = ['name', 'customer', 'customer name', 'full name', 'fullname', 'contact name', 'client', 'person', 'cust']
const PHONE_KEYS = ['phone', 'mobile', 'number', 'phone number', 'contact', 'whatsapp', 'mob', 'cell', 'tel', 'msisdn', 'contact number', 'ph']

const digitCount   = (s: string) => (String(s).match(/\d/g) || []).length
const mostlyDigits = (s: string) => digitCount(s) >= 8
const matchesAny   = (cell: string, keys: string[]) => {
  const c = String(cell).toLowerCase().trim()
  return keys.some(k => c === k || c.includes(k))
}

// Split a single "Name 9876543210" cell into [name, phone] on TRAILING digits,
// so the last number run becomes the phone (never split on the first space).
export function splitNamePhone(cell: string): [string, string] {
  const m = String(cell).trim().match(/^(.*?)[\s,;]+(\+?\d[\d\s\-()]{8,})$/)
  if (m) return [m[1].trim(), m[2].trim()]
  return mostlyDigits(cell) ? ['', cell.trim()] : [cell.trim(), '']
}

export type Parsed = { columns: string[]; rows: string[][]; hasHeader: boolean; nameCol: number; phoneCol: number }

export function parseInput(text: string): Parsed | null {
  const res = Papa.parse<string[]>((text || '').trim(), { skipEmptyLines: 'greedy' })
  let rows = (res.data as any[])
    .map(r => Array.isArray(r) ? r.map(c => String(c ?? '').trim()) : [])
    .filter(r => r.some(c => c !== ''))
  if (!rows.length) return null

  let maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0)
  // Single-column input (pasted "Name Phone" lines) → split on trailing digits
  if (maxCols === 1) { rows = rows.map(r => splitNamePhone(r[0])); maxCols = 2 }
  rows = rows.map(r => { const c = [...r]; while (c.length < maxCols) c.push(''); return c })

  // Header row = has a known keyword and is not itself phone data
  const first = rows[0]
  const hasHeader = first.some(c => matchesAny(c, NAME_KEYS) || matchesAny(c, PHONE_KEYS)) && !first.some(c => mostlyDigits(c))

  let columns: string[], dataRows: string[][], nameCol = -1, phoneCol = -1
  if (hasHeader) {
    columns  = first.map((c, i) => c || `Column ${i + 1}`)
    dataRows = rows.slice(1)
    nameCol  = first.findIndex(c => matchesAny(c, NAME_KEYS))
    phoneCol = first.findIndex(c => matchesAny(c, PHONE_KEYS))
  } else {
    columns  = Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`)
    dataRows = rows
  }

  // Content-based guess for whatever the header didn't resolve
  if (phoneCol < 0) {
    let best = maxCols - 1, bestScore = -1
    for (let i = 0; i < maxCols; i++) {
      const score = dataRows.reduce((s, r) => s + (mostlyDigits(r[i] || '') ? 1 : 0), 0) / Math.max(1, dataRows.length)
      if (score > bestScore) { bestScore = score; best = i }
    }
    phoneCol = best
  }
  if (nameCol < 0) {
    let best = phoneCol === 0 ? Math.min(1, maxCols - 1) : 0, bestScore = -1
    for (let i = 0; i < maxCols; i++) {
      if (i === phoneCol) continue
      const score = dataRows.reduce((s, r) => s + ((String(r[i] || '').match(/[a-zA-Zऀ-ॿ]/g) || []).length), 0)
      if (score > bestScore) { bestScore = score; best = i }
    }
    nameCol = best
  }
  return { columns, rows: dataRows, hasHeader, nameCol, phoneCol }
}
