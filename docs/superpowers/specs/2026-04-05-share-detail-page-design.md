# Share Detail Page Design

**Date:** 2026-04-05
**Status:** Approved

## Problem

The resident payment dashboard has no dedicated URL. It renders inline at `/` via state toggle in `HomePage`. Users cannot share a direct link to a specific resident's payment status.

## Solution

Add a dedicated route `/warga/:blok/:nomorRumah` that renders the payment dashboard directly. Add a share button using the Web Share API.

## Design

### 1. Routing Changes

- **New route:** `/warga/:blok/:nomorRumah` → `WargaPage` component
- **HomePage refactor:** Search form calls `navigate('/warga/${blok}/${nomorRumah}')` instead of `setState`. HomePage becomes search-only — it no longer renders `DashboardView` or the "not found" state.
- URL is always consistent whether user searched from homepage or opened a shared link.

### 2. WargaPage Component (new)

Thin wrapper at `src/components/WargaPage.jsx`:
- Reads `blok` and `nomorRumah` from `useParams()`
- Calls `getResident(blok, nomorRumah)`
- If found → renders `DashboardView` with `onBack={() => navigate('/')}`
- If not found → renders the "data tidak ditemukan" card (moved from `HomePage`) with back button navigating to `/`

### 3. Share Button

- Location: `DashboardView` sticky top bar
- Behavior: Uses `navigator.share()` (Web Share API) when available
- Fallback: `navigator.clipboard.writeText(url)` with brief "Link disalin!" feedback (simple inline state toggle, no toast library)
- Share data:
  - `title`: `"IPL {namaPemilik} - Blok {blok} No. {nomorRumah}"`
  - `url`: current page URL (e.g., `https://ipl-talago.netlify.app/warga/A/1`)

### 4. DashboardView Changes

- Add share button icon (lucide `Share2`) in the sticky top bar, between the back button and the status badge
- Keep existing `onBack` prop — `WargaPage` passes the navigation callback
- No other changes to `DashboardView`

### 5. HomePage Simplification

- Remove `resident` state, `searched` state, `handleSearch` state toggle
- `SearchView.onSearch(blok, nomorRumah)` triggers `navigate(`/warga/${blok}/${nomorRumah}`)`
- Remove the "not found" UI (moved to `WargaPage`)
- `HomePage` becomes just `<SearchView />`

## Files Changed

| File | Change |
|------|--------|
| `src/App.jsx` | Add `/warga/:blok/:nomorRumah` route |
| `src/components/WargaPage.jsx` | New — route wrapper |
| `src/components/HomePage.jsx` | Simplify to search-only with navigate |
| `src/components/DashboardView.jsx` | Add share button to top bar |

## Out of Scope

- SEO/meta tags for shared links (no SSR in this project)
- Analytics for share events (can be added later via `trackEvent`)
