import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarCheck,
  MapPin,
  Home,
  User,
  CheckCircle2,
  Loader2,
  PartyPopper,
  Clock,
  Megaphone,
  Phone,
  Mail,
  ClipboardList,
} from 'lucide-react'
import {
  getAvailableBlocks,
  getAttendanceHouses,
  getResidentName,
} from '../data/helpers'
import { trackEvent } from '../utils/tracking'
import { BLOCK_COLORS, BLOCK_COLORS_UNSELECTED } from '../data/constants'

// Info acara
const EVENT_TITLE = 'Kumpul Warga D’talago Regency'
const EVENT_DATE_LABEL = 'Minggu, 2 Agustus 2026'
const EVENT_TIME_LABEL = '19.30 WIB'
const EVENT_PLACE_LABEL = 'Depan Musola'
const EVENT_AGENDA = [
  'Acara 17 Agustusan 2026',
  'Kelanjutan pengurusan Paguyuban D’Talago Regency',
]

// Endpoint Google Apps Script Web App (lihat docs/attendance-apps-script.md).
// Diisi lewat .env.local: VITE_ATTENDANCE_ENDPOINT=...
const ENDPOINT = import.meta.env.VITE_ATTENDANCE_ENDPOINT || ''

const STATUS_OPTIONS = [
  { value: 'Hadir', label: '✅ Hadir', accent: 'text-green' },
  { value: 'Tidak Hadir', label: '❌ Tidak Hadir', accent: 'text-red-500' },
  { value: 'Masih Ragu', label: '🤔 Masih Ragu', accent: 'text-orange' },
]

export default function AttendanceView() {
  const [blok, setBlok] = useState('')
  const [nomorRumah, setNomorRumah] = useState('')
  const [nama, setNama] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    trackEvent('open_attendance')
  }, [])

  const blocks = getAvailableBlocks()
  const houses = useMemo(() => getAttendanceHouses(blok), [blok])

  // Auto-isi nama dari registry saat blok + nomor rumah dipilih
  const registryName = useMemo(
    () => (blok && nomorRumah ? getResidentName(blok, nomorRumah) : null),
    [blok, nomorRumah]
  )
  useEffect(() => {
    if (registryName) setNama(registryName)
    else if (!nomorRumah) setNama('')
  }, [registryName, nomorRumah])

  function handleSelectBlok(b) {
    setBlok(b)
    setNomorRumah('')
    setNama('')
  }

  const canSubmit =
    blok &&
    nomorRumah &&
    nama.trim() &&
    whatsapp.trim() &&
    email.trim() &&
    status &&
    !submitting

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setError('')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Format email belum benar. Cek lagi ya.')
      return
    }

    if (!ENDPOINT) {
      setError(
        'Formulir belum terhubung ke Google Sheet. Hubungi pengelola untuk mengaktifkan.'
      )
      return
    }

    setSubmitting(true)
    trackEvent('submit_attendance', { blok, nomorRumah, status })

    try {
      const params = new URLSearchParams({
        timestamp: new Date().toISOString(),
        blok,
        nomorRumah: String(nomorRumah),
        nama: nama.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        status,
      })
      // Apps Script Web App tidak mengirim header CORS, jadi pakai no-cors.
      // Respons tidak bisa dibaca — kita anggap sukses bila fetch tidak error.
      await fetch(ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        body: params,
      })
      setSubmitted(true)
    } catch {
      setError('Gagal mengirim. Cek koneksi internet lalu coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setBlok('')
    setNomorRumah('')
    setNama('')
    setWhatsapp('')
    setEmail('')
    setStatus('')
    setSubmitted(false)
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
            Kehadiran Acara
          </span>
        </div>
        <CalendarCheck size={20} strokeWidth={2.5} className="text-violet" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto safe-x">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* Event hero card */}
          <div className="bg-violet border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-1">
            <div className="px-5 pt-5 pb-4">
              <span className="inline-flex items-center gap-1.5 bg-yellow border-2 border-slate-dark rounded-full px-3 py-1 font-heading font-bold text-xs shadow-hard-sm text-slate-dark mb-3">
                <Megaphone size={13} strokeWidth={2.5} />
                Pengumuman Warga
              </span>
              <h1 className="font-heading font-black text-2xl text-white leading-tight mb-1">
                {EVENT_TITLE}
              </h1>
              <p className="font-body text-sm text-white/80">
                Mohon kehadirannya untuk pembahasan:
              </p>
            </div>

            {/* Agenda */}
            <div className="bg-white/10 border-t-2 border-slate-dark px-5 py-4">
              <p className="font-heading font-bold text-xs uppercase tracking-wider text-white/60 mb-2">
                Agenda
              </p>
              <ol className="space-y-2">
                {EVENT_AGENDA.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow border-2 border-slate-dark font-heading font-black text-[11px] text-slate-dark">
                      {i + 1}
                    </span>
                    <span className="font-body text-sm text-white leading-snug">
                      {item}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Waktu & tempat */}
            <div className="bg-white border-t-2 border-slate-dark px-5 py-4 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <CalendarCheck size={16} strokeWidth={2.5} className="text-violet flex-shrink-0" />
                <span className="font-heading font-bold text-sm text-slate-dark">
                  {EVENT_DATE_LABEL}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock size={16} strokeWidth={2.5} className="text-violet flex-shrink-0" />
                <span className="font-heading font-bold text-sm text-slate-dark">
                  Pukul {EVENT_TIME_LABEL}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin size={16} strokeWidth={2.5} className="text-violet flex-shrink-0" />
                <span className="font-heading font-bold text-sm text-slate-dark">
                  {EVENT_PLACE_LABEL}
                </span>
              </div>
            </div>

            <div className="bg-yellow border-t-2 border-slate-dark px-5 py-3">
              <p className="font-body text-xs text-slate-dark font-semibold flex items-center gap-1.5">
                <PartyPopper size={14} strokeWidth={2.5} />
                Yuk konfirmasi kehadiranmu di bawah ini 👇
              </p>
            </div>
          </div>

          {/* Link ke rekap */}
          <Link
            to="/rekap-kehadiran"
            className="
              w-full inline-flex items-center justify-center gap-2
              bg-white border-2 border-slate-dark rounded-full px-5 py-2.5
              font-heading font-bold text-sm shadow-hard-sm
              hover:bg-cream active:translate-x-[1px] active:translate-y-[1px] active:shadow-none
              transition-all animate-fade-in stagger-2
            "
          >
            <ClipboardList size={15} strokeWidth={2.5} className="text-violet" />
            Lihat Rekap Kehadiran
          </Link>

          {submitted ? (
            /* Success card */
            <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard p-6 text-center animate-pop-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green border-2 border-slate-dark shadow-hard-sm mb-4">
                <CheckCircle2 size={32} strokeWidth={2.5} className="text-white" />
              </div>
              <h2 className="font-heading font-black text-xl text-slate-dark mb-2">
                Terima kasih! 🎉
              </h2>
              <p className="font-body text-sm text-slate-dark/70 mb-1">
                Kehadiran <span className="font-bold">{nama}</span> (Blok {blok}-{nomorRumah})
                sudah tercatat.
              </p>
              <p className="font-body text-sm text-slate-dark/70 mb-5">
                Status: <span className="font-bold">{status}</span>
              </p>
              <button
                onClick={handleReset}
                className="
                  w-full bg-violet text-white font-heading font-extrabold text-base
                  border-2 border-slate-dark rounded-2xl px-6 py-3 shadow-hard
                  hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-hard-lg
                  active:translate-x-0 active:translate-y-0 active:shadow-hard-sm
                  transition-all
                "
              >
                Isi untuk rumah lain
              </button>
            </div>
          ) : (
            /* Form card */
            <form
              onSubmit={handleSubmit}
              className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-2"
            >
              <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b-2 border-slate-dark/10">
                <MapPin size={18} strokeWidth={2.5} className="text-violet" />
                <span className="font-heading font-bold text-sm">Data Kehadiran</span>
              </div>

              <div className="p-5 space-y-5">
                {/* Blok */}
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-slate-dark/50 mb-3 block">
                    Pilih Blok
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {blocks.map((b) => (
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

                {/* Nomor Rumah — dropdown */}
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-slate-dark/50 mb-2 flex items-center gap-1.5">
                    <Home size={13} strokeWidth={2.5} />
                    Nomor Rumah
                  </label>
                  <select
                    value={nomorRumah}
                    onChange={(e) => setNomorRumah(e.target.value)}
                    disabled={!blok}
                    className="
                      w-full border-2 border-slate-dark rounded-xl px-4 py-3
                      font-heading text-base font-bold bg-cream
                      focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-2
                      disabled:opacity-40 disabled:cursor-not-allowed
                    "
                  >
                    <option value="">
                      {blok ? 'Pilih nomor rumah…' : 'Pilih blok dulu'}
                    </option>
                    {houses.map((h) => (
                      <option key={`${h.blok}-${h.nomorRumah}`} value={h.nomorRumah}>
                        No. {h.nomorRumah} — {h.namaPemilik}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nama */}
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-slate-dark/50 mb-2 flex items-center gap-1.5">
                    <User size={13} strokeWidth={2.5} />
                    Nama
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Nama warga…"
                    className="
                      w-full border-2 border-slate-dark rounded-xl px-4 py-3
                      font-heading text-base font-bold bg-cream
                      focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-2
                      placeholder:text-slate-dark/20 placeholder:font-normal
                    "
                  />
                  {registryName && nama === registryName && (
                    <p className="mt-1.5 font-body text-[11px] text-slate-dark/50">
                      Terisi otomatis dari data warga — boleh diubah bila perlu.
                    </p>
                  )}
                </div>

                {/* Nomor WhatsApp */}
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-slate-dark/50 mb-2 flex items-center gap-1.5">
                    <Phone size={13} strokeWidth={2.5} />
                    Nomor WhatsApp
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="
                      w-full border-2 border-slate-dark rounded-xl px-4 py-3
                      font-heading text-base font-bold bg-cream
                      focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-2
                      placeholder:text-slate-dark/20 placeholder:font-normal
                    "
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-slate-dark/50 mb-2 flex items-center gap-1.5">
                    <Mail size={13} strokeWidth={2.5} />
                    Email
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="
                      w-full border-2 border-slate-dark rounded-xl px-4 py-3
                      font-heading text-base font-bold bg-cream
                      focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-2
                      placeholder:text-slate-dark/20 placeholder:font-normal
                    "
                  />
                </div>

                {/* Status Kehadiran — dropdown */}
                <div>
                  <label className="font-heading font-bold text-xs uppercase tracking-wider text-slate-dark/50 mb-2 flex items-center gap-1.5">
                    <CalendarCheck size={13} strokeWidth={2.5} />
                    Status Kehadiran
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="
                      w-full border-2 border-slate-dark rounded-xl px-4 py-3
                      font-heading text-base font-bold bg-cream
                      focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-2
                    "
                  >
                    <option value="">Pilih status…</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="font-body text-sm text-red-500 bg-red-50 border-2 border-red-200 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="
                    w-full bg-violet text-white font-heading font-extrabold text-lg
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
                      <CheckCircle2 size={20} strokeWidth={2.5} />
                      Konfirmasi Kehadiran
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      <div className="safe-bottom" />
    </div>
  )
}
