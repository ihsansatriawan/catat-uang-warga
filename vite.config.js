import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { siteConfig } from './src/config/site.config.js'

/**
 * Judul, deskripsi, dan script analytics di index.html diisi dari
 * src/config/site.config.js + environment variable, supaya tidak ada nama
 * perumahan yang perlu diedit manual di HTML.
 *
 * Kalau VITE_UMAMI_* kosong, tag script-nya tidak ikut ditulis sama sekali —
 * jadi aplikasi tetap jalan tanpa .env.local.
 */
function injectSiteConfig(env) {
  const { perumahan, iuran } = siteConfig
  const title = `Cek ${iuran.label} ${perumahan.nama}`
  const description = perumahan.deskripsi || ''

  const umamiUrl = env.VITE_UMAMI_SCRIPT_URL || ''
  const umamiId = env.VITE_UMAMI_WEBSITE_ID || ''
  const umamiTag = umamiUrl && umamiId
    ? `<script defer src="${umamiUrl}" data-website-id="${umamiId}"></script>`
    : ''

  return {
    name: 'inject-site-config',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replace(/%SITE_TITLE%/g, title)
          .replace(/%SITE_DESCRIPTION%/g, description)
          .replace(/%SITE_ANALYTICS%/g, umamiTag)
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      injectSiteConfig(env),
    ],
  }
})
