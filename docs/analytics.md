# Analytics & Event Tracking

This app uses [Umami](https://umami.is) for privacy-friendly, cookieless analytics.

## Setup

### 1. Create an Umami account
Sign up at [cloud.umami.is](https://cloud.umami.is), add your site, and get your **Website ID** and **Script URL**.

### 2. Configure environment variables

For local development, create `.env.local` (gitignored):
```
VITE_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
VITE_UMAMI_WEBSITE_ID=your-website-id-here
```

For production, set these in **Netlify → Site settings → Environment variables**.

## Automatic Tracking

Umami automatically tracks without any code changes:

| What | Details |
|---|---|
| Page views | Every route visit (`/`, `/leaderboard`) |
| Unique visitors | Deduplicated by session |
| Referrer sources | Where users came from |
| Browser / OS / Device | User agent breakdown |
| Country & city | IP-based, no cookies |
| Visit duration | Time spent per session |

## Custom Events

Custom events are fired via `src/utils/tracking.js`:

```js
import { trackEvent } from '../utils/tracking'
trackEvent('event_name', { key: 'value' })
```

### Event Reference

| Event | Fired when | Data |
|---|---|---|
| `search_resident` | User submits the search form | `{ blok, nomorRumah }` |
| `view_dashboard` | User's payment dashboard is shown | `{ blok, nomorRumah }` |
| `open_leaderboard` | User opens the leaderboard page | — |
| `open_proof_modal` | User taps the proof-of-transfer button | — |

### Example: What you can answer with this data

- Which blocks are searched most often?
- Which house numbers have the most lookups?
- How many users visit the leaderboard vs. the search page?
- How often do users open the proof modal?

## Adding New Events

1. Import the helper in your component:
   ```js
   import { trackEvent } from '../utils/tracking'
   ```
2. Call it at the right moment:
   ```js
   trackEvent('your_event_name', { optional: 'data' })
   ```
3. Add a row to the Event Reference table above.

## Local Development

If `VITE_UMAMI_SCRIPT_URL` / `VITE_UMAMI_WEBSITE_ID` are not set, the script tag loads with empty attributes — this is harmless and the app works normally. `trackEvent()` silently no-ops when Umami isn't loaded.

To verify events fire locally without a real Umami account, temporarily add a `console.log` to `src/utils/tracking.js`:

```js
export function trackEvent(eventName, data) {
  console.log('[tracking]', eventName, data) // ← remove before committing
  if (typeof window.umami !== 'undefined') {
    window.umami.track(eventName, data)
  }
}
```
