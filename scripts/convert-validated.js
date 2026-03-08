import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DEFAULT_SRC = '/Users/ihsansatriawan/Projects/personal/catat-uang-warga/raw_data/IPL 2026 - Validated.csv';
const DEFAULT_DEST = '/Users/ihsansatriawan/Projects/personal/catat-uang-warga/src/data/validated.json';

function readFileUtf8(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return raw.replace(/^\uFEFF/, '');
}

function parseCSVLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return [];
  const header = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length <= 1) continue;
    const obj = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = fields[j] ?? '';
    rows.push(obj);
  }
  return rows;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toIsoWIBFromDDMMYYYY(s) {
  if (!s) return null;
  const [datePart, timePart = '00:00:00'] = s.split(' ');
  const d = datePart.split(/[\/\-]/);
  if (d.length !== 3) return null;
  const dd = parseInt(d[0], 10);
  const mm = parseInt(d[1], 10);
  const yyyy = parseInt(d[2], 10);
  const t = timePart.split(':');
  const hh = parseInt(t[0] || '0', 10);
  const mi = parseInt(t[1] || '0', 10);
  const ss = parseInt(t[2] || '0', 10);
  if (!yyyy || !mm || !dd) return null;
  return `${yyyy}-${pad2(mm)}-${pad2(dd)}T${pad2(hh)}:${pad2(mi)}:${pad2(ss)}+07:00`;
}

function getTodayISODateOnly() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toIntAmount(s) {
  const cleaned = String(s || '').replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

function extractBlokNomor(combined) {
  if (!combined) return { blok: '', nomorRumah: '' };
  const m = combined.match(/([A-Za-z])\s*(\d+)/);
  if (!m) return { blok: '', nomorRumah: '' };
  return { blok: m[1].toUpperCase(), nomorRumah: String(parseInt(m[2], 10)) };
}

function transform(rows) {
  const out = [];
  for (const r of rows) {
    let blok = r['Blok'] || '';
    let nomor = r['Nomor rumah'] || '';
    if (!blok || !nomor) {
      const fb = extractBlokNomor(r['Blok dan Nomor Rumah'] || '');
      blok = blok || fb.blok;
      nomor = nomor || fb.nomorRumah;
    }
    const item = {
      timestamp: toIsoWIBFromDDMMYYYY(r['Timestamp']),
      email: r['Email address'] || '',
      blok,
      nomorRumah: String(nomor || ''),
      namaPemilik: r['Nama Pemilik'] || '',
      jumlahPembayaran: toIntAmount(r['Jumlah Pembayaran']),
      buktiTransfer: r['Unggah Bukti Transfer Pembayaran IPL-2026'] || ''
    };
    if (item.blok && item.nomorRumah) out.push(item);
  }
  return out;
}

function main() {
  const src = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SRC;
  const dest = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_DEST;
  const csv = readFileUtf8(src);
  const rows = parseCSV(csv);
  const data = transform(rows);
  const result = { lastUpdate: getTodayISODateOnly(), data };
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${data.length} records to ${dest}`);
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main();
}