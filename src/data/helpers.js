import validated from './validated.json'
import residents from './residents.json'

const { lastUpdate, data } = validated

const MONTHLY_IPL = 250000
const MONTHS_PER_YEAR = 12
const ANNUAL_TARGET = MONTHLY_IPL * MONTHS_PER_YEAR

export function getResident(blok, nomorRumah) {
  const records = data.filter(
    (r) => r.blok === blok && r.nomorRumah === String(nomorRumah)
  )
  if (records.length === 0) return null

  const namaPemilik = records[0].namaPemilik
  const totalPaid = records.reduce((sum, r) => sum + r.jumlahPembayaran, 0)
  const isLunas = totalPaid >= ANNUAL_TARGET

  return {
    namaPemilik,
    blok,
    nomorRumah,
    totalPaid,
    annualTarget: ANNUAL_TARGET,
    isLunas,
    transactions: records.sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    ),
  }
}

export function getAvailableBlocks() {
  return ['A', 'B', 'C', 'D', 'E', 'F']
}

export function getLastUpdated() {
  return lastUpdate || null
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function getAllResidents() {
  return residents.map((r) => {
    const records = data.filter(
      (d) => d.blok === r.blok && d.nomorRumah === String(r.nomorRumah)
    )
    const totalPaid = records.reduce((sum, d) => sum + d.jumlahPembayaran, 0)
    const completionPct = Math.min(100, Math.round((totalPaid / ANNUAL_TARGET) * 100))
    return {
      blok: r.blok,
      nomorRumah: r.nomorRumah,
      namaPemilik: r.namaPemilik,
      totalPaid,
      annualTarget: ANNUAL_TARGET,
      isLunas: totalPaid >= ANNUAL_TARGET,
      completionPct,
      monthsPaid: Math.floor(totalPaid / MONTHLY_IPL),
    }
  })
}

export function getBlockLeaderboard() {
  const all = getAllResidents()
  const blocks = {}
  for (const r of all) {
    if (!blocks[r.blok]) blocks[r.blok] = { total: 0, lunas: 0 }
    blocks[r.blok].total++
    if (r.isLunas) blocks[r.blok].lunas++
  }
  return Object.entries(blocks)
    .map(([blok, { total, lunas }]) => ({
      blok,
      totalHouses: total,
      lunasCount: lunas,
      lunasPct: total > 0 ? Math.round((lunas / total) * 100) : 0,
    }))
    .sort((a, b) => b.lunasPct - a.lunasPct || a.blok.localeCompare(b.blok))
}

export function getHouseLeaderboard(blok) {
  let all = getAllResidents()
  if (blok) {
    all = all.filter((r) => r.blok === blok)
  }
  return all.sort(
    (a, b) =>
      b.completionPct - a.completionPct ||
      a.blok.localeCompare(b.blok) ||
      Number(a.nomorRumah) - Number(b.nomorRumah)
  )
}
