import validated from './validated.json'
import residents from './residents.json'
import expenses from './expenses.json'

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
  const dateBase = lastUpdated ? new Date(lastUpdated) : new Date()
  const dateStr = dateBase.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
  const timeStr = dateBase.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })

  let msg = `📊 *Laporan IPL 2026*\n📅 ${dateStr}\n🕐 Data per ${dateStr}, ${timeStr} WIB\n`

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
      const unpaidSorted = [...unpaid].sort((a, b) => Number(a.nomorRumah) - Number(b.nomorRumah))
      const unpaidLabels = unpaidSorted.map(h => `${h.blok}-${h.nomorRumah}`)
      // Group into lines of ~5 for readability
      for (let i = 0; i < unpaidLabels.length; i += 5) {
        msg += `  ⬜ ${unpaidLabels.slice(i, i + 5).join(', ')}\n`
      }
    }
  }

  msg += `\n📱 Cek detail → https://ipl-talago.netlify.app`
  return msg
}

export function getExpenses() {
  return expenses
}

export function getExpenseCategories() {
  const categories = expenses.insidental
    .map((item) => item.kategori)
    .filter((k) => k && k.trim() !== '')
  return [...new Set(categories)].sort()
}

export function generateExpenseBroadcastMessage() {
  const { summary, rutin, insidental } = expenses
  const lastUpdated = expenses.lastUpdate
  const dateStr = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      })
    : new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      })

  let msg = `*Laporan Pengeluaran IPL 2026*\nUpdate: ${dateStr}\n\n`
  msg += `Total Masuk: ${formatRupiah(summary.totalMasuk)}\n`
  msg += `Total Keluar: ${formatRupiah(summary.totalKeluar)}\n`
  msg += `Sisa Anggaran: ${formatRupiah(summary.sisaAnggaran)}\n`

  // Aggregate by category
  const categoryTotals = {}

  // Rutin: aggregate all keluar as "Security"
  for (const item of rutin) {
    if (item.keluar) {
      categoryTotals['Security'] = (categoryTotals['Security'] || 0) + item.keluar
    }
  }

  // Insidental: aggregate by kategori
  for (const item of insidental) {
    if (item.keluar && item.kategori) {
      categoryTotals[item.kategori] = (categoryTotals[item.kategori] || 0) + item.keluar
    }
  }

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])

  if (sortedCategories.length > 0) {
    msg += `\n*Breakdown per Kategori:*\n`
    for (const [kategori, total] of sortedCategories) {
      msg += `• ${kategori}: ${formatRupiah(total)}\n`
    }
  }

  msg += `\nDetail lengkap: https://ipl-talago.netlify.app/pengeluaran`
  return msg
}
