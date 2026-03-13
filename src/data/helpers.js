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
    if (!blocks[r.blok]) blocks[r.blok] = { total: 0, lunas: 0, sumPaid: 0 }
    blocks[r.blok].total++
    blocks[r.blok].sumPaid += r.totalPaid
    if (r.isLunas) blocks[r.blok].lunas++
  }
  return Object.entries(blocks)
    .map(([blok, { total, lunas, sumPaid }]) => ({
      blok,
      totalHouses: total,
      lunasCount: lunas,
      sumPaid,
      collectionPct: total > 0 ? Math.min(100, Math.round((sumPaid / (total * ANNUAL_TARGET)) * 100)) : 0,
    }))
    .sort((a, b) => b.collectionPct - a.collectionPct || a.blok.localeCompare(b.blok))
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

export function generateBroadcastMessage() {
  const blocks = getBlockLeaderboard().sort((a, b) => a.blok.localeCompare(b.blok))
  const lastUpdated = getLastUpdated()
  const dateStr = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  let msg = `📊 *Laporan IPL 2026*\n📅 ${dateStr}\n`

  for (const block of blocks) {
    const houses = getHouseLeaderboard(block.blok)
    const lunas = houses.filter(h => h.isLunas)
    const partial = houses.filter(h => h.totalPaid > 0 && !h.isLunas)
    const unpaid = houses.filter(h => h.totalPaid === 0)

    msg += `\n*Blok ${block.blok} — ${block.collectionPct}%* (${block.lunasCount}/${block.totalHouses} rumah bayar penuh)\n`

    for (const h of lunas) {
      const months = Math.min(12, Math.floor(h.totalPaid / MONTHLY_IPL))
      msg += `  ✅ ${h.blok}-${h.nomorRumah} ${h.namaPemilik} — ${months} bln\n`
    }

    for (const h of partial) {
      const months = Math.floor(h.totalPaid / MONTHLY_IPL)
      msg += `  🔵 ${h.blok}-${h.nomorRumah} ${h.namaPemilik} — ${months} bln\n`
    }

    if (unpaid.length > 0) {
      const unpaidSorted = unpaid.sort((a, b) => Number(a.nomorRumah) - Number(b.nomorRumah))
      const unpaidLabels = unpaidSorted.map(h => `${h.blok}-${h.nomorRumah}`)
      // Group into lines of ~5 for readability
      for (let i = 0; i < unpaidLabels.length; i += 5) {
        msg += `  ⬜ ${unpaidLabels.slice(i, i + 5).join(', ')}\n`
      }
    }
  }

  msg += `\n📱 Cek detail → cek-ipl.web.app`
  return msg
}
