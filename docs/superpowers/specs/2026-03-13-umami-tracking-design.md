# Umami Analytics Integration

## Overview

Add Umami analytics to track page views and user interactions across the catat-uang-warga app. Umami is privacy-friendly, lightweight (~2kb), GDPR-compliant (no cookies), and free on the cloud tier.

## Setup

- Sign up at cloud.umami.is and create a website entry
- Obtain `data-website-id` and script URL
- No npm packages required — script tag only

## Integration

### Tracking Script

Add the Umami script tag to `index.html` before the closing `</head>` tag using Vite's HTML env var syntax (`%VITE_*%`):

```html
<script defer src="%VITE_UMAMI_SCRIPT_URL%" data-website-id="%VITE_UMAMI_WEBSITE_ID%"></script>
```

Environment variables:

- `VITE_UMAMI_SCRIPT_URL` — the Umami script URL (e.g., `https://cloud.umami.is/script.js`)
- `VITE_UMAMI_WEBSITE_ID` — the website ID from Umami dashboard

### Environment Setup

- Create `.env.example` with both variables (empty values) so developers know what's required
- In Netlify: set the variables under Site settings > Environment variables
- In local dev without a `.env` file, the script tag will have empty attributes — this is harmless

### Event Tracking Helper

Create `src/utils/tracking.js` with a thin wrapper around `umami.track()`:

- `trackEvent(eventName, data)` — calls `umami.track(eventName, data)` with a guard for when Umami isn't loaded

### Custom Events

| Event Name | Component | Data Properties |
|---|---|---|
| `search_resident` | `SearchView.jsx` | `{ blok, nomorRumah }` |
| `view_dashboard` | `DashboardView.jsx` | `{ blok, nomorRumah }` |
| `open_leaderboard` | `LeaderboardView.jsx` | (none) |
| `open_proof_modal` | `ProofModal.jsx` | `{ blok, nomorRumah }` |

Page views are tracked automatically by the Umami script (including SPA navigation with react-router).

## What This Enables

In the Umami dashboard:

- Page views, unique visitors, bounce rate, visit duration
- Referrer sources, browser/OS/device breakdown
- Country/city (IP-based, no cookies)
- Custom event analytics showing search patterns and most-viewed houses

## Constraints

- No cookies or consent banner needed (Umami is cookieless)
- No backend changes (script-only)
- No router changes (Umami auto-detects SPA navigation)
- Environment variables allow different website IDs per environment

## Files Changed

- `index.html` — add Umami script tag
- `src/utils/tracking.js` — new file, event tracking helper
- `src/components/SearchView.jsx` — add `search_resident` event
- `src/components/DashboardView.jsx` — add `view_dashboard` event
- `src/components/LeaderboardView.jsx` — add `open_leaderboard` event
- `src/components/ProofModal.jsx` — add `open_proof_modal` event
