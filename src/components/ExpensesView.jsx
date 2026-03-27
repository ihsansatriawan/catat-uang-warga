import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Wallet } from 'lucide-react'
import {
  getExpenses,
  getExpenseCategories,
  generateExpenseBroadcastMessage,
  formatRupiah,
} from '../data/helpers'
import { trackEvent } from '../utils/tracking'

export default function ExpensesView() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    trackEvent('open_expenses')
  }, [])

  const expenses = useMemo(() => getExpenses(), [])
  const categories = useMemo(() => getExpenseCategories(), [])
  const broadcastMessage = useMemo(() => generateExpenseBroadcastMessage(), [])

  const lastUpdated = useMemo(() => {
    const raw = expenses.lastUpdate
    if (!raw) return null
    return new Date(raw).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    })
  }, [expenses.lastUpdate])

  const filteredInsidental = useMemo(() => {
    if (!selectedCategory) return expenses.insidental
    return expenses.insidental.filter((item) => item.kategori === selectedCategory)
  }, [expenses.insidental, selectedCategory])

  function handleCategoryFilter(kategori) {
    setSelectedCategory(kategori)
    if (kategori) {
      trackEvent('filter_expense_category', { kategori })
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(broadcastMessage)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = broadcastMessage
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    trackEvent('copy_expense_broadcast')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatTanggal(tanggal) {
    if (!tanggal) return ''
    return new Date(tanggal).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Jakarta',
    })
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
            Pengeluaran 2026
          </span>
        </div>
        <Wallet size={20} strokeWidth={2.5} className="text-green" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto safe-x">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* Summary Card */}
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-1">
            {/* Sisa Anggaran — hero */}
            <div className="bg-violet px-5 pt-5 pb-4">
              <p className="font-body text-xs text-white/70 uppercase tracking-widest mb-1">Sisa Anggaran</p>
              <p className="font-heading font-black text-3xl text-white">
                {formatRupiah(expenses.summary.sisaAnggaran)}
              </p>
            </div>
            {/* Divider row */}
            <div className="grid grid-cols-2 divide-x-2 divide-slate-dark border-t-2 border-slate-dark">
              <div className="px-4 py-3">
                <p className="font-body text-xs text-slate-dark/50 mb-0.5">Total Masuk</p>
                <p className="font-heading font-bold text-sm text-green">{formatRupiah(expenses.summary.totalMasuk)}</p>
              </div>
              <div className="px-4 py-3">
                <p className="font-body text-xs text-slate-dark/50 mb-0.5">Total Keluar</p>
                <p className="font-heading font-bold text-sm text-red-500">{formatRupiah(expenses.summary.totalKeluar)}</p>
              </div>
            </div>
            {/* Last updated */}
            {lastUpdated && (
              <div className="px-5 py-2 border-t-2 border-slate-dark bg-slate-dark/5">
                <p className="font-body text-xs text-slate-dark/50">
                  Terakhir diperbarui: <span className="font-semibold text-slate-dark/70">{lastUpdated}</span>
                </p>
              </div>
            )}
          </div>

          {/* Pengeluaran Rutin Section */}
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-2">
            <div className="px-5 py-4 border-b-2 border-slate-dark flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h2 className="font-heading font-bold text-base">Pengeluaran Rutin</h2>
            </div>

            <div>
              {expenses.rutin.map((item, i) => (
                <div
                  key={i}
                  className={`
                    flex items-center justify-between px-5 py-3
                    ${i < expenses.rutin.length - 1 ? 'border-b border-slate-dark/10' : ''}
                  `}
                >
                  <span className="font-body text-sm text-slate-dark flex-1 min-w-0 truncate pr-3">
                    {item.keterangan}
                  </span>
                  {item.masuk && (
                    <span className="font-heading font-bold text-sm text-green flex-shrink-0">
                      +{formatRupiah(item.masuk)}
                    </span>
                  )}
                  {item.keluar && (
                    <span className="font-heading font-bold text-sm text-red-500 flex-shrink-0">
                      -{formatRupiah(item.keluar)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pengeluaran Insidental Section */}
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-3">
            <div className="px-5 py-4 border-b-2 border-slate-dark flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h2 className="font-heading font-bold text-base">Pengeluaran Insidental</h2>
            </div>

            {/* Category filter chips */}
            <div className="px-5 py-3 border-b border-slate-dark/10 flex gap-2 overflow-x-auto">
              <button
                onClick={() => handleCategoryFilter('')}
                className={`
                  flex-shrink-0 border-2 rounded-full px-3 py-1 font-heading font-bold text-xs
                  transition-all duration-150
                  ${!selectedCategory
                    ? 'bg-violet text-white border-violet shadow-hard-sm'
                    : 'bg-white text-slate-dark border-slate-dark hover:bg-violet/10'
                  }
                `}
              >
                Semua
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryFilter(cat)}
                  className={`
                    flex-shrink-0 border-2 rounded-full px-3 py-1 font-heading font-bold text-xs
                    transition-all duration-150
                    ${selectedCategory === cat
                      ? 'bg-violet text-white border-violet shadow-hard-sm'
                      : 'bg-white text-slate-dark border-slate-dark hover:bg-violet/10'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Insidental items */}
            <div>
              {filteredInsidental.map((item, i) => (
                <div
                  key={i}
                  className={`
                    flex items-center px-5 py-3 gap-3
                    ${i < filteredInsidental.length - 1 ? 'border-b border-slate-dark/10' : ''}
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-slate-dark truncate">
                      {item.keterangan}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.tanggal && (
                        <span className="font-body text-xs text-slate-dark/40">
                          {formatTanggal(item.tanggal)}
                        </span>
                      )}
                      {item.kategori && (
                        <span className="font-body text-xs text-violet bg-violet/10 px-1.5 py-0.5 rounded">
                          {item.kategori}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.masuk && (
                    <span className="font-heading font-bold text-sm text-green flex-shrink-0">
                      +{formatRupiah(item.masuk)}
                    </span>
                  )}
                  {item.keluar && (
                    <span className="font-heading font-bold text-sm text-red-500 flex-shrink-0">
                      -{formatRupiah(item.keluar)}
                    </span>
                  )}
                </div>
              ))}

              {filteredInsidental.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="font-body text-sm text-slate-dark/40">
                    Tidak ada pengeluaran untuk kategori ini
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Copy broadcast button */}
          <div className="animate-slide-up stagger-4 flex flex-col items-center gap-3">
            <button
              onClick={handleCopy}
              className={`
                flex items-center justify-center gap-2 w-full max-w-[280px]
                font-heading font-bold
                border-2 border-slate-dark rounded-full px-5 py-2.5
                shadow-hard-sm text-sm
                hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-hard
                active:translate-x-0 active:translate-y-0 active:shadow-none
                transition-all duration-150
                ${copied
                  ? 'bg-yellow text-slate-dark'
                  : 'bg-green text-white'
                }
              `}
            >
              {copied
                ? <><Check size={16} strokeWidth={2.5} /> Tersalin!</>
                : <><Copy size={16} strokeWidth={2.5} /> Salin Broadcast WA</>
              }
            </button>
          </div>


        </div>
      </div>

      {/* Bottom safe area */}
      <div className="safe-bottom bg-cream" />
    </div>
  )
}
