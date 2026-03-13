export function trackEvent(eventName, data) {
  if (typeof window.umami !== 'undefined') {
    window.umami.track(eventName, data)
  }
}
