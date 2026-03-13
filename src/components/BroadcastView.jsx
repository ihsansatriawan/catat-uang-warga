import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Send } from 'lucide-react'
import { generateBroadcastMessage } from '../data/helpers'
import { trackEvent } from '../utils/tracking'

export default function BroadcastView() {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    trackEvent('open_broadcast')
  }, [])

  const message = useMemo(() => generateBroadcastMessage(), [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message)
    } catch {
      // Fallback for browsers without Clipboard API
      const textarea = document.createElement('textarea')
      textarea.value = message
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    trackEvent('copy_broadcast')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            Broadcast
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="hover:scale-110 active:scale-95 transition-transform"
          aria-label="Salin pesan"
        >
          <Send size={20} strokeWidth={2.5} className="text-green" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto safe-x">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* WhatsApp preview card */}
          <div className="bg-white border-2 border-slate-dark rounded-3xl shadow-hard overflow-hidden animate-slide-up stagger-1">
            <div className="px-5 py-4 border-b-2 border-slate-dark flex items-center gap-2">
              <span className="text-lg">💬</span>
              <h2 className="font-heading font-bold text-base">Preview Pesan</h2>
            </div>

            <div
              className="p-4"
              style={{ backgroundColor: '#075e54' }}
            >
              <div
                className="rounded-xl p-4 text-sm leading-relaxed"
                style={{
                  backgroundColor: '#dcf8c6',
                  color: '#111',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {message}
              </div>
            </div>
          </div>

          {/* Copy button */}
          <div className="animate-slide-up stagger-2 flex flex-col items-center gap-3">
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
                : <><Copy size={16} strokeWidth={2.5} /> Salin Pesan</>
              }
            </button>

            <Link
              to="/leaderboard"
              className="font-body text-sm text-slate-dark/50 hover:text-slate-dark transition-colors"
            >
              Lihat Leaderboard →
            </Link>
          </div>

        </div>
      </div>

      {/* Bottom safe area */}
      <div className="safe-bottom bg-cream" />
    </div>
  )
}
