import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const DEFAULT_SRC = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../raw_data/IPL 2026 - Data warga.csv'
)
const DEFAULT_DEST = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/data/residents.json'
)

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
  return out.map(s => s.trim())
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim() !== '')
  if (lines.length === 0) return []
  // Skip header line
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i])
    if (fields.length < 2) continue
    rows.push({ blok: fields[0], combined: fields[1] })
  }
  return rows
}

function transform(rows) {
  const out = []
  for (const r of rows) {
    const blok = r.blok.trim().toUpperCase()
    // combined is like "3. Agus Herianto" — split on first ". "
    const dotIndex = r.combined.indexOf('. ')
    if (dotIndex === -1) continue
    const nomorRumah = r.combined.substring(0, dotIndex).trim()
    const namaPemilik = r.combined.substring(dotIndex + 2).trim()
    if (blok && nomorRumah && namaPemilik) {
      out.push({ blok, nomorRumah: String(parseInt(nomorRumah, 10)), namaPemilik })
    }
  }
  return out
}

function main() {
  const src = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SRC
  const dest = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_DEST
  const csv = readFileUtf8(src)
  const rows = parseCSV(csv)
  const data = transform(rows)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${data.length} residents to ${dest}`)
}

const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  main()
}
