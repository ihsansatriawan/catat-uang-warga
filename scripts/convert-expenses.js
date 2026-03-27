import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DEFAULT_SRC = path.resolve(__dirname, '../raw_data/IPL 2026 - Pengeluaran Rutin.csv')
const DEFAULT_DEST = path.resolve(__dirname, '../src/data/expenses.json')

function readFileUtf8(p) {
  const raw = fs.readFileSync(p, 'utf8')
  return raw.replace(/^\uFEFF/, '')
}

function parseCSVLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length === 0) return []
  return lines.map((line) => parseCSVLine(line))
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function getTodayISODateOnly() {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function toIntAmount(s) {
  const cleaned = String(s || '').replace(/[^\d]/g, '')
  return cleaned ? parseInt(cleaned, 10) : 0
}

function parseDateString(s) {
  if (!s) return null
  const d = new Date(s)
  if (isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function main() {
  const src = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SRC
  const dest = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_DEST

  const csv = readFileUtf8(src)
  const rows = parseCSV(csv)

  if (rows.length < 2) {
    console.error('CSV has no data rows')
    process.exit(1)
  }

  // Skip header row (row 0)
  const dataRows = rows.slice(1)

  // Parse Rutin (cols 0, 1, 2: Keterangan, Masuk, Keluar)
  const rutin = []
  let rutinTotalKeluar = 0

  for (const row of dataRows) {
    const keterangan = (row[0] || '').trim()
    if (!keterangan || keterangan.toLowerCase() === 'total' || keterangan.toLowerCase() === 'sisa') break
    const masuk = toIntAmount(row[1])
    const keluar = toIntAmount(row[2])
    rutin.push({ keterangan, masuk: masuk || null, keluar: keluar || null })
    rutinTotalKeluar += keluar
  }

  // Parse Insidental (cols 4, 5, 6, 7, 8: Keterangan, Masuk, Keluar, Tanggal, Kategori)
  const insidental = []
  let insidentalTotalMasuk = 0
  let insidentalTotalKeluar = 0

  for (const row of dataRows) {
    const keterangan = (row[4] || '').trim()
    if (!keterangan || keterangan.toLowerCase() === 'total') break
    const masuk = toIntAmount(row[5])
    const keluar = toIntAmount(row[6])
    const tanggal = parseDateString(row[7])
    const kategori = (row[8] || '').trim()

    insidental.push({ keterangan, masuk: masuk || null, keluar: keluar || null, tanggal, kategori })
    insidentalTotalMasuk += masuk
    insidentalTotalKeluar += keluar
  }

  const totalMasuk = insidentalTotalMasuk
  const totalKeluar = rutinTotalKeluar + insidentalTotalKeluar
  const sisaAnggaran = totalMasuk - totalKeluar

  const result = {
    lastUpdate: getTodayISODateOnly(),
    rutin,
    insidental,
    summary: { totalMasuk, totalKeluar, sisaAnggaran },
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, JSON.stringify(result, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${rutin.length} rutin + ${insidental.length} insidental records to ${dest}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
