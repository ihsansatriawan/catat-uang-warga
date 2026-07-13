# Pembayaran Lintas Tahun (Multi-Year / Advance Payment) — Plan Opsi B

> **Status:** Belum dikerjakan. Persiapan untuk transisi ke IPL 2027.
> **Konteks:** Opsi A sudah diimplementasi (lihat `helpers.js` → `saldoLebih`/`bulanMaju`
> dan badge saldo di `DashboardView.jsx`). Opsi A hanya *menampilkan* kelebihan bayar
> sebagai saldo; ia belum memisahkan uang itu ke periode tahun yang berbeda. Dokumen ini
> adalah rencana untuk model data yang benar saat halaman 2027 mulai dibangun.

## Masalah yang Diselesaikan

App saat ini scoped ke **IPL 2026** dan meng-cap semua hitungan di 12 bulan / Rp 3.000.000.
Warga yang bayar lebih dari setahun (mis. B-8 = Rp 3.050.000, C-1 = Rp 4.250.000) uang
lebihnya tidak punya "rumah" — hanya ditampilkan sebagai saldo lewat Opsi A, tapi tidak
benar-benar dialokasikan ke 2027. Saat tahun berganti, kita butuh cara agar advance payment
2026 otomatis jadi saldo awal 2027.

## Ide Inti

Tambahkan konsep **periode/tahun** pada tiap transaksi, sehingga satu pembayaran bisa
diatribusikan ke tahun yang benar. Stats per tahun difilter berdasarkan field ini.

## Perubahan Data Schema (`validated.json`)

Tambah field `tahun` (integer) di tiap record:

```json
{
  "timestamp": "2026-01-01T00:00:00+07:00",
  "blok": "A",
  "nomorRumah": "1",
  "namaPemilik": "Name",
  "jumlahPembayaran": 250000,
  "tahun": 2026
}
```

- Default `tahun` = 2026 untuk semua data lama (backfill saat migrasi).
- Pembayaran untuk tahun depan diberi `tahun: 2027`.
- **Splitting saat input:** Bayar Rp 6.000.000 sekaligus dipecah jadi 2 record —
  satu `tahun: 2026` (Rp 3.000.000) dan satu `tahun: 2027` (Rp 3.000.000). Ini lebih
  eksplisit daripada satu record besar, dan langsung cocok dengan filter per tahun.
- Alternatif jika tidak mau split: biarkan satu record besar untuk 2026, lalu logika
  "carry-over" (lihat bawah) yang memindahkan kelebihan ke 2027 secara otomatis.

## Perubahan Kode

### `src/data/helpers.js`
- Tambah konstanta `CURRENT_YEAR` (atau parameter `tahun`) — sumber tunggal tahun aktif.
- `getResident(blok, nomorRumah, tahun = CURRENT_YEAR)` — filter `data` juga berdasarkan
  `r.tahun === tahun`. Hitung `totalPaid`, `monthsPaid`, dst. per tahun tsb.
- Logika **carry-over saldo** (opsional, jika tidak pakai splitting): jika `saldoLebih`
  dari tahun N > 0, jadikan saldo awal tahun N+1 (`saldoAwal`). Progres tahun N+1 =
  `saldoAwal + pembayaran tahun N+1`.
- `getAllResidents(tahun)`, `getBlockLeaderboard(tahun)`, `getHouseLeaderboard(blok, tahun)`
  — semua terima parameter tahun; default ke tahun aktif.
- `generateBroadcastMessage(tahun)` — judul & angka ikut tahun.
- Cap per-rumah di leaderboard sudah ada dari Opsi A — pertahankan.

### UI
- Tambah **year switcher** (mis. dropdown/tab "2026 | 2027") di `DashboardView`,
  `LeaderboardView`, dan `BroadcastView`.
- `App.jsx` / routing: simpan tahun aktif di state atau query param (`?tahun=2027`).
- Badge saldo Opsi A berubah makna: dari "perkiraan saldo" jadi "sudah dialokasikan ke 2027".

### Scripts
- `scripts/convert-validated.js` — tambah kolom `tahun` dari CSV (atau derive dari
  timestamp / kolom periode di sheet). Backfill data lama ke `2026`.
- Update `CLAUDE.md`: dokumentasikan field `tahun` di Data Schema dan helper baru.

## Urutan Pengerjaan (saat mulai 2027)

1. Tambah field `tahun` + backfill semua data existing ke `2026` (migrasi + update converter).
2. Parametrize semua helper dengan `tahun`, default `CURRENT_YEAR`. Pastikan tampilan 2026
   tidak berubah (regression check).
3. Tambah year switcher di UI + wiring state/route.
4. Putuskan strategi advance: **splitting saat input** (disarankan, paling eksplisit) vs.
   **carry-over otomatis**. Implementasikan yang dipilih.
5. Update `CLAUDE.md` + build/verify dengan data 2026 & 2027.

## Keputusan yang Masih Terbuka

- **Split vs. carry-over** untuk advance payment → rekomendasi: split saat input, lebih
  mudah diaudit dan tidak butuh logika saldo lintas tahun.
- **Target 2027** apakah tetap Rp 250.000/bulan? Jadikan konstanta per tahun agar fleksibel
  jika iuran naik.
- **Default tahun** yang ditampilkan saat warga buka app di masa transisi (Des 2026 –
  Jan 2027).
