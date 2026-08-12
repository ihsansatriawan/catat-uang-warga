import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Trophy,
  MapPin,
  Home,
  User,
  Users,
  UserPlus,
  Trash2,
  ChevronDown,
  CheckCircle2,
  Loader2,
  PartyPopper,
  CalendarCheck,
  Clock,
  Phone,
  ClipboardList,
  AlertTriangle,
  Hourglass,
  Sparkles,
} from 'lucide-react'
import { getAvailableBlocks, getAttendanceHouses, getResidentName } from '../data/helpers'
import {
  LOMBA_EVENT,
  LOMBA_LIST,
  LOMBA_GROUPS,
  LOMBA_BY_KEY,
  PERAN_OPTIONS,
  LOMBA_WARN_THRESHOLD,
  getDaysLeft,
  isRegistrationClosed,
} from '../data/lomba'
import { trackEvent } from '../utils/tracking'
import { BLOCK_COLORS, BLOCK_COLORS_UNSELECTED } from '../data/constants'

// Endpoint Google Apps Script Web App milik spreadsheet LOMBA — terpisah dari
// spreadsheet IPL/kehadiran. Sengaja TIDAK ada fallback ke
// VITE_ATTENDANCE_ENDPOINT: kalau variabel ini lupa diisi, lebih baik form
// menolak mengirim daripada data lomba nyasar ke spreadsheet yang salah.
// Setup: docs/lomba-apps-script.md
const ENDPOINT = import.meta.env.VITE_LOMBA_ENDPOINT || ''

const DRAFT_KEY = 'lomba-draft-v1'

const inputCls = `
  w-full border-2 border-slate-dark rounded-xl px-4 py-3
  font-heading text-base font-bold bg-cream
  focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-2
  placeholder:text-slate-dark/20 placeholder:font-normal
`

const labelCls =
  'font-heading font-bold text-xs uppercase tracking-wider text-slate-dark/50 mb-2 flex items-center gap-1.5'

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function blankPeserta(peran = 'Anak') {
  return { id: newId(), nama: '', peran, umur: '', lomba: [], detailPentas: '' }
}

function isPesertaValid(p) {
  if (!p.nama.trim()) return false
  if (p.lomba.length === 0) return false
  if (p.lomba.includes('pentas') && !p.detailPentas.trim()) return false
  return true
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (!d || typeof d !== 'object') return null
    // Buang draft yang bentuknya tidak dikenal supaya tidak bikin form error
    if (!Array.isArray(d.peserta)) return null
    return d
  } catch {
    return null
  }
}

export default function LombaView() {
  const draft = useMemo(loadDraft, [])

  const [blok, setBlok] = useState(draft?.blok || '')
  const [nomorRumah, setNomorRumah] = useState(draft?.nomorRumah || '')
  const [namaAyah, setNamaAyah] = useState(draft?.namaAyah || '')
  const [namaIbu, setNamaIbu] = useState(draft?.namaIbu || '')
  const [whatsapp, setWhatsapp] = useState(draft?.whatsapp || '')
  const [peserta, setPeserta] = useState(draft?.peserta?.length ? draft.peserta : [])
  const [openId, setOpenId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [error, setError] = useState('')
  // Data yang sudah tercatat di Google Sheet, dipakai untuk memperingatkan
  // warga yang rumahnya sudah pernah didaftarkan (lihat catatan di bawah).
  const [tercatat, setTercatat] = useState([])
  const [sudahDimuat, setSudahDimuat] = useState(false)

  const closed = isRegistrationClosed()
  const daysLeft = getDaysLeft()

  useEffect(() => {
    trackEvent('open_lomba')
  }, [])

  // Submit menimpa seluruh baris rumah yang bersangkutan. Tanpa ini, warga yang
  // membuka form lagi untuk menambah satu anak akan menghapus peserta yang sudah
  // terdaftar sebelumnya tanpa sadar. Jadi data lama ditarik lebih dulu supaya
  // bisa ditawarkan untuk dimuat & diedit.
  useEffect(() => {
    if (!ENDPOINT) return
    let batal = false
    fetch(`${ENDPOINT}?form=lomba`, { method: 'GET' })
      .then((r) => r.json())
      .then((json) => {
        if (!batal && Array.isArray(json?.data)) setTercatat(json.data)
      })
      .catch(() => {
        // Gagal menarik data lama bukan alasan untuk memblokir pendaftaran baru.
      })
    return () => {
      batal = true
    }
  }, [])

  // Simpan draft supaya isian tidak hilang kalau halaman kepencet back / reload
  useEffect(() => {
    if (submitted) return
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ blok, nomorRumah, namaAyah, namaIbu, whatsapp, peserta })
      )
    } catch {
      // localStorage penuh atau diblokir — draft memang cuma kenyamanan
    }
  }, [blok, nomorRumah, namaAyah, namaIbu, whatsapp, peserta, submitted])

  // Pesan error ikut hilang begitu ada yang diperbaiki, supaya tidak menuduh
  // peserta yang sudah dilengkapi.
  useEffect(() => {
    setError('')
  }, [blok, nomorRumah, namaAyah, namaIbu, whatsapp, peserta])

  const houses = useMemo(() => getAttendanceHouses(blok || undefined), [blok])
  const registryName = useMemo(
    () => (blok && nomorRumah ? getResidentName(blok, nomorRumah) : null),
    [blok, nomorRumah]
  )

  // Peserta rumah ini yang sudah tercatat sebelumnya
  const pesertaTercatat = useMemo(() => {
    if (!blok || !nomorRumah) return []
    return tercatat.filter(
      (r) => r.blok === blok && String(r.nomorRumah) === String(nomorRumah)
    )
  }, [tercatat, blok, nomorRumah])

  function handleSelectBlok(b) {
    setBlok(b)
    setNomorRumah('')
    setSudahDimuat(false)
  }

  function handleSelectRumah(n) {
    setNomorRumah(n)
    setSudahDimuat(false)
  }

  /** Tarik peserta yang sudah terdaftar ke dalam form supaya bisa diedit. */
  function handleMuatDataLama() {
    if (pesertaTercatat.length === 0) return
    const pertama = pesertaTercatat[0]
    if (pertama.namaAyah) setNamaAyah(pertama.namaAyah)
    if (pertama.namaIbu) setNamaIbu(pertama.namaIbu)
    setPeserta(
      pesertaTercatat.map((r) => ({
        id: newId(),
        nama: r.nama || '',
        peran: PERAN_OPTIONS.includes(r.peran) ? r.peran : 'Anak',
        umur: r.umur === null || r.umur === undefined ? '' : String(r.umur),
        lomba: Array.isArray(r.lomba) ? r.lomba : [],
        detailPentas: r.detailPentas || '',
      }))
    )
    setSudahDimuat(true)
    setOpenId(null)
    trackEvent('lomba_muat_data_lama', { blok, nomorRumah, peserta: pesertaTercatat.length })
  }

  const updatePeserta = useCallback((id, patch) => {
    setPeserta((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  function handleAddPeserta() {
    const baru = blankPeserta()
    setPeserta((list) => [...list, baru])
    setOpenId(baru.id)
    trackEvent('lomba_add_peserta')
  }

  function handleRemovePeserta(id) {
    setPeserta((list) => list.filter((p) => p.id !== id))
    setOpenId((cur) => (cur === id ? null : cur))
  }

  function toggleLomba(p, key) {
    const next = p.lomba.includes(key)
      ? p.lomba.filter((k) => k !== key)
      : [...p.lomba, key]
    updatePeserta(p.id, {
      lomba: next,
      // Bersihkan detail kalau pentas seni dibatalkan
      detailPentas: next.includes('pentas') ? p.detailPentas : '',
    })
  }

  const totalPendaftaran = peserta.reduce((n, p) => n + p.lomba.length, 0)
  const identitasValid =
    blok && nomorRumah && (namaAyah.trim() || namaIbu.trim()) && whatsapp.trim()
  // Tombol sengaja TIDAK di-disable saat data belum lengkap — lebih baik warga
  // menekannya lalu diberi tahu apa yang kurang daripada menghadapi tombol mati
  // tanpa penjelasan.
  const canSubmit = !closed && !submitting

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (closed) {
      setError('Pendaftaran sudah ditutup.')
      return
    }
    if (!identitasValid) {
      setError('Lengkapi dulu data rumah: blok, nomor rumah, nama ayah/ibu, dan nomor WhatsApp.')
      return
    }
    if (peserta.length === 0) {
      setError('Belum ada peserta. Tambahin minimal satu orang dulu ya.')
      return
    }
    const belum = peserta.filter((p) => !isPesertaValid(p))
    if (belum.length > 0) {
      const nama = belum.map((p) => p.nama.trim() || `Peserta ${peserta.indexOf(p) + 1}`)
      setError(
        `Belum lengkap: ${nama.join(', ')}. Tiap peserta wajib punya nama dan minimal 1 lomba` +
          ` (kalau ikut pentas seni, isi juga mau nampilin apa).`
      )
      setOpenId(belum[0].id)
      return
    }
    if (!ENDPOINT) {
      setError('Formulir belum terhubung ke Google Sheet. Hubungi pengelola untuk mengaktifkan.')
      return
    }

    setSubmitting(true)
    trackEvent('submit_lomba', {
      blok,
      nomorRumah,
      peserta: peserta.length,
      pendaftaran: totalPendaftaran,
    })

    try {
      const params = new URLSearchParams({
        // Diabaikan oleh Lomba.gs yang berdiri sendiri, tapi tetap dikirim agar
        // request-nya jelas maksudnya dan tetap benar bila suatu saat endpoint
        // lomba digabung ke Web App lain yang merutekan berdasarkan `form`.
        form: 'lomba',
        timestamp: new Date().toISOString(),
        blok,
        nomorRumah: String(nomorRumah),
        namaAyah: namaAyah.trim(),
        namaIbu: namaIbu.trim(),
        whatsapp: whatsapp.trim(),
        peserta: JSON.stringify(
          peserta.map((p) => ({
            nama: p.nama.trim(),
            peran: p.peran,
            umur: p.umur === '' ? '' : Number(p.umur),
            lomba: p.lomba,
            detailPentas: p.lomba.includes('pentas') ? p.detailPentas.trim() : '',
          }))
        ),
      })
      // Apps Script Web App tidak mengirim header CORS, jadi pakai no-cors.
      // Respons tidak bisa dibaca — kita anggap sukses bila fetch tidak error.
      await fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: params })

      // Perbarui salinan lokal supaya peringatan "rumah ini sudah terdaftar"
      // tetap akurat kalau warga langsung mendaftarkan rumah lain lalu balik lagi.
      setTercatat((lama) => [
        ...lama.filter(
          (r) => !(r.blok === blok && String(r.nomorRumah) === String(nomorRumah))
        ),
        ...peserta.map((p) => ({
          blok,
          nomorRumah: String(nomorRumah),
          namaAyah: namaAyah.trim(),
          namaIbu: namaIbu.trim(),
          nama: p.nama.trim(),
          peran: p.peran,
          umur: p.umur === '' ? '' : String(p.umur),
          lomba: p.lomba,
          detailPentas: p.lomba.includes('pentas') ? p.detailPentas.trim() : '',
        })),
      ])

      setSubmitted({ blok, nomorRumah, jumlahPeserta: peserta.length, totalPendaftaran })
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {
        // abaikan
      }
    } catch {
      setError('Gagal mengirim. Cek koneksi internet lalu coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleResetForNewHouse() {
    setBlok('')
    setNomorRumah('')
    setNamaAyah('')
    setNamaIbu('')
    setWhatsapp('')
    setPeserta([])
    setOpenId(null)
    setSubmitted(null)
    setError('')
  }

  return (
    <div className="flex flex-col min-h-dvh animate-pop-in">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-cream/90 backdrop-blur-md border-b-2 border-slate-dark/10 safe-x px-4 py-3 flex items-center gap-3">
        <Link
          to="/"
          className="
            flex items-center gap-1.5 font-heading font-bold text-sm
            bg-yellow border-2 border-slate-dark rounded-full px-3 py-1.5
            shadow-hard-sm
            active:translate-x-[1px] active:translate-y-[1px] active:shadow-none
            transition-all
          "
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Kembali
        </Link>
        <div className="flex-1 text-center">
          <span className="font-heading font-bold text-sm text-slate-dark/50">
            Pendaftaran Lomba
          </span>
        </div>
        <Trophy size={20} strokeWidth={2.5} className="text-orange" />
      </div>

      <div className="flex-1 overflow-y-auto safe-x">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* Hero acara */}
          <div className="bg-orange border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-1">
            <div className="px-5 pt-5 pb-4">
              <span className="inline-flex items-center gap-1.5 bg-yellow border-2 border-slate-dark rounded-full px-3 py-1 font-heading font-bold text-xs shadow-hard-sm text-slate-dark mb-3">
                <PartyPopper size={13} strokeWidth={2.5} />
                Panitia 17 Agustus
              </span>
              <h1 className="font-heading font-black text-3xl text-white leading-tight">
                {LOMBA_EVENT.title}
              </h1>
              <p className="font-heading font-bold text-base text-white/80 mb-2">
                {LOMBA_EVENT.subtitle}
              </p>
              <p className="font-body text-sm text-white/90">
                Daftarin anak, atau diri sendiri — bapak-ibu juga boleh ikut.
              </p>
            </div>

            <div className="bg-white border-t-2 border-slate-dark px-5 py-4 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <CalendarCheck size={16} strokeWidth={2.5} className="text-orange flex-shrink-0" />
                <span className="font-heading font-bold text-sm text-slate-dark">
                  {LOMBA_EVENT.dateLabel}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock size={16} strokeWidth={2.5} className="text-orange flex-shrink-0" />
                <span className="font-heading font-bold text-sm text-slate-dark">
                  Pukul {LOMBA_EVENT.timeLabel}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin size={16} strokeWidth={2.5} className="text-orange flex-shrink-0" />
                <span className="font-heading font-bold text-sm text-slate-dark">
                  {LOMBA_EVENT.placeLabel}
                </span>
              </div>
            </div>

            {/* Deadline */}
            <div
              className={`border-t-2 border-slate-dark px-5 py-3 ${
                closed ? 'bg-slate-dark' : 'bg-yellow'
              }`}
            >
              <p
                className={`font-body text-xs font-semibold flex items-center gap-1.5 ${
                  closed ? 'text-cream' : 'text-slate-dark'
                }`}
              >
                <Hourglass size={14} strokeWidth={2.5} className="flex-shrink-0" />
                {closed ? (
                  <>Pendaftaran ditutup {LOMBA_EVENT.deadlineLabel}.</>
                ) : (
                  <>
                    Tutup pendaftaran: {LOMBA_EVENT.deadlineLabel}
                    {daysLeft > 0 && ` · ${daysLeft} hari lagi`}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Daftar lomba */}
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-2">
            <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b-2 border-slate-dark/10">
              <Sparkles size={18} strokeWidth={2.5} className="text-orange" />
              <span className="font-heading font-bold text-sm">
                {LOMBA_LIST.length} Lomba · Semua Umur Boleh Ikut
              </span>
            </div>
            <div className="p-5 space-y-4">
              {LOMBA_GROUPS.map((g) => (
                <div key={g.title}>
                  <p className="font-heading font-bold text-xs uppercase tracking-wider text-slate-dark/50 mb-1.5">
                    {g.title}
                    {g.note && <span className="ml-1.5 text-slate-dark/30">({g.note})</span>}
                  </p>
                  <ul className="space-y-1">
                    {g.keys.map((k) => (
                      <li key={k} className="font-body text-sm text-slate-dark flex items-start gap-2">
                        <span className="text-orange font-bold">•</span>
                        {LOMBA_BY_KEY[k].label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="font-body text-[11px] text-slate-dark/50 border-t-2 border-slate-dark/10 pt-3">
                Kategori umur di atas cuma panduan dari panitia — bebas pilih lomba yang mana aja.
              </p>
            </div>
          </div>

          <Link
            to="/rekap-lomba"
            className="
              w-full inline-flex items-center justify-center gap-2
              bg-white border-2 border-slate-dark rounded-full px-5 py-2.5
              font-heading font-bold text-sm shadow-hard-sm
              hover:bg-cream active:translate-x-[1px] active:translate-y-[1px] active:shadow-none
              transition-all animate-fade-in stagger-3
            "
          >
            <ClipboardList size={15} strokeWidth={2.5} className="text-orange" />
            Lihat Rekap Peserta
          </Link>

          {closed ? (
            <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard p-6 text-center animate-pop-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-dark border-2 border-slate-dark shadow-hard-sm mb-4">
                <Hourglass size={30} strokeWidth={2.5} className="text-cream" />
              </div>
              <h2 className="font-heading font-black text-xl text-slate-dark mb-2">
                Pendaftaran Sudah Ditutup
              </h2>
              <p className="font-body text-sm text-slate-dark/70">
                Batas akhirnya {LOMBA_EVENT.deadlineLabel}. Kalau masih mau ikut, japri panitia
                langsung ya.
              </p>
            </div>
          ) : submitted ? (
            /* Success */
            <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard p-6 text-center animate-pop-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green border-2 border-slate-dark shadow-hard-sm mb-4">
                <CheckCircle2 size={32} strokeWidth={2.5} className="text-white" />
              </div>
              <h2 className="font-heading font-black text-xl text-slate-dark mb-2">
                Sip, kedaftar! 🎉
              </h2>
              <p className="font-body text-sm text-slate-dark/70 mb-1">
                <span className="font-bold">{submitted.jumlahPeserta} peserta</span> dari Blok{' '}
                {submitted.blok}-{submitted.nomorRumah} udah masuk daftar lomba.
              </p>
              <p className="font-body text-sm text-slate-dark/70 mb-5">
                Total {submitted.totalPendaftaran} pendaftaran lomba.
              </p>
              <div className="space-y-2">
                <Link
                  to="/rekap-lomba"
                  className="
                    block w-full bg-orange text-white font-heading font-extrabold text-base
                    border-2 border-slate-dark rounded-2xl px-6 py-3 shadow-hard
                    hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg
                    active:translate-x-0 active:translate-y-0 active:shadow-hard-sm
                    transition-all
                  "
                >
                  Lihat Rekap Peserta
                </Link>
                <button
                  onClick={handleResetForNewHouse}
                  className="
                    w-full bg-white font-heading font-bold text-sm
                    border-2 border-slate-dark rounded-2xl px-6 py-3 shadow-hard-sm
                    hover:bg-cream active:translate-x-[1px] active:translate-y-[1px] active:shadow-none
                    transition-all
                  "
                >
                  Daftarin rumah lain
                </button>
              </div>
              <p className="font-body text-[11px] text-slate-dark/50 mt-4">
                Mau nambah atau ubah peserta? Buka form ini lagi, pilih rumah yang sama, lalu klik
                <span className="font-bold"> “Muat &amp; edit data yang sudah ada”</span> supaya
                peserta yang tadi tidak hilang.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Data rumah */}
              <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-3">
                <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b-2 border-slate-dark/10">
                  <Home size={18} strokeWidth={2.5} className="text-orange" />
                  <span className="font-heading font-bold text-sm">Data Rumah</span>
                </div>

                <div className="p-5 space-y-5">
                  <div>
                    <label className="font-heading font-bold text-xs uppercase tracking-wider text-slate-dark/50 mb-3 block">
                      Pilih Blok
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {getAvailableBlocks().map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => handleSelectBlok(b)}
                          className={`
                            border-2 rounded-xl py-3 font-heading font-extrabold text-lg
                            transition-all duration-150 shadow-hard-sm
                            active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                            ${blok === b ? `${BLOCK_COLORS[b]} shadow-hard` : BLOCK_COLORS_UNSELECTED[b]}
                          `}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>
                      <Home size={13} strokeWidth={2.5} />
                      Nomor Rumah
                    </label>
                    <select
                      value={nomorRumah}
                      onChange={(e) => handleSelectRumah(e.target.value)}
                      disabled={!blok}
                      className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <option value="">{blok ? 'Pilih nomor rumah…' : 'Pilih blok dulu'}</option>
                      {houses.map((h) => (
                        <option key={`${h.blok}-${h.nomorRumah}`} value={h.nomorRumah}>
                          No. {h.nomorRumah} — {h.namaPemilik}
                        </option>
                      ))}
                    </select>
                    {registryName && (
                      <p className="mt-1.5 font-body text-[11px] text-slate-dark/50">
                        Rumah atas nama <span className="font-bold">{registryName}</span>.
                      </p>
                    )}

                    {/* Rumah ini sudah pernah didaftarkan — kirim ulang akan
                        menimpa, jadi tawarkan memuat data lamanya dulu. */}
                    {pesertaTercatat.length > 0 && !sudahDimuat && (
                      <div className="mt-3 bg-yellow border-2 border-slate-dark rounded-xl p-3 shadow-hard-sm">
                        <p className="font-heading font-bold text-xs flex items-start gap-1.5 mb-1.5">
                          <AlertTriangle size={14} strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
                          Rumah ini sudah terdaftar
                        </p>
                        <p className="font-body text-[11px] text-slate-dark leading-relaxed mb-2.5">
                          Sudah ada{' '}
                          <span className="font-bold">
                            {pesertaTercatat.length} peserta
                          </span>{' '}
                          ({pesertaTercatat.map((r) => r.nama).filter(Boolean).join(', ')}).
                          Kalau kamu kirim tanpa memuat data ini, daftar yang lama akan{' '}
                          <span className="font-bold">terganti</span>.
                        </p>
                        <button
                          type="button"
                          onClick={handleMuatDataLama}
                          className="
                            w-full inline-flex items-center justify-center gap-1.5
                            bg-slate-dark text-cream border-2 border-slate-dark rounded-xl px-3 py-2
                            font-heading font-bold text-xs
                            active:translate-x-[1px] active:translate-y-[1px]
                            transition-all
                          "
                        >
                          <Users size={13} strokeWidth={2.5} />
                          Muat & edit data yang sudah ada
                        </button>
                      </div>
                    )}

                    {sudahDimuat && (
                      <p className="mt-3 font-body text-[11px] text-slate-dark bg-green/15 border-2 border-green rounded-xl px-3 py-2 flex items-start gap-1.5">
                        <CheckCircle2 size={13} strokeWidth={2.5} className="text-green flex-shrink-0 mt-0.5" />
                        Data lama sudah dimuat. Tambah, ubah, atau hapus peserta sesuai kebutuhan —
                        nomor WhatsApp perlu diisi ulang.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>
                        <User size={13} strokeWidth={2.5} />
                        Nama Ayah
                      </label>
                      <input
                        type="text"
                        value={namaAyah}
                        onChange={(e) => setNamaAyah(e.target.value)}
                        placeholder="Nama ayah"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>
                        <User size={13} strokeWidth={2.5} />
                        Nama Ibu
                      </label>
                      <input
                        type="text"
                        value={namaIbu}
                        onChange={(e) => setNamaIbu(e.target.value)}
                        placeholder="Nama ibu"
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <p className="font-body text-[11px] text-slate-dark/50 -mt-2">
                    Isi salah satu aja juga boleh.
                  </p>

                  <div>
                    <label className={labelCls}>
                      <Phone size={13} strokeWidth={2.5} />
                      Nomor WhatsApp
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className={inputCls}
                    />
                    <p className="mt-1.5 font-body text-[11px] text-slate-dark/50">
                      Buat dihubungi panitia. Nomor ini tidak ditampilkan di halaman rekap.
                    </p>
                  </div>
                </div>
              </div>

              {/* Peserta */}
              <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-4">
                <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b-2 border-slate-dark/10">
                  <Users size={18} strokeWidth={2.5} className="text-orange" />
                  <span className="font-heading font-bold text-sm flex-1">Peserta</span>
                  {peserta.length > 0 && (
                    <span className="font-heading font-bold text-xs bg-cream border-2 border-slate-dark rounded-full px-2.5 py-0.5">
                      {peserta.length} orang · {totalPendaftaran} lomba
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  {peserta.length === 0 && (
                    <div className="border-2 border-dashed border-slate-dark/20 rounded-2xl px-5 py-8 text-center">
                      <p className="font-body text-sm text-slate-dark/60">
                        Belum ada peserta didaftarin.
                        <br />
                        Tambahin anak, atau daftarin diri sendiri juga boleh.
                      </p>
                    </div>
                  )}

                  {peserta.map((p, idx) => {
                    const terbuka = openId === p.id
                    const valid = isPesertaValid(p)
                    return (
                      <div
                        key={p.id}
                        className={`border-2 rounded-2xl overflow-hidden transition-all ${
                          terbuka
                            ? 'border-slate-dark shadow-hard-sm'
                            : valid
                              ? 'border-slate-dark/20'
                              : 'border-orange'
                        }`}
                      >
                        {/* Ringkasan / header kartu */}
                        <button
                          type="button"
                          onClick={() => setOpenId(terbuka ? null : p.id)}
                          className={`w-full flex items-center gap-2 px-4 py-3 text-left ${
                            terbuka ? 'bg-cream border-b-2 border-slate-dark' : 'bg-white'
                          }`}
                        >
                          <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange border-2 border-slate-dark font-heading font-black text-[11px] text-white">
                            {idx + 1}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block font-heading font-bold text-sm truncate">
                              {p.nama.trim() || 'Peserta baru'}
                            </span>
                            <span className="block font-body text-[11px] text-slate-dark/50 truncate">
                              {p.peran}
                              {p.umur !== '' && ` · ${p.umur} th`}
                              {p.lomba.length > 0
                                ? ` · ${p.lomba.length} lomba`
                                : ' · belum pilih lomba'}
                            </span>
                          </span>
                          {!valid && !terbuka && (
                            <AlertTriangle size={15} strokeWidth={2.5} className="text-orange flex-shrink-0" />
                          )}
                          <ChevronDown
                            size={18}
                            strokeWidth={2.5}
                            className={`flex-shrink-0 text-slate-dark/40 transition-transform ${
                              terbuka ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {terbuka && (
                          <div className="p-4 space-y-4">
                            <div>
                              <label className={labelCls}>Siapa?</label>
                              <div className="grid grid-cols-4 gap-1.5">
                                {PERAN_OPTIONS.map((r) => (
                                  <button
                                    key={r}
                                    type="button"
                                    onClick={() => updatePeserta(p.id, { peran: r })}
                                    className={`
                                      border-2 border-slate-dark rounded-xl py-2 font-heading font-bold text-xs
                                      transition-all shadow-hard-sm
                                      active:translate-x-[1px] active:translate-y-[1px] active:shadow-none
                                      ${p.peran === r ? 'bg-violet text-white' : 'bg-white hover:bg-cream'}
                                    `}
                                  >
                                    {r}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="col-span-2">
                                <label className={labelCls}>Nama</label>
                                <input
                                  type="text"
                                  value={p.nama}
                                  onChange={(e) => updatePeserta(p.id, { nama: e.target.value })}
                                  placeholder="Nama peserta"
                                  className={inputCls}
                                />
                              </div>
                              <div>
                                <label className={labelCls}>Umur</label>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  max="120"
                                  value={p.umur}
                                  onChange={(e) => updatePeserta(p.id, { umur: e.target.value })}
                                  placeholder="—"
                                  className={inputCls}
                                />
                              </div>
                            </div>
                            <p className="font-body text-[11px] text-slate-dark/50 -mt-2">
                              Umur boleh dikosongin.
                            </p>

                            {/* Pilih lomba */}
                            <div className="border-t-2 border-slate-dark/10 pt-4">
                              <label className={labelCls}>Pilih Lomba</label>
                              <div className="space-y-3">
                                {LOMBA_GROUPS.map((g) => (
                                  <div key={g.title}>
                                    <p className="font-heading font-bold text-[10px] uppercase tracking-wider text-slate-dark/40 mb-1.5">
                                      {g.title}
                                      {g.note && <span className="ml-1 text-slate-dark/25">({g.note})</span>}
                                    </p>
                                    <div className="border-2 border-slate-dark rounded-xl overflow-hidden">
                                      {g.keys.map((k, i) => {
                                        const l = LOMBA_BY_KEY[k]
                                        const dipilih = p.lomba.includes(k)
                                        return (
                                          <button
                                            key={k}
                                            type="button"
                                            onClick={() => toggleLomba(p, k)}
                                            className={`
                                              w-full flex items-center gap-2.5 px-3 py-2.5 text-left
                                              transition-colors
                                              ${i > 0 ? 'border-t-2 border-slate-dark/10' : ''}
                                              ${dipilih ? 'bg-green/15' : 'bg-white hover:bg-cream'}
                                            `}
                                          >
                                            <span
                                              className={`
                                                flex-shrink-0 inline-flex items-center justify-center
                                                w-5 h-5 rounded border-2 border-slate-dark
                                                ${dipilih ? 'bg-green' : 'bg-white'}
                                              `}
                                            >
                                              {dipilih && (
                                                <CheckCircle2 size={12} strokeWidth={3} className="text-white" />
                                              )}
                                            </span>
                                            <span className="flex-1 font-body text-sm leading-snug">
                                              {l.label}
                                            </span>
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {p.lomba.length > LOMBA_WARN_THRESHOLD && (
                                <p className="mt-3 font-body text-[11px] text-slate-dark bg-yellow border-2 border-slate-dark rounded-xl px-3 py-2 flex items-start gap-1.5">
                                  <AlertTriangle size={13} strokeWidth={2.5} className="flex-shrink-0 mt-0.5" />
                                  {p.lomba.length} lomba sekaligus — yakin nggak bentrok jadwalnya?
                                </p>
                              )}
                            </div>

                            {/* Detail pentas seni */}
                            {p.lomba.includes('pentas') && (
                              <div className="bg-cream border-2 border-slate-dark rounded-xl p-3">
                                <label className={labelCls}>
                                  <Sparkles size={13} strokeWidth={2.5} />
                                  Pentas Seni — nampilin apa?
                                </label>
                                <input
                                  type="text"
                                  value={p.detailPentas}
                                  onChange={(e) => updatePeserta(p.id, { detailPentas: e.target.value })}
                                  placeholder="Contoh: Tari Saman, baca puisi, nyanyi solo…"
                                  className="
                                    w-full border-2 border-slate-dark rounded-xl px-3 py-2.5
                                    font-heading text-sm font-bold bg-white
                                    focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-2
                                    placeholder:text-slate-dark/20 placeholder:font-normal
                                  "
                                />
                                <p className="mt-1.5 font-body text-[11px] text-slate-dark/50">
                                  Biar panitia gampang nyusun urutan acara.
                                </p>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemovePeserta(p.id)}
                              className="
                                w-full inline-flex items-center justify-center gap-1.5
                                border-2 border-red-300 text-red-500 rounded-xl px-4 py-2
                                font-heading font-bold text-xs
                                hover:bg-red-50 transition-colors
                              "
                            >
                              <Trash2 size={13} strokeWidth={2.5} />
                              Hapus peserta ini
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <button
                    type="button"
                    onClick={handleAddPeserta}
                    className="
                      w-full inline-flex items-center justify-center gap-2
                      bg-violet text-white border-2 border-slate-dark rounded-2xl px-5 py-3
                      font-heading font-extrabold text-sm shadow-hard
                      hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg
                      active:translate-x-0 active:translate-y-0 active:shadow-hard-sm
                      transition-all
                    "
                  >
                    <UserPlus size={16} strokeWidth={2.5} />
                    Tambah Peserta
                  </button>
                </div>
              </div>

              {error && (
                <p className="font-body text-sm text-red-500 bg-red-50 border-2 border-red-200 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="
                  w-full bg-orange text-white font-heading font-extrabold text-lg
                  border-2 border-slate-dark rounded-2xl px-6 py-4 shadow-hard
                  hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg
                  active:translate-x-0 active:translate-y-0 active:shadow-hard-sm
                  transition-all duration-150
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-hard
                  flex items-center justify-center gap-2
                "
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} strokeWidth={2.5} className="animate-spin" />
                    Mengirim…
                  </>
                ) : (
                  <>
                    <Trophy size={20} strokeWidth={2.5} />
                    Kirim Pendaftaran
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="safe-bottom" />
    </div>
  )
}
